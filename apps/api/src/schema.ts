import { z } from "zod";

const point = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  elevation: z.number().finite().optional(),
  time: z.string().max(100).optional(),
});

const segment = z.object({ points: z.array(point).min(1).max(250_000) });

export const trackDataSchema = z.object({
  name: z.string().min(1).max(200),
  sourceFormat: z.enum(["gpx", "kml"]),
  segments: z.array(segment).min(1).max(10_000),
  waypoints: z.array(point.extend({ name: z.string().max(200).optional() })).max(20_000),
  dailySections: z.array(z.object({ date: z.string().max(20), segments: z.array(segment) })).max(10_000),
  statistics: z.object({
    distanceMeters: z.number().finite().nonnegative(),
    ascentMeters: z.number().finite().nonnegative(),
    descentMeters: z.number().finite().nonnegative(),
    maxElevationMeters: z.number().finite(),
    durationMs: z.number().finite().nonnegative().nullable(),
  }),
});

export const terrainPosterRequestSchema = trackDataSchema.extend({
  template: z.enum(["modern", "guidebook"]).optional().default("guidebook"),
});
