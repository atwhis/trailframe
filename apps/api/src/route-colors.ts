const FIXED_DAY_COLORS = [
  "#ffcc4d",
  "#ff6b5f",
  "#68d9c0",
  "#87a9ff",
  "#d993ff",
  "#ff9f43",
  "#e9ff70",
  "#61dafb",
] as const;

export const FALLBACK_ROUTE_COLOR = "#f1a91b";

function generatedColor(index: number): string {
  const generatedIndex = index - FIXED_DAY_COLORS.length;
  const hue = (29 + generatedIndex * 137.508) % 360;
  const saturation = 72 + generatedIndex % 3 * 5;
  const lightness = 56 + generatedIndex % 2 * 8;
  return `hsl(${hue.toFixed(3)} ${saturation}% ${lightness}%)`;
}

export function assignDateColors(dates: string[]): Map<string, string> {
  const uniqueDates = [...new Set(dates)].sort((left, right) => left.localeCompare(right));
  return new Map(uniqueDates.map((date, index) => [date, FIXED_DAY_COLORS[index] || generatedColor(index)]));
}
