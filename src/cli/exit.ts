// Wipes the running TUI from the screen and prints a single colored goodbye
// line before exiting, so the terminal is left clean on quit.
const RESET = "\x1B[0m";
const DARKISH_ORANGE = "\x1B[38;2;204;85;0m";

export function exitApp(code = 0): never {
  // clear screen + scrollback and move cursor home so only the goodbye remains
  process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
  process.stdout.write(
    `\n${DARKISH_ORANGE}Thank you for using devcleaner, see you soon!${RESET}\n`,
  );
  process.exit(code);
}
