import { useRef, useState } from "react";
import { parseTrack, type TrackData } from "../../../../packages/track-core/src/index.js";
import { readTrackFile, TRACK_ACCEPT } from "../lib/files.js";

interface TrackUploadProps {
  track: TrackData | null;
  onTrack: (track: TrackData) => void;
}

const DEMO_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trailframe" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Trailframe 山野示例</name><trkseg>
    <trkpt lat="30.0000" lon="120.0000"><ele>860</ele><time>2026-01-01T01:00:00Z</time></trkpt>
    <trkpt lat="30.0060" lon="120.0050"><ele>930</ele><time>2026-01-01T01:24:00Z</time></trkpt>
    <trkpt lat="30.0120" lon="120.0020"><ele>1010</ele><time>2026-01-01T01:51:00Z</time></trkpt>
    <trkpt lat="30.0170" lon="120.0100"><ele>1095</ele><time>2026-01-01T02:22:00Z</time></trkpt>
    <trkpt lat="30.0110" lon="120.0170"><ele>1030</ele><time>2026-01-01T02:55:00Z</time></trkpt>
    <trkpt lat="30.0040" lon="120.0130"><ele>900</ele><time>2026-01-01T03:20:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`;

export function TrackUpload({ track, onTrack }: TrackUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onTrack(await readTrackFile(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "轨迹文件读取失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const loadDemo = async () => {
    setBusy(true);
    setError("");
    try {
      onTrack(parseTrack(DEMO_GPX, "trailframe-demo.gpx"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "样例轨迹读取失败");
    } finally {
      setBusy(false);
    }
  };

  return <section className="upload-card" aria-label="轨迹导入">
    <div className="eyebrow">01 · 导入轨迹</div>
    <input ref={inputRef} className="visually-hidden" id="track-file" type="file" accept={TRACK_ACCEPT} onChange={(event) => void handleFile(event.target.files?.[0])} />
    <label className={`drop-zone ${track ? "drop-zone--compact" : ""}`} htmlFor="track-file">
      <span className="upload-icon" aria-hidden="true">↗</span>
      <strong>{busy ? "正在解析轨迹…" : track ? "更换轨迹文件" : "选择 GPX / KML 文件"}</strong>
      <small>文件只用于本次制作 · 最大 25 MB</small>
    </label>
    {!track && <button className="sample-button" onClick={() => void loadDemo()} disabled={busy}>没有文件？加载内置样例</button>}
    {error && <p className="inline-error" role="alert">{error}</p>}
  </section>;
}
