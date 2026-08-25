## Context

本 change 从空项目开始，需求跨浏览器 UI、轨迹分析、服务端第三方地图调用和图片合成。用户样例 KML 由多个 `gx:Track` 组成，样例 GPX 含轨迹、时间、海拔及航点；累计升降必须消除设备海拔抖动。真实地形底图依赖尚未提供的 Mapbox token，因此 demo 必须能在无凭据和无外网测试环境中验证完整合成流程。行为边界见三个 capability spec。

## Goals / Non-Goals

**Goals:**

- 用单一 npm workspace 提供可本地运行、自动测试、生产构建和 GitHub 托管的代码库。
- 让轨迹解析与分析成为前后端共享、无状态、可单元测试的纯 TypeScript 模块。
- 将照片像素限制在浏览器中，将地图服务凭据和远端请求限制在 API 中。
- 即使没有 Mapbox token 或 Overpass 不可用，也能生成明确标识的可下载 demo 海报。

**Non-Goals:**

- 不处理 HEIC、GIF、视频、Live Photo 或动态海报。
- 不做账号、云端照片存储、项目持久化和多人协作。
- 不用 DEM 补全缺失海拔，也不提供专业测绘精度保证。
- demo 不逐个拖动统计指标；所选指标作为一个统计组编辑。

## Decisions

### npm workspace 与责任分层

代码采用 `apps/web`（React/Vite）、`apps/api`（Fastify/Sharp）和 `packages/track-core`（解析、分析、投影、共享类型）。这比两个独立仓库更容易共享 `TrackData` 类型与测试样例，也便于单次 GitHub clone 后启动。替代方案是全前端应用，但会暴露地图 token 且无法稳定控制远端请求。

### 浏览器解析并复用统一 TrackData

文件在浏览器中解析为带显式 `segments` 的 `TrackData`，随后同一对象用于两类海报；请求地形海报时只上传轨迹数据，不上传原文件。XML 解析器兼容浏览器并保留 GPX/KML 的轨迹段、时间、海拔和航点。多日颜色按时间戳格式中的时区换算后的本地日历日分组，而不是按几何段分组。

距离按每段相邻点 Haversine 累加，绝不跨段连接。海拔先线性插补短缺口，再使用距离窗口平滑，之后采用 3 米迟滞阈值累计趋势反转，减少 GPS 噪声；样例结果用范围断言防止算法漂移。替代方案是直接累计逐点差值，会显著高估爬升。

### 服务端合成地形海报

API 计算适配轨迹范围的 Web Mercator 相机，从 Mapbox Outdoors Static Images API 获取仅含底图的位图，再由 SVG/Sharp 绘制简化后的轨迹、山峰、曲线、图例和统计。轨迹不放进 Mapbox URL，避免长轨迹超过 URL 长度限制。`MAPBOX_ACCESS_TOKEN` 仅在服务端环境变量中读取。

没有 token 时生成带等高线视觉语言和“演示底图”标识的确定性 SVG 占位图；Mapbox 或 Overpass 失败也分别降级，不阻断最终 PNG。这使 CI 不依赖外网，同时让用户在添加 token 前就能验证浏览器→API→海报的完整链路。

### 周边高峰查询与筛选

API 用轨迹外包框加 5 公里余量请求 Overpass 的 `natural=peak`，只接受有效 `name` 与数值 `ele`。随后计算每座峰到简化轨迹点的近似最小距离，过滤 5 公里外结果，并按“较高优先、距离为次”选择最多 5 座。请求设置短超时；失败返回警告并继续合成。

### React-Konva 照片编辑器

照片通过对象 URL 直接进入 Konva 画布，永不进入 API。轨迹层与统计组分别持有 `{x, y, scale, rotation, visible, locked}`，其中位置使用 0..1 归一化坐标；预览渲染时映射到画布像素，导出时提高 `pixelRatio`，因此布局不会漂移。九宫格只是写入预设归一化坐标，自由拖动仍更新同一模型。

轨迹使用基于经纬度归一化的局部平面路径，并提供颜色、线宽、透明度、阴影和描边；统计组允许勾选距离、爬升、耗时并整体控制字体、颜色、对齐、方向、背景和阴影。导出通过 canvas 重新编码 PNG/JPEG，自然移除原照片 EXIF。

## Risks / Trade-offs

- [Mapbox Static API 额度、样式或许可发生变化] → 封装地图提供者、保留署名、提供无 token 占位底图并在 README 记录配置方式。
- [公共 Overpass 限流或超时] → 短超时、输入范围限制、结果数量限制和无峰降级；生产环境可替换为自建或缓存服务。
- [浏览器处理超大轨迹或照片造成卡顿] → 限制文件大小与点数、显示处理状态、绘制前 Douglas-Peucker 简化但统计仍基于原始点。
- [不同设备海拔噪声导致升降统计与运动平台不完全一致] → 固定并测试平滑/迟滞参数，在 UI 和文档中说明估算口径。
- [Web 字体或浏览器 canvas 差异] → API 的最终地形海报由 Sharp/SVG 确定性输出；照片海报使用系统无衬线字体栈并以实际导出预览验收。

## Migration Plan

1. 创建 workspace、共享模块、Web 与 API，并提交 `.env.example` 而非真实 token。
2. 用项目样例验证两种格式和统计范围；用 mock 地图/高峰响应验证 API。
3. 运行 lint/typecheck、单元/集成测试和生产构建，再执行浏览器端上传、编辑、生成与下载冒烟测试。
4. 初始化 Git 仓库，先检查 GitHub 远端历史；空仓库直接推送，非空仓库只做非破坏性整合且绝不 force push。

回滚可恢复到前一 Git commit；外部服务集成可通过移除 token 回到占位底图模式。
