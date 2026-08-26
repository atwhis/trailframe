import { describe, expect, it } from "vitest";
import { analyzeSegments, type TrackData } from "../../../packages/track-core/src/index.js";
import { routeSvg } from "../src/poster.js";
import { assignDateColors, FALLBACK_ROUTE_COLOR } from "../src/route-colors.js";

function trackWithDailySections(): TrackData {
  const segments = [
    { points: [{ lat: 30, lon: 102, elevation: 1000, time: "2026-01-01T01:00:00Z" }, { lat: 30.01, lon: 102.01, elevation: 1050, time: "2026-01-01T02:00:00Z" }] },
    { points: [{ lat: 30.02, lon: 102.02, elevation: 1100, time: "2026-01-02T01:00:00Z" }, { lat: 30.03, lon: 102.03, elevation: 1150, time: "2026-01-02T02:00:00Z" }] },
  ];
  return { name: "多日轨迹", sourceFormat: "gpx", waypoints: [], ...analyzeSegments(segments, { timeZone: "UTC" }) };
}

describe("date route colors", () => {
  it("assigns one deterministic unique color per date beyond the fixed palette", () => {
    const dates = Array.from({ length: 20 }, (_, index) => `2026-01-${String(index + 1).padStart(2, "0")}`);
    const colors = assignDateColors([...dates, dates[0]!]);
    expect(colors.size).toBe(20);
    expect(new Set(colors.values()).size).toBe(20);
    expect(assignDateColors([...dates].reverse())).toEqual(colors);
  });

  it("uses daily colors in both templates and a single fallback without timestamps", () => {
    const track = trackWithDailySections();
    for (const template of ["modern", "guidebook"] as const) {
      const svg = routeSvg(track, template, 1400);
      const colors = [...svg.matchAll(/data-route-date="[^"]+"[^>]+stroke="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(colors).size).toBe(2);
    }
    const noTime = { ...track, dailySections: [] };
    const svg = routeSvg(noTime, "guidebook", 1400);
    const colors = [...svg.matchAll(/data-route-date="[^"]+"[^>]+stroke="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(colors)).toEqual(new Set([FALLBACK_ROUTE_COLOR]));
  });
});
