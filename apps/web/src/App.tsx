import { lazy, Suspense, useState } from "react";
import type { TrackData } from "../../../packages/track-core/src/index.js";
import { TerrainPoster } from "./components/TerrainPoster.js";
import { TrackSummary } from "./components/TrackSummary.js";
import { TrackUpload } from "./components/TrackUpload.js";

type Mode = "terrain" | "photo";

const PhotoPoster = lazy(() => import("./components/PhotoPoster.js").then((module) => ({ default: module.PhotoPoster })));

export default function App() {
  const [track, setTrack] = useState<TrackData | null>(null);
  const [mode, setMode] = useState<Mode>("terrain");

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Trailframe 首页"><span className="brand-mark">⌁</span><span>trailframe<small>轨迹成画</small></span></a>
      <div className="top-note"><span />纯网页 Demo · GPX / KML</div>
    </header>

    <main id="top">
      <section className="hero">
        <p className="eyebrow">MAKE THE PATH VISIBLE</p>
        <h1>走过的路，<em>值得被看见。</em></h1>
        <p>上传一段轨迹，生成带地貌与海拔起伏的地图海报，或把轨迹形状轻轻放进你拍下的风景。</p>
      </section>

      <div className="project-layout">
        <aside className="project-sidebar">
          <TrackUpload track={track} onTrack={setTrack} />
          {track && <TrackSummary track={track} />}
          <div className="privacy-note"><span>◇</span><div><strong>你的素材属于你</strong><small>轨迹只在本次会话处理；照片始终留在浏览器中。</small></div></div>
        </aside>

        <div className="maker-area">
          <nav className="mode-tabs" aria-label="海报类型">
            <button className={mode === "terrain" ? "active" : ""} onClick={() => setMode("terrain")}><span>⌁</span><div><b>地形轨迹海报</b><small>地图 · 分日轨迹 · 海拔曲线</small></div></button>
            <button className={mode === "photo" ? "active" : ""} onClick={() => setMode("photo")}><span>▧</span><div><b>照片轨迹海报</b><small>照片 · 轨迹形状 · 自选统计</small></div></button>
          </nav>
          {track ? (mode === "terrain" ? <TerrainPoster track={track} /> : <Suspense fallback={<section className="empty-workspace"><h2>正在加载照片编辑器…</h2></section>}><PhotoPoster track={track} /></Suspense>) : <section className="empty-workspace">
            <div className="empty-map"><i /><i /><i /><span>⌁</span></div>
            <h2>先从左侧导入一份轨迹</h2>
            <p>支持 GPX 轨迹、路线与航点，以及 KML LineString 和 gx:Track。</p>
            <div><span>1</span>导入轨迹<b>→</b><span>2</span>选择海报<b>→</b><span>3</span>预览下载</div>
          </section>}
        </div>
      </div>
    </main>
    <footer><span>trailframe · demo 0.1</span><span>Map data © OpenStreetMap contributors · Mapbox when configured</span></footer>
  </div>;
}
