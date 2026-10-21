"""Review a COCO80 training plan, then execute it with --execute.

No automatic dataset download or embedded dataset-YAML code execution. This uses
the licensed Ultralytics stack, including for random initialization.
"""
import argparse
import json
import os
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data", type=Path, required=True, help="Local YAML with path/train/val/names; no download key")
    p.add_argument("--init", choices=["scratch", "finetune"], default="scratch")
    p.add_argument("--size", choices=list("nsmlx"), default="n")
    p.add_argument("--device", default="0")
    p.add_argument("--epochs", type=int, default=300)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--out", type=Path, required=True, help="New run directory")
    p.add_argument("--execute", action="store_true", help="Start the reviewed training plan")
    p.add_argument("--no-amp", action="store_true")
    args = p.parse_args()
    if not args.data.is_file() or args.epochs < 1 or args.batch < 1 or args.workers < 0 or args.imgsz < 64 or args.imgsz % 32:
        p.error("Require local data YAML, epochs/batch>0, workers>=0 and imgsz>=64 divisible by 32")
    if args.out.exists():
        p.error("Choose a new --out; existing runs are never overwritten")
    # Must be set before importing Ultralytics/PyTorch and creating a CUDA context.
    os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")
    import yaml
    try:
        config = yaml.safe_load(args.data.read_text())
    except (yaml.YAMLError, OSError) as error:
        p.error(f"Cannot parse local dataset YAML: {error}")
    if not isinstance(config, dict) or "download" in config:
        p.error("Use a local YAML mapping without a download key")
    names = config.get("names")
    if isinstance(names, dict):
        try:
            names = [names[i] for i in range(80)] if set(names) == set(range(80)) else None
        except (KeyError, TypeError):
            names = None
    if not isinstance(names, list) or len(names) != 80 or any(not isinstance(n, str) for n in names):
        p.error("Require exactly 80 ordered class names with contiguous IDs 0…79")
    # Prevent an accidentally relabeled/custom 80-class dataset being called COCO80.
    from ultralytics.utils import ROOT
    official = yaml.safe_load((ROOT / "cfg/datasets/coco.yaml").read_text())["names"]
    if names != [official[i] for i in range(80)]:
        p.error("names must match the official COCO80 label order, not original sparse COCO category IDs")
    if "path" in config and not isinstance(config["path"], str):
        p.error("Dataset path must be an absolute path string")
    root = Path(config.get("path", args.data.resolve().parent)).expanduser()
    if not root.is_absolute():
        p.error("Use an absolute dataset path so the review and Ultralytics resolve the same files")
    split_counts = {}
    for split in ["train", "val"]:
        relative = config.get(split)
        if not isinstance(relative, str):
            p.error("This local recipe requires train/val image-directory strings")
        directory = root / relative
        if not directory.is_dir() or "images" not in directory.parts:
            p.error(f"Expected existing images directory for {split}: {directory}")
        files = sorted(f for f in directory.rglob("*") if f.suffix.lower() in {".jpg", ".jpeg", ".png"})
        if not files:
            p.error(f"No images in {directory}")
        # Mirror Ultralytics images→labels convention. Negative frames can lack txt.
        parts = list(directory.parts);parts[len(parts) - 1 - parts[::-1].index("images")] = "labels"
        label_directory = Path(*parts)
        if not label_directory.is_dir() or not any(label_directory.rglob("*.txt")):
            p.error(f"Expected converted YOLO labels in {label_directory}; COCO JSON alone is not YOLO labels")
        split_counts[split] = len(files)
    import torch
    if args.device != "cpu":
        if not args.device.isdigit() or not torch.cuda.is_available() or int(args.device) >= torch.cuda.device_count():
            p.error("Requested CUDA device is unavailable")
        device = f"cuda:{args.device}"
        # An actual operation detects unsupported GPU architectures, not just driver presence.
        _ = torch.ones((32, 32), device=device) @ torch.ones((32, 32), device=device)
        torch.cuda.synchronize()
        gpu = {"name": torch.cuda.get_device_name(int(args.device)), "capability": list(torch.cuda.get_device_capability(int(args.device)))}
    else:
        gpu = None
    plan = {"model": f"yolo11{args.size}.{'yaml' if args.init == 'scratch' else 'pt'}", "init": args.init,
            "classes": 80, "images": split_counts, "epochs": args.epochs, "batch": args.batch,
            "imgsz": args.imgsz, "device": args.device, "gpu": gpu, "amp": not args.no_amp,
            "out": str(args.out.resolve()), "data": str(args.data.resolve()),
            "notice": "Counts reflect supplied local data. COCO8/subsets are smoke tests, not full COCO2017 pretraining. RAM/VRAM and duration must be measured on your device."}
    print(json.dumps(plan, indent=2))
    if not args.execute:
        print("Plan only. Add --execute to start; no dataset download or training was performed.")
        return
    from ultralytics import YOLO
    model = YOLO(plan["model"])
    model.train(data=str(args.data.resolve()), pretrained=args.init == "finetune", epochs=args.epochs,
                batch=args.batch, imgsz=args.imgsz, device=args.device, workers=args.workers,
                amp=not args.no_amp, seed=42, deterministic=True,
                project=str(args.out.resolve().parent), name=args.out.name, exist_ok=False)
    (args.out / "course-plan.json").write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print("Checkpoint:", args.out / "weights/best.pt")
    print("Interrupted-run resume (completed stripped checkpoints cannot restore optimizer): yolo train resume model=" + str(args.out / "weights/last.pt"))


if __name__ == "__main__":
    main()
