import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { ProgressBar } from "primereact/progressbar";
import { Slider } from "primereact/slider";
import {
  CellState,
  GridPoint,
  SimulationEngine,
  colors as stateColors,
} from "./simulation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrush,
  faEraser,
  faPencil,
  faRuler,
} from "@fortawesome/free-solid-svg-icons";
type CanvasMode = "sand" | "wall" | "erase" | "measure";

const GRID_WIDTH = 80;
const GRID_HEIGHT = 60;
const CELL_SIZE = 10;
const DEFAULT_FLOOR_MIN = 4;
const DEFAULT_FLOOR_MAX = 30;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function App() {
  const [engine] = useState(
    () =>
      new SimulationEngine({
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        floorMin: DEFAULT_FLOOR_MIN,
        floorMax: DEFAULT_FLOOR_MAX,
      })
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mixRatio, setMixRatio] = useState(engine.mixRatio);
  const [targetDrops, setTargetDrops] = useState(600);
  const [dropped, setDropped] = useState(0);
  const [autoDropping, setAutoDropping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [floorBase, setFloorBase] = useState(engine.floorMin);
  const [floorSpan, setFloorSpan] = useState(engine.floorMax - engine.floorMin);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("sand");
  const [metrics, setMetrics] = useState(engine.metrics());
  const [brushType, setBrushType] = useState<CellState | "mixed" | null>(null);
  const [measurement, setMeasurement] = useState<{
    a?: GridPoint;
    b?: GridPoint;
  }>({});

  const controlRef = useRef({
    paused,
    autoDropping,
    target: targetDrops,
    dropped,
  });
  const measurementRef = useRef<{ a?: GridPoint; b?: GridPoint }>({});
  const brushRef = useRef<{
    active: boolean;
    point: GridPoint | null;
    type: CellState | "mixed" | null;
  }>({
    active: false,
    point: null,
    type: null,
  });
  const droppedRef = useRef(dropped);

  const computeMeasurementInfo = (points: { a?: GridPoint; b?: GridPoint }) => {
    if (!points.a || !points.b) return null;
    const heightA = GRID_HEIGHT - points.a.y;
    const heightB = GRID_HEIGHT - points.b.y;
    const deltaH = heightB - heightA;
    const dx = points.b.x - points.a.x;
    const dy = points.a.y - points.b.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { deltaH, angle, distance };
  };
  const measurementInfo = useMemo(
    () => computeMeasurementInfo(measurement),
    [measurement]
  );

  const previewAngle = useMemo(() => {
    const cappedSpan = clamp(floorSpan, 0, GRID_HEIGHT - floorBase - 1);
    const rise = Math.max(0, cappedSpan);
    const run = Math.max(1, GRID_WIDTH - 1);
    return (Math.atan2(rise, run) * 180) / Math.PI;
  }, [floorBase, floorSpan]);

  useEffect(() => {
    controlRef.current.paused = paused;
  }, [paused]);
  useEffect(() => {
    controlRef.current.autoDropping = autoDropping;
  }, [autoDropping]);
  useEffect(() => {
    controlRef.current.target = targetDrops;
  }, [targetDrops]);
  useEffect(() => {
    controlRef.current.dropped = dropped;
    droppedRef.current = dropped;
  }, [dropped]);
  useEffect(() => {
    const maxSpan = Math.max(0, GRID_HEIGHT - floorBase - 1);
    if (floorSpan > maxSpan) {
      setFloorSpan(maxSpan);
    }
  }, [floorBase, floorSpan]);

  useEffect(() => {
    engine.setMixRatio(mixRatio);
  }, [engine, mixRatio]);

  useEffect(() => {
    measurementRef.current = measurement;
  }, [measurement]);

  useEffect(() => {
    let frame = 0;
    let animationId: number;
    const render = () => {
      const controls = controlRef.current;
      const stillDropping = controls.dropped < controls.target;
      if (controls.autoDropping && !controls.paused && stillDropping) {
        if (engine.emit()) {
          controls.dropped += 1;
          droppedRef.current = controls.dropped;
          setDropped(controls.dropped);
          if (controls.dropped >= controls.target) {
            controls.autoDropping = false;
            setAutoDropping(false);
          }
        }
      } else if (controls.autoDropping && !stillDropping) {
        controls.autoDropping = false;
        setAutoDropping(false);
      }

      engine.step();
      const brushState = brushRef.current;
      if (brushState.active && brushState.point && brushState.type !== null) {
        if (brushState.type === CellState.Wall) {
          engine.setCell(brushState.point, CellState.Wall);
        } else if (brushState.type === CellState.Empty) {
          engine.setCell(brushState.point, CellState.Empty);
        } else if (brushState.type === "mixed") {
          engine.emitAt(brushState.point.x);
        } else {
          engine.emitAt(brushState.point.x, brushState.type);
        }
      }
      if (controls.dropped !== droppedRef.current) {
        droppedRef.current = controls.dropped;
        setDropped(controls.dropped);
      }
      drawCanvas();
      if (frame % 5 === 0) {
        setMetrics(engine.metrics());
      }
      frame += 1;
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine]);

  const canvasWidth = GRID_WIDTH * CELL_SIZE;
  const canvasHeight = GRID_HEIGHT * CELL_SIZE;
  const floorLocked = hasStarted || dropped > 0 || metrics.topHeight > 0;
  const dropProgress =
    targetDrops === 0
      ? 100
      : Math.min(100, Math.round((droppedRef.current / targetDrops) * 100));

  const handleStart = () => {
    setDropped(0);
    controlRef.current.dropped = 0;
    setAutoDropping(true);
    setPaused(false);
    setHasStarted(true);
  };
  const handlePause = () => setPaused(true);
  const handleResume = () => {
    setPaused(false);
    setAutoDropping(true);
    setHasStarted(true);
  };

  const resetStage = () => {
    const cappedSpan = clamp(floorSpan, 0, GRID_HEIGHT - floorBase - 1);
    const nextMax = floorBase + cappedSpan;
    engine.buildSlope(floorBase, nextMax);
    engine.setMixRatio(mixRatio);
    setMeasurement({});
    setDropped(0);
    controlRef.current.dropped = 0;
    setAutoDropping(false);
    setPaused(false);
    setHasStarted(false);
    setMetrics(engine.metrics());
  };

  const clearSand = () => {
    engine.resetSandOnly();
    setDropped(0);
    controlRef.current.dropped = 0;
    brushRef.current = { active: false, point: null, type: null };
    setAutoDropping(false);
    controlRef.current.autoDropping = false;
    setPaused(false);
    controlRef.current.paused = false;
    setHasStarted(false);
    setMetrics(engine.metrics());
  };

  const drawMarker = (
    ctx: CanvasRenderingContext2D,
    point: GridPoint,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      point.x * CELL_SIZE + CELL_SIZE / 2,
      point.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE * 0.35,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "#0b1224";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const state = engine.grid[y * GRID_WIDTH + x] as CellState;
        ctx.fillStyle = stateColors[state];
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    const measure = measurementRef.current;
    if (measure.a) drawMarker(ctx, measure.a, "#2563eb");
    if (measure.b) drawMarker(ctx, measure.b, "#16a34a");
    if (measure.a && measure.b) {
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        measure.a.x * CELL_SIZE + CELL_SIZE / 2,
        measure.a.y * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.lineTo(
        measure.b.x * CELL_SIZE + CELL_SIZE / 2,
        measure.b.y * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.stroke();

      const info = computeMeasurementInfo(measure);
      if (info) {
        const midX = (measure.a.x + measure.b.x + 1) * CELL_SIZE * 0.5;
        const midY = (measure.a.y + measure.b.y + 1) * CELL_SIZE * 0.5;
        const deltaHText = `Delta h:  ${info.deltaH.toFixed(1)}`;
        const angleText = `Angle:  ${info.angle.toFixed(1)} deg`;
        const distanceText = `Dist.:  ${info.distance.toFixed(1)}`;
        const fontSize = 14;
        ctx.font = `${fontSize}px Manrope, Arial, sans-serif`;
        ctx.textBaseline = "top";
        const padding = 6;
        const metricsWidth = Math.max(
          ctx.measureText(deltaHText).width,
          ctx.measureText(angleText).width,
          ctx.measureText(distanceText).width
        );
        const metricsHeight = 3 * 14;
        const boxX = Math.min(
          canvas.width - metricsWidth - padding * 2,
          Math.max(4, midX)
        );
        const boxY = Math.min(canvas.height - 24, Math.max(4, midY));
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        if ("roundRect" in ctx) {
          (ctx as any).roundRect(
            boxX,
            boxY,
            metricsWidth + padding * 2,
            metricsHeight + padding * 4,
            6
          );
        } else {
          ctx.beginPath();
          ctx.rect(boxX, boxY, metricsWidth + padding * 2, 22);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(deltaHText, boxX + padding, boxY + 5);
        ctx.fillText(angleText, boxX + padding, boxY + 5 + fontSize + padding);
        ctx.fillText(
          distanceText,
          boxX + padding,
          boxY + 5 + 2 * (fontSize + padding)
        );
      }
    }
  };

  const toGridPoint = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): GridPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((event.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((event.clientY - rect.top) * scaleY) / CELL_SIZE);
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return null;
    return { x, y };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = toGridPoint(event);
    if (!point) return;

    if (canvasMode === "measure") {
      setMeasurement((prev) => {
        if (!prev.a) return { a: point };
        if (!prev.b) return { ...prev, b: point };
        return { a: point };
      });
      return;
    }

    if (canvasMode === "wall") {
      engine.setCell(point, CellState.Wall);
      setBrushType(CellState.Wall);
      brushRef.current = { active: true, point, type: CellState.Wall };
      return;
    }
    if (canvasMode === "erase") {
      engine.setCell(point, CellState.Empty);
      setBrushType(CellState.Empty);
      brushRef.current = { active: true, point, type: CellState.Empty };
      return;
    }

    const type = event.button === 2 ? CellState.Coarse : CellState.Fine;
    if (event.button === 1) {
      engine.emitAt(point.x);
      brushRef.current = { active: true, point, type: "mixed" };
      setBrushType("mixed");
    } else {
      engine.emitAt(point.x, type);
      brushRef.current = { active: true, point, type };
      setBrushType(type);
    }
    setHasStarted(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toGridPoint(event);
    if (!point) return;
    brushRef.current.point = point;
    if (brushRef.current.active && brushRef.current.type !== null) {
      setBrushType(brushRef.current.type);
    }
  };

  const stopBrushing = () => {
    setBrushType(null);
    brushRef.current = { active: false, point: null, type: null };
  };

  const onSetCanvasMode = (mode: CanvasMode) => {
    if (mode !== "measure") {
      setMeasurement({});
    }
    setCanvasMode(mode);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Modelling and Simulation</p>
          <h1>Falling SandBox</h1>
        </div>
      </header>

      <div className="content-grid">
        <div className="controls-column">
          <Card title="Terrain Settings">
            <div className="field">
              <div className="field-header">
                <div>
                  <div className="label">Slope</div>
                </div>
                <InputNumber
                  value={floorSpan}
                  min={0}
                  max={Math.max(0, GRID_HEIGHT - floorBase - 1)}
                  onValueChange={(e) => setFloorSpan(e.value ?? floorSpan)}
                  disabled={floorLocked}
                  inputClassName="narrow-input"
                />
              </div>
              <Slider
                value={floorSpan}
                min={0}
                max={Math.max(0, GRID_HEIGHT - floorBase - 1)}
                step={1}
                onChange={(e) => setFloorSpan(e.value as number)}
                disabled={floorLocked}
              />
            </div>

            <div className="field">
              <div className="field-header">
                <div>
                  <div className="label">Base height</div>
                </div>
                <InputNumber
                  value={floorBase}
                  min={1}
                  max={GRID_HEIGHT - 4}
                  onValueChange={(e) => setFloorBase(e.value ?? floorBase)}
                  disabled={floorLocked}
                  inputClassName="narrow-input"
                />
              </div>
              <Slider
                value={floorBase}
                min={1}
                max={GRID_HEIGHT - 4}
                step={1}
                onChange={(e) => setFloorBase(e.value as number)}
                disabled={floorLocked}
              />
            </div>

            <div className="stage-actions">
              <Button
                label="Generate floor"
                onClick={resetStage}
                disabled={floorLocked}
                severity="help"
                icon="pi pi-sync"
              />
              <Button
                label="Reset Canvas"
                severity="danger"
                icon="pi pi-replay"
                onClick={resetStage}
              />
            </div>
          </Card>

          <Card title="Sand Settings">
            <div className="field">
              <div className="field-header">
                <div className="label">Fine ratio</div>
                <InputNumber
                  value={mixRatio}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(e) => setMixRatio(e.value ?? mixRatio)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  inputClassName="narrow-input"
                />
              </div>
              <Slider
                value={mixRatio}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) => setMixRatio(e.value as number)}
              />
            </div>

            <div className="field">
              <div className="field-header">
                <div className="label">Total auto-dropped grains</div>
                <InputNumber
                  value={targetDrops}
                  min={0}
                  max={5000}
                  step={10}
                  onValueChange={(e) => setTargetDrops(e.value ?? targetDrops)}
                  inputClassName="narrow-input"
                  disabled={hasStarted || autoDropping || paused}
                />
              </div>
              <Slider
                value={targetDrops}
                min={0}
                max={1500}
                step={10}
                onChange={(e) => setTargetDrops(e.value as number)}
                disabled={hasStarted || autoDropping || paused}
              />
            </div>
          </Card>
        </div>

        <div className="canvas-column">
          <Card>
            <div className="stream-actions">
              {paused ? (
                <Button
                  label="Resume"
                  icon="pi pi-refresh"
                  severity="success"
                  onClick={handleResume}
                  disabled={!paused}
                />
              ) : (
                <Button
                  label="Start"
                  icon="pi pi-play"
                  onClick={handleStart}
                  disabled={autoDropping}
                />
              )}
              <Button
                label="Pause"
                icon="pi pi-pause"
                severity="warning"
                onClick={handlePause}
                disabled={paused || !autoDropping}
              />
              <Button
                label="Clear sand"
                icon="pi pi-times"
                severity="danger"
                onClick={clearSand}
              />
            </div>
            <ProgressBar value={dropProgress} showValue={false} />
            <div className="progress-text">
              <span>
                Dropped {dropped} / {targetDrops}
              </span>
            </div>

            <div className="canvas-layout">
              <div className="canvas-shell">
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className={`sim-canvas mode-${canvasMode}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopBrushing}
                  onPointerLeave={stopBrushing}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className="canvas-overlay">
                  <div>
                    Delta Height: {`${metrics.deltaH.toFixed(0)} cells`}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    Heap Angle: {`${metrics.heapAngle.toFixed(1)} deg`}
                  </div>
                </div>
              </div>
              <div className="canvas-tools">
                <Button
                  outlined={canvasMode !== "sand"}
                  label="Sand brush"
                  icon={() => <FontAwesomeIcon icon={faBrush} />}
                  onClick={() => onSetCanvasMode("sand")}
                />
                <Button
                  outlined={canvasMode !== "wall"}
                  label="Draw wall"
                  icon={() => <FontAwesomeIcon icon={faPencil} />}
                  onClick={() => onSetCanvasMode("wall")}
                />
                <Button
                  outlined={canvasMode !== "erase"}
                  label="Erase"
                  icon={() => <FontAwesomeIcon icon={faEraser} />}
                  onClick={() => onSetCanvasMode("erase")}
                />
                <Button
                  outlined={canvasMode !== "measure"}
                  label="Measure"
                  icon={() => <FontAwesomeIcon icon={faRuler} />}
                  onClick={() => onSetCanvasMode("measure")}
                />
                {canvasMode === "sand" && (
                  <small className="brush-info">
                    left click: fine sand
                    <br />
                    wheel click: fine ratio mix
                    <br />
                    right click: coarse sand
                  </small>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

type MetricProps = { label: string; value: string };
const Metric = ({ label, value }: MetricProps) => (
  <div className="metric">
    <span className="metric-label">{label}</span>
    <strong>{value}</strong>
  </div>
);
