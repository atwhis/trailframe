import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrackData } from "../../../../packages/track-core/src/index.js";
import { TerrainPoster } from "./TerrainPoster.js";

const track: TrackData = {
  name: "晨跑",
  sourceFormat: "gpx",
  segments: [{ points: [{ lat: 31.2, lon: 121.4, elevation: 10 }, { lat: 31.21, lon: 121.41, elevation: 20 }] }],
  waypoints: [],
  dailySections: [],
  statistics: { distanceMeters: 1500, ascentMeters: 20, descentMeters: 10, maxElevationMeters: 20, durationMs: 3_600_000 },
};

afterEach(() => vi.unstubAllGlobals());

describe("TerrainPoster", () => {
  it("shows an API generation error without losing the workflow", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ mapConfigured: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "地图服务繁忙" }), { status: 503, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TerrainPoster track={track} />);
    await userEvent.click(screen.getByRole("button", { name: "生成地形轨迹海报" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("地图服务繁忙");
  });

  it("previews a generated poster and triggers a PNG download", async () => {
    const warnings = encodeURIComponent(JSON.stringify(["演示底图"]));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ mapConfigured: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), { status: 200, headers: { "content-type": "image/png", "x-trailframe-warnings": warnings } }));
    vi.stubGlobal("fetch", fetchMock);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<TerrainPoster track={track} />);
    await userEvent.click(screen.getByRole("button", { name: "生成地形轨迹海报" }));
    expect(await screen.findByAltText("生成的地形轨迹海报")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "下载 PNG" }));
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("sends Guidebook by default without requiring daily metadata", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ mapConfigured: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), { status: 200, headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TerrainPoster track={track} />);
    expect(screen.getByRole("button", { name: /Guidebook/ })).toHaveClass("active");
    await userEvent.click(screen.getByRole("button", { name: "生成地形轨迹海报" }));
    expect(await screen.findByAltText("生成的地形轨迹海报")).toBeInTheDocument();
    const request = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as { template: string; dailySections: unknown[]; waypoints: unknown[] };
    expect(body.template).toBe("guidebook");
    expect(body.dailySections).toEqual([]);
    expect(body.waypoints).toEqual([]);
  });

  it("keeps Modern explicitly selectable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ mapConfigured: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), { status: 200, headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TerrainPoster track={track} />);
    await userEvent.click(screen.getByRole("button", { name: /Modern/ }));
    await userEvent.click(screen.getByRole("button", { name: "生成地形轨迹海报" }));
    const request = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body)).template).toBe("modern");
  });
});
