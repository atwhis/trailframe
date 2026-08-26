import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrackData } from "../../../../packages/track-core/src/index.js";

const stageToDataURL = vi.hoisted(() => vi.fn(() => "data:image/png;base64,poster"));

vi.mock("react-konva", async () => {
  const React = await import("react");
  return {
    Stage: React.forwardRef(function Stage({ children }: { children?: React.ReactNode }, ref) {
      React.useImperativeHandle(ref, () => ({ toDataURL: stageToDataURL }));
      return <div>{children}</div>;
    }),
    Layer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Group: ({ children, onDragEnd, x, y, opacity, rotation, scaleX, ...props }: { children?: React.ReactNode; onDragEnd?: (event: unknown) => void; x?: number; y?: number; opacity?: number; rotation?: number; scaleX?: number; [key: string]: unknown }) => <div data-testid={props["data-testid"] as string | undefined} data-x={x} data-y={y} data-opacity={opacity} data-rotation={rotation} data-scale={scaleX}>
      {onDragEnd && <button type="button" data-testid={`${String(props["data-testid"])}-drag`} onClick={() => onDragEnd({ target: { x: () => 120, y: () => 180 } })}>drag</button>}
      {children}
    </div>,
    Image: () => null,
    Line: () => null,
    Rect: () => null,
    Text: ({ text, fontSize, ...props }: { text: string; fontSize: number; [key: string]: unknown }) => <span data-testid={props["data-testid"] as string | undefined} data-font-size={fontSize}>{text}</span>,
  };
});

import { PhotoPoster } from "./PhotoPoster.js";

const track: TrackData = {
  name: "山野训练",
  sourceFormat: "gpx",
  segments: [{ points: [{ lat: 30, lon: 102, elevation: 1000 }, { lat: 30.02, lon: 102.03, elevation: 1240 }] }],
  waypoints: [],
  dailySections: [],
  statistics: { distanceMeters: 18_600, ascentMeters: 1_245, descentMeters: 800, maxElevationMeters: 1_240, durationMs: 16_318_000 },
};

