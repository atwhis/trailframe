import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-konva", () => ({
  Stage: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Layer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Image: () => null,
  Line: () => null,
  Rect: () => null,
  Text: () => null,
}));

import App from "./App.js";

const gpx = `<?xml version="1.0"?><gpx><trk><name>城市晨跑</name><trkseg><trkpt lat="31.20" lon="121.40"><ele>10</ele><time>2026-08-25T00:00:00Z</time></trkpt><trkpt lat="31.21" lon="121.42"><ele>30</ele><time>2026-08-25T01:00:00Z</time></trkpt></trkseg></trk></gpx>`;

describe("App", () => {
  it("shows the guided empty state", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /走过的路/ })).toBeInTheDocument();
    expect(screen.getByText("先从左侧导入一份轨迹")).toBeInTheDocument();
  });

  it("imports a GPX and exposes both poster modes", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = document.querySelector<HTMLInputElement>("#track-file")!;
    await user.upload(input, new File([gpx], "morning.gpx", { type: "application/gpx+xml" }));
    expect(await screen.findByText("城市晨跑")).toBeInTheDocument();
    expect(screen.getByText("轨迹已就绪")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /照片轨迹海报/ }));
    expect(await screen.findByText("让轨迹落在你的风景里")).toBeInTheDocument();
  });
});
