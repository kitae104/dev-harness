from torch import nn


class DigitsClassifier(nn.Module):
    """64개 픽셀 → 10개 숫자. 예제용 작은 신경망입니다. 자신의 모델은 이 파일 옆에 만드세요."""

    def __init__(self, hidden: int = 128, num_classes: int = 10) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(64, hidden),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden, num_classes),
        )

    def forward(self, x):
        return self.net(x)
