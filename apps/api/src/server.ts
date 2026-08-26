import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";

// npm workspaces run this package with apps/api as process.cwd(). Resolve from
// the module instead so both src/server.ts and dist/server.js load root .env.
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

const app = await buildApp({
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
  mapboxStyle: process.env.MAPBOX_STYLE,
  mapboxGuidebookStyle: process.env.MAPBOX_GUIDEBOOK_STYLE,
  webOrigin: process.env.WEB_ORIGIN,
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT || 8787);
  await app.listen({ host: "0.0.0.0", port });
  console.log(`Trailframe API listening on http://localhost:${port}`);
}

export { app };
