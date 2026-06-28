import { Box, Text, useInput } from "ink";
import React from "react";

import { formatSize } from "../../engine/size.js";
import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";
import { type Category,CATEGORY_LABELS } from "../types.js";

export default function ConfirmScreen() {
  const { setScreen, getSelectedItems } = useAppState();
  const selected = getSelectedItems();

  const grouped = new Map<Category, { count: number; size: number }>();
  for (const item of selected) {
    const prev = grouped.get(item.category) || { count: 0, size: 0 };
    grouped.set(item.category, { count: prev.count + 1, size: prev.size + item.size });
  }

  const totalSize = selected.reduce((s, i) => s + i.size, 0);

  const hasNodeModules = selected.some(
    (i) => i.name.includes("node_modules") && !i.name.includes("cache")
  );
  const hasSystem = selected.some((i) => i.category === "system");
  const hasDangerous = selected.some((i) => i.risk === "dangerous");

  useInput((input) => {
    if (input === "y" || input === "Y") setScreen("progress");
    if (input === "n" || input === "N" || input === "q") setScreen("category");
  });

  if (selected.length === 0) {
    return (
      <Box flexDirection="column">
        <Header title="confirm" />
        <Box paddingLeft={1}>
          <Text>Nothing selected.</Text>
        </Box>
        <Footer hints={["n go back"]} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header title="confirm" />

      {(hasDangerous || hasNodeModules || hasSystem) && (
        <Box flexDirection="column" paddingLeft={1} marginBottom={1}>
          {hasDangerous && (
            <Text color={COLORS.danger}>
              ! Dangerous items selected. Double-check before confirming.
            </Text>
          )}
          {hasNodeModules && (
            <Text color={COLORS.accent}>
              ! node_modules selected -- reinstall needed after deletion.
            </Text>
          )}
          {hasSystem && (
            <Text color={COLORS.accent}>
              ! System/editor data selected -- may lose workspace settings.
            </Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" paddingLeft={1} marginBottom={1}>
        <Text bold>Will delete:</Text>
        <Text />
        {Array.from(grouped.entries()).map(([cat, info]) => (
          <Text key={cat}>
            {"  "}
            <Text color={COLORS.brandDim}>{CATEGORY_LABELS[cat].padEnd(10)}</Text>
            <Text bold color={COLORS.positive}>{formatSize(info.size).padStart(10)}</Text>
            <Text dimColor color={COLORS.count}>
              {"  " + info.count + (info.count === 1 ? " item" : " items")}
            </Text>
          </Text>
        ))}
      </Box>

      <Box paddingLeft={1}>
        <Text dimColor color={COLORS.brandDim}>{"  " + "─".repeat(30)}</Text>
      </Box>
      <Box paddingLeft={1} marginBottom={1}>
        <Text>
          {"  total     "}
          <Text bold color={COLORS.danger}>
            {formatSize(totalSize)}
          </Text>
        </Text>
      </Box>

      <Box paddingLeft={1}>
        <Text>
          {"Delete? "}
          <Text bold color={COLORS.accent}>y</Text>
          <Text dimColor>/</Text>
          <Text bold color={COLORS.brandDim}>n</Text>
        </Text>
      </Box>

      <Footer hints={["y confirm", "n cancel"]} />
    </Box>
  );
}
