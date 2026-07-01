import { Box, Text, useInput, useStdout } from "ink";
import React from "react";

import { formatSize } from "../../engine/size.js";
import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import ScrollList from "../components/ScrollList.js";
import Tabs from "../components/Tabs.js";
import { exitApp } from "../exit.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";
import { ALL_CATEGORIES } from "../types.js";

const MAX_VISIBLE = 10;
const MIN_VISIBLE = 2;
const FIXED_CHROME_ROWS = 11;
const LIST_HEADER_ROWS = 2;
const MARKER_ROWS = 2;

export default function CategoryScreen() {
  const {
    setScreen,
    selectedCategory,
    setSelectedCategory,
    activeSubcategory,
    setActiveSubcategory,
    cursor,
    setCursor,
    scrollOffset,
    setScrollOffset,
    toggleItem,
    getFilteredItems,
    getTotalSelected,
    getCategoryCounts,
    getSubcategoryCounts,
    setFocusedItemId,
    selectAllInCategory,
    deselectAllInCategory,
  } = useAppState();

  const items = getFilteredItems(selectedCategory, activeSubcategory);
  const { count, size } = getTotalSelected();
  const categoryCounts = getCategoryCounts();
  const subcategoryCounts = getSubcategoryCounts(selectedCategory);

  const nonEmpty = ALL_CATEGORIES.filter(
    (c) => (categoryCounts.get(c) || 0) > 0
  );

  const showSubHeaders =
    activeSubcategory === "all" &&
    subcategoryCounts.global > 0 &&
    subcategoryCounts.project > 0;

  const { stdout } = useStdout();
  const termRows = stdout?.rows ?? 24;
  const hasTabsSubcatRow =
    subcategoryCounts.global > 0 && subcategoryCounts.project > 0;
  const reservedRows =
    FIXED_CHROME_ROWS +
    (hasTabsSubcatRow ? 1 : 0) +
    (showSubHeaders ? LIST_HEADER_ROWS : 0) +
    MARKER_ROWS;
  const maxVisible = Math.max(
    MIN_VISIBLE,
    Math.min(MAX_VISIBLE, termRows - reservedRows),
  );

  useInput((input, key) => {
    if (input === "q" || input === "Q") {
      exitApp();
    }

    if (key.upArrow) {
      const next = Math.max(0, cursor - 1);
      setCursor(next);
      if (next < scrollOffset) setScrollOffset(next);
    }
    if (key.downArrow) {
      const max = Math.max(0, items.length - 1);
      const next = Math.min(max, cursor + 1);
      setCursor(next);
      if (next >= scrollOffset + maxVisible) setScrollOffset(next - maxVisible + 1);
    }

    if (key.leftArrow) {
      const idx = nonEmpty.indexOf(selectedCategory);
      if (idx > 0) {
        setSelectedCategory(nonEmpty[idx - 1]!);
        setCursor(0);
        setScrollOffset(0);
        setActiveSubcategory("all");
      }
    }
    if (key.rightArrow) {
      const idx = nonEmpty.indexOf(selectedCategory);
      if (idx >= 0 && idx < nonEmpty.length - 1) {
        setSelectedCategory(nonEmpty[idx + 1]!);
        setCursor(0);
        setScrollOffset(0);
        setActiveSubcategory("all");
      }
    }

    if (key.tab || input === "f" || input === "F") {
      if (subcategoryCounts.global > 0 && subcategoryCounts.project > 0) {
        const order = ["all", "global", "project"] as const;
        const idx = order.indexOf(activeSubcategory);
        const next = order[(idx + 1) % order.length]!;
        setActiveSubcategory(next);
        setCursor(0);
        setScrollOffset(0);
      }
    }

    if (input === " ") {
      if (items.length > 0 && items[cursor]) toggleItem(items[cursor]!.id);
    }

    if (input === "a" || input === "A") {
      const allSelected = items.every((i) => i.selected);
      if (allSelected) deselectAllInCategory(selectedCategory);
      else selectAllInCategory(selectedCategory);
    }

    if (input === "i" || input === "I") {
      if (items.length > 0 && items[cursor]) {
        setFocusedItemId(items[cursor]!.id);
        setScreen("info");
      }
    }

    if (input === "d" || input === "D") {
      if (count > 0) setScreen("confirm");
    }

    if (key.escape || key.backspace || key.delete) setScreen("summary");
  });

  return (
    <Box flexDirection="column">
      <Header title="browse" />

      <Tabs
        active={selectedCategory}
        onChange={(c) => {
          setSelectedCategory(c);
          setCursor(0);
          setScrollOffset(0);
          setActiveSubcategory("all");
        }}
        counts={categoryCounts}
        subcategory={activeSubcategory}
        subcategoryCounts={subcategoryCounts}
      />

      <ScrollList
        items={items}
        cursor={cursor}
        scrollOffset={scrollOffset}
        maxVisible={maxVisible}
        showSubcategory={showSubHeaders}
      />

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor color={COLORS.brandDim}>{"─".repeat(42)}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text bold color={COLORS.positive}>{count} selected</Text>
        <Text dimColor> ── </Text>
        <Text bold color={COLORS.positive}>{formatSize(size)}</Text>
        <Text dimColor> to reclaim</Text>
      </Box>

      <Footer
        hints={[
          "up/down move",
          "left/right tabs",
          "space toggle",
          "f filter",
          "a all",
          "i info",
          "d delete",
          "esc back",
        ]}
      />
    </Box>
  );
}
