import sharp from "sharp";
import { formatStatistics, simplifySegments, type TrackData, type TrackPoint } from "../../../packages/track-core/src/index.js";
import { getMapBackground, type MapBackgroundOptions } from "./map-background.js";
import { lookupPeaks, type Peak, type PeakLookupOptions } from "./peaks.js";

const WIDTH = 1600;
const HEIGHT = 2400;
const MAP_HEIGHT = 1400;
const DAY_COLORS = ["#ffcc4d", "#ff6b5f", "#68d9c0", "#87a9ff", "#d993ff", "#ff9f43", "#e9ff70", "#61dafb"];

export interface PosterOptions {
  map?: MapBackgroundOptions;
  peaks?: PeakLookupOptions;
}

export interface PosterResult {
  image: Buffer;
  warnings: string[];
  mapMode: "mapbox" | "demo";
  peakCount: number;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character);
}

function geoProjector(track: TrackData) {
  const points = track.segments.flatMap((segment) => segment.points);
  let minLon = Math.min(...points.map((point) => point.lon));
  let maxLon = Math.max(...points.map((point) => point.lon));
  let minLat = Math.min(...points.map((point) => point.lat));
  let maxLat = Math.max(...points.map((point) => point.lat));
  const lonPad = Math.max(0.004, (maxLon - minLon) * 0.18);
  const latPad = Math.max(0.004, (maxLat - minLat) * 0.18);
  minLon -= lonPad;
  maxLon += lonPad;
  minLat -= latPad;
  maxLat += latPad;
  return (point: Pick<TrackPoint, "lat" | "lon">) => ({
    x: 70 + ((point.lon - minLon) / (maxLon - minLon)) * (WIDTH - 140),
    y: 140 + ((maxLat - point.lat) / (maxLat - minLat)) * (MAP_HEIGHT - 260),
  });
}

