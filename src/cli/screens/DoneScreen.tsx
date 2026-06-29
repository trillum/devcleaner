import { Box, Text } from "ink";
import React, { useEffect } from "react";

import { formatSize } from "../../engine/size.js";
import Header from "../components/Header.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";

export default function DoneScreen() {
  const { deletionReport } = useAppState();

  useEffect(() => {
    const t = setTimeout(() => {
      console.log("\nThank you for using devcleaner, see you soon!\n");
      process.exit(0);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const reclaimed = deletionReport?.totalReclaimed || 0;
  const failed = deletionReport?.totalFailed || 0;
  const total = deletionReport?.results.length || 0;
  const succeeded = total - failed;

  return (
    <Box flexDirection="column">
      <Header title="done" />

      <Box paddingLeft={1} marginBottom={1}>
        <Text bold color={COLORS.positive}>Cleanup complete.</Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1}>
        <Text>
          <Text dimColor>{"reclaimed  "}</Text>
          <Text bold color={COLORS.positive}>{formatSize(reclaimed)}</Text>
        </Text>
        <Text>
          <Text dimColor>{"deleted    "}</Text>
          <Text color={COLORS.count}>{succeeded} {succeeded === 1 ? "item" : "items"}</Text>
        </Text>
        {failed > 0 && (
          <Text>
            <Text dimColor>{"failed     "}</Text>
            <Text color={COLORS.danger}>{failed} {failed === 1 ? "item" : "items"}</Text>
          </Text>
        )}
      </Box>

      {failed > 0 && deletionReport && (
        <Box flexDirection="column" paddingLeft={1} marginTop={1}>
          <Text dimColor color={COLORS.danger}>Errors:</Text>
          {deletionReport.results
            .filter((r) => !r.success)
            .slice(0, 5)
            .map((r) => (
              <Text key={r.id} dimColor>
                {"  "}{r.path}: {r.error}
              </Text>
            ))}
        </Box>
      )}
    </Box>
  );
}
