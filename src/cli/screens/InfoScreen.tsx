import { Box, Text, useInput } from "ink";
import React from "react";

import { formatSize } from "../../engine/size.js";
import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";
import { CATEGORY_LABELS, SUBCATEGORY_LABELS } from "../types.js";

const RISK_TEXT = {
  safe: "safe",
  medium: "caution",
  dangerous: "dangerous",
} as const;

const RISK_COLOR = {
  safe: COLORS.positive,
  medium: COLORS.accent,
  dangerous: COLORS.danger,
} as const;

export default function InfoScreen() {
  const { setScreen, scanItems, focusedItemId } = useAppState();
  const item = scanItems.find((i) => i.id === focusedItemId);

  useInput((_input, key) => {
    if (key.return || key.escape || key.backspace || _input) setScreen("category");
  });

  if (!item) {
    return (
      <Box flexDirection="column">
        <Header title="info" />
        <Box paddingLeft={1}>
          <Text>Item not found.</Text>
        </Box>
        <Footer hints={["any key to go back"]} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header title="info" />

      <Box flexDirection="column" paddingLeft={1}>
        <Text>
          <Text dimColor>{"name       "}</Text>
          <Text bold color={COLORS.brand}>{item.name}</Text>
        </Text>
        <Text>
          <Text dimColor>{"path       "}</Text>
          <Text>{item.path}</Text>
        </Text>
        <Text>
          <Text dimColor>{"size       "}</Text>
          <Text bold color={COLORS.positive}>{formatSize(item.size)}</Text>
        </Text>
        <Text>
          <Text dimColor>{"category   "}</Text>
          <Text color={COLORS.brandDim}>{CATEGORY_LABELS[item.category]}</Text>
        </Text>
        <Text>
          <Text dimColor>{"type       "}</Text>
          <Text>{SUBCATEGORY_LABELS[item.subcategory]}</Text>
        </Text>
        <Text>
          <Text dimColor>{"risk       "}</Text>
          <Text color={RISK_COLOR[item.risk]}>{RISK_TEXT[item.risk]}</Text>
        </Text>
        <Text>
          <Text dimColor>{"selected   "}</Text>
          <Text color={item.selected ? COLORS.positive : undefined}>
            {item.selected ? "yes" : "no"}
          </Text>
        </Text>
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor color={COLORS.muted}>{item.description}</Text>
      </Box>

      <Footer hints={["any key to go back"]} />
    </Box>
  );
}
