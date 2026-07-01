import { Box, Text, useInput } from "ink";
import React, { useState } from "react";

import { formatSize } from "../../engine/size.js";
import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import { exitApp } from "../exit.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
} from "../types.js";

export default function SummaryScreen() {
  const {
    setScreen,
    scanItems,
    getCategoryTotals,
    getLargestCategory,
    setSelectedCategory,
    setCursor,
    setScrollOffset,
    setActiveSubcategory,
  } = useAppState();

  const [cursor, setCursorLocal] = useState(0);
  const totals = getCategoryTotals();
  const largest = getLargestCategory();

  const activeCategories = ALL_CATEGORIES.filter(
    (cat) => (totals.get(cat) || 0) > 0
  );

  const totalSize = scanItems.reduce((sum, i) => sum + i.size, 0);

  useInput((input, key) => {
    if (input === "q" || input === "Q") {
      exitApp();
    }

    if (key.upArrow) setCursorLocal((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursorLocal((c) => Math.min(activeCategories.length - 1, c + 1));

    if (key.return) {
      if (activeCategories.length > 0) {
        setSelectedCategory(activeCategories[cursor] || largest);
        setCursor(0);
        setScrollOffset(0);
        setActiveSubcategory("all");
        setScreen("category");
      }
    }
  });

  if (scanItems.length === 0) {
    return (
      <Box flexDirection="column">
        <Header title="results" />
        <Box paddingLeft={1}>
          <Text>Nothing found. Your system looks clean.</Text>
        </Box>
        <Footer hints={["q quit"]} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header title="results" />

      <Box paddingLeft={1} marginBottom={1}>
        <Text>
          <Text bold color={COLORS.count}>{scanItems.length}</Text>
          <Text dimColor> items in </Text>
          <Text bold color={COLORS.count}>{activeCategories.length}</Text>
          <Text dimColor> categories</Text>
        </Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1}>
        {activeCategories.map((cat, i) => {
          const size = totals.get(cat) || 0;
          const isLargest = cat === largest;
          const focused = i === cursor;
          const count = scanItems.filter((x) => x.category === cat).length;

          return (
            <Text key={cat}>
              <Text color={focused ? COLORS.brand : undefined}>
                {focused ? " > " : "   "}
              </Text>
              <Text bold={focused} color={focused ? COLORS.brand : COLORS.brandDim}>
                {CATEGORY_LABELS[cat].padEnd(10)}
              </Text>
              <Text bold color={COLORS.positive}>{formatSize(size).padStart(10)}</Text>
              <Text dimColor color={COLORS.count}>
                {"  " + count + (count === 1 ? " item" : " items")}
              </Text>
              {isLargest ? <Text color={COLORS.accent}> *</Text> : null}
            </Text>
          );
        })}
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor color={COLORS.brandDim}>{"   " + "─".repeat(30)}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text>
          {"   total     "}
          <Text bold color={COLORS.positive}>{formatSize(totalSize).padStart(10)}</Text>
        </Text>
      </Box>

      <Footer hints={["up/down select", "enter open", "q quit"]} />
    </Box>
  );
}
