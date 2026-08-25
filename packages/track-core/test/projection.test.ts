import { describe, expect, it } from "vitest";
import { projectSegments, simplifyPoints } from "../src/index.js";

describe("track projection", () => {
  it("fits projected points inside the requested padded bounds", () => {
    const projected = projectSegments([{ points: [{ lat: 28, lon: 100 }, { lat: 29, lon: 102 }] }], 400, 300, 20);
    for (const point of projected[0]?.points || []) {
      expect(point.x).toBeGreaterThanOrEqual(20);
      expect(point.x).toBeLessThanOrEqual(380);
      expect(point.y).toBeGreaterThanOrEqual(20);
      expect(point.y).toBeLessThanOrEqual(280);
    }
  });

  it("simplifies near-linear routes while keeping endpoints", () => {
    const points = Array.from({ length: 100 }, (_, index) => ({ lat: index / 1000, lon: index / 1000, elevation: index }));
    const simplified = simplifyPoints(points, 0.00001);
    expect(simplified).toHaveLength(2);
    expect(simplified[0]).toBe(points[0]);
    expect(simplified[1]).toBe(points[99]);
  });
});
