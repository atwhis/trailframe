## 1. Mapbox Guidebook style contract

- [x] 1.1 Document the Mapbox Studio Guidebook recipe based on the satellite streets classic style, including retained imagery and road-label layers, OSM-derived peak name/elevation text expressions, Chinese/local-name fallback, and required attribution
- [ ] 1.2 Document and verify that all contour layers, ordinary POIs, duplicate labels, and peak icon bindings are disabled so mountain peaks render as text only
- [x] 1.3 Update `MAPBOX_GUIDEBOOK_STYLE` documentation and the Guidebook fallback to use `mapbox/satellite-streets-v12` when the custom style is missing or inaccessible
- [x] 1.4 Replace contour-based no-token and empty-state visuals with deterministic terrain or imagery-like shading that does not imply contour-line output

## 2. Remove nearby peak search

- [x] 2.1 Remove the Overpass peak lookup module, radius calculation, ranking, timeout handling, server options, environment configuration, and unused tests
- [x] 2.2 Remove independent peak SVG markers, labels, leader lines, collision handling, peak count result fields, and peak-search warnings from both terrain poster templates
- [x] 2.3 Remove `peakRadiusKm`, `x-trailframe-peak-count`, related CORS exposure, feature-list copy, documentation, and client types
- [x] 2.4 Add API tests proving poster generation performs only the map request and returns no peak-search configuration, count, or warning metadata

## 3. Guidebook default and per-day route colors

- [x] 3.1 Add a deterministic non-repeating date color assignment helper that keeps all segments from the same date on one color and extends beyond the fixed palette without modulo reuse
- [x] 3.2 Update Modern and Guidebook route rendering to use `dailySections` when available and a single fallback color when valid timestamps are absent
- [x] 3.3 Preserve the Modern date legend while keeping Guidebook free of route legends, itinerary lists, key-node lists, and icon legends
- [x] 3.4 Change the Web initial template and API request default to Guidebook while preserving explicit Modern requests
- [x] 3.5 Add renderer, API, and Web tests for same-day same-color, different-day different-color, more days than the fixed palette, no-time fallback, Guidebook default, and explicit Modern selection

## 4. Numeric photo-layer controls

- [x] 4.1 Extend the shared layer state so route and statistics layers both use normalized position, scale, rotation, opacity, visibility, and lock values
- [x] 4.2 Build a reusable range-plus-number control with unit display, bidirectional synchronization, parsing, safe clamping, and invalid-value recovery
- [x] 4.3 Add X, Y, overall scale, rotation, and opacity controls in the same order and units to both route and statistics panels, and update values immediately after canvas dragging
- [x] 4.4 Show route line width and statistics value font size as editable pixel values while retaining their layer-specific styling controls
- [x] 4.5 Apply statistics rotation and group opacity to the whole metric group, and preserve route/statistics independence in preview and export
- [x] 4.6 Display `1600 × 2400 px` as the fixed output size without adding canvas-size state or additional aspect-ratio presets
- [x] 4.7 Add component and model tests for matched numeric values, slider/input synchronization, clamping, drag-to-position updates, statistics rotation, independent opacity, and 1600×2400 PNG/JPEG export

## 5. Documentation and verification

- [x] 5.1 Update README and `.env.example` for the custom Guidebook style, Guidebook default, map-native OSM-derived labels, removal of Overpass, per-day colors, numeric controls, and API migration notes
- [x] 5.2 Run API and Web tests, type checks, production builds, and strict OpenSpec validation after implementation
- [ ] 5.3 Run browser smoke tests with the sample GPX/KML and a static photo, visually checking text-only peaks, no contours, road labels, per-day colors, numeric editing, preview consistency, and downloads
