// Wipes the running TUI from the screen and prints a single colored goodbye
// line before exiting, so the terminal is left clean on quit.
const RESET = "\x1B[0m";
const DARKISH_ORANGE = "\x1B[38;2;204;85;0m";

// Optional teardown registered by index.tsx (the Ink render instance). When
// set, exitApp() unmounts the TUI before tearing the process down. This is
// required on Windows: while Ink is mounted it keeps stdin in raw mode, and
// calling process.exit() with it still attached leaves the console host
// mid-read, which prints "The system cannot find the path specified."
let unmountFn: (() => void) | null = null;

export function setAppUnmount(fn: (() => void) | null): void {
  unmountFn = fn;
}

export function exitApp(code = 0): never {
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

  // clear screen + scrollback and move cursor home so only the goodbye remains
  process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
  process.stdout.write(
    `\n${DARKISH_ORANGE}Thank you for using devcleaner, see you soon!${RESET}\n`,
  );
  process.exit(code);
}
