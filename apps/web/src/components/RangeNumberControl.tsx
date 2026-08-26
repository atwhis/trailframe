import { useEffect, useState } from "react";
import { parseNumericDraft } from "../lib/editor-model.js";

interface RangeNumberControlProps {
  label: string;
  ariaPrefix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function decimalsFor(step: number): number {
  const fraction = String(step).split(".")[1];
  return fraction?.length || 0;
}

export function RangeNumberControl({ label, ariaPrefix, value, min, max, step, unit, onChange }: RangeNumberControlProps) {
  const decimals = decimalsFor(step);
  const formattedValue = value.toFixed(decimals);
  const [draft, setDraft] = useState(formattedValue);

  useEffect(() => setDraft(formattedValue), [formattedValue]);

  const commit = () => {
    const next = parseNumericDraft(draft, value, min, max);
    onChange(next);
    setDraft(next.toFixed(decimals));
  };

  return <div className="range-number-control">
    <span>{label}</span>
    <input
      aria-label={`${ariaPrefix} ${label}`}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    <span className="number-field">
      <input
        aria-label={`${ariaPrefix} ${label}数值`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(formattedValue);
        }}
      />
      <i>{unit}</i>
    </span>
  </div>;
}
