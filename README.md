# Trailframe

Trailframe（轨迹成画）是一个纯 Web demo：导入 GPX/KML 后，可生成带地貌、周边高峰、海拔曲线与统计信息的地形轨迹海报，或把轨迹形状和自选统计放到一张本地照片上。

> 当前范围是静态图片。HEIC、GIF、视频、Apple Live Photo 和动态海报暂不支持。

## 已实现功能

### 地形轨迹海报

- GPX/KML 导入并显示总距离、累计爬升、总耗时、最高海拔。
- 约 1600 × 2400 PNG，包含地形底图、按本地日期着色的轨迹、海拔曲线、累计下降与最高海拔。
- 默认搜索轨迹周边 5 km 内带名称和海拔的 OSM `natural=peak`，最多展示 5 座。
- Mapbox token 只由 API 读取。无 token、Mapbox 失败或 Overpass 失败时仍会生成带清晰提示的演示海报。
- 页面预览最终图片并下载 PNG。

### 照片轨迹海报

- 支持 JPEG、PNG、WebP 静态照片；照片不上传服务器。
- 轨迹形状和统计信息是两个独立图层，可分别拖动、锁定、隐藏和使用九宫格快速定位。
- 轨迹可调整尺寸、旋转、颜色、线宽、透明度、描边与阴影。
- 可任意组合总距离、累计爬升、总耗时（至少一项）；统计组可调整字号、颜色、尺寸、对齐、横竖布局、半透明背景与阴影。
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
```

不要把真实 token 放入 Git、前端 `VITE_` 变量或浏览器代码。网页只请求 Trailframe API；API 在服务端请求 Mapbox Static Images。生成图片保留 `© Mapbox © OpenStreetMap` 署名。Mapbox 的套餐、额度和许可可能变化，正式上线前请重新核对其当前条款。

`OVERPASS_URL` 默认使用公共 Overpass 实例。公共服务可能限流，生产环境建议增加缓存或使用自建实例。高峰数据署名为 OpenStreetMap contributors。

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
- `GET /api/config`：只返回地图是否配置、照片是否上传和高峰搜索半径，不返回 token
- `POST /api/posters/terrain`：接收规范化 `TrackData`，返回 `image/png`

地形接口通过响应头返回非阻断警告：

- `x-trailframe-warnings`
- `x-trailframe-map-mode` (`mapbox` 或 `demo`)
- `x-trailframe-peak-count`

## 验证

```bash
npm run typecheck
npm test
npm run build
# 或一次执行
npm run check
```

测试包括非敏感 GPX/KML fixtures、分段距离、海拔缺失、统计范围、投影简化、5 km 高峰筛选、API 降级合成尺寸、token 隔离、网页导入、编辑器状态、错误恢复和下载行为。开发阶段另用本地私有样例做过兼容验证，但它们不进入 Git。

## 后续方向

- 接入账号与云端项目保存前，先明确照片与轨迹的存储/删除策略。
- 把地图提供者抽象为可选 Mapbox、MapTiler 或自托管瓦片服务。
- 若要保留 Apple Live Photo 的动态与配对元数据，使用原生 iOS 能力单独实现；本 Web demo 不承诺迁移该部分。

## License

MIT
