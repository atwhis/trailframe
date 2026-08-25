import cors from "@fastify/cors";
import Fastify from "fastify";
import type { TrackData } from "../../../packages/track-core/src/index.js";
import { generateTerrainPoster } from "./poster.js";
import { trackDataSchema } from "./schema.js";

export interface AppOptions {
  mapboxToken?: string;
  mapboxStyle?: string;
  overpassUrl?: string;
  fetchImpl?: typeof fetch;
  webOrigin?: string;
}

export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 * 1024 });
  await app.register(cors, {
    origin: options.webOrigin || "http://localhost:5173",
    exposedHeaders: ["x-trailframe-warnings", "x-trailframe-map-mode", "x-trailframe-peak-count"],
  });
  app.get("/health", async () => ({ ok: true, service: "trailframe-api" }));
  app.get("/api/config", async () => ({ mapConfigured: Boolean(options.mapboxToken), photoUpload: false, peakRadiusKm: 5 }));
  app.post("/api/posters/terrain", async (request, reply) => {
    const result = trackDataSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: "轨迹数据无效", details: result.error.issues.slice(0, 5) });
    }
    const pointCount = result.data.segments.reduce((sum, segment) => sum + segment.points.length, 0);
    if (pointCount > 250_000) return reply.status(413).send({ error: "轨迹点超过 250,000 个限制" });
    const poster = await generateTerrainPoster(result.data as TrackData, {
      map: { token: options.mapboxToken, style: options.mapboxStyle, fetchImpl: options.fetchImpl },
      peaks: { url: options.overpassUrl, fetchImpl: options.fetchImpl },
    });
    reply.header("content-type", "image/png");
    reply.header("content-disposition", 'inline; filename="trailframe-terrain.png"');
    reply.header("x-trailframe-warnings", encodeURIComponent(JSON.stringify(poster.warnings)));
    reply.header("x-trailframe-map-mode", poster.mapMode);
    reply.header("x-trailframe-peak-count", String(poster.peakCount));
    return reply.send(poster.image);
  });
  app.setErrorHandler((error, _request, reply) => {
    const candidate = error as { statusCode?: number; message?: string };
    const status = candidate.statusCode && candidate.statusCode >= 400 ? candidate.statusCode : 500;
    reply.status(status).send({ error: status === 500 ? "海报生成失败，请稍后重试" : candidate.message || "请求失败" });
  });
  return app;
}
