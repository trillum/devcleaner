#!/usr/bin/env node
import { statSync } from "node:fs";

import { render } from "ink";

import App from "./app.js";
import { parseArgs } from "./cli/args.js";
import Centered from "./cli/components/Centered.js";
import { AppStateProvider } from "./cli/hooks/useAppState.js";

const args = parseArgs(process.argv);

if (args.directory !== undefined) {
  let isDir = false;
  if (args.directory !== "") {
    try {
      isDir = statSync(args.directory).isDirectory();
    } catch {
      isDir = false;
    }
  }
  if (!isDir) {
    process.stderr.write(
      `Error: -d requires an existing directory${
        args.directory ? `: ${args.directory}` : ""
      }\n`,
    );
    process.exit(1);
  }
}

const scanOptions = {
  directory: args.directory,
  allDrives: args.allDrives,
};

// clear screen + scrollback and move cursor home before starting the TUI
process.stdout.write("\x1B[2J\x1B[3J\x1B[H");

render(
  <AppStateProvider scanOptions={scanOptions}>
    <Centered>
      <App />
    </Centered>
  </AppStateProvider>,
);
