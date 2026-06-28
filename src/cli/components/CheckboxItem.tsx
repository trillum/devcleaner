import { Text } from "ink";
import React from "react";

import { COLORS } from "../theme.js";
import type { RiskLevel } from "../types.js";

interface CheckboxItemProps {
  checked: boolean;
  label: string;
  sizeText: string;
  focused: boolean;
  risk: RiskLevel;
  subcategoryLabel?: string;
}

export default function CheckboxItem({
  checked,
  label,
  sizeText,
  focused,
  risk,
  subcategoryLabel,
}: CheckboxItemProps) {
  const pointer = focused ? ">" : " ";
  const box = checked ? "[x]" : "[ ]";

  const riskIndicator =
    risk === "dangerous" ? "!" : risk === "medium" ? "~" : "";

  return (
    <Text>
      <Text color={focused ? COLORS.brand : undefined}> {pointer} </Text>
      <Text color={checked ? COLORS.positive : undefined}>{box}</Text>
      <Text bold={focused}> {label}</Text>
      {subcategoryLabel ? (
        <Text dimColor> ({subcategoryLabel})</Text>
      ) : null}
      <Text dimColor> ── </Text>
      <Text bold color={COLORS.positive}>{sizeText}</Text>
      {riskIndicator ? (
        <Text color={risk === "dangerous" ? COLORS.danger : COLORS.accent}>
          {" "}
          {riskIndicator}
        </Text>
      ) : null}
    </Text>
  );
}
