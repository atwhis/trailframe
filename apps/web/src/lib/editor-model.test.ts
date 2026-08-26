import { describe, expect, it } from "vitest";
import { moveToGrid, parseNumericDraft, toggleMetric, type LayerState } from "./editor-model.js";

const layer: LayerState = { x: 0.5, y: 0.5, scale: 1, rotation: 12, opacity: 0.8, visible: true, locked: false };

describe("photo editor model", () => {
  it("uses normalized coordinates for nine-grid positioning", () => {
    expect(moveToGrid(layer, "top-left")).toMatchObject({ x: 0.2, y: 0.2, rotation: 12 });
    expect(moveToGrid(layer, "bottom-right")).toMatchObject({ x: 0.8, y: 0.8 });
  });

  it("keeps at least one selected metric", () => {
    expect(toggleMetric(["distance"], "distance")).toEqual(["distance"]);
    expect(toggleMetric(["distance", "duration"], "distance")).toEqual(["duration"]);
    expect(toggleMetric(["distance"], "ascent")).toEqual(["distance", "ascent"]);
  });

  it("clamps numeric drafts and recovers invalid values", () => {
    expect(parseNumericDraft("120", 50, 4, 96)).toBe(96);
    expect(parseNumericDraft("-10", 50, 4, 96)).toBe(4);
    expect(parseNumericDraft("not-a-number", 50, 4, 96)).toBe(50);
    expect(parseNumericDraft("", 50, 4, 96)).toBe(50);
  });
});
