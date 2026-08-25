## Why

户外和城市运动用户需要把 GPX/KML 轨迹快速制作成可分享的地图海报或照片轨迹海报，而现有流程通常依赖专业 GIS 软件、上传私人照片或手工排版。Trailframe 的首个纯 Web demo 用浏览器完成导入、编辑、预览与导出，并把必须联网的底图能力隔离在轻量后端。

## What Changes

- 新建可部署到 GitHub 的 React + TypeScript Web 应用和 Node.js + TypeScript API。
- 支持导入 GPX 轨迹、路线和航点，以及 KML LineString、MultiGeometry、`gx:Track`，统一分析距离、时间、海拔与多日分段。
- 生成包含地形底图、轨迹、周边高峰、海拔曲线和完整统计信息的竖版地形轨迹海报。
- 提供静态照片轨迹海报编辑器；照片仅在浏览器本地处理，轨迹形状与可选统计组可分别拖动和定制。
- 支持页面预览以及 PNG/JPEG 下载；缺少 Mapbox token 或外部高峰服务失败时给出清晰且可恢复的降级结果。
- 使用非敏感的 GPX/KML fixtures 作为自动测试数据，并允许本地私有样例进行兼容验证而不进入 Git。

## Capabilities

### New Capabilities

- `track-import-analysis`: 导入、规范化和分析 GPX/KML 轨迹数据。
- `terrain-track-poster`: 通过后端安全调用地形底图和周边高峰服务，生成可下载的地形轨迹海报。
- `photo-track-poster`: 在浏览器本地将静态照片、可编辑轨迹形状与可选统计信息合成为海报。

### Modified Capabilities

无。

## Impact

- 新增 npm workspace，包含 `apps/web`、`apps/api` 和共享 TypeScript 包。
- 前端新增 React、Vite、Konva/React-Konva；后端新增 Fastify、Sharp 和 SVG 合成能力。
- 外部集成包括 Mapbox Static Images API 和 OpenStreetMap Overpass API；Mapbox token 仅通过 API 进程环境变量读取。
- 新增浏览器端文件和照片处理、服务端地图渲染接口、单元/集成测试、环境变量示例和项目文档。
