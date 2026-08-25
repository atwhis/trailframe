import { describe, expect, it } from "vitest";
import { readTrackFile, validatePhotoFile } from "./files.js";

describe("file validation", () => {
  it("rejects unsupported track extensions", async () => {
    await expect(readTrackFile(new File(["data"], "track.fit"))).rejects.toThrow("GPX 或 KML");
  });

  it("accepts static photos and rejects animated/HEIC formats", () => {
    expect(() => validatePhotoFile(new File(["image"], "scene.webp", { type: "image/webp" }))).not.toThrow();
    expect(() => validatePhotoFile(new File(["image"], "scene.heic", { type: "image/heic" }))).toThrow("静态照片");
    expect(() => validatePhotoFile(new File(["image"], "scene.gif", { type: "image/gif" }))).toThrow("静态照片");
  });
});
