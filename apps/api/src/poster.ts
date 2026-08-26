import sharp from "sharp";
import { formatStatistics, simplifySegments, type TrackData } from "../../../packages/track-core/src/index.js";
import { calculateMapCamera, getMapBackground, projectMapPoint, type MapBackgroundOptions } from "./map-background.js";
import { assignDateColors, FALLBACK_ROUTE_COLOR } from "./route-colors.js";

const WIDTH = 1600;
const HEIGHT = 2400;
const MODERN_MAP_HEIGHT = 1400;
const GUIDEBOOK_MAP_HEIGHT = 1680;

export type PosterTemplate = "modern" | "guidebook";

export interface PosterOptions {
  template?: PosterTemplate;
  map?: MapBackgroundOptions;
}

export interface PosterResult {
  image: Buffer;
  warnings: string[];
  mapMode: "mapbox" | "demo";
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character);
}

function projector(track: TrackData, mapHeight: number) {
  const camera = calculateMapCamera(track, WIDTH, mapHeight);
  return (point: { lat: number; lon: number }) => projectMapPoint(point, camera);
}

export function routeSvg(track: TrackData, template: PosterTemplate, mapHeight: number): string {
  const project = projector(track, mapHeight);
  const hasDailySections = track.dailySections.length > 0;
  const sections = hasDailySections ? track.dailySections : [{ date: "轨迹", segments: track.segments }];
  const colors = assignDateColors(hasDailySections ? sections.map((section) => section.date) : []);
  return sections.flatMap((section) => simplifySegments(section.segments, 0.00006).map((segment) => {
    const points = segment.points.map((point) => {
      const projected = project(point);
      return `${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    }).join(" ");
    if (!points) return "";
    const color = hasDailySections ? colors.get(section.date)! : FALLBACK_ROUTE_COLOR;
    const halo = template === "guidebook" ? "#fffdf5" : "#07140f";
    const haloOpacity = template === "guidebook" ? ".86" : ".7";
    const haloWidth = template === "guidebook" ? 17 : 14;
    const routeWidth = template === "guidebook" ? 9 : 8;
    return `<polyline points="${points}" fill="none" stroke="${halo}" stroke-opacity="${haloOpacity}" stroke-width="${haloWidth}" stroke-linecap="round" stroke-linejoin="round"/><polyline data-route-date="${escape(section.date)}" points="${points}" fill="none" stroke="${color}" stroke-width="${routeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  })).join("");
}

function elevationPath(track: TrackData, x1: number, x2: number, yTop: number, yBottom: number): string {
  const points = track.segments.flatMap((segment) => segment.points).filter((point) => point.elevation != null);
  const step = Math.max(1, Math.floor(points.length / 650));
  const sampled = points.filter((_, index) => index % step === 0 || index === points.length - 1);
  const min = Math.min(...sampled.map((point) => point.elevation!));
  const max = Math.max(...sampled.map((point) => point.elevation!));
  const range = Math.max(1, max - min);
  const coordinates = sampled.map((point, index) => {
    const x = x1 + (index / Math.max(1, sampled.length - 1)) * (x2 - x1);
    const y = yBottom - ((point.elevation! - min) / range) * (yBottom - yTop);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M${coordinates.join(" L")} L${x2} ${yBottom} L${x1} ${yBottom} Z`;
}

function modernOverlaySvg(track: TrackData, mapMode: "mapbox" | "demo"): Buffer {
  const stats = formatStatistics(track.statistics);
  const colors = assignDateColors(track.dailySections.map((section) => section.date));
  const legend = track.dailySections.map((section, index) => `<g transform="translate(${100 + (index % 5) * 295} ${1245 + Math.floor(index / 5) * 42})"><circle r="8" fill="${colors.get(section.date)}"/><text x="18" y="7" fill="#fff" font-size="22" font-weight="600">${escape(section.date.slice(5))}</text></g>`).join("");
  const cards = [["总距离", stats.distance], ["累计爬升", stats.ascent], ["累计下降", stats.descent], ["最高海拔", stats.maximum]].map(([label, value], index) => `<g transform="translate(${80 + index * 380} 1470)"><rect width="340" height="160" rx="25" fill="#1b2c27"/><text x="28" y="55" fill="#91a29c" font-size="25">${label}</text><text x="28" y="116" fill="#f5f2e8" font-size="43" font-weight="800">${value}</text></g>`).join("");
  const attribution = mapMode === "mapbox" ? "© Mapbox  © OpenStreetMap" : "DEMO IMAGERY";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07130f" stop-opacity=".88"/><stop offset="1" stop-color="#07130f" stop-opacity="0"/></linearGradient><linearGradient id="profile" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f5ca67" stop-opacity=".72"/><stop offset="1" stop-color="#f5ca67" stop-opacity=".05"/></linearGradient></defs>
    <rect width="1600" height="420" fill="url(#fade)"/><rect y="1400" width="1600" height="1000" fill="#0c1714"/>
    <text x="82" y="105" fill="#f7f3e8" font-family="Arial, PingFang SC, sans-serif" font-size="62" font-weight="800">${escape(track.name)}</text>
    <text x="85" y="155" fill="#d8e2dc" font-family="Arial, sans-serif" font-size="27" letter-spacing="6">TRAILFRAME · TERRAIN STORY</text>
    <g font-family="Arial, PingFang SC, sans-serif">${routeSvg(track, "modern", MODERN_MAP_HEIGHT)}${legend}${cards}</g>
    <text x="85" y="1688" fill="#f5f2e8" font-family="Arial, PingFang SC, sans-serif" font-size="32" font-weight="700">海拔变化</text>
    <path d="${elevationPath(track, 90, 1510, 1650, 2040)}" fill="url(#profile)" stroke="#f5ca67" stroke-width="6" stroke-linejoin="round"/>
    <line x1="90" y1="2040" x2="1510" y2="2040" stroke="#53635e" stroke-width="2"/>
    <text x="90" y="2100" fill="#a7b5af" font-family="Arial, PingFang SC, sans-serif" font-size="24">${stats.maximum} 最高</text>
    <text x="1510" y="2100" text-anchor="end" fill="#a7b5af" font-family="Arial, PingFang SC, sans-serif" font-size="24">总耗时 ${stats.duration}</text>
    <text x="80" y="2318" fill="#f5f2e8" font-family="Arial, sans-serif" font-size="28" font-weight="700">Trailframe</text>
    <text x="1520" y="2318" text-anchor="end" fill="#87958f" font-family="Arial, sans-serif" font-size="20">${attribution}</text>
  </svg>`);
}

function guidebookOverlaySvg(track: TrackData, mapMode: "mapbox" | "demo"): Buffer {
  const stats = formatStatistics(track.statistics);
  const cards = [[stats.distance, "总距离"], [stats.ascent, "累计爬升"], [stats.descent, "累计下降"], [stats.maximum, "最高海拔"]].map(([value, label], index) => `<g transform="translate(${72 + index * 382} 1738)"><text x="0" y="48" fill="#1d2923" font-size="43" font-weight="800">${value}</text><text x="1" y="83" fill="#778178" font-size="21" font-weight="600" letter-spacing="2">${label}</text></g>`).join("");
  const attribution = mapMode === "mapbox" ? "© Mapbox  © OpenStreetMap" : "DEMO IMAGERY";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="paperFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7f3e8" stop-opacity=".94"/><stop offset=".7" stop-color="#f7f3e8" stop-opacity=".18"/><stop offset="1" stop-color="#f7f3e8" stop-opacity="0"/></linearGradient>
      <linearGradient id="guideProfile" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5d806b" stop-opacity=".48"/><stop offset="1" stop-color="#5d806b" stop-opacity=".05"/></linearGradient>
    </defs>
    <rect width="1600" height="330" fill="url(#paperFade)"/>
    <rect y="1620" width="1600" height="95" fill="#f5f0e4" fill-opacity=".82"/>
    <rect y="1680" width="1600" height="720" fill="#f5f0e4"/>
    <text x="76" y="102" fill="#18241e" font-family="Arial, PingFang SC, sans-serif" font-size="66" font-weight="900">${escape(track.name)}</text>
    <text x="80" y="154" fill="#59665e" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="6">TRAILFRAME · GUIDEBOOK</text>
    <g>${routeSvg(track, "guidebook", GUIDEBOOK_MAP_HEIGHT)}</g>
    <g font-family="Arial, PingFang SC, sans-serif">${cards}</g>
    <line x1="72" y1="1850" x2="1528" y2="1850" stroke="#d8d3c7" stroke-width="2"/>
    <text x="74" y="1912" fill="#243229" font-family="Arial, PingFang SC, sans-serif" font-size="28" font-weight="800">海拔变化</text>
    <text x="1526" y="1912" text-anchor="end" fill="#69766d" font-family="Arial, PingFang SC, sans-serif" font-size="22">总耗时 ${stats.duration}</text>
    <path d="${elevationPath(track, 74, 1526, 1950, 2240)}" fill="url(#guideProfile)" stroke="#466b58" stroke-width="6" stroke-linejoin="round"/>
    <line x1="74" y1="2240" x2="1526" y2="2240" stroke="#aeb6ae" stroke-width="2"/>
    <text x="74" y="2290" fill="#6e796f" font-family="Arial, PingFang SC, sans-serif" font-size="21">最高 ${stats.maximum}</text>
    <text x="74" y="2360" fill="#26332c" font-family="Arial, sans-serif" font-size="25" font-weight="800">Trailframe</text>
    <text x="1526" y="2360" text-anchor="end" fill="#7b847d" font-family="Arial, sans-serif" font-size="18">${attribution}</text>
  </svg>`);
}

export async function generateTerrainPoster(track: TrackData, options: PosterOptions = {}): Promise<PosterResult> {
  const warnings: string[] = [];
  const template = options.template || "guidebook";
  const mapHeight = template === "guidebook" ? GUIDEBOOK_MAP_HEIGHT : MODERN_MAP_HEIGHT;
  const map = await getMapBackground(track, { ...options.map, width: WIDTH, height: mapHeight });
  if (map.warning) warnings.push(map.warning);
  const overlay = template === "guidebook" ? guidebookOverlaySvg(track, map.mode) : modernOverlaySvg(track, map.mode);
  const background = template === "guidebook" ? "#f5f0e4" : "#0c1714";
  const image = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background } })
    .composite([{ input: map.image, left: 0, top: 0 }, { input: overlay, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { image, warnings, mapMode: map.mode };
}
