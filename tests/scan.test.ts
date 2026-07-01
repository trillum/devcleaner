import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, describe, expect,it } from "vitest";

import { scan } from "../src/engine/scan.js";

const createdTmpDirs: string[] = [];

async function makeTempTree(): Promise<string> {
  const dir = path.join(os.tmpdir(), `devcleaner-excl-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(dir, { recursive: true });
  createdTmpDirs.push(dir);
  return dir;
}

async function plantNodeModules(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  // >1KB so the scan's size filter keeps it
  await fs.writeFile(path.join(dir, "blob.bin"), Buffer.alloc(4096, 0));
}

afterEach(async () => {
  await Promise.all(
    createdTmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })),
  );
});


describe("scan", () => {
  it("returns an array of ScanItems", async () => {
    const items = await scan();
    expect(Array.isArray(items)).toBe(true);
  }, 60000);

  it("each item has required fields", async () => {
    const items = await scan();

    for (const item of items.slice(0, 5)) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("path");
      expect(item).toHaveProperty("size");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("subcategory");
      expect(item).toHaveProperty("safe");
      expect(item).toHaveProperty("selected");
      expect(item).toHaveProperty("description");
      expect(item).toHaveProperty("risk");

      expect(typeof item.size).toBe("number");
      expect(item.size).toBeGreaterThan(0);
      expect(["global", "project"]).toContain(item.subcategory);
      expect(["safe", "medium", "dangerous"]).toContain(item.risk);
    }
  }, 60000);

  it("reports progress during scan", async () => {
    const phases: string[] = [];
    await scan((p) => {
      phases.push(p.phase);
    });

    expect(phases.length).toBeGreaterThan(0);
  }, 60000);

  it("items are sorted with global before project within categories", async () => {
    const items = await scan();

    const byCategory = new Map<string, string[]>();
    for (const item of items) {
      const arr = byCategory.get(item.category) || [];
      arr.push(item.subcategory);
      byCategory.set(item.category, arr);
    }

    for (const [, subs] of byCategory) {
      let seenProject = false;
      for (const sub of subs) {
        if (sub === "project") seenProject = true;
        if (seenProject && sub === "global") {
          // a global item after a project item would violate the sort order
          expect(true).toBe(false);
        }
      }
    }

    expect(items.length).toBeGreaterThanOrEqual(0);
  }, 60000);

  it("excludes editor extension installs and package manager installs", async () => {
    const root = await makeTempTree();

    // a normal project node_modules (should be found)
    await plantNodeModules(path.join(root, "myapp", "node_modules"));
    // node_modules inside a VS Code extension (must be excluded)
    await plantNodeModules(
      path.join(root, ".vscode", "extensions", "someext", "node_modules"),
    );
    // node_modules inside the pnpm global install (must be excluded)
    await plantNodeModules(
      path.join(root, "AppData", "Local", "pnpm", "global", "node_modules"),
    );

    const items = await scan(undefined, { directory: root });

    const nm = items.filter((i) => i.path.includes("node_modules"));
    expect(nm).toHaveLength(1);
    expect(nm[0]!.path).toContain("myapp");
    expect(nm[0]!.path).not.toContain(".vscode");
    expect(nm[0]!.path).not.toContain(path.join("pnpm", "global"));
  }, 60000);
});
