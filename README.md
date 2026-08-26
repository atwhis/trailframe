# Trailframe

Trailframe（轨迹成画）是一个纯 Web demo：导入 GPX/KML 后，可生成带影像地貌、地图原生标签、分日轨迹、海拔曲线与统计信息的地形轨迹海报，或把轨迹形状和自选统计放到一张本地照片上。

> 当前范围是静态图片。HEIC、GIF、视频、Apple Live Photo 和动态海报暂不支持。

## 已实现功能

### 地形轨迹海报

- GPX/KML 导入并显示总距离、累计爬升、总耗时、最高海拔。
- 约 1600 × 2400 PNG，默认使用 Guidebook，也可显式选择 Modern。
- 两个模板都按轨迹点的本地日期着色：同一天同色、不同天不重复；无有效时间时整条轨迹使用一种强调色。
- Modern 保留深色信息面板和日期颜色图例。
- Guidebook 使用大面积卫星/地貌地图、紧凑统计和海拔曲线；不显示日期颜色图例、分日行程、关键节点列表或图标图例。
- Guidebook 的道路名称、山峰名称和可用海拔由 Mapbox Studio 样式中的 OSM 衍生地图数据直接渲染；不显示等高线和山峰图标，也不再调用 Overpass 搜索或额外绘制山峰。
- Mapbox token 只由 API 读取。无 token 或 Mapbox 失败时仍会生成带清晰提示的演示影像底图海报。
- 页面预览最终图片并下载 PNG。

### 照片轨迹海报

- 支持 JPEG、PNG、WebP 静态照片；照片不上传服务器。
- 轨迹形状和统计信息是两个独立图层，可分别拖动、锁定、隐藏和使用九宫格快速定位。
- 两个图层都按相同顺序提供 X、Y、整体缩放、旋转和透明度的滑块与数值输入；数值可精确输入并安全限制到有效范围。
- 轨迹还可调整颜色、像素线宽、描边与阴影。
- 可任意组合总距离、累计爬升、总耗时（至少一项）；每项都以“大号数值和单位在上、小号指标名称在下”的信息块显示。
- 统计组还可调整像素字号、颜色、对齐、横竖布局、半透明背景和阴影；统计变换与透明度不会改变轨迹图层。
- 高分辨率导出 PNG/JPEG；canvas 重新编码会移除原照片 EXIF。

## 快速开始

要求 Node.js 20+（本项目已在 Node.js 22.11 / npm 10.9 测试）。

```bash
npm install
cp .env.example .env
npm run dev
```

打开 `http://localhost:5173`。API 默认在 `http://localhost:8787`。

没有手边文件时可点击页面中的“加载内置样例”，它与文件上传使用同一套 GPX 解析和统计模块。

不设置任何 token 也可完整验证导入、合成、预览与下载；地形海报会使用内置的演示地形底图。页面的“一键样例”由代码生成，不包含真实用户的位置或照片数据。

本地 `samples/` 目录已被 Git 忽略，用于开发者自行放置私有轨迹与参考照片；这些文件不会推送到仓库。

## 配置 Mapbox

