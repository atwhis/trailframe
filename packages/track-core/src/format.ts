import type { TrackStatistics } from "./types.js";

export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters).toLocaleString("zh-CN")} m`;
}

export function formatDuration(milliseconds: number | null): string {
  if (milliseconds == null) return "暂无数据";
  const minutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMinutes = minutes % 60;
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${remainingMinutes}分`;
  return `${remainingMinutes}分钟`;
}

export function formatStatistics(statistics: TrackStatistics): Record<string, string> {
  return {
    distance: formatDistance(statistics.distanceMeters),
    ascent: formatElevation(statistics.ascentMeters),
    descent: formatElevation(statistics.descentMeters),
    maximum: formatElevation(statistics.maxElevationMeters),
    duration: formatDuration(statistics.durationMs),
  };
}
