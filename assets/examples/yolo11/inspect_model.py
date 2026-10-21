"""Export a real YOLO11 Detect forward pass for the static architecture viewer.

GPU reference: torch 2.7.1/cu128, torchvision 0.22.1, ultralytics 8.3.200.
Only load trusted checkpoints. No weights or executable Python are embedded in
the JSON. Feature tiles are independently normalized, not semantic labels.
"""
import argparse
import base64
import hashlib
import io
import json
from collections import Counter
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", type=Path, required=True, help="Your local image")
    p.add_argument("--model", default="yolo11n.pt", help="Trusted COCO80 Detect checkpoint or YOLO11 YAML")
    p.add_argument("--device", default="0", help="CUDA index or cpu")
    p.add_argument("--imgsz", type=int, default=320)
    p.add_argument("--out", type=Path, required=True, help="New JSON filename")
    args = p.parse_args()
    if not args.source.is_file() or args.out.exists() or not 64 <= args.imgsz <= 1280 or args.imgsz % 32:
        p.error("source must exist, out must be new, imgsz must be 64…1280 and divisible by 32")

    import cv2
    import numpy as np
    import torch
    import ultralytics
    from PIL import Image, ImageDraw
    from ultralytics import YOLO
    from ultralytics.data.augment import LetterBox
    from ultralytics.utils.nms import non_max_suppression

    device = torch.device("cpu" if args.device == "cpu" else f"cuda:{int(args.device)}")
    if device.type == "cuda" and not torch.cuda.is_available():
        p.error("CUDA is unavailable; use a compatible torch CUDA wheel/driver or --device cpu")
    yolo = YOLO(args.model)
    if yolo.task != "detect" or yolo.model.model[-1].nc != 80:
        p.error("This viewer requires a YOLO11 COCO80 Detect model")
    net = yolo.model.to(device).eval()  # Unfused: preserve Conv/BatchNorm structure.
    image = cv2.imread(str(args.source))
    if image is None:
        p.error("OpenCV could not decode source")
    boxed = LetterBox((args.imgsz, args.imgsz), auto=False)(image=image)
    # NumPy only at the CPU image-decoder boundary; all model operators run on device.
    tensor = torch.from_numpy(np.ascontiguousarray(boxed[..., ::-1].transpose(2, 0, 1))).to(device).float().unsqueeze(0) / 255

    def png(image):
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")

    def shapes(value):
        if isinstance(value, torch.Tensor):
            return list(value.shape)
        return [shapes(v) for v in value] if isinstance(value, (list, tuple)) else None

    def first_feature(value):
        if isinstance(value, torch.Tensor):
            return value if value.ndim == 4 else None
        if isinstance(value, (list, tuple)):
            return next((t for v in value if (t := first_feature(v)) is not None), None)
        return None

    def mosaic(tensor):
        channels = tensor[0, :4].detach().float()
        small = torch.nn.functional.interpolate(channels[:, None], (80, 80), mode="bilinear", align_corners=False)[:, 0]
        low = small.amin((1, 2), keepdim=True)
        high = small.amax((1, 2), keepdim=True)
        pixels = ((small - low) / (high - low).clamp_min(1e-12) * 255).byte().cpu()
        grid = Image.new("RGB", (164, 188), "#080d18")
        draw = ImageDraw.Draw(grid)
        for i in range(len(pixels)):
            x, y = (i % 2) * 84, (i // 2) * 94
            grid.paste(Image.fromarray(pixels[i].numpy()).convert("RGB"), (x, y + 12))
            draw.text((x, y), f"channel {i}", fill="#98a9c2")
        return png(grid)

    layers, handles, input_shapes = [], [], {}

    def pre_hook(module, inputs):
        # Detect mutates its input list; capture the actual incoming feature shapes first.
        input_shapes[module.i] = shapes(inputs)

    def hook(module, inputs, output):
        feature = first_feature(output)
        primitive = [
            {"path": name, "type": child.__class__.__name__, "parameters": sum(q.numel() for q in child.parameters(recurse=False))}
            for name, child in module.named_modules() if not list(child.children())
        ]
        refs = module.f if isinstance(module.f, list) else [module.f]
        parents = [module.i - 1 if ref == -1 else ref if ref >= 0 else module.i + ref for ref in refs]
        item = {"id": module.i, "type": module.__class__.__name__, "from": refs, "parents": parents,
                "input_shapes": input_shapes[module.i], "output_shapes": shapes(output),
                "parameters": sum(q.numel() for q in module.parameters()), "operators": primitive,
                "operator_counts": dict(Counter(q["type"] for q in primitive))}
        if feature is not None:
            f = feature.detach().float()
            item["feature_shape"] = list(f.shape)
            item["stats"] = {"min": f.min().item(), "max": f.max().item(), "mean": f.mean().item()}
            item["feature_png"] = mosaic(f)
        layers.append(item)

    for module in net.model:
        handles.append(module.register_forward_pre_hook(pre_hook))
        handles.append(module.register_forward_hook(hook))
    try:
        with torch.inference_mode():
            decoded, raw = net(tensor)
    finally:
        for handle in handles:
            handle.remove()
    head = net.model[-1]
    assert head.nc == 80 and head.reg_max == 16 and len(raw) == 3
    flat = torch.cat([f.view(1, 144, -1) for f in raw], dim=2)
    scores = decoded[0, 4:]
    best = int(scores.max(0).values.argmax())
    cls = int(scores[:, best].argmax())
    distributions = flat[0, :64, best].view(4, 16)
    probabilities = distributions.softmax(-1)
    dfl_expected = (probabilities * torch.arange(16, device=device)).sum(-1)
    with torch.inference_mode():
        detections = non_max_suppression(decoded.clone(), conf_thres=.25, iou_thres=.7, nc=80)[0].cpu()
    annotated = Image.fromarray(boxed[..., ::-1])
    draw = ImageDraw.Draw(annotated)
    for x1, y1, x2, y2, conf, category in detections.tolist():
        draw.rectangle((x1, y1, x2, y2), outline="#27d3c3", width=2)
        draw.text((max(0, x1), max(0, y1 - 12)), f"{yolo.names[int(category)]} {conf:.2f}", fill="#27d3c3")
    preview = Image.fromarray(image[..., ::-1]);preview.thumbnail((320, 320))
    annotated.thumbnail((320, 320))
    checkpoint = Path(args.model)
    report = {
        "format": "vision-yolo11-forward-v1", "runtime": {"ultralytics": ultralytics.__version__, "torch": torch.__version__, "device": str(device)},
        "model": {"name": checkpoint.name, "sha256": hashlib.sha256(checkpoint.read_bytes()).hexdigest() if checkpoint.is_file() else None,
                  "nc": head.nc, "reg_max": head.reg_max, "stride": head.stride.tolist(), "parameters": sum(q.numel() for q in net.parameters())},
        "source": {"name": args.source.name, "sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
                   "original_shape": list(image.shape), "png": png(preview), "annotated_png": png(annotated)},
        "input_shape": list(tensor.shape), "preprocess": "BGR decode → square LetterBox(auto=False) → RGB BCHW float32 /255; no fusion",
        "layers": layers, "decoded_shape": list(decoded.shape), "raw_shapes": [list(f.shape) for f in raw],
        "candidate": {"index": best, "class_id": cls, "class_name": yolo.names[cls],
                      "class_logit": flat[0, 64 + cls, best].item(), "class_score": scores[cls, best].item(),
                      "anchor_cells": head.anchors[:, best].cpu().tolist(), "stride": head.strides[0, best].item(),
                      "box_xywh_input": decoded[0, :4, best].cpu().tolist(),
                      "distance_logits": distributions.cpu().tolist(), "distance_probabilities": probabilities.cpu().tolist(),
                      "distance_expectation_cells": dfl_expected.cpu().tolist()},
        "detections_input_xyxy_conf_cls": detections.tolist(),
        "limitations": "Single real inference, not training or a benchmark. Four channels per block, each tile separately min/max normalized. A bright channel is not a labeled object. Detect tiles show raw P3 logits. Input image may be synthetic; model operations are real."
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    print(f"Saved {len(layers)} outer blocks and {sum(len(x['operators']) for x in layers)} primitive operator records to {args.out}")


if __name__ == "__main__":
    main()
