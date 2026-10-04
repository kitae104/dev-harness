import pytest

torch = pytest.importorskip("torch")

from ml.train import evaluate, load, save, train  # noqa: E402


def test_train_learns_digits(tmp_path):
    model, accuracy = train(epochs=3, limit=600, quiet=True)
    assert accuracy > 0.6

    path = save(model, tmp_path / "digits.pt")
    restored = load(path)
    x = torch.rand(4, 64)
    model.eval()
    assert torch.equal(restored(x).argmax(1), model.cpu()(x).argmax(1))


def test_evaluate_returns_ratio():
    from ml.data import digits_loaders
    from ml.model import DigitsClassifier

    _, test_loader = digits_loaders(limit=200)
    assert 0.0 <= evaluate(DigitsClassifier(), test_loader, torch.device("cpu")) <= 1.0
