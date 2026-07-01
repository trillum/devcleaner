export interface CliArgs {
  /** -d <dir> : scan a specific directory */
  directory?: string;
  /** -a : scan home folder plus all non-OS drives */
  allDrives?: boolean;
}

// Minimal flag parser for the two scan-scope flags. Unknown flags are ignored
// so the TUI still launches; -d expects the next token as its path value.
export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;

    if (arg === "-d" || arg === "--directory") {
      const value = argv[i + 1];
      if (value === undefined) {
        // -d was the last token with no value; mark as empty so the caller
        // can report a usage error instead of silently scanning nothing
        args.directory = "";
      } else {
        args.directory = value;
        i++;
      }
    } else if (arg === "-a" || arg === "--all") {
      args.allDrives = true;
    }
  }

  return args;
}
