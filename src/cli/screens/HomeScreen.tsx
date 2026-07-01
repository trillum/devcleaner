import { Box, Text, useInput } from "ink";
import React from "react";

import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import { exitApp } from "../exit.js";
import { useAppState } from "../hooks/useAppState.js";
import { COLORS } from "../theme.js";

export default function HomeScreen() {
  const { setScreen, scanStatus } = useAppState();

  useInput((input) => {
    if (input === "q" || input === "Q") {
      exitApp();
    }
    if (input === "s" || input === "S") {
      // scan runs in the background from app launch; jump to results if it's
      // already done, otherwise show the remaining progress on the scan screen
      setScreen(scanStatus === "done" ? "summary" : "scanning");
    }
  });

  return (
    <Box flexDirection="column">
      <Header />

      <Box flexDirection="column" paddingLeft={1}>
        <Text>Find and clean developer caches, build artifacts,</Text>
        <Text>and temporary files from your system.</Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1} marginTop={1}>
        <Text>
          <Text bold color={COLORS.accent}>s</Text>
          <Text dimColor> ─ </Text>
          <Text>scan your system</Text>
        </Text>
        <Text>
          <Text bold color={COLORS.accent}>q</Text>
          <Text dimColor> ─ </Text>
          <Text>quit</Text>
        </Text>
      </Box>

      <Box paddingLeft={1} marginTop={1}>
        <Text dimColor>
          Looks for node_modules, npm/pnpm/yarn caches, Rust
        </Text>
      </Box>
      <Box paddingLeft={1}>
        <Text dimColor>
          targets, __pycache__, pip cache, VS Code data, etc.
        </Text>
      </Box>

      <Footer hints={["s scan", "q quit"]} />
    </Box>
  );
}
