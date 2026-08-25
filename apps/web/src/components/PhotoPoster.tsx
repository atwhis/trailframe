import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import { formatStatistics, projectSegments, simplifySegments, type TrackData } from "../../../../packages/track-core/src/index.js";
import { clampUnit, moveToGrid, toggleMetric, type GridPosition, type LayerState, type MetricKey } from "../lib/editor-model.js";
import { downloadUrl, PHOTO_ACCEPT, validatePhotoFile } from "../lib/files.js";
import { GridPicker } from "./GridPicker.js";

const STAGE_WIDTH = 600;
const STAGE_HEIGHT = 900;

function useImage(url: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) { setImage(null); return; }
    const next = new Image();
    next.onload = () => setImage(next);
    next.src = url;
    return () => { next.onload = null; };
  }, [url]);
  return image;
}

function coverCrop(image: HTMLImageElement) {
  const imageRatio = image.width / image.height;
  const stageRatio = STAGE_WIDTH / STAGE_HEIGHT;
  if (imageRatio > stageRatio) {
    const width = image.height * stageRatio;
    return { x: (image.width - width) / 2, y: 0, width, height: image.height };
  }
  const height = image.width / stageRatio;
  return { x: 0, y: (image.height - height) / 2, width: image.width, height };
}

function metricLabel(metric: MetricKey, values: Record<string, string>): string {
  if (metric === "distance") return `总距离  ${values.distance}`;
  if (metric === "ascent") return `累计爬升  ${values.ascent}`;
  return `总耗时  ${values.duration}`;
}

