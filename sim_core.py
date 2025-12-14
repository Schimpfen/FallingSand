from dataclasses import dataclass
from enum import Enum, IntEnum
from typing import Iterable, List, Optional, Tuple

import numpy as np


class CellState(IntEnum):
    """Represent the available states inside the CA grid."""

    EMPTY = 0
    FINE = 1
    COARSE = 2
    WALL = 3


@dataclass(frozen=True)
class SimulationMetrics:
    """Diagnostics emitted after each snapshot."""

    mix_ratio: float
    delta_h: int
    top_height: int
    bottom_height: int


class FloorProfile(Enum):
    """Predefined terrain shapes used for the static floor."""

    RANDOM = "random"
    FLAT = "flat"
    SLOPE = "slope"
    STEPPED = "stepped"


class SimulationEngine:
    """Encapsulates the cellular automaton that simulates falling sand."""

    def __init__(
        self,
        width: int = 50,
        height: int = 50,
        mix_ratio: float = 1.0,
        coarse_slide: float = 0.05,
        seed: Optional[int] = None,
        floor_profile: FloorProfile = FloorProfile.RANDOM,
        floor_min: int = 2,
        floor_max: Optional[int] = None,
    ) -> None:
        self.width = width
        self.height = height
        self._mix_ratio = self._clamp_ratio(mix_ratio)
        self.coarse_slide = coarse_slide
        self._rng = np.random.default_rng(seed)
        self.grid = np.full((height, width), CellState.EMPTY, dtype=np.uint8)
        self._floor_profile = floor_profile
        self._floor_min = max(1, floor_min)
        self._floor_max = floor_max
        self._build_floor()

    @staticmethod
    def _clamp_ratio(value: float) -> float:
        return float(max(0.0, min(1.0, value)))

    def _build_floor(self) -> None:
        """Build a randomly varying floor so particles have a surface to land on."""
        floor_upper = (
            (self._floor_max if self._floor_max is not None else max(2, self.height // 2))
        )
        floor_upper = max(self._floor_min, floor_upper)
        floor_upper = min(self.height - 1, floor_upper)
        floor_min = min(self._floor_min, floor_upper)
        self.grid.fill(CellState.EMPTY)
        heights = self._build_floor_heights(floor_min, floor_upper)
        for column, height in enumerate(heights):
            start_row = self.height - height
            self.grid[start_row:, column] = CellState.WALL

    def _build_floor_heights(self, floor_min: int, floor_max: int) -> np.ndarray:
        """Generate column heights for the requested floor profile."""
        if self._floor_profile == FloorProfile.FLAT or floor_min == floor_max:
            return np.full(self.width, floor_min, dtype=int)

        if self._floor_profile == FloorProfile.SLOPE:
            result = np.linspace(floor_min, floor_max, num=self.width)
            return np.round(result).astype(int)

        if self._floor_profile == FloorProfile.STEPPED:
            steps = max(2, self.width // 6)
            pattern = np.linspace(floor_min, floor_max, num=steps)
            repeats = int(np.ceil(self.width / steps))
            stepped = np.repeat(pattern, repeats)[: self.width]
            return np.round(stepped).astype(int)

        # Random floor
        return self._rng.integers(floor_min, floor_max + 1, size=self.width)

    @property
    def mix_ratio(self) -> float:
        return self._mix_ratio

    def set_mix(self, value: float) -> None:
        self._mix_ratio = self._clamp_ratio(value)

    @property
    def source_position(self) -> Tuple[int, int]:
        return 0, self.width // 2

    def emit(self) -> None:
        """Drop a new sand grain at the source if it is empty."""
        y, x = self.source_position
        if self.grid[y, x] != CellState.EMPTY:
            return
        state = CellState.FINE if self._rng.random() < self._mix_ratio else CellState.COARSE
        self.grid[y, x] = state

    def _is_empty(self, y: int, x: int) -> bool:
        return 0 <= y < self.height and 0 <= x < self.width and self.grid[y, x] == CellState.EMPTY

    def _available_neighbors(self, positions: Iterable[Tuple[int, int]]) -> List[Tuple[int, int]]:
        return [(y, x) for y, x in positions if self._is_empty(y, x)]

    def _move(self, source: Tuple[int, int], destination: Tuple[int, int], moved: np.ndarray) -> None:
        sy, sx = source
        dy, dx = destination
        self.grid[dy, dx] = self.grid[sy, sx]
        self.grid[sy, sx] = CellState.EMPTY
        moved[dy, dx] = True

    def step(self) -> None:
        """Advance the CA by one discrete timestep."""
        moved = np.zeros((self.height, self.width), dtype=bool)
        for column in self._rng.permutation(self.width):
            for row in range(self.height - 2, -1, -1):
                if moved[row, column]:
                    continue
                state = CellState(self.grid[row, column])
                if state not in (CellState.FINE, CellState.COARSE):
                    continue

                below = (row + 1, column)
                if self._is_empty(*below):
                    self._move((row, column), below, moved)
                    continue

                diag_positions = [(row + 1, column - 1), (row + 1, column + 1)]
                diag_neighbors = self._available_neighbors(diag_positions)
                probability = 1.0 if state == CellState.FINE else self.coarse_slide
                if diag_neighbors and self._rng.random() < probability:
                    self._move((row, column), self._rng.choice(diag_neighbors), moved)
                    continue

                if state == CellState.FINE:
                    sideways = self._available_neighbors([(row, column - 1), (row, column + 1)])
                    if sideways:
                        self._move((row, column), self._rng.choice(sideways), moved)

    def metrics(self) -> SimulationMetrics:
        sand_mask = (self.grid == CellState.FINE) | (self.grid == CellState.COARSE)
        sand_coords = np.argwhere(sand_mask)
        if sand_coords.size == 0:
            top_y = bottom_y = self.height
        else:
            top_y = int(np.min(sand_coords[:, 0]))
            bottom_y = int(np.max(sand_coords[:, 0]))
        height_max = self.height - top_y
        height_min = self.height - bottom_y
        return SimulationMetrics(
            mix_ratio=self._mix_ratio,
            delta_h=height_max - height_min,
            top_height=height_max,
            bottom_height=height_min,
        )

    def snapshot(self) -> dict:
        metrics = self.metrics()
        return {
            "grid": self.grid.tolist(),
            "mix_ratio": metrics.mix_ratio,
            "delta_h": metrics.delta_h,
            "top_height": metrics.top_height,
            "bottom_height": metrics.bottom_height,
        }
