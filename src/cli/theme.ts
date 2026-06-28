// Shared color palette so the whole app stays visually consistent.
// To retint the app, change these values only.
export const COLORS = {
  brand: "cyan", // devclean word, dividers, focused cursor
  brandDim: "cyan", // used with dimColor for muted brand accents
  positive: "green", // sizes (reclaimable bytes), checked items, success
  count: "magenta", // item counts / numbers
  accent: "yellow", // key hints, largest marker, caution
  danger: "red", // dangerous totals / errors
  muted: "gray", // plain dim text fallback (dimColor is preferred)
} as const;
