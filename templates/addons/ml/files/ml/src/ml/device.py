import torch


def get_device() -> torch.device:
    """사용할 수 있는 가장 빠른 장치: NVIDIA GPU(cuda) → Apple GPU(mps) → CPU."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def describe() -> str:
    device = get_device()
    if device.type == "cuda":
        return f"cuda ({torch.cuda.get_device_name(0)}), torch {torch.__version__}"
    return f"{device.type}, torch {torch.__version__}"


if __name__ == "__main__":
    print(describe())