function routeSvg(track: TrackData): string {
  const project = geoProjector(track);
  const sections = track.dailySections.length > 0 ? track.dailySections : [{ date: "轨迹", segments: track.segments }];
  return sections.flatMap((section, dayIndex) => simplifySegments(section.segments, 0.00006).map((segment) => {
    const points = segment.points.map((point) => {
      const projected = project(point);
      return `${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    }).join(" ");
    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
    return `<polyline points="${points}" fill="none" stroke="#07140f" stroke-opacity=".7" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  })).join("");
}

function peaksSvg(track: TrackData, peaks: Peak[]): string {
  const project = geoProjector(track);
  return peaks.map((peak) => {
    const point = project(peak);
    if (point.x < 30 || point.x > WIDTH - 30 || point.y < 80 || point.y > MAP_HEIGHT - 40) return "";
    return `<g transform="translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})"><path d="M0 -20L18 12H-18z" fill="#fff" stroke="#162b26" stroke-width="3"/><rect x="24" y="-31" rx="9" width="${Math.min(310, 75 + peak.name.length * 30)}" height="58" fill="#0a1814" fill-opacity=".78"/><text x="38" y="7" font-size="25" font-weight="700" fill="#fff">${escape(peak.name)} · ${Math.round(peak.elevation)}m</text></g>`;
  }).join("");
}

function elevationPath(track: TrackData): string {
  const points = track.segments.flatMap((segment) => segment.points).filter((point) => point.elevation != null);
  const step = Math.max(1, Math.floor(points.length / 650));
  const sampled = points.filter((_, index) => index % step === 0 || index === points.length - 1);
  const min = Math.min(...sampled.map((point) => point.elevation!));
  const max = Math.max(...sampled.map((point) => point.elevation!));
  const range = Math.max(1, max - min);
  const coordinates = sampled.map((point, index) => {
    const x = 90 + (index / Math.max(1, sampled.length - 1)) * 1420;
    const y = 2010 - ((point.elevation! - min) / range) * 360;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M${coordinates.join(" L")} L1510 2040 L90 2040 Z`;
}

function overlaySvg(track: TrackData, peaks: Peak[], mapMode: "mapbox" | "demo"): Buffer {
  const stats = formatStatistics(track.statistics);
  const sections = track.dailySections.length > 0 ? track.dailySections : [{ date: "轨迹" }];
  const legend = sections.slice(0, 8).map((section, index) => `<g transform="translate(${100 + (index % 4) * 360} ${1260 + Math.floor(index / 4) * 48})"><circle r="9" fill="${DAY_COLORS[index % DAY_COLORS.length]}"/><text x="20" y="8" fill="#fff" font-size="25" font-weight="600">${escape(section.date.slice(5))}</text></g>`).join("");
  const cards = [
    ["总距离", stats.distance],
    ["累计爬升", stats.ascent],
    ["累计下降", stats.descent],
    ["最高海拔", stats.maximum],
  ].map(([label, value], index) => `<g transform="translate(${80 + index * 380} 1470)"><rect width="340" height="160" rx="25" fill="#1b2c27"/><text x="28" y="55" fill="#91a29c" font-size="25">${label}</text><text x="28" y="116" fill="#f5f2e8" font-size="43" font-weight="800">${value}</text></g>`).join("");
  const attribution = mapMode === "mapbox" ? "© Mapbox  © OpenStreetMap" : "DEMO TERRAIN  ·  Peak data © OpenStreetMap contributors";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07130f" stop-opacity=".88"/><stop offset="1" stop-color="#07130f" stop-opacity="0"/></linearGradient><linearGradient id="profile" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f5ca67" stop-opacity=".72"/><stop offset="1" stop-color="#f5ca67" stop-opacity=".05"/></linearGradient></defs>
    <rect width="1600" height="420" fill="url(#fade)"/><rect y="1400" width="1600" height="1000" fill="#0c1714"/>
    <text x="82" y="105" fill="#f7f3e8" font-family="Arial, sans-serif" font-size="62" font-weight="800">${escape(track.name)}</text>
    <text x="85" y="155" fill="#d8e2dc" font-family="Arial, sans-serif" font-size="27" letter-spacing="6">TRAILFRAME · TERRAIN STORY</text>
    <g font-family="Arial, sans-serif">${routeSvg(track)}${peaksSvg(track, peaks)}${legend}${cards}</g>
    <text x="85" y="1688" fill="#f5f2e8" font-family="Arial, sans-serif" font-size="32" font-weight="700">海拔变化</text>
    <path d="${elevationPath(track)}" fill="url(#profile)" stroke="#f5ca67" stroke-width="6" stroke-linejoin="round"/>
    <line x1="90" y1="2040" x2="1510" y2="2040" stroke="#53635e" stroke-width="2"/>
    <text x="90" y="2100" fill="#a7b5af" font-family="Arial, sans-serif" font-size="24">${stats.maximum} 最高</text>
    <text x="1510" y="2100" text-anchor="end" fill="#a7b5af" font-family="Arial, sans-serif" font-size="24">总耗时 ${stats.duration}</text>
    <text x="80" y="2318" fill="#f5f2e8" font-family="Arial, sans-serif" font-size="28" font-weight="700">Trailframe</text>
    <text x="1520" y="2318" text-anchor="end" fill="#87958f" font-family="Arial, sans-serif" font-size="20">${attribution}</text>
  </svg>`;
  return Buffer.from(svg);
}

export async function generateTerrainPoster(track: TrackData, options: PosterOptions = {}): Promise<PosterResult> {
  const warnings: string[] = [];
  const map = await getMapBackground(track, { ...options.map, width: WIDTH, height: MAP_HEIGHT });
  if (map.warning) warnings.push(map.warning);
  let peaks: Peak[] = [];
  try {
    peaks = await lookupPeaks(track, options.peaks);
    if (peaks.length === 0) warnings.push("轨迹周边 5 公里内未找到带名称与海拔的山峰。 ");
  } catch (error) {
    warnings.push(`周边山峰信息暂不可用（${error instanceof Error ? error.message : "未知错误"}）。`);
  }
  const image = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0c1714" } })
    .composite([{ input: map.image, left: 0, top: 0 }, { input: overlaySvg(track, peaks, map.mode), left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { image, warnings, mapMode: map.mode, peakCount: peaks.length };
}
