## Purpose

让用户在不上传私人照片的前提下，将照片、轨迹形状和自行选择的基础统计排版为可下载的静态海报。

## ADDED Requirements

### Requirement: Keep photo composition local
系统 MUST 在浏览器本地读取并合成 JPEG、PNG 或 WebP 静态照片，照片不得上传至 Trailframe API；导出 SHALL 通过重新编码移除原图 EXIF 元数据。

#### Scenario: Compose a private photo
- **WHEN** 用户选择受支持的本地照片并编辑海报
- **THEN** 所有照片像素处理都在浏览器发生，网络请求中不包含照片内容

#### Scenario: Reject unsupported photo formats
- **WHEN** 用户选择 HEIC、GIF、视频或 Live Photo
- **THEN** 系统显示本 demo 仅支持 JPEG、PNG 和 WebP 静态图片

### Requirement: Independently edit the route and statistics layers
系统 SHALL 将轨迹形状和统计信息作为两个独立图层；每个图层可分别拖动、显示、隐藏和锁定，并使用归一化相对坐标保存位置以保持预览与高分辨率导出一致。

#### Scenario: Move layers separately
- **WHEN** 用户拖动轨迹图层而未锁定该图层
- **THEN** 只有轨迹图层改变位置，统计图层保持原位

#### Scenario: Use a quick position
- **WHEN** 用户为任一图层选择九宫格位置
- **THEN** 该图层移动到相应的相对画布位置，之后仍可自由拖动

### Requirement: Customize the route shape
系统 SHALL 支持调整轨迹图层的位置、尺寸、旋转、颜色、线宽、透明度以及阴影或描边，且照片海报不得显示起终点、地图底图、周边山峰或海拔曲线。

#### Scenario: Style a route overlay
- **WHEN** 用户修改轨迹颜色、线宽、旋转或透明度
- **THEN** 预览和导出结果同步反映该样式，且只显示轨迹形状

### Requirement: Select and style basic statistics
系统 SHALL 允许用户任意组合总距离、累计爬升和总耗时，至少选择一项，并将所选统计作为一个可调整字体、颜色、对齐、横竖布局、背景与阴影的整体图层。

#### Scenario: Select a subset of metrics
- **WHEN** 用户只选择总距离和总耗时
- **THEN** 预览与导出仅显示总距离和总耗时，不显示累计爬升

#### Scenario: Deselect all metrics
- **WHEN** 用户尝试取消最后一项统计
- **THEN** 系统阻止生成或明确提示至少保留一项统计

### Requirement: Preview and export static images
系统 SHALL 在页面中提供编辑预览，并支持按目标分辨率导出 PNG 或 JPEG，导出元素的位置和视觉比例 SHALL 与预览一致。

#### Scenario: Download a completed poster
- **WHEN** 用户选择导出格式并点击下载
- **THEN** 浏览器下载包含照片、轨迹形状和所选统计的静态图片
