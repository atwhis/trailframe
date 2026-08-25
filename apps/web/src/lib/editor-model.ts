export interface LayerState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
}

export type GridPosition = "top-left" | "top-center" | "top-right" | "middle-left" | "middle-center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type MetricKey = "distance" | "ascent" | "duration";

export const GRID_POSITIONS: GridPosition[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

export function moveToGrid(layer: LayerState, position: GridPosition): LayerState {
  const [vertical, horizontal] = position.split("-");
  const x = horizontal === "left" ? 0.2 : horizontal === "right" ? 0.8 : 0.5;
  const y = vertical === "top" ? 0.2 : vertical === "bottom" ? 0.8 : 0.5;
  return { ...layer, x, y };
}

export function toggleMetric(metrics: MetricKey[], metric: MetricKey): MetricKey[] {
  if (metrics.includes(metric)) return metrics.length === 1 ? metrics : metrics.filter((value) => value !== metric);
  return [...metrics, metric];
}

export function clampUnit(value: number): number {
  return Math.max(0.04, Math.min(0.96, value));
}
