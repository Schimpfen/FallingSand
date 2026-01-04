export enum CellState {
  Empty = 0,
  Fine = 1,
  Coarse = 2,
  Wall = 3,
}

export type GridPoint = { x: number; y: number };

export type FloorProfile = "slope" | "flat";

export interface SimulationMetrics {
  mixRatio: number;
  deltaH: number;
  topHeight: number;
  bottomHeight: number;
  heapAngle: number;
}

export interface SimulationConfig {
  width?: number;
  height?: number;
  floorMin?: number;
  floorMax?: number;
  mixRatio?: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const STATE_COLORS: Record<CellState, string> = {
  [CellState.Empty]: "#f7fbff",
  [CellState.Fine]: "#f4a261",
  [CellState.Coarse]: "#b5651d",
  [CellState.Wall]: "#0f172a",
};

export const colors = STATE_COLORS;

export class SimulationEngine {
  width: number;
  height: number;
  grid: Uint8Array;
  stopped: Uint8Array;
  floorMin: number;
  floorMax: number;
  mixRatio: number;
  fineDiagonalProb: number;
  coarseDiagonalProb: number;
  fineLateralProb: number;
  coarseLateralProb: number;
  profile: FloorProfile = "slope";
  private columnOrder: Uint16Array;

  constructor(config: SimulationConfig = {}) {
    this.width = config.width ?? 80;
    this.height = config.height ?? 60;
    this.floorMin = config.floorMin ?? 4;
    this.floorMax =
      config.floorMax ??
      Math.max(this.floorMin + 1, Math.floor(this.height / 2));
    this.mixRatio = clamp01(config.mixRatio ?? 0.7);
    this.grid = new Uint8Array(this.width * this.height);
    this.stopped = new Uint8Array(this.width * this.height);
    this.columnOrder = new Uint16Array(this.width);
    for (let i = 0; i < this.width; i++) {
      this.columnOrder[i] = i;
    }
    this.updateFlowParameters();
    this.buildSlope(this.floorMin, this.floorMax);
  }

  get sourceColumn() {
    return Math.floor(this.width / 2);
  }

  private updateFlowParameters() {
    // Fixed parameters: fine flows like water, coarse is moderately sticky.
    this.fineDiagonalProb = 1;
    this.coarseDiagonalProb = 0.9;

    this.fineLateralProb = 0.9;
    this.coarseLateralProb = 0.4;
  }

  setMixRatio(value: number) {
    this.mixRatio = clamp01(value);
  }

  resetSandOnly() {
    for (let i = 0; i < this.grid.length; i++) {
      if (
        this.grid[i] === CellState.Fine ||
        this.grid[i] === CellState.Coarse
      ) {
        this.grid[i] = CellState.Empty;
        this.stopped[i] = 0;
      }
    }
  }

  buildSlope(minHeight: number, maxHeight: number) {
    this.profile = "slope";
    const clampedMin = Math.max(
      1,
      Math.min(this.height - 1, Math.round(minHeight))
    );
    const upperBound = Math.max(
      clampedMin,
      Math.min(this.height - 1, Math.round(maxHeight))
    );
    this.floorMin = clampedMin;
    this.floorMax = upperBound;
    this.grid.fill(CellState.Empty);
    this.stopped.fill(0);
    const heights = this.buildSlopeHeights(clampedMin, upperBound);
    heights.forEach((height, x) => {
      const cappedHeight = Math.max(0, Math.min(this.height, height));
      const startRow = this.height - cappedHeight;
      for (let y = startRow; y < this.height; y++) {
        this.grid[y * this.width + x] = CellState.Wall;
      }
    });
  }

  private buildSlopeHeights(minHeight: number, maxHeight: number): number[] {
    if (minHeight === maxHeight) {
      return Array.from({ length: this.width }, () => minHeight);
    }
    const heights: number[] = [];
    for (let x = 0; x < this.width; x++) {
      const t = x / Math.max(1, this.width - 1);
      const interpolated = minHeight + t * (maxHeight - minHeight);
      heights.push(Math.round(interpolated));
    }
    return heights;
  }

  setCell(point: GridPoint, state: CellState) {
    if (!this.inBounds(point.y, point.x)) return;
    const index = point.y * this.width + point.x;
    this.grid[index] = state;
    this.stopped[index] = 0;
  }

  getCell(point: GridPoint) {
    if (!this.inBounds(point.y, point.x)) return CellState.Empty;
    return this.grid[point.y * this.width + point.x] as CellState;
  }

  inBounds(y: number, x: number) {
    return y >= 0 && x >= 0 && y < this.height && x < this.width;
  }

  private isEmpty(y: number, x: number) {
    return (
      this.inBounds(y, x) && this.grid[y * this.width + x] === CellState.Empty
    );
  }

  private move(source: GridPoint, destination: GridPoint, moved: Uint8Array) {
    const sourceIndex = source.y * this.width + source.x;
    const destIndex = destination.y * this.width + destination.x;
    this.grid[destIndex] = this.grid[sourceIndex];
    this.grid[sourceIndex] = CellState.Empty;
    this.stopped[destIndex] = 0;
    moved[destIndex] = 1;
  }

  emitAt(column: number, explicitState?: CellState) {
    const x = Math.max(0, Math.min(this.width - 1, Math.floor(column)));
    const y = 0;
    const index = y * this.width + x;
    if (this.grid[index] !== CellState.Empty) return false;
    const state =
      explicitState ??
      (Math.random() < this.mixRatio ? CellState.Fine : CellState.Coarse);
    this.grid[index] = state;
    this.stopped[index] = 0;
    return true;
  }

