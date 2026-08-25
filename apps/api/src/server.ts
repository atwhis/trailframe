import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp({
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
  mapboxStyle: process.env.MAPBOX_STYLE,
  overpassUrl: process.env.OVERPASS_URL,
  webOrigin: process.env.WEB_ORIGIN,
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT || 8787);
  await app.listen({ host: "0.0.0.0", port });
  console.log(`Trailframe API listening on http://localhost:${port}`);
}

export { app };
