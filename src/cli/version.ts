import fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// resolve package.json relative to this file so it works under both tsx (src/)
// and the built bundle (dist/)
const pkgPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "package.json"
);

let version = "0.0.0";
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (typeof pkg.version === "string") version = pkg.version;
} catch {
  // keep default if package.json is unreadable
}

export const VERSION = version;
