## Purpose

让用户把已解析的户外或城市轨迹生成为包含地貌、海拔变化、周边高峰和关键统计信息的可分享静态地图海报。

## ADDED Requirements

### Requirement: Generate a terrain track poster
系统 SHALL 生成约 1600×2400 的竖版海报，包含地形底图、轨迹、海拔曲线、总距离、累计爬升、累计下降和最高海拔，并允许用户选择 Modern 或 Guidebook 模板后在页面中预览最终生成的图片。

#### Scenario: Generate with configured map service
- **WHEN** 用户导入有效轨迹并请求生成，且服务端已配置地图服务凭据
- **THEN** 系统返回包含地形地貌和轨迹数据的 PNG 海报，用户可下载该图片

#### Scenario: Render multi-day sections
- **WHEN** 有效轨迹包含多个每日区段且用户选择 Modern 模板
- **THEN** 海报以可区分颜色绘制各日轨迹并显示对应日期图例

#### Scenario: Render a Guidebook poster
- **WHEN** 用户选择 Guidebook 模板并生成海报
- **THEN** 海报以单一强调色绘制整条轨迹，且不显示分日行程、关键节点列表、路线颜色图例或图标图例

#### Scenario: Render Guidebook without optional route metadata
- **WHEN** 有效轨迹不包含日期、航点或分日区段信息且用户选择 Guidebook 模板
- **THEN** 系统仍能生成包含地貌、轨迹、海拔曲线和基础统计的 Guidebook 海报

### Requirement: Show recognizable terrain in Guidebook
Guidebook 模板 SHALL 使用可辨识地表纹理或高低起伏的地图背景，并通过卫星影像、地形阴影或等高线中的一种或多种信息，让轨迹周围及已标注山峰附近的地貌保持可见。

#### Scenario: Generate Guidebook with a configured terrain map
- **WHEN** 用户选择 Guidebook 模板，且地图服务返回支持的地貌背景
- **THEN** 最终海报在轨迹和山峰标注周围显示可辨识的地表纹理或高低起伏，而不是仅显示纯色背景和孤立文字

### Requirement: Protect map service credentials and attribution
系统 MUST 仅在服务端读取地图服务 token，客户端资源、接口响应和代码仓库中不得暴露 token；海报 SHALL 保留地图服务与 OpenStreetMap 必需的署名。

#### Scenario: Inspect browser requests
- **WHEN** 用户在浏览器中生成地形海报
- **THEN** 浏览器仅调用 Trailframe API，且无法从请求或响应读取 Mapbox token

### Requirement: Show nearby highest peaks
系统 SHALL 默认检索轨迹几何周边 5 公里范围内具有名称和海拔的 OpenStreetMap `natural=peak`，按高度并兼顾距离选取至多 5 座标注在海报地图区域；Guidebook 模板 SHALL 将山峰标注锚定到真实地理位置，显示名称和海拔，并避免使用完全遮挡周围地貌的大面积标签。

#### Scenario: Nearby peaks are available
- **WHEN** 高峰服务返回轨迹周边多个有效山峰
- **THEN** 海报在对应地理位置标注至多 5 座代表性高峰的名称与海拔

#### Scenario: Show peaks over Guidebook terrain
- **WHEN** 用户选择 Guidebook 模板且高峰服务返回有效山峰
- **THEN** 山峰名称和海拔显示在对应地貌区域，且标注不会把山峰周围的地貌完全替换为不透明信息块

#### Scenario: Peak service is unavailable
- **WHEN** 高峰服务超时、限流或返回无有效高峰
- **THEN** 海报仍可生成，且页面提示周边高峰信息暂不可用

### Requirement: Degrade clearly when map service is not configured
系统 SHALL 在未设置 Mapbox token 时返回可识别的配置状态，并可生成带有明确演示占位底图的海报以验证合成流程。

#### Scenario: Generate without a token
- **WHEN** demo 环境未配置 `MAPBOX_ACCESS_TOKEN`
- **THEN** 用户仍能预览和下载合成结果，同时界面明确说明真实地形底图尚未启用
