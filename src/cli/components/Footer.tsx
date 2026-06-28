import { Box, Text, useStdout } from "ink";
import React from "react";

import { COLORS } from "../theme.js";
import { VERSION } from "../version.js";

interface FooterProps {
  hints?: string[];
}

// splits "key rest" on the first space so the key can be highlighted
function renderHint(hint: string, i: number) {
  const spaceIdx = hint.indexOf(" ");
  if (spaceIdx === -1) {
    return <Text key={i} color={COLORS.accent} bold>{hint}</Text>;
  }
  const key = hint.slice(0, spaceIdx);
  const rest = hint.slice(spaceIdx);
  return (
    <Text key={i}>
      <Text color={COLORS.accent} bold>{key}</Text>
      <Text dimColor>{rest}</Text>
    </Text>
  );
}

export default function Footer({ hints }: FooterProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 80;

  const hintNodes =
    hints && hints.length > 0
      ? hints.map((h, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Text dimColor>  </Text>}
            {renderHint(h, i)}
          </React.Fragment>
        ))
      : null;

  return (
    <Box marginTop={1} paddingLeft={1} paddingRight={1}>
      {hintNodes}
      <Box flexGrow={1} />
      <Text dimColor color={COLORS.brandDim}>v{VERSION}</Text>
      {columns < 40 ? null : <Text> </Text>}
    </Box>
  );
}