在 [Mapbox](https://account.mapbox.com/access-tokens/) 创建 public (`pk`) token，只授予读取样式/瓦片所需权限（`styles:tiles`），然后写入本地 `.env`：

```dotenv
MAPBOX_ACCESS_TOKEN=pk.your_token_here
MAPBOX_STYLE=mapbox/outdoors-v12
# 可选；留空时使用 mapbox/satellite-streets-v12
MAPBOX_GUIDEBOOK_STYLE=your-mapbox-username/your-style-id
```

`MAPBOX_STYLE` 用于 Modern，`MAPBOX_GUIDEBOOK_STYLE` 用于 Guidebook。Guidebook 自定义样式应保留卫星影像、道路名称以及纯文字的山峰名称/海拔，并关闭全部等高线、普通 POI、重复标签和山峰图标。完整的克隆步骤、文字表达式和发布检查清单见 [Mapbox Guidebook 样式说明](docs/mapbox-guidebook-style.md)。

未设置 `MAPBOX_GUIDEBOOK_STYLE` 时直接使用 `mapbox/satellite-streets-v12`；已设置但样式无法访问时，也会回退到 Satellite Streets 并返回非阻断警告。默认样式可用于功能验证，但只有按文档制作的自定义样式才能保证道路与山峰标签的筛选和排版完全符合 Guidebook 约定。

轨迹文件中的海拔只描述轨迹线自身，不能还原周边山体。Guidebook 的周边地貌来自地图样式中的卫星影像；道路与山峰文字来自地图样式，不代表“周边最高峰”排名。本 demo 不使用大模型生成或修改山峰、地貌、轨迹、数字和文字。

不要把真实 token 放入 Git、前端 `VITE_` 变量或浏览器代码。网页只请求 Trailframe API；API 在服务端请求 Mapbox Static Images。生成图片保留 `© Mapbox © OpenStreetMap` 署名。Mapbox 的套餐、额度和许可可能变化，正式上线前请重新核对其当前条款。

`.env` 必须位于仓库根目录（与根 `package.json` 同级）。API 会显式读取此文件；修改 token 后需要重启 `npm run dev`。

## 支持的轨迹数据

- GPX 1.1：`trk/trkseg/trkpt`、`rte/rtept`、`wpt`
- KML：`LineString`、`MultiGeometry`、`gx:Track`、Point 航点
- 坐标、海拔、时间和原始分段边界
- 文件最大 25 MB、最多 250,000 个轨迹点

总距离只累计同一分段内的相邻点，使用 Haversine 大圆距离，不跨断点连线。累计爬升/下降先插补少量海拔缺口，再使用滑动平滑和 3 m 迟滞阈值以降低 GPS 噪声；它是稳定估算值，可能与设备厂商或运动平台的私有算法不同。大范围缺少海拔时会拒绝生成海拔相关海报，而不会从 DEM 猜测。总耗时取首末有效时间；无时间时显示“暂无数据”。每日轨迹按浏览器本地时区的日历日期分组。

## 项目结构

```text
trailframe/
├── apps/
│   ├── web/          React + Vite + React-Konva
│   └── api/          Fastify + Sharp + SVG
├── packages/
│   └── track-core/   GPX/KML 解析、统计、简化与投影
├── openspec/         规格、设计和任务
└── samples/          本地私有素材（Git 忽略）
```

隐私边界：轨迹在浏览器解析；生成地形海报时会把规范化后的轨迹数据发送给本地/自托管 API。照片海报完全在浏览器 canvas 中合成，照片不会进入 API。demo 不做云端持久化。

## API

- `GET /health`：服务健康状态
- `GET /api/config`：只返回地图是否配置和照片是否上传，不返回 token 或山峰搜索元数据
- `POST /api/posters/terrain`：接收规范化 `TrackData`，可在顶层附加 `template: "modern" | "guidebook"`，返回 `image/png`；省略模板时默认使用 Guidebook

地形接口通过响应头返回非阻断警告：

- `x-trailframe-warnings`
- `x-trailframe-map-mode` (`mapbox` 或 `demo`)
- `x-trailframe-template` (`modern` 或 `guidebook`)

迁移提示：`peakRadiusKm` 配置字段、`x-trailframe-peak-count` 响应头和 `OVERPASS_URL` 环境变量已移除；依赖这些字段的调用方应直接删除相应逻辑。显式发送 `template: "modern"` 仍保持原模板选择能力。

## 验证

```bash
npm run typecheck
npm test
npm run build
# 或一次执行
npm run check
```

测试包括非敏感 GPX/KML fixtures、分段距离、海拔缺失、统计范围、投影简化、跨日非重复配色、模板默认值、Guidebook Satellite Streets 回退、单次地图请求、API 合成尺寸、token 隔离、网页导入、统一数值控件、统计旋转与独立透明度、错误恢复和 1600×2400 PNG/JPEG 下载行为。开发阶段另用本地私有样例做兼容验证，但它们不进入 Git。

## 后续方向

- 接入账号与云端项目保存前，先明确照片与轨迹的存储/删除策略。
- 把地图提供者抽象为可选 Mapbox、MapTiler 或自托管瓦片服务。
- 若要保留 Apple Live Photo 的动态与配对元数据，使用原生 iOS 能力单独实现；本 Web demo 不承诺迁移该部分。

## License

MIT