  emit() {
    return this.emitAt(this.sourceColumn);
  }

  private shuffleColumns() {
    for (let i = this.columnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = this.columnOrder[i];
      this.columnOrder[i] = this.columnOrder[j];
      this.columnOrder[j] = tmp;
    }
  }

  step(): boolean {
    const moved = new Uint8Array(this.grid.length);
    let changed = false;
    this.shuffleColumns();

    for (let ci = 0; ci < this.columnOrder.length; ci++) {
      const column = this.columnOrder[ci];
      for (let row = this.height - 2; row >= 0; row--) {
        const index = row * this.width + column;
        if (moved[index]) continue;
        const state = this.grid[index] as CellState;
        if (state !== CellState.Fine && state !== CellState.Coarse) continue;

        const below: GridPoint = { y: row + 1, x: column };
        if (this.isEmpty(below.y, below.x)) {
          this.move({ y: row, x: column }, below, moved);
          changed = true;
          continue;
        }

        if (this.stopped[index]) continue;

        const diag: GridPoint[] = [
          { y: row + 1, x: column - 1 },
          { y: row + 1, x: column + 1 },
        ].filter((p) => this.isEmpty(p.y, p.x));

        if (diag.length === 2) {
          const chosen = diag[Math.floor(Math.random() * diag.length)];
          this.move({ y: row, x: column }, chosen, moved);
          changed = true;
          continue;
        }

        const slideChance =
          state === CellState.Fine
            ? this.fineDiagonalProb
            : this.coarseDiagonalProb;

        if (diag.length && Math.random() < slideChance) {
          const chosen = diag[Math.floor(Math.random() * diag.length)];
          this.move({ y: row, x: column }, chosen, moved);
          changed = true;
          continue;
        }

        const lateralNeighbors = [
          { y: row, x: column - 1 },
          { y: row, x: column + 1 },
        ].filter((p) => this.isEmpty(p.y, p.x));
        const lateralChance =
          state === CellState.Fine
            ? this.fineLateralProb
            : this.coarseLateralProb;
        if (lateralNeighbors.length && Math.random() < lateralChance) {
          const destination =
            lateralNeighbors[
              Math.floor(Math.random() * lateralNeighbors.length)
            ];
          this.move({ y: row, x: column }, destination, moved);
          changed = true;
        } else {
          this.stopped[index] = 1;
        }
      }
    }
    return changed;
  }

  settle(maxIterations = 1000) {
    let moves = 0;
    for (let i = 0; i < maxIterations; i++) {
      if (!this.step()) break;
      moves++;
    }
    return moves;
  }

  private surfaceProfile(): { columns: number[]; heights: number[] } {
    const heights = new Array<number>(this.width).fill(-1);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const val = this.grid[index];
        if (
          (val === CellState.Fine || val === CellState.Coarse) &&
          heights[x] === -1
        ) {
          heights[x] = this.height - y;
        }
      }
    }
    const columns: number[] = [];
    const filteredHeights: number[] = [];
    for (let x = 0; x < heights.length; x++) {
      if (heights[x] >= 0) {
        columns.push(x);
        filteredHeights.push(heights[x]);
      }
    }
    return { columns, heights: filteredHeights };
  }

  private heapAngle(): number {
    const { columns, heights } = this.surfaceProfile();
    if (heights.length < 2) return 0;

    // Find peak column.
    let peakIdx = 0;
    for (let i = 1; i < heights.length; i++) {
      if (heights[i] > heights[peakIdx]) {
        peakIdx = i;
      }
    }

    const regressionSlope = (xs: number[], ys: number[]): number | null => {
      const n = xs.length;
      if (n < 2) return null;
      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < n; i++) {
        sumX += xs[i];
        sumY += ys[i];
      }
      const meanX = sumX / n;
      const meanY = sumY / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        num += dx * dy;
        den += dx * dx;
      }
      if (den === 0) return null;
      return num / den;
    };

    const leftXs = columns.slice(0, peakIdx + 1);
    const leftYs = heights.slice(0, peakIdx + 1);
    const rightXs = columns.slice(peakIdx);
    const rightYs = heights.slice(peakIdx);

    const leftSlope = regressionSlope(leftXs, leftYs);
    const rightSlope = regressionSlope(rightXs, rightYs);

    const angles: number[] = [];
    if (leftSlope !== null) angles.push(Math.abs(Math.atan(leftSlope)));
    if (rightSlope !== null) angles.push(Math.abs(Math.atan(rightSlope)));

    if (!angles.length) return 0;
    const meanAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
    return (meanAngle * 180) / Math.PI;
  }

  metrics(): SimulationMetrics {
    let topY = this.height;
    let bottomY = 0;
    let hasSand = false;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const value = this.grid[y * this.width + x];
        if (value === CellState.Fine || value === CellState.Coarse) {
          hasSand = true;
          if (y < topY) topY = y;
          if (y > bottomY) bottomY = y;
        }
      }
    }
    const topHeight = hasSand ? this.height - topY : 0;
    const bottomHeight = hasSand ? this.height - bottomY : 0;
    return {
      mixRatio: this.mixRatio,
      deltaH: hasSand ? topHeight - bottomHeight : 0,
      topHeight,
      bottomHeight,
      heapAngle: this.heapAngle(),
    };
  }

  floorAngle() {
    const rise = Math.max(0, this.floorMax - this.floorMin);
    const run = Math.max(1, this.width - 1);
    return (Math.atan2(rise, run) * 180) / Math.PI;
  }
}
