import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function pngSize(file: string) {
  const buffer = readFileSync(path.join(root, file));
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("PWA assets", () => {
  it("publishes an installable manifest with logo icons", () => {
    const manifest = JSON.parse(readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8")) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      icons: { src: string; sizes: string; purpose?: string }[];
    };

    expect(manifest.name).toBe("Samul Bikers POS");
    expect(manifest.short_name).toBe("Samul Bikers");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"]),
    );
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    for (const icon of manifest.icons) {
      const [width, height] = icon.sizes.split("x").map(Number);
      expect(pngSize(icon.src.replace(/^\//, "public/"))).toEqual({ width, height });
    }
  });

  it("ships a favicon generated from the logo", () => {
    const favicon = readFileSync(path.join(root, "public/favicon.ico"));
    expect(favicon.readUInt16LE(0)).toBe(0);
    expect(favicon.readUInt16LE(2)).toBe(1);
    expect(favicon.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
    expect(pngSize("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("registers a service worker with a fetch handler", () => {
    const sw = readFileSync(path.join(root, "public/sw.js"), "utf8");
    expect(sw).toContain('addEventListener("install"');
    expect(sw).toContain('addEventListener("fetch"');
    expect(sw).toContain("/manifest.webmanifest");
  });
});