export function PhotoPoster({ track }: { track: TrackData }) {
  const stageRef = useRef<Konva.Stage>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const image = useImage(photoUrl);
  const [route, setRoute] = useState<LayerState>({ x: 0.5, y: 0.42, scale: 1, rotation: 0, visible: true, locked: false });
  const [statsLayer, setStatsLayer] = useState<LayerState>({ x: 0.5, y: 0.78, scale: 1, rotation: 0, visible: true, locked: false });
  const [routeColor, setRouteColor] = useState("#fff1b3");
  const [routeWidth, setRouteWidth] = useState(7);
  const [routeOpacity, setRouteOpacity] = useState(0.95);
  const [routeShadow, setRouteShadow] = useState(true);
  const [routeOutline, setRouteOutline] = useState(true);
  const [metrics, setMetrics] = useState<MetricKey[]>(["distance", "ascent", "duration"]);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [statsBackground, setStatsBackground] = useState(true);
  const [statsShadow, setStatsShadow] = useState(true);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const routeSegments = useMemo(() => projectSegments(simplifySegments(track.segments, 0.00008), 250, 330, 8), [track]);
  const values = formatStatistics(track.statistics);
  const statText = metrics.map((metric) => metricLabel(metric, values)).join(layout === "vertical" ? "\n" : "   ·   ");
  const textWidth = layout === "vertical" ? 330 : 500;
  const textHeight = layout === "vertical" ? metrics.length * (fontSize + 12) : fontSize + 18;

  const selectPhoto = (file?: File) => {
    if (!file) return;
    setPhotoError("");
    try {
      validatePhotoFile(file);
      const next = URL.createObjectURL(file);
      setPhotoUrl((current) => { if (current) URL.revokeObjectURL(current); return next; });
    } catch (reason) {
      setPhotoError(reason instanceof Error ? reason.message : "照片读取失败");
    }
  };

  const moveRoute = (position: GridPosition) => setRoute((state) => moveToGrid(state, position));
  const moveStats = (position: GridPosition) => setStatsLayer((state) => moveToGrid(state, position));

  const exportPoster = () => {
    if (!stageRef.current || !image || metrics.length === 0) return;
    const mimeType = exportFormat === "png" ? "image/png" : "image/jpeg";
    const url = stageRef.current.toDataURL({ pixelRatio: 1600 / STAGE_WIDTH, mimeType, quality: 0.92 });
    downloadUrl(url, `${track.name}-照片轨迹海报.${exportFormat === "png" ? "png" : "jpg"}`);
  };

  return <section className="photo-workspace">
    <div className="editor-sidebar">
      <div className="editor-intro"><span className="mode-kicker">PHOTO OVERLAY</span><h2>让轨迹落在你的风景里</h2><p>照片始终留在浏览器本地，只导出重新编码后的成品。</p></div>
      <div className="control-card">
        <div className="control-title"><b>照片</b><span>JPEG · PNG · WebP</span></div>
        <label className="photo-picker"><input type="file" accept={PHOTO_ACCEPT} onChange={(event) => selectPhoto(event.target.files?.[0])} /><span>{image ? "更换背景照片" : "选择一张静态照片"}</span></label>
        {photoError && <p className="inline-error" role="alert">{photoError}</p>}
      </div>

      <div className="control-card">
        <div className="control-title"><b>轨迹形状</b><div className="layer-toggles"><label><input type="checkbox" checked={route.visible} onChange={() => setRoute((state) => ({ ...state, visible: !state.visible }))} />显示</label><label><input type="checkbox" checked={route.locked} onChange={() => setRoute((state) => ({ ...state, locked: !state.locked }))} />锁定</label></div></div>
        <div className="quick-row"><span>快速位置</span><GridPicker label="轨迹位置" onPick={moveRoute} /></div>
        <label className="color-control">颜色<input type="color" value={routeColor} onChange={(event) => setRouteColor(event.target.value)} /></label>
        <label>尺寸 <input type="range" min="0.45" max="1.8" step="0.05" value={route.scale} onChange={(event) => setRoute((state) => ({ ...state, scale: Number(event.target.value) }))} /></label>
        <label>旋转 <input type="range" min="-180" max="180" step="1" value={route.rotation} onChange={(event) => setRoute((state) => ({ ...state, rotation: Number(event.target.value) }))} /></label>
        <label>线宽 <input type="range" min="2" max="16" step="1" value={routeWidth} onChange={(event) => setRouteWidth(Number(event.target.value))} /></label>
        <label>透明度 <input type="range" min="0.2" max="1" step="0.05" value={routeOpacity} onChange={(event) => setRouteOpacity(Number(event.target.value))} /></label>
        <div className="inline-checks"><label><input type="checkbox" checked={routeOutline} onChange={(event) => setRouteOutline(event.target.checked)} />描边</label><label><input type="checkbox" checked={routeShadow} onChange={(event) => setRouteShadow(event.target.checked)} />阴影</label></div>
      </div>

      <div className="control-card">
        <div className="control-title"><b>统计信息</b><div className="layer-toggles"><label><input type="checkbox" checked={statsLayer.visible} onChange={() => setStatsLayer((state) => ({ ...state, visible: !state.visible }))} />显示</label><label><input type="checkbox" checked={statsLayer.locked} onChange={() => setStatsLayer((state) => ({ ...state, locked: !state.locked }))} />锁定</label></div></div>
        <div className="metric-options">{(["distance", "ascent", "duration"] as MetricKey[]).map((metric) => <label key={metric}><input type="checkbox" checked={metrics.includes(metric)} onChange={() => setMetrics((current) => toggleMetric(current, metric))} />{{ distance: "总距离", ascent: "累计爬升", duration: "总耗时" }[metric]}</label>)}</div>
        <p className="control-hint">至少保留一项；所选数据作为一个整体拖动。</p>
        <div className="quick-row"><span>快速位置</span><GridPicker label="统计位置" onPick={moveStats} /></div>
        <label className="color-control">文字颜色<input type="color" value={fontColor} onChange={(event) => setFontColor(event.target.value)} /></label>
        <label>字号 <input type="range" min="18" max="52" step="1" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
        <label>尺寸 <input type="range" min="0.55" max="1.7" step="0.05" value={statsLayer.scale} onChange={(event) => setStatsLayer((state) => ({ ...state, scale: Number(event.target.value) }))} /></label>
        <div className="select-row"><label>布局<select value={layout} onChange={(event) => setLayout(event.target.value as "vertical" | "horizontal")}><option value="vertical">纵向</option><option value="horizontal">横向</option></select></label><label>对齐<select value={alignment} onChange={(event) => setAlignment(event.target.value as typeof alignment)}><option value="left">左</option><option value="center">中</option><option value="right">右</option></select></label></div>
        <div className="inline-checks"><label><input type="checkbox" checked={statsBackground} onChange={(event) => setStatsBackground(event.target.checked)} />半透明底</label><label><input type="checkbox" checked={statsShadow} onChange={(event) => setStatsShadow(event.target.checked)} />阴影</label></div>
      </div>

      <div className="export-row"><select aria-label="导出格式" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "png" | "jpeg")}><option value="png">PNG</option><option value="jpeg">JPEG</option></select><button className="primary-button" disabled={!image} onClick={exportPoster}>导出 1600 × 2400</button></div>
    </div>

    <div className="photo-preview-column">
      <div className="stage-shell">
        <Stage ref={stageRef} width={STAGE_WIDTH} height={STAGE_HEIGHT}>
          <Layer>
            {image ? <KonvaImage image={image} x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT} crop={coverCrop(image)} /> : <>
              <Rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#17241f" />
              <Text x={60} y={380} width={480} text="选择一张照片开始排版" fill="#81928a" fontSize={27} align="center" />
              <Text x={60} y={430} width={480} text="照片不会上传" fill="#596b63" fontSize={18} align="center" />
            </>}
            <Rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 0, y: STAGE_HEIGHT }} fillLinearGradientColorStops={[0, "rgba(0,0,0,0.10)", 0.65, "rgba(0,0,0,0.02)", 1, "rgba(0,0,0,0.35)"]} listening={false} />
            {route.visible && <Group x={route.x * STAGE_WIDTH} y={route.y * STAGE_HEIGHT} offsetX={125} offsetY={165} scaleX={route.scale} scaleY={route.scale} rotation={route.rotation} draggable={!route.locked} onDragEnd={(event) => setRoute((state) => ({ ...state, x: clampUnit(event.target.x() / STAGE_WIDTH), y: clampUnit(event.target.y() / STAGE_HEIGHT) }))}>
              {routeSegments.map((segment, index) => <Line key={index} points={segment.points.flatMap((point) => [point.x, point.y])} stroke={routeColor} strokeWidth={routeWidth} opacity={routeOpacity} lineCap="round" lineJoin="round" shadowColor="#000" shadowBlur={routeShadow ? 14 : 0} shadowOpacity={routeShadow ? 0.65 : 0} shadowOffset={{ x: 2, y: 5 }} perfectDrawEnabled={false} />)}
              {routeOutline && routeSegments.map((segment, index) => <Line key={`outline-${index}`} points={segment.points.flatMap((point) => [point.x, point.y])} stroke="#ffffff" strokeWidth={Math.max(1, routeWidth * 0.22)} opacity={routeOpacity * 0.75} lineCap="round" lineJoin="round" listening={false} />)}
            </Group>}
            {statsLayer.visible && <Group x={statsLayer.x * STAGE_WIDTH} y={statsLayer.y * STAGE_HEIGHT} offsetX={textWidth / 2} offsetY={textHeight / 2} scaleX={statsLayer.scale} scaleY={statsLayer.scale} draggable={!statsLayer.locked} onDragEnd={(event) => setStatsLayer((state) => ({ ...state, x: clampUnit(event.target.x() / STAGE_WIDTH), y: clampUnit(event.target.y() / STAGE_HEIGHT) }))}>
              {statsBackground && <Rect x={-22} y={-17} width={textWidth + 44} height={textHeight + 34} cornerRadius={18} fill="rgba(5,12,10,.48)" shadowColor="#000" shadowBlur={statsShadow ? 18 : 0} shadowOpacity={statsShadow ? 0.45 : 0} />}
              <Text width={textWidth} height={textHeight} text={statText} fill={fontColor} fontSize={fontSize} fontFamily="Arial, PingFang SC, sans-serif" fontStyle="bold" lineHeight={1.35} align={alignment} verticalAlign="middle" shadowColor="#000" shadowBlur={!statsBackground && statsShadow ? 9 : 0} shadowOpacity={0.85} />
            </Group>}
          </Layer>
        </Stage>
      </div>
      <div className="privacy-chip"><span>●</span> 本地合成 · 照片不会上传服务器</div>
    </div>
  </section>;
}
