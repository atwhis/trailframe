## MODIFIED Requirements

### Requirement: Generate a terrain track poster
系统 SHALL 生成约 1600×2400 的竖版海报，包含地图底图、轨迹、海拔曲线、总距离、累计爬升、累计下降和最高海拔，并允许用户选择 Modern 或 Guidebook 模板后在页面中预览最终生成的图片；未显式选择模板时 SHALL 使用 Guidebook。

#### Scenario: Generate with configured map service
- **WHEN** 用户导入有效轨迹并请求生成，且服务端已配置地图服务凭据
- **THEN** 系统返回包含地图地貌和轨迹数据的 PNG 海报，用户可下载该图片

#### Scenario: Default to Guidebook
- **WHEN** Web 页面首次进入地形海报模式，或 API 请求未显式传入模板
- **THEN** 系统选择 Guidebook 模板生成海报

#### Scenario: Keep Modern selectable
- **WHEN** 用户显式选择 Modern 模板
- **THEN** 系统仍使用 Modern 布局生成海报

#### Scenario: Render multi-day sections consistently
- **WHEN** 有效轨迹包含多个按本地日历日期划分的每日区段
- **THEN** 同一日期的所有轨迹段使用同一种颜色，不同日期使用可区分且不重复的颜色

#### Scenario: Render Guidebook without a route legend
- **WHEN** 多日轨迹使用 Guidebook 模板生成海报
- **THEN** 海报按日期区分轨迹颜色，但不显示路线颜色图例、分日行程列表、关键节点列表或图标图例

#### Scenario: Render a track without valid timestamps
- **WHEN** 有效轨迹没有可用于按日分组的时间信息
- **THEN** 系统使用一种默认强调色绘制全部轨迹，且仍能生成完整海报

### Requirement: Show Mapbox imagery with OSM-derived map labels in Guidebook
Guidebook 模板 SHALL 保留配置的 Mapbox 影像底图，并显示来自 OSM 衍生地图数据的道路名称、山峰名称和可用海拔；地图 SHALL 不显示等高线，山峰 SHALL 仅以文字标注，不显示三角形或其他山峰图标。

#### Scenario: Render the configured Guidebook map style
- **WHEN** 用户生成 Guidebook 海报且自定义 Mapbox Guidebook 样式可用
- **THEN** 最终地图显示影像地貌、道路名称以及地图范围内可用的山峰名称和海拔，同时不显示等高线

#### Scenario: Render a peak with elevation
- **WHEN** 地图标签数据中的山峰同时具有名称和海拔
- **THEN** 地图使用纯文字显示山峰名称和以米为单位的海拔，不在文字旁绘制山峰图标

#### Scenario: Render a peak without elevation
- **WHEN** 地图标签数据中的山峰具有名称但没有有效海拔
- **THEN** 地图仅显示山峰名称且不伪造海拔值

#### Scenario: Avoid duplicate labels over imagery
- **WHEN** 自定义 Guidebook 地图样式组合影像和地图标签
- **THEN** 道路与山峰标签只由一个可配置的标注层提供，不叠加重复标签

## ADDED Requirements

### Requirement: Do not perform nearby peak searches
系统 MUST NOT 根据轨迹边界或固定半径调用独立山峰搜索服务，也 MUST NOT 在地图底图之上额外筛选、绘制或统计周边最高山峰。

#### Scenario: Generate a terrain poster without a peak service
- **WHEN** 用户请求生成任一地形海报模板
- **THEN** 系统只请求配置的地图底图并合成轨迹与统计，不发起 Overpass 或其他周边山峰搜索请求

#### Scenario: Report map configuration without peak metadata
- **WHEN** 客户端读取配置或接收地形海报响应
- **THEN** 响应不包含周边山峰搜索半径、山峰数量或山峰搜索失败警告

## REMOVED Requirements

### Requirement: Show nearby highest peaks
**Reason**: 山峰名称和海拔改由 Mapbox 自定义地图样式中的 OSM 衍生标签提供，独立的 5 公里 Overpass 搜索、筛选和卡片式绘制会产生重复标注并增加不稳定外部依赖。

**Migration**: 删除 Overpass 配置与山峰搜索响应元数据；需要显示的山峰由 `MAPBOX_GUIDEBOOK_STYLE` 对应样式的地图范围、缩放级别和标签避让规则决定。
