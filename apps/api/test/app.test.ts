import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
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
  it("reports health and map configuration without exposing secrets or peak metadata", async () => {
    const app = await buildApp({ mapboxToken: "pk.secret-value", fetchImpl: failingFetch });
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.json()).toEqual({ ok: true, service: "trailframe-api" });
    const config = await app.inject({ method: "GET", url: "/api/config" });
    expect(config.json()).toEqual({ mapConfigured: true, photoUpload: false });
    expect(config.body).not.toContain("secret-value");
    expect(config.body).not.toContain("peak");
    await app.close();
  });

  it("defaults to a 1600x2400 Guidebook fallback PNG", async () => {
    const app = await buildApp({ fetchImpl: failingFetch });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: fixtureTrack() });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
    expect(response.headers["x-trailframe-map-mode"]).toBe("demo");
    expect(response.headers["x-trailframe-template"]).toBe("guidebook");
    expect(response.headers["x-trailframe-peak-count"]).toBeUndefined();
    const warnings = JSON.parse(decodeURIComponent(String(response.headers["x-trailframe-warnings"]))) as string[];
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Mapbox");
    expect(warnings.join(" ")).not.toContain("山峰");
    const metadata = await sharp(response.rawPayload).metadata();
    expect(metadata).toMatchObject({ width: 1600, height: 2400 });
    await app.close();
  });

  it("performs only one map request and no nearby peak request", async () => {
    const mapPng = await sharp({ create: { width: 1600, height: 1680, channels: 3, background: "#809080" } }).png().toBuffer();
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(new Uint8Array(mapPng), { status: 200, headers: { "content-type": "image/png" } }));
    const app = await buildApp({ mapboxToken: "pk.test", fetchImpl });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: fixtureTrack() });
    expect(response.statusCode).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static");
    expect(response.headers["x-trailframe-peak-count"]).toBeUndefined();
    const warnings = JSON.parse(decodeURIComponent(String(response.headers["x-trailframe-warnings"]))) as string[];
    expect(warnings).toEqual([]);
    await app.close();
  });

  it("falls back from an inaccessible custom Guidebook style to Satellite Streets", async () => {
    const mapPng = await sharp({ create: { width: 1600, height: 1680, channels: 3, background: "#809080" } }).png().toBuffer();
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes("atwhis/guidebook")) return new Response("missing", { status: 404 });
      return new Response(new Uint8Array(mapPng), { status: 200, headers: { "content-type": "image/png" } });
    };
    const app = await buildApp({ mapboxToken: "pk.test", mapboxGuidebookStyle: "atwhis/guidebook", fetchImpl });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: fixtureTrack() });
    expect(response.statusCode).toBe(200);
    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls[0]).toContain("atwhis/guidebook");
    expect(requestedUrls[1]).toContain("mapbox/satellite-streets-v12");
    const warnings = JSON.parse(decodeURIComponent(String(response.headers["x-trailframe-warnings"]))) as string[];
    expect(warnings).toEqual([expect.stringContaining("Satellite Streets")]);
    await app.close();
  });

  it("preserves an explicit Modern request", async () => {
    const app = await buildApp({ fetchImpl: failingFetch });
    const response = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: { ...fixtureTrack(), template: "modern" } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-trailframe-template"]).toBe("modern");
    await app.close();
  });

  it("rejects invalid track bodies and unknown templates", async () => {
    const app = await buildApp({ fetchImpl: failingFetch });
    const invalid = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: { name: "bad" } });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error).toContain("无效");
    const unknown = await app.inject({ method: "POST", url: "/api/posters/terrain", payload: { ...fixtureTrack(), template: "storybook" } });
    expect(unknown.statusCode).toBe(400);
    await app.close();
  });
});
