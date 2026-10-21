"""Actual CUDA array interoperability; not a replacement YOLO/autograd engine.

Shared storage is intentional. Do not mutate a tensor used by autograd through a
CuPy view. DLPack exchanges memory; it does not transfer a computation graph.
"""
import argparse
import json


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--device", type=int, default=0)
    args = p.parse_args()
    import torch
    import cupy as cp
    if not torch.cuda.is_available() or not 0 <= args.device < torch.cuda.device_count():
        p.error("A compatible NVIDIA CUDA GPU/runtime is required; there is no silent CPU fallback")
    with torch.cuda.device(args.device), cp.cuda.Device(args.device), torch.no_grad():
        x = torch.linspace(-4, 4, 4096, device=f"cuda:{args.device}", dtype=torch.float32).reshape(64, 64)
        # Object-based DLPack performs stream negotiation. Keep both owners alive.
        view = cp.from_dlpack(x.detach())
        assert view.data.ptr == x.data_ptr(), "Expected zero-copy shared storage"
        gpu_score = 1 / (1 + cp.exp(-view))
        back = torch.from_dlpack(gpu_score)
        assert back.data_ptr() == gpu_score.data.ptr
        error = (back - x.sigmoid()).abs().max().item()
        assert error < 1e-6
        view[0, 0] = 7
        cp.cuda.get_current_stream().synchronize()
        assert x[0, 0].item() == 7  # Proves aliasing; unsafe on a live autograd tensor.
        print(json.dumps({"gpu": torch.cuda.get_device_name(args.device), "torch": torch.__version__,
                          "cupy": cp.__version__, "shared_pointer": True,
                          "sigmoid_max_error": error, "aliasing_proved": True,
                          "autograd": "detached inference-only exchange; no gradient graph crosses DLPack"}, indent=2))


if __name__ == "__main__":
    main()
