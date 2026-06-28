import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect,it } from "vitest";

import { formatSize, getDirSize } from "../src/engine/size.js";

describe("formatSize", () => {
  it("formats zero bytes", () => {
    expect(formatSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1 KB");
    expect(formatSize(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatSize(1048576)).toBe("1.0 MB");
    expect(formatSize(5242880)).toBe("5.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatSize(1073741824)).toBe("1.0 GB");
    expect(formatSize(7851737088)).toBe("7.3 GB");
  });

  it("formats fractional values", () => {
    const result = formatSize(1572864); // 1.5 MB
    expect(result).toBe("1.5 MB");
  });
});

describe("getDirSize", () => {
  it("returns 0 for non-existent directory", async () => {
    const size = await getDirSize(path.join(os.tmpdir(), "devclean-nonexistent-" + Date.now()));
    expect(size).toBe(0);
  });

  it("calculates size of a real directory", async () => {
    const tmpDir = path.join(os.tmpdir(), "devclean-test-size-" + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });

    const content = "x".repeat(1000);
    await fs.writeFile(path.join(tmpDir, "file1.txt"), content);
    await fs.writeFile(path.join(tmpDir, "file2.txt"), content);

    const size = await getDirSize(tmpDir);
    expect(size).toBeGreaterThanOrEqual(2000);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("handles nested directories", async () => {
    const tmpDir = path.join(os.tmpdir(), "devclean-test-nested-" + Date.now());
    const subDir = path.join(tmpDir, "sub");
    await fs.mkdir(subDir, { recursive: true });

    await fs.writeFile(path.join(tmpDir, "a.txt"), "hello");
    await fs.writeFile(path.join(subDir, "b.txt"), "world");

    const size = await getDirSize(tmpDir);
    expect(size).toBeGreaterThanOrEqual(10);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
