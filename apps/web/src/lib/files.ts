import { parseTrack, type TrackData } from "../../../../packages/track-core/src/index.js";

export const TRACK_ACCEPT = ".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml";
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function fileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
}

export async function readTrackFile(file: File): Promise<TrackData> {
  if (file.size > 25 * 1024 * 1024) throw new Error("轨迹文件不能超过 25 MB");
  if (!/\.(gpx|kml)$/i.test(file.name)) throw new Error("请选择 GPX 或 KML 轨迹文件");
  return parseTrack(await fileText(file), file.name);
}

export function validatePhotoFile(file: File): void {
  if (file.size > 30 * 1024 * 1024) throw new Error("照片不能超过 30 MB");
  const supportedType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  const supportedName = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!supportedType || !supportedName) throw new Error("本 demo 仅支持 JPEG、PNG 和 WebP 静态照片");
}

export function downloadUrl(url: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
