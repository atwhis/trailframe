import { useEffect, useState } from "react";
import type { TrackData } from "../../../../packages/track-core/src/index.js";
import { downloadUrl } from "../lib/files.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

interface ApiConfig { mapConfigured: boolean; peakRadiusKm: number }

export function TerrainPoster({ track }: { track: TrackData }) {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [posterUrl, setPosterUrl] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/config`).then((response) => response.ok ? response.json() : Promise.reject()).then((value: ApiConfig) => active && setConfig(value)).catch(() => active && setConfig(null));
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (posterUrl) URL.revokeObjectURL(posterUrl); }, [posterUrl]);

  const generate = async () => {
    setBusy(true);
    setError("");
    setWarnings([]);
    try {
      const response = await fetch(`${API_BASE}/api/posters/terrain`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(track),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error || `生成失败（HTTP ${response.status}）`);
      }
      const warningHeader = response.headers.get("x-trailframe-warnings");
      if (warningHeader) setWarnings(JSON.parse(decodeURIComponent(warningHeader)) as string[]);
      const nextUrl = URL.createObjectURL(await response.blob());
      setPosterUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "地形海报生成失败");
    } finally {
      setBusy(false);
    }
  };

  return <section className="workspace-panel terrain-workspace">
    <div className="panel-copy">
      <span className="mode-kicker">TERRAIN STORY</span>
      <h2>把一段路，铺进山川里</h2>
      <p>真实地形底图、每日轨迹、高峰标注、海拔曲线和完整统计，一次合成为 1600 × 2400 PNG。</p>
      <div className="feature-list">
        <span>⌁ 地貌与等高线</span><span>△ 周边 5 km 高峰</span><span>⌇ 海拔起伏</span><span>↧ 原图下载</span>
      </div>
      <div className={`service-state ${config?.mapConfigured ? "service-state--ready" : ""}`}>
        <span />
        {config ? (config.mapConfigured ? "Mapbox Outdoors 已启用" : "未配置 Mapbox，使用可下载的演示地形底图") : "API 状态将在生成时确认"}
      </div>
      <button className="primary-button" onClick={() => void generate()} disabled={busy}>{busy ? "正在绘制 1600 × 2400 海报…" : "生成地形轨迹海报"}</button>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {warnings.length > 0 && <div className="warning-list">{warnings.map((warning) => <p key={warning}>提示 · {warning}</p>)}</div>}
    </div>
    <div className="poster-preview terrain-preview">
      {posterUrl ? <>
        <img src={posterUrl} alt="生成的地形轨迹海报" />
        <button className="download-button" onClick={() => downloadUrl(posterUrl, `${track.name}-地形轨迹海报.png`)}>下载 PNG</button>
      </> : <div className="poster-placeholder">
        <div className="contour-art"><i /><i /><i /><i /><b>⌁</b></div>
        <strong>你的山川轨迹将在这里生成</strong>
        <span>纵向海报 · 1600 × 2400</span>
      </div>}
    </div>
  </section>;
}
