import { describe, expect,it } from "vitest";

import type { ScanItem } from "../src/cli/types.js";
import { ALL_CATEGORIES, ALL_SUBCATEGORIES, CATEGORY_LABELS, SUBCATEGORY_LABELS } from "../src/cli/types.js";

describe("types", () => {
  it("ALL_CATEGORIES contains all expected categories", () => {
    expect(ALL_CATEGORIES).toContain("node");
    expect(ALL_CATEGORIES).toContain("rust");
    expect(ALL_CATEGORIES).toContain("python");
    expect(ALL_CATEGORIES).toContain("docker");
    expect(ALL_CATEGORIES).toContain("go");
    expect(ALL_CATEGORIES).toContain("java");
    expect(ALL_CATEGORIES).toContain("swift");
    expect(ALL_CATEGORIES).toContain("android");
    expect(ALL_CATEGORIES).toContain("system");
    expect(ALL_CATEGORIES).toContain("misc");
    expect(ALL_CATEGORIES).toHaveLength(10);
  });

  it("ALL_SUBCATEGORIES has global and project", () => {
    expect(ALL_SUBCATEGORIES).toContain("global");
    expect(ALL_SUBCATEGORIES).toContain("project");
    expect(ALL_SUBCATEGORIES).toHaveLength(2);
  });

  it("CATEGORY_LABELS maps all categories", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof CATEGORY_LABELS[cat]).toBe("string");
    }
  });

  it("SUBCATEGORY_LABELS maps all subcategories", () => {
    for (const sub of ALL_SUBCATEGORIES) {
      expect(SUBCATEGORY_LABELS[sub]).toBeDefined();
    }
  });

  it("ScanItem can be constructed with all required fields", () => {
    const item: ScanItem = {
      id: "test-1",
      name: "test",
      path: "/tmp/test",
      size: 1024,
      category: "node",
      subcategory: "project",
      safe: true,
      selected: false,
      description: "A test item",
      risk: "safe",
    };

    expect(item.id).toBe("test-1");
    expect(item.subcategory).toBe("project");
    expect(item.risk).toBe("safe");
  });
});
