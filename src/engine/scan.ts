import * as os from "node:os";
import * as path from "node:path";

import fg from "fast-glob";
import fs from "fs-extra";

import type { ScanItem } from "../cli/types.js";
import {
  getScanTargetsForPlatform,
  type ResolvedScanTarget,
} from "./scanTargets.js";
import { getDirSize } from "./size.js";

interface PlatformPaths {
  home: string;
  localAppData: string;
  appData: string;
  cache: string;
  config: string;
  library: string;
  cargo: string;
}

function getPlatformPaths(): PlatformPaths {
  const home = os.homedir();
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";

  return {
    home,
    // windows-only env dirs; "" elsewhere so token targets are skipped
    localAppData: isWin
      ? process.env.LOCALAPPDATA || path.join(home, "AppData", "Local")
      : "",
    appData: isWin
      ? process.env.APPDATA || path.join(home, "AppData", "Roaming")
      : "",
    cache: isMac
      ? path.join(home, "Library", "Caches")
      : isWin
        ? ""
        : path.join(home, ".cache"),
    // linux uses XDG config; mac/windows use other dirs via {library}/{appData}
    config: !isWin && !isMac ? path.join(home, ".config") : "",
    library: isMac ? path.join(home, "Library") : "",
    cargo: path.join(home, ".cargo"),
  };
}

function makeTokenExpander(paths: PlatformPaths) {
  const tokens: Record<string, string> = {
    "{home}": paths.home,
    "{localAppData}": paths.localAppData,
    "{appData}": paths.appData,
    "{cache}": paths.cache,
    "{config}": paths.config,
    "{library}": paths.library,
    "{cargo}": paths.cargo,
  };
  return (p: string): string =>
    p.replace(/\{[^}]+\}/g, (m) => tokens[m] ?? "");
}

async function isRustTarget(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    return (
      entries.includes("debug") ||
      entries.includes("release") ||
      entries.includes(".rustc_info.json") ||
      entries.includes("CACHEDIR.TAG")
    );
  } catch {
    return false;
  }
}

export interface ScanProgress {
  phase: string;
  found: number;
}

type ProgressCallback = (progress: ScanProgress) => void;

export async function scan(
  onProgress?: ProgressCallback
): Promise<ScanItem[]> {
  const paths = getPlatformPaths();
  const expandToken = makeTokenExpander(paths);
  const targets = getScanTargetsForPlatform(process.platform);
  const items: ScanItem[] = [];
  let idCounter = 0;

  for (const target of targets) {
    onProgress?.({
      phase: `Looking for ${target.name}...`,
      found: items.length,
    });

    for (const rawBase of target.baseDirs) {
      const baseDir = expandToken(rawBase);
      if (!baseDir || !(await fs.pathExists(baseDir))) continue;

      try {
        const isLiteral =
          target.patterns.length > 0 &&
          target.patterns.every((p) => !p.includes("*"));

        if (isLiteral) {
          for (const pattern of target.patterns) {
            const fullPath = path.join(baseDir, pattern);
            if (!(await fs.pathExists(fullPath))) continue;

            const stat = await fs.stat(fullPath);
            if (!stat.isDirectory()) continue;

            if (target.validate === "rust-target" && !(await isRustTarget(fullPath))) {
              continue;
            }

            const size = await getDirSize(fullPath);
            if (size < 1024) continue;

            items.push({
              id: `item-${idCounter++}`,
              name: target.name,
              path: fullPath,
              size,
              category: target.category,
              subcategory: target.subcategory,
              safe: target.safe,
              selected: target.safe,
              description: target.description,
              risk: target.risk,
            });
          }
        } else {
          const normalizedBase = baseDir.replace(/\\/g, "/");
          const globPatterns = target.patterns.map(
            (p) => `${normalizedBase}/${p}`
          );

          const matches = await fg(globPatterns, {
            onlyDirectories: true,
            deep: target.maxDepth || 3,
            followSymbolicLinks: false,
            suppressErrors: true,
            dot: true,
            ignore: ["**/node_modules/**/node_modules", "**/.git"],
          });

          for (const match of matches) {
            const normalPath = path.normalize(match);

            if (target.validate === "rust-target" && !(await isRustTarget(normalPath))) {
              continue;
            }

            onProgress?.({
              phase: `Sizing ${path.basename(path.dirname(normalPath))}/${path.basename(normalPath)}...`,
              found: items.length,
            });

            const size = await getDirSize(normalPath);
            if (size < 1024) continue;

            const parentName = path.basename(path.dirname(normalPath));
            items.push({
              id: `item-${idCounter++}`,
              name: `${target.name} (${parentName})`,
              path: normalPath,
              size,
              category: target.category,
              subcategory: target.subcategory,
              safe: target.safe,
              selected: target.safe,
              description: target.description,
              risk: target.risk,
            });
          }
        }
      } catch {
        // skip targets that fail due to permission or access errors
      }
    }
  }

  items.sort((a, b) => {
    if (a.category !== b.category) return 0;
    if (a.subcategory !== b.subcategory) {
      return a.subcategory === "global" ? -1 : 1;
    }
    return b.size - a.size;
  });

  return items;
}

// re-export for callers/tests that want the resolved list
export { getScanTargetsForPlatform, type ResolvedScanTarget };
