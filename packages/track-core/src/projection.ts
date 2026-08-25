import type { ProjectedSegment, TrackPoint, TrackSegment } from "./types.js";

function mercator(point: TrackPoint): { x: number; y: number } {
  const lat = Math.max(-85.051129, Math.min(85.051129, point.lat));
  const x = (point.lon + 180) / 360;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return { x, y };
}

export function projectSegments(segments: TrackSegment[], width: number, height: number, padding = 0): ProjectedSegment[] {
  const projected = segments.map((segment) => segment.points.map((source) => ({ ...mercator(source), source })));
  const points = projected.flat();
  if (points.length === 0) return [];
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const rangeX = Math.max(maxX - minX, 1e-9);
  const rangeY = Math.max(maxY - minY, 1e-9);
  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);
  const scale = Math.min(availableWidth / rangeX, availableHeight / rangeY);
  const offsetX = padding + (availableWidth - rangeX * scale) / 2;
  const offsetY = padding + (availableHeight - rangeY * scale) / 2;
  return projected.map((segment) => ({
    points: segment.map((point) => ({
      x: offsetX + (point.x - minX) * scale,
      y: offsetY + (point.y - minY) * scale,
      source: point.source,
    })),
  }));
}

function perpendicularDistance(point: TrackPoint, start: TrackPoint, end: TrackPoint): number {
  const x = point.lon;
  const y = point.lat;
  const dx = end.lon - start.lon;
  const dy = end.lat - start.lat;
  if (dx === 0 && dy === 0) return Math.hypot(x - start.lon, y - start.lat);
  const t = Math.max(0, Math.min(1, ((x - start.lon) * dx + (y - start.lat) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (start.lon + t * dx), y - (start.lat + t * dy));
}

export function simplifyPoints(points: TrackPoint[], tolerance = 0.00008): TrackPoint[] {
  if (points.length <= 2) return points;
  let maximum = 0;
  let split = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index]!, points[0]!, points[points.length - 1]!);
    if (distance > maximum) {
      maximum = distance;
      split = index;
    }
  }
  if (maximum <= tolerance) return [points[0]!, points[points.length - 1]!];
  const before = simplifyPoints(points.slice(0, split + 1), tolerance);
  const after = simplifyPoints(points.slice(split), tolerance);
  return [...before.slice(0, -1), ...after];
}

export function simplifySegments(segments: TrackSegment[], tolerance?: number): TrackSegment[] {
  return segments.map((segment) => ({ points: simplifyPoints(segment.points, tolerance) }));
}
