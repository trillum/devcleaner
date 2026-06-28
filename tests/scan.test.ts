import { describe, expect,it } from "vitest";

import { scan } from "../src/engine/scan.js";

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
});
