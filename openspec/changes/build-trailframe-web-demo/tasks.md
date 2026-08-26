## 1. Project foundation

- [x] 1.1 Create the npm workspace, TypeScript configuration, environment example, ignore rules, and sample asset layout
- [x] 1.2 Add shared scripts for development, type checking, testing, production builds, and formatting checks

## 2. Track import and analysis

- [x] 2.1 Define the normalized TrackData model and implement GPX track/route/waypoint parsing
- [x] 2.2 Implement KML LineString, MultiGeometry, and gx:Track parsing while preserving segments
- [x] 2.3 Implement segmented distance, duration, local-day grouping, elevation interpolation, smoothing, ascent, descent, and maximum elevation
- [x] 2.4 Add route simplification and normalized projection helpers for poster rendering
- [x] 2.5 Test GPX/KML fixtures plus local private samples, invalid files, missing data, segment boundaries, and statistic ranges

## 3. Terrain poster API

- [x] 3.1 Create the Fastify API with health/config endpoints, request validation, size limits, and CORS for local development
- [x] 3.2 Implement Mapbox Outdoors static background fetching with server-only credentials and deterministic no-token fallback
- [x] 3.3 Implement 5 km Overpass peak lookup, validation, distance filtering, ranking, timeout, and graceful failure
- [x] 3.4 Implement Sharp/SVG terrain poster composition with route days, peak labels, elevation profile, statistics, legend, attribution, and PNG response
- [x] 3.5 Add API integration tests for successful fallback rendering, invalid input, peak degradation, dimensions, and token secrecy

## 4. Web application

- [x] 4.1 Build the responsive Trailframe shell, file upload flow, parsed-track summary, mode navigation, validation, and empty/error states
- [x] 4.2 Build terrain poster generation, warning display, final image preview, object URL cleanup, and PNG download
- [x] 4.3 Build the local-photo Konva editor with independent route/stat layers, drag/lock/hide, nine-grid positioning, normalized coordinates, and route styling
- [x] 4.4 Add metric selection and statistics styling, enforce at least one metric, validate static photo formats, and export PNG/JPEG without uploading photos
- [x] 4.5 Add frontend component and behavior tests for imports, selections, independent layer state, API errors, and downloads

## 5. Documentation and verification

- [x] 5.1 Document setup, Mapbox token permissions, architecture, privacy behavior, supported formats, statistical caveats, external attribution, and demo workflows
- [x] 5.2 Run strict OpenSpec validation, all automated tests, type checks, and production builds
- [x] 5.3 Run browser smoke tests for both poster workflows and verify rendered previews and downloads

## 6. GitHub delivery

- [x] 6.1 Initialize Git with a main branch, review tracked files for secrets and generated artifacts, and create the implementation commit
- [x] 6.2 Inspect the target GitHub remote, integrate non-destructively if needed, push main, and verify the published commit

## 7. Guidebook terrain poster

- [x] 7.1 Add the Modern/Guidebook template field to API validation, poster requests, and the Web template selector while keeping Modern as the backward-compatible default
- [x] 7.2 Add server-only Guidebook map style configuration, a satellite-terrain default, environment documentation, and graceful fallback to the existing map style
- [x] 7.3 Implement the Guidebook SVG/Sharp composition with a large terrain map, single-color route, compact statistics, elevation profile, and no itinerary, waypoint list, or route legend
- [x] 7.4 Implement compact Guidebook peak markers with name, elevation, leader lines, bounded candidate placement, and reduced terrain occlusion
- [x] 7.5 Add API and Web tests for template selection, missing optional track metadata, terrain-style fallback, peak-service degradation, and Modern compatibility

## 8. Photo statistics hierarchy and opacity

- [x] 8.1 Replace the joined statistics text with grouped metric blocks that render a large value and unit above a smaller metric label in horizontal and vertical layouts
- [x] 8.2 Add a 0%–100% statistics-group opacity control that affects text, background, and shadow without changing route opacity, and preserve it in preview and export
- [x] 8.3 Add component tests for selected metric subsets, hierarchical layouts, independent opacity, drag behavior, and high-resolution export consistency

## 9. Documentation and verification for poster refinements

- [x] 9.1 Document template behavior, Guidebook map style configuration, terrain limitations, peak behavior, and photo statistics controls
- [x] 9.2 Run strict OpenSpec validation, automated tests, type checks, and production builds after the refinements
- [x] 9.3 Run browser smoke tests with the sample GPX/KML and a static photo, and visually verify Guidebook terrain, peak labels, statistics hierarchy, opacity, preview, and downloads
