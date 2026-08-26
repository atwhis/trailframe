import sharp from "sharp";
import type { TrackData, TrackPoint } from "../../../packages/track-core/src/index.js";

export interface MapBackgroundResult {
  image: Buffer;
  mode: "mapbox" | "demo";
  warning?: string;
}

export interface MapBackgroundOptions {
  token?: string;
  style?: string;
  fallbackStyle?: string;
  fetchImpl?: typeof fetch;
  width?: number;
  height?: number;
}

export interface MapCamera {
  centerLat: number;
  centerLon: number;
  zoom: number;
  requestWidth: number;
  requestHeight: number;
  outputWidth: number;
  outputHeight: number;
}

function mercatorX(lon: number): number {
  return (lon + 180) / 360;
}

function mercatorY(lat: number): number {
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const radians = clamped * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
}

function inverseMercatorY(value: number): number {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * value))) * 180 / Math.PI;
}

export function calculateMapCamera(track: TrackData, width: number, height: number): MapCamera {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of track.segments.flatMap((segment) => segment.points)) {
    const x = mercatorX(point.lon);
    const y = mercatorY(point.lat);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const requestWidth = Math.min(1280, Math.ceil(width / 2));
  const requestHeight = Math.min(1280, Math.ceil(height / 2));
  const spanX = Math.max(0.000006, maxX - minX) * 1.38;
  const spanY = Math.max(0.000006, maxY - minY) * 1.38;
  const zoomX = Math.log2((requestWidth * 0.9) / (512 * spanX));
  const zoomY = Math.log2((requestHeight * 0.86) / (512 * spanY));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return {
    centerLat: inverseMercatorY(centerY),
    centerLon: centerX * 360 - 180,
    zoom: Math.max(2, Math.min(16, Math.min(zoomX, zoomY))),
    requestWidth,
    requestHeight,
    outputWidth: width,
    outputHeight: height,
  };
}

export function projectMapPoint(point: Pick<TrackPoint, "lat" | "lon">, camera: MapCamera) {
  const worldSize = 512 * 2 ** camera.zoom;
  const centerX = mercatorX(camera.centerLon);
  const centerY = mercatorY(camera.centerLat);
  const logicalX = camera.requestWidth / 2 + (mercatorX(point.lon) - centerX) * worldSize;
  const logicalY = camera.requestHeight / 2 + (mercatorY(point.lat) - centerY) * worldSize;
  return {
    x: logicalX * camera.outputWidth / camera.requestWidth,
    y: logicalY * camera.outputHeight / camera.requestHeight,
  };
}

function demoSvg(width: number, height: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#142e28"/><stop offset=".38" stop-color="#466b58"/><stop offset=".72" stop-color="#8e8d66"/><stop offset="1" stop-color="#d3bb83"/></linearGradient>
      <radialGradient id="sun"><stop stop-color="#f1d39a" stop-opacity=".68"/><stop offset="1" stop-color="#f1d39a" stop-opacity="0"/></radialGradient>
      <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c9b780"/><stop offset="1" stop-color="#18372f"/></linearGradient>
      <filter id="texture"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="23"/><feColorMatrix values="0 0 0 0 .23 0 0 0 0 .31 0 0 0 0 .24 0 0 0 .34 0"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#terrain)"/>
    <ellipse cx="78%" cy="20%" rx="58%" ry="42%" fill="url(#sun)"/>
    <path d="M0 ${height * .58}L${width * .16} ${height * .29}L${width * .29} ${height * .48}L${width * .45} ${height * .18}L${width * .62} ${height * .5}L${width * .76} ${height * .25}L${width} ${height * .61}V${height}H0Z" fill="url(#ridge)" fill-opacity=".66"/>
    <path d="M0 ${height * .76}L${width * .2} ${height * .52}L${width * .36} ${height * .7}L${width * .58} ${height * .42}L${width * .77} ${height * .71}L${width} ${height * .55}V${height}H0Z" fill="#102a24" fill-opacity=".58"/>
    <rect width="100%" height="100%" filter="url(#texture)" opacity=".7"/>
    <g font-family="Arial, sans-serif" text-anchor="end"><text x="${width - 70}" y="${height - 80}" fill="#fff" fill-opacity=".76" font-size="34" letter-spacing="7">DEMO IMAGERY</text><text x="${width - 70}" y="${height - 38}" fill="#fff" fill-opacity=".58" font-size="22">配置 Mapbox token 后显示真实影像与地图标签</text></g>
  </svg>`;
  return Buffer.from(svg);
}

export async function getMapBackground(track: TrackData, options: MapBackgroundOptions = {}): Promise<MapBackgroundResult> {
  const width = options.width || 1600;
  const height = options.height || 1400;
  if (!options.token) {
    return { image: await sharp(demoSvg(width, height)).png().toBuffer(), mode: "demo", warning: "未配置 Mapbox token，当前使用演示影像底图。" };
  }

  const camera = calculateMapCamera(track, width, height);
  const style = options.style || "mapbox/outdoors-v12";
  const styles = [style, options.fallbackStyle].filter((candidate, index, values): candidate is string => Boolean(candidate) && values.indexOf(candidate) === index);
  const failures: string[] = [];

  for (const candidate of styles) {
    const url = `https://api.mapbox.com/styles/v1/${candidate}/static/${camera.centerLon.toFixed(6)},${camera.centerLat.toFixed(6)},${camera.zoom.toFixed(2)},0/${camera.requestWidth}x${camera.requestHeight}@2x?access_token=${encodeURIComponent(options.token)}&logo=false&attribution=false`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await (options.fetchImpl || fetch)(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const image = await sharp(Buffer.from(await response.arrayBuffer())).resize(width, height, { fit: "fill" }).png().toBuffer();
      return {
        image,
        mode: "mapbox",
        warning: candidate !== style ? "自定义 Guidebook 样式暂不可用，已回退到 Mapbox Satellite Streets。" : undefined,
      };
    } catch (error) {
      failures.push(`${candidate}: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    image: await sharp(demoSvg(width, height)).png().toBuffer(),
    mode: "demo",
    warning: `Mapbox 地形底图暂不可用，已使用演示底图（${failures.join("；")}）。`,
  };
}
