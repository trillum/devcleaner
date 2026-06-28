import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect,it } from "vitest";

import type { ScanItem } from "../src/cli/types.js";
import { deleteItems } from "../src/engine/delete.js";

function makeTempItem(tmpDir: string, id: string): ScanItem {
  return {
    id,
    name: "test-item",
    path: tmpDir,
    size: 100,
    category: "misc",
    subcategory: "project",
    safe: true,
    selected: true,
    description: "test",
    risk: "safe",
  };
}

describe("deleteItems", () => {
  it("deletes a real directory", async () => {
    const dir = path.join(os.tmpdir(), "devclean-del-" + Date.now());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "f.txt"), "data");

    const item = makeTempItem(dir, "del-1");
    const report = await deleteItems([item]);

    expect(report.results).toHaveLength(1);
    expect(report.results[0]!.success).toBe(true);
    expect(report.totalReclaimed).toBe(100);
    expect(report.totalFailed).toBe(0);

    await expect(fs.stat(dir)).rejects.toThrow();
  });

  it("continues on failure without crashing", async () => {
    const nonexistent = path.join(os.tmpdir(), "devclean-nope-" + Date.now());
    const item = makeTempItem(nonexistent, "fail-1");

    const report = await deleteItems([item]);
    expect(report.results).toHaveLength(1);
    expect(report.results[0]!.success).toBe(true);
  });

  it("reports progress correctly", async () => {
    const dir1 = path.join(os.tmpdir(), "devclean-prog1-" + Date.now());
    const dir2 = path.join(os.tmpdir(), "devclean-prog2-" + Date.now());
    await fs.mkdir(dir1, { recursive: true });
    await fs.mkdir(dir2, { recursive: true });

    const items = [
      makeTempItem(dir1, "p1"),
      makeTempItem(dir2, "p2"),
    ];

    const progressCalls: number[] = [];
    await deleteItems(items, (p) => {
      progressCalls.push(p.current);
    });

    expect(progressCalls).toEqual([1, 2]);
  });

  it("handles batch with mixed results", async () => {
    const realDir = path.join(os.tmpdir(), "devclean-mixed-" + Date.now());
    await fs.mkdir(realDir, { recursive: true });
    await fs.writeFile(path.join(realDir, "x.txt"), "content");

    const items: ScanItem[] = [
      makeTempItem(realDir, "m1"),
    ];

    const report = await deleteItems(items);
    expect(report.totalFailed).toBe(0);
    expect(report.results[0]!.success).toBe(true);
  });
});
