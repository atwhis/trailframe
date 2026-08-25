import { describe, expect, it } from "vitest";
import { analyzeSegments, type TrackData } from "../../../packages/track-core/src/index.js";
import { lookupPeaks } from "../src/peaks.js";

const segments = [{ points: [{ lat: 28.4, lon: 100.4, elevation: 4000 }, { lat: 28.41, lon: 100.41, elevation: 4100 }] }];
const track: TrackData = { name: "peak", sourceFormat: "gpx", waypoints: [], ...analyzeSegments(segments) };

describe("lookupPeaks", () => {
  it("filters invalid and distant peaks, then ranks high peaks", async () => {
    const response = { elements: [
      { id: 1, lat: 28.405, lon: 100.405, tags: { name: "近峰", ele: "4300" } },
      { id: 2, lat: 28.406, lon: 100.406, tags: { name: "高峰", ele: "4800 m" } },
      { id: 3, lat: 29, lon: 101, tags: { name: "远峰", ele: "6000" } },
      { id: 4, lat: 28.405, lon: 100.405, tags: { name: "无海拔" } },
    ] };
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify(response), { status: 200 });
    const peaks = await lookupPeaks(track, { fetchImpl });
    expect(peaks.map((peak) => peak.name)).toEqual(["高峰", "近峰"]);
  });
});
