import * as fs from "node:fs";
import * as path from "node:path";

// Filesystem types that represent real, user-data volumes (skip pseudo/proc/sys).
const REAL_FS_TYPES = new Set([
  "ext2", "ext3", "ext4", "btrfs", "xfs", "zfs", "f2fs",
  "ntfs", "ntfs3", "vfat", "exfat", "fuseblk",
  "apfs", "hfs", "hfsplus", "msdos",
]);

function windowsDriveRoots(): string[] {
  const roots: string[] = [];
  // probe A:\ .. Z:\ for accessible volumes; skips empty removable drives
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const root = `${letter}:\\`;
    try {
      if (fs.existsSync(root)) roots.push(root);
    } catch {
      // ignore drives that error (e.g. no media in a removable drive)
    }
  }
  return roots;
}

function macVolumeRoots(): string[] {
  const roots: string[] = [];
  try {
    const entries = fs.readdirSync("/Volumes", { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) roots.push(path.join("/Volumes", entry.name));
    }
  } catch {
    // ignore if /Volumes is unreadable
  }
  return roots;
}

function linuxMountRoots(): string[] {
  const roots: string[] = [];
  const seen = new Set<string>();
  try {
    const content = fs.readFileSync("/proc/mounts", "utf8");
    for (const line of content.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      // /proc/mounts encodes spaces in mountpoints as \040
      const mountPoint = parts[1]!.replace(/\\040/g, " ");
      const fsType = parts[2]!;
      if (!REAL_FS_TYPES.has(fsType)) continue;
      if (seen.has(mountPoint)) continue;
      seen.add(mountPoint);
      roots.push(mountPoint);
    }
  } catch {
    // ignore if /proc/mounts is unreadable
  }
  return roots;
}

/** Returns the root path of every connected/mounted volume on the system. */
export function getAllDriveRoots(): string[] {
  if (process.platform === "win32") return windowsDriveRoots();
  if (process.platform === "darwin") return macVolumeRoots();
  if (process.platform === "linux") return linuxMountRoots();
  return [];
}

/**
 * Returns the volume root that contains `p` (e.g. "C:\\" on Windows, "/" or a
 * separate mountpoint like "/home" on unix). Used to identify the drive that
 * holds the home directory so it can be excluded from the -a drive sweep.
 */
export function getDriveRootOfPath(p: string): string {
  const resolved = path.resolve(p);

  if (process.platform === "win32") {
    return path.parse(resolved).root;
  }

  // unix: pick the deepest known mountpoint that is a prefix of the path
  const candidates = getAllDriveRoots().concat(["/"]);
  let best = "/";
  for (const mp of candidates) {
    const mpWithSep = mp.endsWith(path.sep) ? mp : mp + path.sep;
    const target = resolved.endsWith(path.sep) ? resolved : resolved + path.sep;
    if (target.startsWith(mpWithSep) && mp.length > best.length) {
      best = mp;
    }
  }
  return best;
}

/** Compares two volume roots for equality (case-insensitive on Windows). */
export function isSameDriveRoot(a: string, b: string): boolean {
  const normalize = (root: string): string => {
    const n = path.normalize(root).toLowerCase().replace(/[\\/]+$/, "");
    return n === "" ? path.sep : n;
  };
  return normalize(a) === normalize(b);
}

/** Short label for a volume root, used in scan progress messages. */
export function shortRootLabel(root: string): string {
  const cleaned = root.replace(/[\\/]+$/, "");
  return path.basename(cleaned) || root;
}
