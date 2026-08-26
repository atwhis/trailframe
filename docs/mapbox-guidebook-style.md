# Mapbox Guidebook 样式契约

Trailframe 通过 Mapbox Static Images API 请求一张完整底图，服务端只在其上叠加轨迹、统计和海拔曲线。道路与山峰文字必须在 Mapbox Studio 样式内完成，代码不会再调用 Overpass 或额外绘制山峰。

## 创建与发布

1. 在 Mapbox Studio 中复制一个可由 Static Images API 使用的经典 Satellite Streets 样式；不要改用本项目尚未验证的 Standard 样式槽位。
2. 保留卫星影像背景和必要的地形明暗。保留 Mapbox Streets 矢量源中一套道路名称层，以及一套包含山峰/自然地物的文字层。
3. 删除或隐藏所有 contour/等高线层、普通 POI、重复道路标签、重复自然地物标签和不需要的地点标签。
4. 山峰层只配置 `text-field`，清空 `icon-image`，并关闭任何来自基础样式的三角形、山形、maki 或 sprite 图标绑定。
5. 发布样式，复制样式 URL 中的 `用户名/样式ID`，写入仓库根目录 `.env` 的 `MAPBOX_GUIDEBOOK_STYLE`。修改后重启 API。

建议保留的图层从下到上为：卫星影像、可选 hillshade/地形明暗、必要道路名称、纯文字山峰标签。不要再叠加另一套栅格地形文字，否则道路和山峰会重复。

## 道路与山峰文字

道路标签沿用克隆样式中 Mapbox Streets 的道路名称层，只保留需要的道路等级。Mapbox Streets 的道路和自然地物数据包含 OSM 衍生来源；最终图片必须保留 `© Mapbox © OpenStreetMap` 署名。

在 Studio 数据检查器中确认山峰所在 source-layer 及字段后，将山峰文字设为以下等价表达式。不同样式版本的 source-layer/filter 名称可能不同，但输出契约相同：名称优先简体中文，其次本地名称；有 `elevation_m` 时第二行显示米制海拔，没有时只显示名称。

```json
[
  "case",
  ["has", "elevation_m"],
  [
    "format",
    ["coalesce", ["get", "name_zh-Hans"], ["get", "name_zh"], ["get", "name"], ""],
    {},
    "\n",
    {},
    ["concat", ["to-string", ["round", ["to-number", ["get", "elevation_m"]]]], " m"],
    { "font-scale": 0.8 }
  ],
  ["coalesce", ["get", "name_zh-Hans"], ["get", "name_zh"], ["get", "name"], ""]
]
```

若样式实际海拔字段不是 `elevation_m`，应先在 Studio 内转换或把表达式字段改为数据检查器显示的米制字段；不得从轨迹最高海拔或其他山峰推断缺失值。

## 发布前检查清单

- 卫星影像和地貌明暗可见，轨迹经过的主要道路名称可读。
- 地图范围内可用的山峰显示名称；有海拔时显示第二行 `{数值} m`。
- 山峰旁没有三角形、山形、圆点、引导线或其他图标。
- 图层列表与导出的 1600×2400 样图中均没有等高线。
- 普通 POI 已隐藏，道路与山峰没有来自两套标签层的重复文字。
- 样式已发布，使用服务端 token 可通过 Static Images API 访问。
- 最终海报保留 `© Mapbox © OpenStreetMap` 署名。

若 `MAPBOX_GUIDEBOOK_STYLE` 留空，Trailframe 使用 `mapbox/satellite-streets-v12`。若配置的自定义样式请求失败，服务端再请求 Satellite Streets 并通过 `x-trailframe-warnings` 告知降级；不会回退到含等高线的 Outdoors。
