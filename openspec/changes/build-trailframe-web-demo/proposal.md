## Why

户外和城市运动用户需要把 GPX/KML 轨迹快速制作成可分享的地图海报或照片轨迹海报，而现有流程通常依赖专业 GIS 软件、上传私人照片或手工排版。Trailframe 的首个纯 Web demo 用浏览器完成导入、编辑、预览与导出，并把必须联网的底图能力隔离在轻量后端；同时需要提供以真实地貌为视觉主体的 Guidebook 模板，并改善照片海报统计信息的层级和透明度控制。

## What Changes

- 新建可部署到 GitHub 的 React + TypeScript Web 应用和 Node.js + TypeScript API。
- 支持导入 GPX 轨迹、路线和航点，以及 KML LineString、MultiGeometry、`gx:Track`，统一分析距离、时间、海拔与多日分段。
- 生成包含地形底图、轨迹、周边高峰、海拔曲线和完整统计信息的竖版地形轨迹海报。
- 在保留现有 Modern 风格的基础上新增 Guidebook 地貌模板；该模板不依赖分日或关键节点信息，不显示分日行程列表、关键节点列表及路线颜色或图标图例，并默认使用单一强调色绘制轨迹。
- Guidebook 模板以卫星影像、地形阴影或等高线等真实地貌信息作为地图主体，在山峰真实位置显示名称和海拔，并让山峰周围的山体地貌保持可见，而不是仅绘制孤立的名称标签。
- 提供静态照片轨迹海报编辑器；照片仅在浏览器本地处理，轨迹形状与可选统计组可分别拖动和定制。
- 照片海报的每项统计采用“数值在上、指标名称在下”的两级排版，支持横向或纵向排列，并允许独立于轨迹图层调整统计组的整体透明度。
- 支持页面预览以及 PNG/JPEG 下载；缺少 Mapbox token 或外部高峰服务失败时给出清晰且可恢复的降级结果。
- 地理事实图层使用确定性绘制，不依赖大模型生成或修改轨迹、山峰、文字和地貌。
- 使用非敏感的 GPX/KML fixtures 作为自动测试数据，并允许本地私有样例进行兼容验证而不进入 Git。

## Capabilities

### New Capabilities

- `track-import-analysis`: 导入、规范化和分析 GPX/KML 轨迹数据。
- `terrain-track-poster`: 通过后端安全调用地形底图和周边高峰服务，生成可下载的 Modern 或 Guidebook 地形轨迹海报，并在 Guidebook 中突出真实地貌和山峰信息。
- `photo-track-poster`: 在浏览器本地将静态照片、可编辑轨迹形状与可选统计信息合成为海报，并提供两级统计排版与统计组透明度控制。

### Modified Capabilities

无。

## Impact

- 新增 npm workspace，包含 `apps/web`、`apps/api` 和共享 TypeScript 包。
- 前端新增 React、Vite、Konva/React-Konva；后端新增 Fastify、Sharp 和 SVG 合成能力。
- 外部集成包括 Mapbox Static Images API 和 OpenStreetMap Overpass API；Guidebook 需要地图样式提供卫星影像、地形阴影或等高线中的一种或多种地貌信息，Mapbox token 仅通过 API 进程环境变量读取。
- 新增浏览器端文件和照片处理、服务端地图渲染接口、单元/集成测试、环境变量示例和项目文档。
