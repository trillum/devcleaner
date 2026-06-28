import { Box, Text } from "ink";
import React from "react";

import { COLORS } from "../theme.js";

export default function Header({ title }: { title?: string }) {
  const line = "─".repeat(52);
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={COLORS.brandDim} dimColor>{line}</Text>
      <Text>
        <Text bold color={COLORS.brand}> devclean</Text>
        {title ? <Text dimColor> / {title}</Text> : null}
      </Text>
      <Text color={COLORS.brandDim} dimColor>{line}</Text>
    </Box>
  );
}