describe("PhotoPoster statistics", () => {
  beforeEach(() => stageToDataURL.mockClear());

  it("renders every metric as a larger value above a smaller label", () => {
    render(<PhotoPoster track={track} />);
    const value = screen.getByTestId("metric-value-distance");
    const label = screen.getByTestId("metric-label-distance");
    expect(value).toHaveTextContent("18.6 km");
    expect(label).toHaveTextContent("总距离");
    expect(Number(value.dataset.fontSize)).toBeGreaterThan(Number(label.dataset.fontSize));
  });

  it("reflows metric blocks between vertical and horizontal layouts and supports subsets", async () => {
    const user = userEvent.setup();
    render(<PhotoPoster track={track} />);
    const distance = screen.getByTestId("metric-block-distance");
    const ascent = screen.getByTestId("metric-block-ascent");
    expect(distance.dataset.x).toBe("0");
    expect(ascent.dataset.x).toBe("0");
    expect(Number(ascent.dataset.y)).toBeGreaterThan(0);
    await user.selectOptions(screen.getByRole("combobox", { name: "布局" }), "horizontal");
    expect(screen.getByTestId("metric-block-ascent").dataset.y).toBe("0");
    expect(Number(screen.getByTestId("metric-block-ascent").dataset.x)).toBeGreaterThan(0);
    await user.click(screen.getByRole("checkbox", { name: "总耗时" }));
    expect(screen.queryByTestId("metric-block-duration")).not.toBeInTheDocument();
  });

  it("shows symmetric numeric transforms and synchronizes inputs with sliders", async () => {
    const user = userEvent.setup();
    render(<PhotoPoster track={track} />);
    for (const prefix of ["轨迹形状", "统计信息"]) {
      expect(screen.getByRole("slider", { name: `${prefix} X 位置` })).toBeInTheDocument();
      expect(screen.getByRole("spinbutton", { name: `${prefix} X 位置数值` })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: `${prefix} Y 位置` })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: `${prefix} 整体缩放` })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: `${prefix} 旋转` })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: `${prefix} 透明度` })).toBeInTheDocument();
    }
    const routeScale = screen.getByRole("spinbutton", { name: "轨迹形状 整体缩放数值" });
    await user.clear(routeScale);
    await user.type(routeScale, "80");
    fireEvent.blur(routeScale);
    expect(screen.getByRole<HTMLInputElement>("slider", { name: "轨迹形状 整体缩放" }).value).toBe("80");
    expect(screen.getByTestId("route-layer")).toHaveAttribute("data-scale", "0.8");
    const statsScale = screen.getByRole("spinbutton", { name: "统计信息 整体缩放数值" });
    await user.clear(statsScale);
    await user.type(statsScale, "80");
    fireEvent.blur(statsScale);
    expect(screen.getByRole<HTMLInputElement>("slider", { name: "统计信息 整体缩放" }).value).toBe("80");
    expect(screen.getByTestId("statistics-layer")).toHaveAttribute("data-scale", "0.8");
    expect(screen.getByRole("spinbutton", { name: "轨迹形状 线宽数值" })).toHaveValue(7);
    expect(screen.getByRole("spinbutton", { name: "统计信息 数值字号数值" })).toHaveValue(28);
  });

  it("clamps invalid numeric edits and synchronizes normalized drag positions", async () => {
    const user = userEvent.setup();
    render(<PhotoPoster track={track} />);
    const routeX = screen.getByRole<HTMLInputElement>("spinbutton", { name: "轨迹形状 X 位置数值" });
    await user.clear(routeX);
    await user.type(routeX, "999");
    fireEvent.blur(routeX);
    expect(routeX.value).toBe("96");
    await user.clear(routeX);
    fireEvent.blur(routeX);
    expect(routeX.value).toBe("96");
    await user.click(screen.getByTestId("statistics-layer-drag"));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "统计信息 X 位置数值" }).value).toBe("20");
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "统计信息 Y 位置数值" }).value).toBe("20");
  });

  it("applies statistics rotation and keeps layer opacity independent", async () => {
    const user = userEvent.setup();
    render(<PhotoPoster track={track} />);
    const routeOpacity = screen.getByRole<HTMLInputElement>("slider", { name: "轨迹形状 透明度" });
    const statsOpacity = screen.getByRole<HTMLInputElement>("slider", { name: "统计信息 透明度" });
    expect(routeOpacity.value).toBe("95");
    fireEvent.change(statsOpacity, { target: { value: "60" } });
    expect(screen.getByTestId("statistics-layer").dataset.opacity).toBe("0.6");
    expect(screen.getByTestId("route-layer").dataset.opacity).toBe("0.95");
    expect(routeOpacity.value).toBe("95");
    const rotation = screen.getByRole("spinbutton", { name: "统计信息 旋转数值" });
    await user.clear(rotation);
    await user.type(rotation, "35");
    fireEvent.blur(rotation);
    expect(screen.getByTestId("statistics-layer")).toHaveAttribute("data-rotation", "35");
  });

  it("exports the same composed stage at the 1600px high-resolution ratio", async () => {
    class LoadedImage {
      width = 1200;
      height = 1800;
      onload: (() => void) | null = null;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
    }
    vi.stubGlobal("Image", LoadedImage);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<PhotoPoster track={track} />);
    expect(screen.getByText("1600 × 2400 px")).toBeInTheDocument();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(["photo"], "mountain.jpg", { type: "image/jpeg" }));
    expect(await screen.findByText("更换背景照片")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: "统计信息 透明度" }), { target: { value: "60" } });
    await user.click(screen.getByRole("button", { name: "导出 1600 × 2400" }));
    expect(stageToDataURL).toHaveBeenCalledWith({ pixelRatio: 1600 / 600, mimeType: "image/png", quality: 0.92 });
    expect(screen.getByTestId("statistics-layer")).toHaveAttribute("data-opacity", "0.6");
    await user.selectOptions(screen.getByRole("combobox", { name: "导出格式" }), "jpeg");
    await user.click(screen.getByRole("button", { name: "导出 1600 × 2400" }));
    expect(stageToDataURL).toHaveBeenLastCalledWith({ pixelRatio: 1600 / 600, mimeType: "image/jpeg", quality: 0.92 });
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });
});
