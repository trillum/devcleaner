// Wipes the running TUI from the screen and prints a colored goodbye line
// (plus an optional cleanup summary) before exiting, so the terminal is left
// clean on quit.
const RESET = "\x1B[0m";
const DARKISH_ORANGE = "\x1B[38;2;204;85;0m";

// ANSI codes mirroring src/cli/theme.ts so the exit output matches the TUI.
const BOLD = "\x1B[1m";
const DIM = "\x1B[2m";
const GREEN = "\x1B[32m";
const MAGENTA = "\x1B[35m";
const RED = "\x1B[31m";

export interface CleanupSummary {
  reclaimed: number;
  deleted: number;
  failed: number;
}

// Optional teardown registered by index.tsx (the Ink render instance). When
// set, exitApp() unmounts the TUI before tearing the process down. This is
// required on Windows: while Ink is mounted it keeps stdin in raw mode, and
// calling process.exit() with it still attached leaves the console host
// mid-read, which prints "The system cannot find the path specified."
let unmountFn: (() => void) | null = null;

export function setAppUnmount(fn: (() => void) | null): void {
  unmountFn = fn;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

function buildSummary(s: CleanupSummary): string {
  const lines: string[] = [];
  lines.push(`${BOLD}${GREEN}Cleanup complete.${RESET}`);
  lines.push(
    `${DIM}reclaimed  ${RESET}${BOLD}${GREEN}${formatSize(s.reclaimed)}${RESET}`,
  );
  const itemWord = s.deleted === 1 ? "item" : "items";
  lines.push(
    `${DIM}deleted    ${RESET}${MAGENTA}${s.deleted} ${itemWord}${RESET}`,
  );
  if (s.failed > 0) {
    const failWord = s.failed === 1 ? "item" : "items";
    lines.push(
      `${DIM}failed     ${RESET}${RED}${s.failed} ${failWord}${RESET}`,
    );
  }
  return lines.join("\n");
}

export function exitApp(code = 0, summary?: CleanupSummary): never {
  // Restore terminal state first. Unmounting clears raw mode and any pending
  // render frame before we pull the process out from under the console host.
  if (unmountFn) {
    try {
      unmountFn();
    } catch {
      // ignore teardown errors during exit
    }
    unmountFn = null;
  }

  // clear screen + scrollback and move cursor home so only the goodbye (and
  // optional summary) remains
  process.stdout.write("\x1B[2J\x1B[3J\x1B[H");

  if (summary) {
    process.stdout.write(`\n${buildSummary(summary)}\n\n`);
  }
  process.stdout.write(
    `${DARKISH_ORANGE}Thank you for using devcleaner, see you soon!${RESET}\n`,
  );
  process.exit(code);
}
