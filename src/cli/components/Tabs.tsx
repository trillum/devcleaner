import { Box, Text, useStdout } from "ink";
import React from "react";

import { COLORS } from "../theme.js";
import type { Category, Subcategory } from "../types.js";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../types.js";

interface TabsProps {
  active: Category;
  onChange: (c: Category) => void;
  counts?: Map<Category, number>;
  subcategory?: Subcategory | "all";
  subcategoryCounts?: { global: number; project: number };
}

interface TabInfo {
  cat: Category;
  label: string;
  count: number;
  // worst-case rendered width so the budget never overflows
  width: number;
}

function buildTabs(counts: Map<Category, number> | undefined): TabInfo[] {
  return ALL_CATEGORIES
    .map((cat) => {
      const label = CATEGORY_LABELS[cat];
      const count = counts?.get(cat) || 0;
      const countStr = count > 0 ? `(${count})` : "";
      // "  Label(count)  " inactive form is the widest a tab gets
      const width = 2 + label.length + (countStr ? 1 + countStr.length : 0) + 2;
      return { cat, label, count, width };
    })
    .filter((t) => t.count > 0);
}

// greedy window that always keeps the active tab visible and expands outward
// while staying within the character budget
function computeWindow(
  tabs: TabInfo[],
  activeIdx: number,
  budget: number
): { start: number; end: number; leftMore: boolean; rightMore: boolean } {
  const total = tabs.reduce((s, t) => s + t.width, 0);
  if (total <= budget) {
    return { start: 0, end: tabs.length, leftMore: false, rightMore: false };
  }

  // reserve room for both edge markers
  const avail = Math.max(8, budget - 4);
  let start = activeIdx;
  let end = activeIdx + 1;
  let w = tabs[activeIdx]!.width;

  while (start > 0 || end < tabs.length) {
    const leftFits = start > 0 && w + tabs[start - 1]!.width <= avail;
    const rightFits = end < tabs.length && w + tabs[end]!.width <= avail;
    if (!leftFits && !rightFits) break;

    // grow toward the side with more room to keep active roughly centered
    if (leftFits && rightFits) {
      const leftSlack = start;
      const rightSlack = tabs.length - end;
      if (leftSlack >= rightSlack) {
        start--;
        w += tabs[start]!.width;
      } else {
        w += tabs[end]!.width;
        end++;
      }
    } else if (leftFits) {
      start--;
      w += tabs[start]!.width;
    } else {
      w += tabs[end]!.width;
      end++;
    }
  }

  return { start, end, leftMore: start > 0, rightMore: end < tabs.length };
}

export default function Tabs({
  active,
  counts,
  subcategory,
  subcategoryCounts,
}: TabsProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 80;
  // padding for screen margins + footer alignment
  const budget = Math.max(20, columns - 2);

  const tabs = buildTabs(counts);
  const activeIdx = Math.max(0, tabs.findIndex((t) => t.cat === active));
  const { start, end, leftMore, rightMore } = computeWindow(tabs, activeIdx, budget);
  const visible = tabs.slice(start, end);

  const hasSubcategories =
    subcategoryCounts &&
    subcategoryCounts.global > 0 &&
    subcategoryCounts.project > 0;

  return (
    <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
      <Box>
        {leftMore && <Text color={COLORS.accent} bold>{"< "}</Text>}
        {visible.map((tab) => {
          const isActive = tab.cat === active;
          if (isActive) {
            return (
              <Text key={tab.cat} bold color={COLORS.brand}>
                {" [" + tab.label + "] "}
              </Text>
            );
          }
          return (
            <Text key={tab.cat}>
              {"  "}
              <Text color={COLORS.brandDim}>{tab.label}</Text>
              <Text dimColor color={COLORS.count}>({tab.count})</Text>
              {"  "}
            </Text>
          );
        })}
        {rightMore && <Text color={COLORS.accent} bold>{" >"}</Text>}
      </Box>

      {hasSubcategories && (
        <Box paddingLeft={1} marginTop={0}>
          <Text dimColor>filter: </Text>
          {(["all", "global", "project"] as const).map((s) => {
            const isActive = subcategory === s;
            const label =
              s === "all"
                ? "all"
                : s === "global"
                  ? `global(${subcategoryCounts!.global})`
                  : `project(${subcategoryCounts!.project})`;

            return (
              <Text key={s}>
                {isActive ? (
                  <Text bold>[{label}]</Text>
                ) : (
                  <Text dimColor> {label} </Text>
                )}
              </Text>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
