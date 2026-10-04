"""예제 학습 스크립트.

uv run python -m ml.train --epochs 10      # ml/models/digits.pt 저장
make ml-train                               # 프로젝트 루트에서
"""

import argparse
from pathlib import Path

import torch
from torch import nn
from tqdm import tqdm

from ml.data import digits_loaders
from ml.device import describe, get_device
from ml.model import DigitsClassifier
from ml.paths import MODELS_DIR


def evaluate(model: nn.Module, loader, device: torch.device) -> float:
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for x, y in loader:
            pred = model(x.to(device)).argmax(dim=1)
            correct += (pred == y.to(device)).sum().item()
            total += y.numel()
    return correct / total


def train(epochs: int = 10, lr: float = 1e-3, limit: int | None = None, quiet: bool = False) -> tuple[nn.Module, float]:
    torch.manual_seed(42)
    device = get_device()
    train_loader, test_loader = digits_loaders(limit=limit)
    model = DigitsClassifier().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.CrossEntropyLoss()

    for epoch in tqdm(range(epochs), desc="학습", disable=quiet):
        model.train()
        for x, y in train_loader:
            optimizer.zero_grad()
            loss = loss_fn(model(x.to(device)), y.to(device))
            loss.backward()
            optimizer.step()
        if not quiet:
            tqdm.write(f"epoch {epoch + 1}: loss {loss.item():.4f}")

    return model, evaluate(model, test_loader, device)


def save(model: nn.Module, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), path)
    return path


def load(path: Path) -> DigitsClassifier:
    model = DigitsClassifier()
    model.load_state_dict(torch.load(path, map_location="cpu", weights_only=True))
    model.eval()
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="예제 모델 학습")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--out", type=Path, default=MODELS_DIR / "digits.pt")
    args = parser.parse_args()

    print(f"장치: {describe()}")
    model, accuracy = train(args.epochs, args.lr)
    print(f"테스트 정확도: {accuracy:.3f}")
    print(f"저장: {save(model, args.out)}")


if __name__ == "__main__":
    main()
