"""예제 데이터: scikit-learn 에 들어 있는 손글씨 숫자(8x8, 1797장). 내려받기 없이 바로 씁니다.
실제 데이터는 ml/data/ 에 두고 같은 모양(DataLoader 를 돌려주는 함수)으로 만들면 train.py 를 그대로 쓸 수 있습니다."""

import torch
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, TensorDataset


def digits_loaders(batch_size: int = 64, limit: int | None = None, seed: int = 42) -> tuple[DataLoader, DataLoader]:
    x, y = load_digits(return_X_y=True)
    if limit:
        x, y = x[:limit], y[:limit]
    x = x / 16.0  # 0~16 → 0~1
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=seed, stratify=y)

    def to_loader(features, labels, shuffle: bool) -> DataLoader:
        dataset = TensorDataset(torch.tensor(features, dtype=torch.float32), torch.tensor(labels, dtype=torch.long))
        return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)

    return to_loader(x_train, y_train, True), to_loader(x_test, y_test, False)
