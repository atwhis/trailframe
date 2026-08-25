import type { DailySection, TrackPoint, TrackSegment, TrackStatistics } from "./types.js";

const EARTH_RADIUS_METERS = 6_371_008.8;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: Pick<TrackPoint, "lat" | "lon">, b: Pick<TrackPoint, "lat" | "lon">): number {
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function fillElevations(points: TrackPoint[]): number[] {
  const elevations = points.map((point) => point.elevation ?? Number.NaN);
  const validCount = elevations.filter(Number.isFinite).length;
  if (validCount / elevations.length < 0.8) throw new Error("轨迹的海拔数据不足，无法可靠计算海拔统计");

  let index = 0;
  while (index < elevations.length) {
    if (Number.isFinite(elevations[index])) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < elevations.length && !Number.isFinite(elevations[index])) index += 1;
    const end = index - 1;
    const gap = end - start + 1;
    if (gap > 20) throw new Error("轨迹存在过长的海拔缺口，无法可靠生成海报");
    const before = elevations[start - 1];
    const after = elevations[index];
    if (Number.isFinite(before) && Number.isFinite(after)) {
      for (let offset = 0; offset < gap; offset += 1) {
        elevations[start + offset] = before! + ((after! - before!) * (offset + 1)) / (gap + 1);
      }
    } else {
      const fill = Number.isFinite(before) ? before! : after!;
      for (let cursor = start; cursor <= end; cursor += 1) elevations[cursor] = fill;
    }
  }
  return elevations as number[];
}

function smooth(values: number[], radius = 5): number[] {
  const prefix = [0];
  for (const value of values) prefix.push((prefix[prefix.length - 1] || 0) + value);
  return values.map((_, index) => {
    const from = Math.max(0, index - radius);
    const to = Math.min(values.length - 1, index + radius);
    return ((prefix[to + 1] || 0) - (prefix[from] || 0)) / (to - from + 1);
  });
}

function elevationGainLoss(values: number[], threshold = 3): { ascent: number; descent: number } {
  if (values.length < 2) return { ascent: 0, descent: 0 };
  let anchor = values[0]!;
  let extreme = anchor;
  let direction = 0;
  let ascent = 0;
  let descent = 0;
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index]!;
    if (direction >= 0) {
      extreme = Math.max(extreme, value);
      if (extreme - value >= threshold) {
        const gain = extreme - anchor;
        if (gain >= threshold) ascent += gain;
        anchor = extreme;
        extreme = value;
        direction = -1;
      }
    }
    if (direction <= 0) {
      extreme = Math.min(extreme, value);
      if (value - extreme >= threshold) {
        const loss = anchor - extreme;
        if (loss >= threshold) descent += loss;
        anchor = extreme;
        extreme = value;
        direction = 1;
      }
    }
  }
  const tail = extreme - anchor;
  if (tail >= threshold) ascent += tail;
  if (tail <= -threshold) descent += -tail;
  return { ascent, descent };
}

function localDate(time: string, timeZone?: string): string | null {
  const date = new Date(time);
  if (!Number.isFinite(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const values = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dailySections(segments: TrackSegment[], timeZone?: string): DailySection[] {
  const days = new Map<string, TrackSegment[]>();
  for (const segment of segments) {
    let activeDate: string | null = null;
    let activePoints: TrackPoint[] = [];
    const flush = () => {
      if (activeDate && activePoints.length > 0) {
        const list = days.get(activeDate) || [];
        list.push({ points: activePoints });
        days.set(activeDate, list);
      }
      activePoints = [];
    };
    for (const point of segment.points) {
      const date = point.time ? localDate(point.time, timeZone) : null;
      if (!date) continue;
      if (activeDate && activeDate !== date) flush();
      activeDate = date;
      activePoints.push(point);
    }
    flush();
  }
  return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, daySegments]) => ({ date, segments: daySegments }));
}

export function analyzeSegments(segments: TrackSegment[], options: { timeZone?: string } = {}): {
  segments: TrackSegment[];
  dailySections: DailySection[];
  statistics: TrackStatistics;
} {
  let totalDistance = 0;
  let ascent = 0;
  let descent = 0;
  let maximum = -Infinity;
  const hydratedSegments: TrackSegment[] = [];
  const times: number[] = [];

  for (const segment of segments) {
    if (segment.points.length === 0) continue;
    const elevations = fillElevations(segment.points);
    const points = segment.points.map((point, index) => ({ ...point, elevation: elevations[index] }));
    hydratedSegments.push({ points });
    for (let index = 1; index < points.length; index += 1) totalDistance += distanceMeters(points[index - 1]!, points[index]!);
    const gainLoss = elevationGainLoss(smooth(elevations));
    ascent += gainLoss.ascent;
    descent += gainLoss.descent;
    maximum = Math.max(maximum, ...elevations);
    for (const point of points) {
      if (point.time) {
        const time = new Date(point.time).getTime();
        if (Number.isFinite(time)) times.push(time);
      }
    }
  }

  if (hydratedSegments.length === 0) throw new Error("轨迹中没有有效分段");
  return {
    segments: hydratedSegments,
    dailySections: dailySections(hydratedSegments, options.timeZone),
    statistics: {
      distanceMeters: totalDistance,
      ascentMeters: ascent,
      descentMeters: descent,
      maxElevationMeters: maximum,
      durationMs: times.length >= 2 ? Math.max(...times) - Math.min(...times) : null,
    },
  };
}
