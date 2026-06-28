import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect } from "react";

import Header from "../components/Header.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";

export default function ScanningScreen() {
  const { setScreen, scanPhase, scanFound, scanStatus } = useAppState();

  // scan is started on app launch; here we only watch for completion and move on
  useEffect(() => {
    if (scanStatus === "done") setScreen("summary");
  }, [scanStatus, setScreen]);

  return (
    <Box flexDirection="column">
      <Header title="scanning" />

      <Box paddingLeft={1}>
        <Text color={COLORS.brand}><Spinner type="dots" /> </Text>
        <Text>{scanPhase}</Text>
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor>
          <Text color={COLORS.count}>{scanFound}</Text>
          {" items found so far"}
        </Text>
      </Box>
    </Box>
  );
}
