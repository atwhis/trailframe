## Purpose

提供一致、可验证的轨迹导入和统计口径，使地形海报与照片海报能够安全地复用 GPX/KML 中的位置、时间、海拔和分段信息。

## ADDED Requirements

### Requirement: Import supported track files
系统 SHALL 在浏览器中导入 GPX 1.1 的 `trk/trkseg/trkpt`、`rte/rtept`、`wpt`，以及 KML 的 `LineString`、`MultiGeometry` 和 `gx:Track`，并保留轨迹段边界。

#### Scenario: Import representative GPX and KML
- **WHEN** 用户导入项目样例 GPX 或 KML
- **THEN** 系统生成包含坐标、海拔、时间、轨迹段和航点的统一轨迹数据，且不会连接原文件中断开的轨迹段

#### Scenario: Reject unsupported or invalid files
- **WHEN** 用户导入不受支持、无法解析或不含有效轨迹点的文件
- **THEN** 系统显示可理解的错误且不进入海报编辑流程

### Requirement: Calculate track statistics consistently
系统 SHALL 使用分段内相邻点的大圆距离计算总距离，并提供累计爬升、累计下降、最高海拔以及首末有效时间之间的总耗时；累计升降 SHALL 在抗噪平滑后计算而非直接累计每一个微小高度波动。

#### Scenario: Analyze a complete elevation track
- **WHEN** 导入包含连续坐标、时间和海拔的轨迹
- **THEN** 系统返回有限且非负的距离、爬升、下降、耗时和最高海拔统计值

#### Scenario: Handle missing measurements
- **WHEN** 轨迹缺少时间或仅有少量可插值的海拔点
- **THEN** 系统将无时间的耗时标记为暂无数据，并对小范围海拔缺口插值

#### Scenario: Reject insufficient elevation data
- **WHEN** 轨迹大范围缺少海拔，无法可靠生成海拔相关内容
- **THEN** 系统明确提示海拔数据不足，而不伪造爬升或海拔曲线

### Requirement: Group time-bearing tracks by local calendar day
系统 SHALL 按轨迹时间的本地日历日期生成每日区段，区段不得简单等同于文件中的几何分段。

#### Scenario: Import a multi-day route
- **WHEN** 轨迹点时间跨越多个本地日历日期
- **THEN** 系统生成按日期排序的每日区段，并允许各日期使用不同轨迹颜色

