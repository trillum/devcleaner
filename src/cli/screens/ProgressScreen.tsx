import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import React, { useEffect, useState } from "react";

import { deleteItems } from "../../engine/delete.js";
import Header from "../components/Header.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";

export default function ProgressScreen() {
  const { setScreen, getSelectedItems, setDeletionReport } = useAppState();
  const selected = getSelectedItems();
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(selected.length);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    const run = async () => {
      const report = await deleteItems(selected, (p) => {
        setCurrent(p.current);
        setTotal(p.total);
        setCurrentName(p.currentName);
      });

      setDeletionReport(report);
      await new Promise((r) => setTimeout(r, 400));
      setScreen("done");
    };

    run();
    // run once on mount: selected is captured from initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const barW = 30;
  const filled = Math.round((pct / 100) * barW);

  return (
    <Box flexDirection="column">
      <Header title="cleaning" />

      <Box paddingLeft={1}>
        <Text color={COLORS.brand}><Spinner type="dots" /> </Text>
        <Text>deleting...</Text>
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text>
          [
          <Text color={COLORS.positive}>{"#".repeat(filled)}</Text>
          <Text dimColor>{"-".repeat(barW - filled)}</Text>
          ]{" "}
          <Text bold color={COLORS.positive}>{pct}%</Text>
        </Text>
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor>
          <Text color={COLORS.count}>{current}</Text>
          {`/${total} `}
          {currentName}
        </Text>
      </Box>
    </Box>
  );
}
