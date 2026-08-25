import { distanceMeters, simplifySegments, type TrackData, type TrackPoint } from "../../../packages/track-core/src/index.js";

export interface Peak {
  id: number;
  name: string;
  elevation: number;
  lat: number;
  lon: number;
  distanceMeters: number;
}

interface OverpassElement {
  id?: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

export interface PeakLookupOptions {
  fetchImpl?: typeof fetch;
  url?: string;
  radiusMeters?: number;
}

function trackBounds(track: TrackData, radiusMeters: number) {
  const points = track.segments.flatMap((segment) => segment.points);
  const centerLat = points.reduce((total, point) => total + point.lat, 0) / points.length;
  const latPad = radiusMeters / 111_320;
  const lonPad = radiusMeters / (111_320 * Math.max(0.2, Math.cos((centerLat * Math.PI) / 180)));
  return {
    south: Math.min(...points.map((point) => point.lat)) - latPad,
    west: Math.min(...points.map((point) => point.lon)) - lonPad,
    north: Math.max(...points.map((point) => point.lat)) + latPad,
    east: Math.max(...points.map((point) => point.lon)) + lonPad,
  };
}

function nearestDistance(point: TrackPoint, route: TrackPoint[]): number {
  let nearest = Infinity;
  for (const routePoint of route) nearest = Math.min(nearest, distanceMeters(point, routePoint));
  return nearest;
}

export async function lookupPeaks(track: TrackData, options: PeakLookupOptions = {}): Promise<Peak[]> {
  const radiusMeters = options.radiusMeters || 5_000;
  const bbox = trackBounds(track, radiusMeters);
  const query = `[out:json][timeout:8];node["natural"="peak"]["name"]["ele"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out body 100;`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await (options.fetchImpl || fetch)(options.url || "https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", "user-agent": "Trailframe/0.1 (terrain poster demo)" },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const route = simplifySegments(track.segments, 0.0005).flatMap((segment) => segment.points);
    const peaks = (payload.elements || []).flatMap((element): Peak[] => {
      const name = element.tags?.["name:zh"] || element.tags?.name;
      const elevation = Number.parseFloat(element.tags?.ele || "");
      if (!name || !Number.isFinite(elevation) || element.lat == null || element.lon == null) return [];
      const distance = nearestDistance({ lat: element.lat, lon: element.lon }, route);
      if (distance > radiusMeters) return [];
      return [{ id: element.id || 0, name, elevation, lat: element.lat, lon: element.lon, distanceMeters: distance }];
    });
    return peaks.sort((a, b) => b.elevation - a.elevation || a.distanceMeters - b.distanceMeters).slice(0, 5);
  } finally {
    clearTimeout(timeout);
  }
}
