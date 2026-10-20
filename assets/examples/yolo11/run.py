"""YOLO11 course runner for an external CPU/GPU machine, not the static website.

Pinned learning baseline: ultralytics==8.3.0, torch==2.4.1, torchvision==0.19.1.
Uses Ultralytics under its applicable terms; this wrapper does not grant model,
dataset or dependency rights. Only load checkpoints from trusted sources.
"""
import argparse
import json
from pathlib import Path

SUFFIX = {"detect": "", "segment": "-seg", "pose": "-pose", "classify": "-cls", "obb": "-obb"}


def array(value):
    return None if value is None else value.cpu().tolist()


def describe(result):
    """Extract task-specific results without assuming every head produces boxes."""
    output = {"orig_shape": list(result.orig_shape), "names": result.names}
    if result.boxes is not None:
        output["boxes"] = {"xyxy": array(result.boxes.xyxy), "cls": array(result.boxes.cls), "conf": array(result.boxes.conf)}
        if result.boxes.id is not None:
            output["boxes"]["id"] = array(result.boxes.id)
    if result.masks is not None:
        output["masks"] = {"shape": list(result.masks.data.shape), "xy": [p.tolist() for p in result.masks.xy]}
    if result.keypoints is not None:
        output["keypoints"] = {"xy": array(result.keypoints.xy), "conf": array(result.keypoints.conf)}
    if result.probs is not None:
        output["probs"] = {"top1": result.probs.top1, "top5": result.probs.top5, "top5conf": array(result.probs.top5conf)}
    if result.obb is not None:
        output["obb"] = {"xywhr": array(result.obb.xywhr), "xyxyxyxy": array(result.obb.xyxyxyxy), "cls": array(result.obb.cls), "conf": array(result.obb.conf)}
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("task", choices=SUFFIX)
    parser.add_argument("mode", choices=["predict", "train", "val", "export", "track"])
    parser.add_argument("--model", help="Trusted checkpoint/export path; otherwise use the task's YOLO11n")
    parser.add_argument("--source", help="Image, video, directory or stream source for predict/track")
    parser.add_argument("--data", help="Task-specific dataset YAML, or classification directory")
    parser.add_argument("--out", type=Path, default=None, help="New output directory; refuses existing nonempty directories")
    parser.add_argument("--device", default="cpu", help="cpu, or a configured CUDA device such as 0")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--imgsz", type=int, default=None)
    parser.add_argument("--conf", type=float, default=.25)
    parser.add_argument("--split", choices=["val", "test"], default="val")
    parser.add_argument("--from-scratch", action="store_true", help="Random init with the SAME licensed Ultralytics stack; not an independent implementation")
    args = parser.parse_args()
    if args.mode in {"train", "val"} and not args.data:
        parser.error("train/val requires --data; classification uses a directory, other tasks use YAML")
    if args.mode in {"predict", "track"} and not args.source:
        parser.error("predict/track requires --source")
    if args.mode == "track" and args.task not in {"detect", "segment", "pose"}:
        parser.error("This v8.3.0 recipe supports tracking only with detect/segment/pose")
    if args.from_scratch and (args.mode != "train" or args.model):
        parser.error("--from-scratch is for train without --model")
    if args.epochs < 1 or not 0 <= args.conf <= 1 or (args.imgsz is not None and args.imgsz < 32):
        parser.error("epochs>=1, conf in [0,1], imgsz>=32 are required")
    out = args.out or Path("runs") / f"course-{args.task}-{args.mode}"
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        parser.error(f"Output is nonempty: {out}. Choose a new --out.")

    # Imports are deliberately after CLI validation so --help needs no ML install.
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO

    model_path = args.model or f"yolo11n{SUFFIX[args.task]}.{'yaml' if args.from_scratch else 'pt'}"
    model = YOLO(model_path, task=args.task)
    if model.task != args.task:
        parser.error(f"Checkpoint task {model.task} does not match {args.task}")
    out.mkdir(parents=True, exist_ok=True)
    imgsz = args.imgsz or (224 if args.task == "classify" else 640)
    common = {"device": args.device, "imgsz": imgsz}
    if args.mode == "train":
        model.train(data=args.data, epochs=args.epochs, batch=2, workers=0, seed=42, deterministic=True,
                    pretrained=not args.from_scratch, project=str(out.parent), name=out.name, exist_ok=True, **common)
        print("Best checkpoint:", out / "weights" / "best.pt")
    elif args.mode == "val":
        metrics = model.val(data=args.data, split=args.split, workers=0, batch=2,
                            project=str(out.parent), name=out.name, exist_ok=True, **common)
        (out / "metrics.json").write_text(json.dumps(metrics.results_dict, indent=2), encoding="utf-8")
    elif args.mode == "export":
        # Export path belongs to Ultralytics (beside its source checkpoint); record it.
        artifact = model.export(format="onnx", opset=17, simplify=False, **common)
        (out / "artifact.json").write_text(json.dumps({"path": str(artifact), "task": args.task, "imgsz": imgsz}, indent=2), encoding="utf-8")
        print("Export:", artifact)
    else:
        options = {"source": args.source, "stream": True, "conf": args.conf, "save": False, **common}
        if args.task != "classify":
            # v8.3.0's pre_transform hardcodes auto=same_shapes and model.pt;
            # rect=False alone does NOT give identical PyTorch/ONNX input shapes.
            # Extend the task's native predictor; leave its decoding/scaling intact.
            from ultralytics.data.augment import LetterBox

            class SquareLetterboxPredictor(model.task_map[args.task]["predictor"]):
                def pre_transform(self, images):
                    letterbox = LetterBox(self.imgsz, auto=False, stride=self.model.stride)
                    return [letterbox(image=image) for image in images]

            # This pinned API accepts an instance, not the class accepted by some later releases.
            predictor_args = {**model.overrides, **{k: v for k, v in options.items() if k != "stream"},
                              "mode": args.mode, "task": args.task, "batch": 1}
            options["predictor"] = SquareLetterboxPredictor(overrides=predictor_args, _callbacks=model.callbacks)
        if args.task == "segment":
            options["retina_masks"] = True
        results = model.track(tracker="bytetrack.yaml", **options) if args.mode == "track" else model.predict(**options)
        for index, result in enumerate(results):
            stem = out / f"frame-{index:06d}"
            result.save(filename=str(stem) + "-annotated.jpg")
            Path(str(stem) + ".json").write_text(json.dumps(describe(result), indent=2), encoding="utf-8")
            if args.task == "segment":
                height, width = result.orig_shape
                alpha = np.zeros((height, width), dtype=np.uint8)
                if result.masks is not None and len(result.masks.data):
                    masks = result.masks.data.cpu().numpy()
                    np.savez_compressed(str(stem) + "-masks.npz", masks=masks)
                    alpha = (masks.max(axis=0) > .5).astype(np.uint8) * 255
                alpha_image = Image.fromarray(alpha).resize((width, height), Image.Resampling.NEAREST)
                foreground = Image.fromarray(result.orig_img[..., ::-1]).convert("RGBA")
                foreground.putalpha(alpha_image)
                foreground.save(str(stem) + "-foreground.png")
        print("Results:", out.resolve())


if __name__ == "__main__":
    main()
