import { describe, expect, it } from "vitest";
import { moveToGrid, toggleMetric, type LayerState } from "./editor-model.js";

const layer: LayerState = { x: 0.5, y: 0.5, scale: 1, rotation: 12, visible: true, locked: false };

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
});
