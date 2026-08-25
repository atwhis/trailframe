import sharp from "sharp";
import type { TrackData } from "../../../packages/track-core/src/index.js";

export interface MapBackgroundResult {
  image: Buffer;
  mode: "mapbox" | "demo";
  warning?: string;
}

export interface MapBackgroundOptions {
  token?: string;
  style?: string;
  fetchImpl?: typeof fetch;
  width?: number;
  height?: number;
}

function bounds(track: TrackData) {
  const points = track.segments.flatMap((segment) => segment.points);
  const minLat = Math.min(...points.map((point) => point.lat));
  const maxLat = Math.max(...points.map((point) => point.lat));
  const minLon = Math.min(...points.map((point) => point.lon));
  const maxLon = Math.max(...points.map((point) => point.lon));
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const lonSpan = Math.max(0.002, maxLon - minLon) * 1.35;
  const latSpan = Math.max(0.002, maxLat - minLat) * 1.35;
  const zoomX = Math.log2(360 / lonSpan);
  const zoomY = Math.log2(170 / latSpan);
  return { centerLat, centerLon, zoom: Math.max(2, Math.min(16, Math.min(zoomX, zoomY) - 0.25)) };
}

function demoSvg(width: number, height: number): Buffer {
  const contours = Array.from({ length: 18 }, (_, index) => {
    const y = 80 + index * 76;
    const bend = 35 + (index % 4) * 28;
    return `<path d="M-80 ${y} C 260 ${y - bend}, 430 ${y + bend}, 760 ${y - 8} S 1260 ${y + bend}, ${width + 80} ${y - 20}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27483d"/><stop offset=".48" stop-color="#6c8265"/><stop offset="1" stop-color="#c2a876"/></linearGradient>
      <radialGradient id="ridge"><stop stop-color="#d8c697" stop-opacity=".5"/><stop offset="1" stop-color="#18342f" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#terrain)"/>
    <ellipse cx="75%" cy="24%" rx="55%" ry="40%" fill="url(#ridge)"/>
    <g fill="none" stroke="#eef1d1" stroke-opacity=".27" stroke-width="2">${contours}</g>
    <g fill="#0e241f" fill-opacity=".25"><path d="M0 820L260 500l180 190 260-390 250 360 230-260 420 520v480H0z"/></g>
    <g font-family="Arial, sans-serif" text-anchor="end"><text x="${width - 70}" y="${height - 80}" fill="#fff" fill-opacity=".76" font-size="34" letter-spacing="7">DEMO TERRAIN</text><text x="${width - 70}" y="${height - 38}" fill="#fff" fill-opacity=".58" font-size="22">配置 Mapbox token 后显示真实地形底图</text></g>
  </svg>`;
  return Buffer.from(svg);
}

export async function getMapBackground(track: TrackData, options: MapBackgroundOptions = {}): Promise<MapBackgroundResult> {
  const width = options.width || 1600;
  const height = options.height || 1400;
  if (!options.token) {
    return { image: await sharp(demoSvg(width, height)).png().toBuffer(), mode: "demo", warning: "未配置 Mapbox token，当前使用演示地形底图。" };
  }

  const camera = bounds(track);
  const requestWidth = Math.min(800, Math.ceil(width / 2));
  const requestHeight = Math.min(700, Math.ceil(height / 2));
  const style = options.style || "mapbox/outdoors-v12";
  const url = `https://api.mapbox.com/styles/v1/${style}/static/${camera.centerLon.toFixed(6)},${camera.centerLat.toFixed(6)},${camera.zoom.toFixed(2)},0/${requestWidth}x${requestHeight}@2x?access_token=${encodeURIComponent(options.token)}&logo=false&attribution=false`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await (options.fetchImpl || fetch)(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const image = await sharp(Buffer.from(await response.arrayBuffer())).resize(width, height, { fit: "cover" }).png().toBuffer();
    return { image, mode: "mapbox" };
  } catch (error) {
    return {
      image: await sharp(demoSvg(width, height)).png().toBuffer(),
      mode: "demo",
      warning: `Mapbox 地形底图暂不可用，已使用演示底图（${error instanceof Error ? error.message : "未知错误"}）。`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
