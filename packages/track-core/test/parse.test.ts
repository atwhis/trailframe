import { describe, expect, it } from "vitest";
import { parseTrack } from "../src/index.js";

const sampleGpx = `<?xml version="1.0"?><gpx><wpt lat="30" lon="120"><ele>100</ele><name>营地</name></wpt><trk><name>两日环线</name><trkseg>
  <trkpt lat="30" lon="120"><ele>100</ele><time>2026-01-01T15:50:00Z</time></trkpt>
  <trkpt lat="30.01" lon="120.01"><ele>160</ele><time>2026-01-01T16:10:00Z</time></trkpt>
  <trkpt lat="30.02" lon="120.02"><ele>120</ele><time>2026-01-01T17:00:00Z</time></trkpt>
</trkseg><trkseg>
  <trkpt lat="30.03" lon="120.03"><ele>130</ele><time>2026-01-02T01:00:00Z</time></trkpt>
  <trkpt lat="30.04" lon="120.04"><ele>210</ele><time>2026-01-02T02:00:00Z</time></trkpt>
  <trkpt lat="30.05" lon="120.05"><ele>150</ele><time>2026-01-02T03:00:00Z</time></trkpt>
</trkseg></trk></gpx>`;

const sampleKml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Document><name>gx 示例</name>
  <Placemark><gx:Track><when>2026-01-01T01:00:00Z</when><when>2026-01-01T02:00:00Z</when><gx:coord>120 30 100</gx:coord><gx:coord>120.01 30.01 180</gx:coord></gx:Track></Placemark>
  <Placemark><gx:Track><when>2026-01-02T01:00:00Z</when><when>2026-01-02T02:00:00Z</when><gx:coord>120.02 30.02 140</gx:coord><gx:coord>120.03 30.03 220</gx:coord></gx:Track></Placemark>
  <Placemark><name>山口</name><Point><coordinates>120.01,30.01,180</coordinates></Point></Placemark>
</Document></kml>`;

describe("parseTrack", () => {
  it("parses GPX segments, waypoints, statistics and local days", () => {
    const track = parseTrack(sampleGpx, "two-days.gpx", { timeZone: "Asia/Shanghai" });
    expect(track.name).toBe("两日环线");
    expect(track.segments).toHaveLength(2);
    expect(track.segments.flatMap((segment) => segment.points)).toHaveLength(6);
    expect(track.waypoints).toHaveLength(1);
    expect(track.dailySections).toHaveLength(2);
    expect(track.statistics.distanceMeters).toBeGreaterThan(5_000);
    expect(track.statistics.maxElevationMeters).toBe(210);
    expect(track.statistics.durationMs).toBeGreaterThan(10 * 60 * 60 * 1000);
  });

  it("parses gx:Track KML fragments without bridging them", () => {
    const track = parseTrack(sampleKml, "gx.kml", { timeZone: "Asia/Shanghai" });
    expect(track.name).toBe("gx 示例");
    expect(track.segments).toHaveLength(2);
    expect(track.segments.reduce((sum, segment) => sum + segment.points.length, 0)).toBe(4);
    expect(track.dailySections).toHaveLength(2);
    expect(track.waypoints[0]?.name).toBe("山口");
    expect(track.statistics.distanceMeters).toBeLessThan(4_000);
  });

  it("rejects invalid and unsupported input", () => {
    expect(() => parseTrack("not xml", "track.gpx")).toThrow();
    expect(() => parseTrack("<root />", "track.fit")).toThrow("仅支持");
    expect(() => parseTrack("<gpx />", "track.gpx")).toThrow("足够");
  });

  it("does not add distance between separate segments", () => {
    const gpx = `<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="0" lon="0"><ele>10</ele></trkpt><trkpt lat="0" lon="0.001"><ele>11</ele></trkpt></trkseg><trkseg><trkpt lat="20" lon="20"><ele>12</ele></trkpt><trkpt lat="20" lon="20.001"><ele>13</ele></trkpt></trkseg></trk></gpx>`;
    const track = parseTrack(gpx, "segments.gpx");
    expect(track.statistics.distanceMeters).toBeLessThan(250);
  });

  it("interpolates small elevation gaps and rejects large missing ranges", () => {
    const smallGap = `<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="0" lon="0"><ele>10</ele></trkpt><trkpt lat="0" lon="0.001"></trkpt><trkpt lat="0" lon="0.002"><ele>20</ele></trkpt><trkpt lat="0" lon="0.003"><ele>25</ele></trkpt><trkpt lat="0" lon="0.004"><ele>30</ele></trkpt></trkseg></trk></gpx>`;
    expect(parseTrack(smallGap, "gap.gpx").segments[0]?.points[1]?.elevation).toBe(15);
    const missing = `<?xml version="1.0"?><gpx><trk><trkseg>${Array.from({ length: 30 }, (_, index) => `<trkpt lat="0" lon="${index / 1000}">${index < 3 ? `<ele>${index}</ele>` : ""}</trkpt>`).join("")}</trkseg></trk></gpx>`;
    expect(() => parseTrack(missing, "missing.gpx")).toThrow("海拔数据不足");
  });
});
