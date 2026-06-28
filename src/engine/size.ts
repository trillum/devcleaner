import * as path from "node:path";

import fs from "fs-extra";

export async function getDirSize(dirPath: string): Promise<number> {
  let total = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const BATCH_SIZE = 100;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const sizes = await Promise.all(
        batch.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          try {
            if (entry.isDirectory()) {
              return getDirSize(fullPath);
            } else if (entry.isFile()) {
              const stat = await fs.stat(fullPath);
              return stat.size;
            }
          } catch {
            // skip unreadable entries to avoid permission crashes
          }
          return 0;
        })
      );
      for (const s of sizes) total += s;
    }
  } catch {
    // skip unreadable directories to avoid permission crashes
  }

  return total;
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}
