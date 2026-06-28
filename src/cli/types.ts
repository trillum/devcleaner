import { z } from "zod";

import type { Category as DerivedCategory } from "../engine/scanTargets.js";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
} from "../engine/scanTargets.js";

export type Category = DerivedCategory;
export { ALL_CATEGORIES, CATEGORY_LABELS };

export const SubcategorySchema = z.enum(["global", "project"]);
export type Subcategory = z.infer<typeof SubcategorySchema>;

export const RiskLevelSchema = z.enum(["safe", "medium", "dangerous"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ScreenSchema = z.enum([
  "home", "scanning", "summary", "category", "info", "confirm", "progress", "done",
]);
export type Screen = z.infer<typeof ScreenSchema>;

export const ALL_SUBCATEGORIES: Subcategory[] = SubcategorySchema.options as unknown as Subcategory[];

export const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  global: "Global caches",
  project: "Project files",
};

export const ScanItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  size: z.number().nonnegative(),
  // category validity is guaranteed by the scan engine (keys of SCAN_TARGETS)
  category: z.string(),
  subcategory: SubcategorySchema,
  safe: z.boolean(),
  selected: z.boolean(),
  description: z.string(),
  risk: RiskLevelSchema,
});
export type ScanItem = {
  id: string;
  name: string;
  path: string;
  size: number;
  category: Category;
  subcategory: Subcategory;
  safe: boolean;
  selected: boolean;
  description: string;
  risk: RiskLevel;
};

export const DeletionResultSchema = z.object({
  id: z.string(),
  path: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  size: z.number(),
});
export type DeletionResult = z.infer<typeof DeletionResultSchema>;

export const DeletionReportSchema = z.object({
  results: z.array(DeletionResultSchema),
  totalReclaimed: z.number(),
  totalFailed: z.number(),
});
export type DeletionReport = z.infer<typeof DeletionReportSchema>;
