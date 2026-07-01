import { Box, useStdout } from "ink";
import React, { useEffect, useState } from "react";

// Centers children horizontally and (when they fit) vertically. Uses minHeight
// instead of a fixed height so taller screens top-align instead of being
// clipped, keeping the top of the UI visible on small terminals. Re-measures
// on resize so the layout stays centered.
export default function Centered({ children }: { children: React.ReactNode }) {
  const { stdout } = useStdout();

  const [size, setSize] = useState(() => ({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  }));

  useEffect(() => {
    if (!stdout) return;
    const onResize = () =>
      setSize({
        columns: stdout.columns ?? 80,
        rows: stdout.rows ?? 24,
      });
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return (
    <Box
      width={size.columns}
      minHeight={size.rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
}
