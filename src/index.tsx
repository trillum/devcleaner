#!/usr/bin/env node
import { render } from "ink";
import React from "react";

import App from "./app.js";
import { AppStateProvider } from "./cli/hooks/useAppState.js";

// clear screen + scrollback and move cursor home before starting the TUI
process.stdout.write("\x1B[2J\x1B[3J\x1B[H");

render(
  React.createElement(AppStateProvider, null, React.createElement(App))
);
