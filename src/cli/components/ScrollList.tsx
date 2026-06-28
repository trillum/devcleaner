import { Box, Text } from "ink";
import React from "react";

import { formatSize } from "../../engine/size.js";
import { COLORS } from "../theme.js";
import type { ScanItem } from "../types.js";
import { SUBCATEGORY_LABELS } from "../types.js";
import CheckboxItem from "./CheckboxItem.js";

interface ScrollListProps {
  items: ScanItem[];
  cursor: number;
  scrollOffset: number;
  maxVisible?: number;
  showSubcategory?: boolean;
}

const MAX_VISIBLE = 10;

export default function ScrollList({
  items,
  cursor,
  scrollOffset,
  maxVisible = MAX_VISIBLE,
  showSubcategory = false,
}: ScrollListProps) {
  if (items.length === 0) {
    return (
      <Box paddingLeft={2}>
        <Text dimColor>No items in this view.</Text>
      </Box>
    );
  }

  const visible = items.slice(scrollOffset, scrollOffset + maxVisible);
  const aboveCount = scrollOffset;
  const belowCount = Math.max(0, items.length - scrollOffset - maxVisible);

  return (
    <Box flexDirection="column">
      {aboveCount > 0 && (
        <Text color={COLORS.count} dimColor>   ^ {aboveCount} more</Text>
      )}

      {visible.map((item, i) => {
        const actualIndex = scrollOffset + i;
        const showHeader =
          showSubcategory &&
          (i === 0 || visible[i - 1]!.subcategory !== item.subcategory);

        return (
          <React.Fragment key={item.id}>
            {showHeader && (
              <Text color={COLORS.brandDim} dimColor bold>
                {"  ── " + SUBCATEGORY_LABELS[item.subcategory] + " ──"}
              </Text>
            )}
            <CheckboxItem
              checked={item.selected}
              label={item.name}
              sizeText={formatSize(item.size)}
              focused={actualIndex === cursor}
              risk={item.risk}
            />
          </React.Fragment>
        );
      })}

      {belowCount > 0 && (
        <Text color={COLORS.count} dimColor>   v {belowCount} more</Text>
      )}
    </Box>
  );
}
