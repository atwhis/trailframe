import { GRID_POSITIONS, type GridPosition } from "../lib/editor-model.js";

export function GridPicker({ onPick, label }: { onPick: (position: GridPosition) => void; label: string }) {
  return <div className="grid-picker" aria-label={label}>{GRID_POSITIONS.map((position) => <button key={position} aria-label={`${label}-${position}`} title={position} onClick={() => onPick(position)} />)}</div>;
}
