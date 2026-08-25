import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { analyzeSegments, type TrackData } from "../../../packages/track-core/src/index.js";
import { buildApp } from "../src/app.js";

function fixtureTrack(): TrackData {
  const segments = [{ points: [
    { lat: 28.4, lon: 100.35, elevation: 4000, time: "2026-07-27T01:00:00Z" },
    { lat: 28.42, lon: 100.38, elevation: 4200, time: "2026-07-27T03:00:00Z" },
    { lat: 28.43, lon: 100.41, elevation: 4100, time: "2026-07-27T05:00:00Z" },
  ] }];
  return { name: "测试轨迹", sourceFormat: "gpx", waypoints: [], ...analyzeSegments(segments, { timeZone: "Asia/Shanghai" }) };
}

const failingFetch: typeof fetch = async () => { throw new Error("offline"); };

describe("Trailframe API", () => {
  it("reports health and only a boolean map configuration", async () => {
    const app = await buildApp({ mapboxToken: "pk.secret-value", fetchImpl: failingFetch });
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.json()).toEqual({ ok: true, service: "trailframe-api" });
    const config = await app.inject({ method: "GET", url: "/api/config" });
    expect(config.json()).toEqual({ mapConfigured: true, photoUpload: false, peakRadiusKm: 5 });
    expect(config.body).not.toContain("secret-value");
    await app.close();
  });

  it("renders a 1600x2400 fallback PNG and exposes degradation warnings", async () => {
    const app = await buildApp({ fetchImpl: failingFetch });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: fixtureTrack() });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
    expect(response.headers["x-trailframe-map-mode"]).toBe("demo");
    const warnings = JSON.parse(decodeURIComponent(String(response.headers["x-trailframe-warnings"]))) as string[];
    expect(warnings.some((warning) => warning.includes("Mapbox"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("山峰"))).toBe(true);
    const metadata = await sharp(response.rawPayload).metadata();
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(2400);
    await app.close();
  });

  it("rejects invalid track bodies", async () => {
    const app = await buildApp({ fetchImpl: failingFetch });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: { name: "bad" } });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain("无效");
    await app.close();
  });
});
