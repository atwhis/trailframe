import { formatStatistics, type TrackData } from "../../../../packages/track-core/src/index.js";

export function TrackSummary({ track }: { track: TrackData }) {
  const values = formatStatistics(track.statistics);
  const count = track.segments.reduce((total, segment) => total + segment.points.length, 0);
  return <section className="summary-card">
    <div className="summary-heading">
      <div><span className="status-dot" />轨迹已就绪</div>
      <span>{track.sourceFormat.toUpperCase()}</span>
    </div>
    <h2>{track.name}</h2>
    <div className="summary-grid">
      <div><small>总距离</small><strong>{values.distance}</strong></div>
      <div><small>累计爬升</small><strong>{values.ascent}</strong></div>
      <div><small>总耗时</small><strong>{values.duration}</strong></div>
      <div><small>最高海拔</small><strong>{values.maximum}</strong></div>
    </div>
    <p className="track-meta">{count.toLocaleString("zh-CN")} 个轨迹点 · {track.segments.length} 个分段 · {track.dailySections.length || "无"} 个日期</p>
  </section>;
}
