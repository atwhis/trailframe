## Why

当前 Guidebook 通过独立 Overpass 查询绘制周边高峰卡片，地图标签风格与底图割裂，同时单色多日轨迹和无数值滑块让路线辨识与照片排版缺少精确控制。本变更统一地图视觉、简化外部依赖，并让分日轨迹与照片图层参数更清晰可控。

## What Changes

- 保留当前 Mapbox 卫星影像底图，通过自定义 Mapbox Guidebook 样式显示来自 OSM 数据的道路名称，以及纯文字形式的山峰名称和海拔；不显示等高线、山峰三角图标或其他山峰图标。
- **BREAKING**：移除轨迹周边 5 公里高峰搜索、Overpass 集成、独立山峰筛选与绘制、相关配置字段、响应头、警告和页面说明。
- Guidebook 和 Modern 均按轨迹点的本地日历日期着色：同一天使用同一颜色，不同日期使用不同颜色；无有效时间时回退为单色。
- 保持 Guidebook 不显示路线颜色图例、分日行程列表和关键节点列表，仅通过路线颜色区分日期。
- **BREAKING**：将 Web 与 API 的默认地形海报模板从 Modern 改为 Guidebook，Modern 继续作为可选模板。
- 在照片轨迹海报中为轨迹形状与统计信息提供对齐的数值化图层控制；位置、整体缩放、旋转和透明度使用统一单位，并支持滑块与数字输入同步。
- 明确显示照片海报输出尺寸，保留 demo 的 1600×2400 PNG/JPEG 输出，不在本变更中增加多画布比例。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `terrain-track-poster`: 修改 Guidebook 地图标签、移除周边高峰搜索、按日期分色并将 Guidebook 设为默认模板。
- `photo-track-poster`: 为两个独立图层增加统一单位的可见、可编辑数值控制，并明确固定输出尺寸。

## Impact

- 地形海报 API、请求默认值、响应元数据、Mapbox Guidebook 样式配置和地图署名。
- 删除 `apps/api/src/peaks.ts` 及 Overpass 相关服务端选项、测试与文档。
- 调整服务端 SVG 路线渲染、前端模板默认值和地形海报说明。
- 调整照片编辑器图层状态控件、数值输入校验、拖动回写和组件测试。
- 需要在 Mapbox Studio 准备兼容 Static Images API 的自定义经典样式，并通过 `MAPBOX_GUIDEBOOK_STYLE` 配置其样式 ID。
