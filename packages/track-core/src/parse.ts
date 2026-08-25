import type { TrackData, TrackFormat, TrackPoint, TrackSegment, Waypoint } from "./types.js";
import { analyzeSegments } from "./statistics.js";
import { elementsByLocalName, finiteNumber, firstDirectText, parseXml } from "./xml.js";

function cleanName(fileName: string): string {
  return fileName.replace(/\.(gpx|kml)$/i, "").trim() || "未命名轨迹";
}

function parsePoint(element: Element): TrackPoint | null {
  const lat = finiteNumber(element.getAttribute("lat"));
  const lon = finiteNumber(element.getAttribute("lon"));
  if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return {
    lat,
    lon,
    elevation: finiteNumber(firstDirectText(element, "ele")),
    time: firstDirectText(element, "time"),
  };
}

function parseGpx(document: Document, fileName: string): Omit<TrackData, "dailySections" | "statistics"> {
  const segmentElements = elementsByLocalName(document, "trkseg");
  const segments: TrackSegment[] = segmentElements
    .map((segment) => ({ points: elementsByLocalName(segment, "trkpt").map(parsePoint).filter((point): point is TrackPoint => point != null) }))
    .filter((segment) => segment.points.length > 0);

  if (segments.length === 0) {
    for (const route of elementsByLocalName(document, "rte")) {
      const points = elementsByLocalName(route, "rtept").map(parsePoint).filter((point): point is TrackPoint => point != null);
      if (points.length > 0) segments.push({ points });
    }
  }

  const waypoints: Waypoint[] = elementsByLocalName(document, "wpt")
    .flatMap((element): Waypoint[] => {
      const point = parsePoint(element);
      return point ? [{ ...point, name: firstDirectText(element, "name") }] : [];
    });

  const track = elementsByLocalName(document, "trk")[0];
  const name = (track && firstDirectText(track, "name")) || cleanName(fileName);
  return { name, sourceFormat: "gpx", segments, waypoints };
}

function coordinatePoint(raw: string, time?: string): TrackPoint | null {
  const values = raw.trim().split(/[\s,]+/).map(Number);
  const lon = values[0];
  const lat = values[1];
  const elevation = values[2];
  if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return {
    lat,
    lon,
    elevation: Number.isFinite(elevation) ? elevation : undefined,
    time: time?.trim() || undefined,
  };
}

function parseKml(document: Document, fileName: string): Omit<TrackData, "dailySections" | "statistics"> {
  const segments: TrackSegment[] = [];

  for (const track of elementsByLocalName(document, "Track")) {
    const coordinates = elementsByLocalName(track, "coord");
    const times = elementsByLocalName(track, "when");
    const points = coordinates
      .map((coordinate, index) => coordinatePoint(coordinate.textContent || "", times[index]?.textContent || undefined))
      .filter((point): point is TrackPoint => point != null);
    if (points.length > 0) segments.push({ points });
  }

  for (const line of elementsByLocalName(document, "LineString")) {
    const coordinates = elementsByLocalName(line, "coordinates")[0]?.textContent || "";
    const points = coordinates
      .trim()
      .split(/\s+/)
      .map((coordinate) => coordinatePoint(coordinate))
      .filter((point): point is TrackPoint => point != null);
    if (points.length > 0) segments.push({ points });
  }

  const waypoints: Waypoint[] = [];
  for (const placemark of elementsByLocalName(document, "Placemark")) {
    const pointElement = elementsByLocalName(placemark, "Point")[0];
    const coordinates = pointElement && elementsByLocalName(pointElement, "coordinates")[0]?.textContent;
    const point = coordinates ? coordinatePoint(coordinates.split(/\s+/)[0] || "") : null;
    if (point) waypoints.push({ ...point, name: firstDirectText(placemark, "name") });
  }

  const documentElement = elementsByLocalName(document, "Document")[0];
  const name = (documentElement && firstDirectText(documentElement, "name")) || cleanName(fileName);
  return { name, sourceFormat: "kml", segments, waypoints };
}

export interface ParseTrackOptions {
  timeZone?: string;
}

export function parseTrack(xml: string, fileName: string, options: ParseTrackOptions = {}): TrackData {
  if (xml.length > 25 * 1024 * 1024) throw new Error("轨迹文件超过 25 MB 限制");
  const extension = fileName.split(".").pop()?.toLowerCase() as TrackFormat | undefined;
  if (extension !== "gpx" && extension !== "kml") throw new Error("仅支持 .gpx 和 .kml 轨迹文件");
  const document = parseXml(xml);
  const parsed = extension === "gpx" ? parseGpx(document, fileName) : parseKml(document, fileName);
  const pointCount = parsed.segments.reduce((total, segment) => total + segment.points.length, 0);
  if (pointCount < 2) throw new Error("文件中没有足够的有效轨迹点");
  if (pointCount > 250_000) throw new Error("轨迹点超过 250,000 个限制");
  const analysis = analyzeSegments(parsed.segments, options);
  return { ...parsed, ...analysis };
}
