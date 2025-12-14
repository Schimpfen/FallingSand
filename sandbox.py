import argparse

import matplotlib.animation as animation
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt

from sim_core import FloorProfile, SimulationEngine
from simulation_api import SimulationAPIServer

DEFAULT_FRAMES = 450


class SandboxVisualizer:
    """Handles the matplotlib visualization loop for a running engine."""

    def __init__(self, engine: SimulationEngine, frames: int = DEFAULT_FRAMES, interval: int = 10):
        self.engine = engine
        self.frames = frames
        self.interval = interval
        self.figure, self.ax = plt.subplots()
        self.ax.set_title(f"Mix ratio: {self.engine.mix_ratio:.2f}")
        self.cmap = mcolors.ListedColormap(["white", "#FFD700", "#8B4513", "#404040"])
        self.norm = mcolors.BoundaryNorm([0, 1, 2, 3, 4], self.cmap.N)
        self.image = self.ax.imshow(self.engine.grid, interpolation="nearest", cmap=self.cmap, norm=self.norm)

    def _report(self) -> None:
        metrics = self.engine.metrics()
        print(
            "\n--- REPORT "
            f"(Mix: {metrics.mix_ratio:.2f}) ---\n"
            f"Top Height:    {metrics.top_height}\n"
            f"Bottom Height: {metrics.bottom_height}\n"
            f"DELTA H:       {metrics.delta_h}\n"
            "------------------------------"
        )

    def _update(self, frame: int) -> tuple:
        self.engine.emit()
        self.engine.step()
        self.image.set_data(self.engine.grid)
        self.ax.set_title(f"Mix ratio: {self.engine.mix_ratio:.2f} | Step: {frame + 1}")
        if frame == self.frames - 1:
            self._report()
        return (self.image,)

    def run(self) -> None:
        self.animation = animation.FuncAnimation(
            self.figure,
            self._update,
            frames=self.frames,
            interval=self.interval,
            blit=True,
            repeat=False,
        )
        plt.show()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Visualize the falling sand simulation.")
    parser.add_argument("--api-port", type=int, help="Expose the simulation state via HTTP on this port.")
    parser.add_argument("--frames", type=int, default=DEFAULT_FRAMES, help="Number of steps to animate.")
    parser.add_argument("--interval", type=int, default=10, help="Delay between frames in milliseconds.")
    parser.add_argument("--seed", type=int, help="Seed used for deterministic floor generation.")
    parser.add_argument("--mix", type=float, default=1.0, help="Initial proportion of fine grains (0.0-1.0).")
    parser.add_argument("--width", type=int, default=50, help="Grid width.")
    parser.add_argument("--height", type=int, default=50, help="Grid height.")
    parser.add_argument(
        "--floor",
        type=str,
        choices=[profile.value for profile in FloorProfile],
        default=FloorProfile.RANDOM.value,
        help="Floor profile to use for the underlying topology.",
    )
    parser.add_argument("--floor-min", type=int, default=2, help="Minimum floor height (1=shallow).")
    parser.add_argument("--floor-max", type=int, help="Maximum floor height (<= height-1).")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    engine = SimulationEngine(
        width=args.width,
        height=args.height,
        mix_ratio=args.mix,
        seed=args.seed,
        floor_profile=FloorProfile(args.floor),
        floor_min=args.floor_min,
        floor_max=args.floor_max,
    )
    api_server = None
    if args.api_port:
        api_server = SimulationAPIServer(engine, port=args.api_port)
        api_server.start()
        print(f"Simulation API listening on http://localhost:{args.api_port}")

    visualizer = SandboxVisualizer(engine, frames=args.frames, interval=args.interval)
    try:
        visualizer.run()
    finally:
        if api_server:
            api_server.shutdown()


if __name__ == "__main__":
    main()
