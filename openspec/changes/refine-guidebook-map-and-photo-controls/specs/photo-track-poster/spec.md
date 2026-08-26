## ADDED Requirements

### Requirement: Show symmetric numeric controls for editable layers
系统 SHALL 为轨迹形状和统计信息两个独立图层提供结构一致的数值化变换控件，包含 X 位置、Y 位置、整体缩放、旋转和透明度；每项 SHALL 同时提供滑块和可编辑数值，二者 SHALL 双向同步。

#### Scenario: Inspect current layer values
- **WHEN** 用户查看轨迹形状或统计信息控制区
- **THEN** 界面分别显示该图层的 X、Y 百分比、整体缩放百分比、旋转角度和透明度百分比

#### Scenario: Enter the same scale for both layers
- **WHEN** 用户将轨迹形状和统计信息的整体缩放都输入为 80%
- **THEN** 两个图层分别使用数值 80% 渲染，且对应滑块同步移动到相同数值

#### Scenario: Change a numeric value with a slider
- **WHEN** 用户拖动任一图层的旋转、缩放、位置或透明度滑块
- **THEN** 对应数字输入立即显示带有 `%` 或 `°` 语义的最新值，预览同步更新

#### Scenario: Enter an out-of-range value
- **WHEN** 用户在图层数字输入中提交超出允许范围或无法解析的值
- **THEN** 系统将其限制到安全范围或恢复最后一个有效值，不产生不可见或无法继续编辑的图层状态

### Requirement: Distinguish shared transforms from layer-specific values
系统 SHALL 使用相同单位与排列顺序展示两个图层的共同变换参数，并单独展示轨迹线宽和统计数值字号等图层专属参数；轨迹线宽 SHALL 显示像素值，统计数值字号 SHALL 显示像素值。

#### Scenario: Compare route and statistics controls
- **WHEN** 用户在两个图层控制区之间切换
- **THEN** 位置、缩放、旋转和透明度采用一致的名称、单位和控件顺序，而线宽与字号分别显示为各自专属的像素数值

#### Scenario: Edit statistics rotation
- **WHEN** 用户调整统计信息图层的旋转数值
- **THEN** 整个统计组围绕其图层锚点旋转，所有指标、背景和阴影保持为一个整体

### Requirement: Display the fixed demo output size
系统 SHALL 在照片轨迹海报编辑器中明确显示当前输出尺寸为 1600×2400 px，并继续以该尺寸导出 PNG 或 JPEG；本变更 SHALL NOT 提供其他画布比例或尺寸预设。

#### Scenario: Review export dimensions
- **WHEN** 用户进入照片轨迹海报编辑器或准备导出
- **THEN** 界面可见地显示输出尺寸 1600×2400 px

#### Scenario: Export after numeric adjustments
- **WHEN** 用户调整任一图层的数值参数并导出 PNG 或 JPEG
- **THEN** 下载图片尺寸为 1600×2400 px，且图层位置、比例、旋转和透明度与预览一致
