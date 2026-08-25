export type TrackFormat = "gpx" | "kml";

export interface TrackPoint {
  lat: number;
  lon: number;
  elevation?: number;
  time?: string;
}

export interface Waypoint extends TrackPoint {
  name?: string;
}

export interface TrackSegment {
  points: TrackPoint[];
}

export interface DailySection {
  date: string;
  segments: TrackSegment[];
}

export interface TrackStatistics {
  distanceMeters: number;
  ascentMeters: number;
  descentMeters: number;
  maxElevationMeters: number;
  durationMs: number | null;
}

export interface TrackData {
  name: string;
  sourceFormat: TrackFormat;
  segments: TrackSegment[];
  waypoints: Waypoint[];
  dailySections: DailySection[];
  statistics: TrackStatistics;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  source: TrackPoint;
}

export interface ProjectedSegment {
  points: ProjectedPoint[];
}
