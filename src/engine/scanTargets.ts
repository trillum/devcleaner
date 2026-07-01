// Single source of truth for categories + scan targets.
// To add a category: add a key here. To add a target: append to its `targets`.
// `Category`, ALL_CATEGORIES and CATEGORY_LABELS are derived from this object,
// so nothing else needs editing.
//
// baseDirs may use tokens that the engine resolves per-platform:
//   {home}          user home (all platforms)
//   {localAppData}  %LOCALAPPDATA%        (windows only)
//   {appData}       %APPDATA% (roaming)   (windows only)
//   {cache}         ~/Library/Caches (mac) | ~/.cache (linux) | "" (windows)
//   {config}        ~/.config (linux) | "" (mac uses {library}, windows uses {appData})
//   {library}       ~/Library (mac) | "" (other)
//   {cargo}         ~/.cargo (all platforms)
// Tokens that resolve to "" on a platform are skipped automatically, but pairing
// platform-specific paths with a `platform` filter is clearer and avoids surprises.
import type { RiskLevel,Subcategory } from "../cli/types.js";

export type Platform = "win" | "darwin" | "linux" | "unix";

export interface ScanTargetDef {
  name: string;
  description: string;
  patterns: string[];
  baseDirs: string[];
  risk: RiskLevel;
  safe: boolean;
  subcategory: Subcategory;
  /** restrict to an OS; omit to run on all platforms */
  platform?: Platform;
  maxDepth?: number;
  /** optional directory validator: confirm a match really belongs to a toolchain/project */
  validate?: "rust-target" | "unity-project" | "unreal-project" | "godot-project";
  /**
   * Per-target glob/path exclusions. For traversal (glob) targets these are
   * passed to fast-glob's `ignore`; for literal targets they are matched as
   * path fragments. Use these to skip a specific sub-tree this target would
   * otherwise match (e.g. a `node_modules` inside an editor extensions dir).
   */
  exclude?: string[];
}

export interface CategoryDef {
  label: string;
  targets: ScanTargetDef[];
}

/**
 * Paths that must NEVER be touched by traversal-based (glob) scans, even though
 * they may contain matching folders like `node_modules`, `dist` or `build`.
 * These are application/toolchain installs whose deletion breaks the tool
 * itself (e.g. wiping a VS Code extension's bundled deps, or pnpm's global
 * install).
 *
 * Applied only to glob targets. Literal cache targets (e.g. the pnpm *store*)
 * still run, since those point at a single re-creatable cache folder by design.
 */
export const GLOBAL_EXCLUDES: string[] = [
  // Editor / IDE extension installs: their bundled node_modules/build/dist
  // must not be touched or the extensions break.
  "**/.vscode/extensions/**",
  "**/.vscode-insiders/extensions/**",
  "**/.vscode-server/extensions/**",
  "**/.vscode-oss/extensions/**",
  "**/.cursor/extensions/**",
  // Package manager installs / global installs: traversal scans must not
  // descend into these or the toolchain and its globally installed packages
  // get wiped. Explicit cache targets (pnpm store, npm-cache, ...) are
  // unaffected since they are literal, not globbed.
  "**/AppData/Local/pnpm/**",
  "**/AppData/Roaming/npm/**",
  "**/AppData/Local/Yarn/**",
  "**/Library/pnpm/**",
];

export const SCAN_TARGETS = {
  node: {
    label: "Node.js",
    targets: [
      {
        name: "node_modules",
        description:
          "NPM dependency folder. Reinstall with npm/pnpm/yarn/bun install.",
        patterns: ["**/node_modules"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Next.js cache",
        description: "Next.js build cache. Rebuilt on next dev/build.",
        patterns: ["**/.next/cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Turborepo cache",
        description: "Turborepo local task cache.",
        patterns: ["**/.turbo"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Vite cache",
        description: "Vite pre-bundled dependency cache. Rebuilt on next start.",
        patterns: ["**/node_modules/.vite"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 6,
      },
      {
        name: "Nuxt build",
        description: "Nuxt generated build output. Regenerated on next build.",
        patterns: ["**/.nuxt"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "SvelteKit build",
        description: "SvelteKit generated output.",
        patterns: ["**/.svelte-kit"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Astro cache",
        description: "Astro build cache.",
        patterns: ["**/.astro"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Parcel cache",
        description: "Parcel bundler cache.",
        patterns: ["**/.parcel-cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Bundler cache",
        description:
          "Generic node_modules/.cache (babel, terser, webpack, etc.). Regenerated.",
        patterns: ["**/node_modules/.cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 6,
      },
      {
        name: "Expo cache",
        description: "Expo build artifacts and cache.",
        patterns: ["**/.expo"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Docusaurus cache",
        description: "Docusaurus build cache.",
        patterns: ["**/.docusaurus"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "Angular cache",
        description: "Angular CLI cache.",
        patterns: ["**/.angular/cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 6,
      },
      {
        name: "Coverage reports",
        description: "Test coverage output (istanbul/nyc/c8). Regenerated on next run.",
        patterns: ["**/coverage"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "nyc output",
        description: "Istanbul/nyc coverage cache.",
        patterns: ["**/.nyc_output"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "npm cache",
        description: "Global npm download cache. Re-downloaded as needed.",
        patterns: ["npm-cache"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "npm cache",
        description: "Global npm download cache. Re-downloaded as needed.",
        patterns: ["_cacache", "npm"],
        baseDirs: ["{home}/.npm"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "npm logs",
        description: "npm command log files.",
        patterns: ["_logs"],
        baseDirs: ["{home}/.npm"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "yarn cache",
        description: "Yarn package cache.",
        patterns: ["Yarn/Cache", "yarn/cache"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "yarn cache",
        description: "Yarn package cache.",
        patterns: ["cache"],
        baseDirs: ["{home}/.yarn"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "bun install cache",
        description: "Bun global package cache.",
        patterns: ["install/cache"],
        baseDirs: ["{home}/.bun"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "deno cache",
        description: "Deno remote module cache. Re-fetched as needed.",
        patterns: ["deno"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "deno cache",
        description: "Deno remote module cache. Re-fetched as needed.",
        patterns: ["deno"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
    ],
  },

  rust: {
    label: "Rust",
    targets: [
      {
        name: "Rust target",
        description:
          "Cargo build output. Rebuilt on next cargo build. Often very large.",
        patterns: ["**/target"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: true,
        subcategory: "project",
        maxDepth: 4,
        validate: "rust-target",
      },
      {
        name: "cargo registry cache",
        description: "Cached crate downloads.",
        patterns: ["registry/cache"],
        baseDirs: ["{cargo}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "cargo registry src",
        description: "Extracted crate sources. Re-extracted on demand.",
        patterns: ["registry/src"],
        baseDirs: ["{cargo}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "cargo git checkouts",
        description: "Checked-out git dependencies. Re-fetched on demand.",
        patterns: ["git/checkouts"],
        baseDirs: ["{cargo}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "sccache cache",
        description: "sccache compilation cache.",
        patterns: ["sccache"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "rustup toolchains",
        description:
          "Installed Rust toolchains. Deleting forces a full re-download.",
        patterns: ["toolchains"],
        baseDirs: ["{home}/.rustup"],
        risk: "dangerous",
        safe: false,
        subcategory: "global",
      },
    ],
  },

  python: {
    label: "Python",
    targets: [
      {
        name: "__pycache__",
        description: "Bytecode cache. Auto-regenerated by Python.",
        patterns: ["**/__pycache__"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 6,
      },
      {
        name: "pytest cache",
        description: "Pytest result cache.",
        patterns: ["**/.pytest_cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "mypy cache",
        description: "Mypy type checking cache.",
        patterns: ["**/.mypy_cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "ruff cache",
        description: "Ruff linter/formatter cache.",
        patterns: ["**/.ruff_cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "tox envs",
        description: "tox virtualenvs. Recreated on next tox run.",
        patterns: ["**/.tox"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "nox envs",
        description: "nox virtualenvs. Recreated on next nox run.",
        patterns: ["**/.nox"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "setuptools eggs",
        description: "Setuptools .eggs build output.",
        patterns: ["**/.eggs"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "virtualenv (.venv)",
        description:
          "Project virtualenv. Recreate with your dependency manager before use.",
        patterns: ["**/.venv"],
        baseDirs: ["{home}"],
        risk: "dangerous",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "virtualenv (venv)",
        description:
          "Project virtualenv. Recreate with your dependency manager before use.",
        patterns: ["**/venv"],
        baseDirs: ["{home}"],
        risk: "dangerous",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "pip cache",
        description: "pip download and wheel cache.",
        patterns: ["pip/Cache"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "pip cache",
        description: "pip download and wheel cache.",
        patterns: ["pip", "pip3"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "pipenv cache",
        description: "pipenv cache.",
        patterns: ["pipenv"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "poetry cache",
        description: "Poetry cache.",
        patterns: ["pypoetry"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "poetry cache",
        description: "Poetry cache.",
        patterns: ["pypoetry"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "conda packages",
        description: "Conda package cache. Re-downloaded as needed.",
        patterns: ["pkgs"],
        baseDirs: ["{home}/.conda", "{home}/anaconda3", "{home}/miniconda3"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "conda packages",
        description: "Conda package cache. Re-downloaded as needed.",
        patterns: ["miniconda3/pkgs", "anaconda3/pkgs"],
        baseDirs: ["{home}", "{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "pyenv versions",
        description: "Installed Python versions. Reinstall with pyenv install.",
        patterns: ["versions"],
        baseDirs: ["{home}/.pyenv"],
        risk: "dangerous",
        safe: false,
        subcategory: "global",
      },
    ],
  },

  docker: {
    label: "Docker",
    targets: [
      {
        name: "Docker Desktop VM disk",
        description:
          "Docker Desktop VM data (images/containers/volumes). Deleting wipes ALL of them.",
        patterns: ["vms"],
        baseDirs: ["{library}/Containers/com.docker.docker/Data"],
        risk: "dangerous",
        safe: false,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Docker Desktop cache",
        description: "Docker Desktop cache and logs.",
        patterns: ["cache", "log"],
        baseDirs: ["{library}/Containers/com.docker.docker/Data"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Docker Desktop logs",
        description: "Docker Desktop log files.",
        patterns: ["log"],
        baseDirs: ["{localAppData}/Docker"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Docker Desktop cache",
        description: "Docker Desktop cache.",
        patterns: ["cache"],
        baseDirs: ["{localAppData}/Docker"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
    ],
  },

  go: {
    label: "Go",
    targets: [
      {
        name: "go build cache",
        description: "go-build cache. Cleared with `go clean -cache`.",
        patterns: ["go-build"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "go build cache",
        description: "go-build cache. Cleared with `go clean -cache`.",
        patterns: ["go-build"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "go mod cache",
        description: "Downloaded module cache (GOPATH/pkg/mod). Re-downloaded on demand.",
        patterns: ["pkg/mod"],
        baseDirs: ["{home}/go"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
    ],
  },

  java: {
    label: "Java",
    targets: [
      {
        name: "Maven repository",
        description: "Local Maven dependency cache (~/.m2/repository). Re-downloaded on build.",
        patterns: ["repository"],
        baseDirs: ["{home}/.m2"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "Gradle caches",
        description: "Gradle dependency and transform caches.",
        patterns: ["caches"],
        baseDirs: ["{home}/.gradle"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "Gradle wrapper dists",
        description: "Downloaded Gradle distributions.",
        patterns: ["wrapper/dists"],
        baseDirs: ["{home}/.gradle"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
      {
        name: "Ivy cache",
        description: "Apache Ivy dependency cache.",
        patterns: ["cache"],
        baseDirs: ["{home}/.ivy2"],
        risk: "safe",
        safe: true,
        subcategory: "global",
      },
    ],
  },

  swift: {
    label: "Swift",
    targets: [
      {
        name: "Xcode DerivedData",
        description: "Xcode build output. Regenerated on next build. Often very large.",
        patterns: ["DerivedData"],
        baseDirs: ["{library}/Developer/Xcode"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Xcode DeviceSupport",
        description: "iOS/watchOS device support files. Re-copied when a device connects.",
        patterns: ["iOS DeviceSupport", "watchOS DeviceSupport"],
        baseDirs: ["{library}/Developer/Xcode"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "CoreSimulator caches",
        description: "Simulator runtime caches.",
        patterns: ["Caches"],
        baseDirs: ["{library}/Developer/CoreSimulator"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "SwiftPM cache",
        description: "Swift Package Manager cache.",
        patterns: ["org.swift.swiftpm"],
        baseDirs: ["{library}/Caches"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "SwiftPM cache",
        description: "Swift Package Manager cache.",
        patterns: ["org.swift.swiftpm"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "linux",
      },
      {
        name: "CocoaPods cache",
        description: "CocoaPods spec/repo cache.",
        patterns: ["CocoaPods"],
        baseDirs: ["{library}/Caches"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
    ],
  },

  android: {
    label: "Android",
    targets: [
      {
        name: "Android Studio cache",
        description: "Android Studio caches.",
        patterns: ["AndroidStudio*"],
        baseDirs: ["{library}/Caches/Google"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Android Studio cache",
        description: "Android Studio caches.",
        patterns: ["AndroidStudio*"],
        baseDirs: ["{localAppData}/Google"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Android Studio cache",
        description: "Android Studio caches.",
        patterns: ["AndroidStudio*"],
        baseDirs: ["{cache}/Google"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "linux",
      },
    ],
  },

  system: {
    label: "System",
    targets: [
      {
        name: "VS Code workspace storage",
        description: "VS Code workspace data. May contain workspace-specific settings.",
        patterns: ["Code/User/workspaceStorage"],
        baseDirs: ["{appData}"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "VS Code workspace storage",
        description: "VS Code workspace data. May contain workspace-specific settings.",
        patterns: ["workspaceStorage"],
        baseDirs: ["{config}/Code/User", "{library}/Application Support/Code/User"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "VS Code cache",
        description: "VS Code cached data. Rebuilt on next launch.",
        patterns: ["Code/Cache", "Code/CachedData", "Code/CachedExtensions", "Code/CachedExtensionVSIXs"],
        baseDirs: ["{appData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "VS Code cache",
        description: "VS Code cached data. Rebuilt on next launch.",
        patterns: ["Cache", "CachedData", "CachedExtensions", "CachedExtensionVSIXs"],
        baseDirs: ["{config}/Code", "{library}/Application Support/Code"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "VS Code logs",
        description: "VS Code log files.",
        patterns: ["Code/logs"],
        baseDirs: ["{appData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "VS Code logs",
        description: "VS Code log files.",
        patterns: ["logs"],
        baseDirs: ["{config}/Code", "{library}/Application Support/Code"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "VS Code crashpad",
        description: "VS Code crash reports.",
        patterns: ["Code/Crashpad"],
        baseDirs: ["{appData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "VS Code crashpad",
        description: "VS Code crash reports.",
        patterns: ["Crashpad"],
        baseDirs: ["{config}/Code", "{library}/Application Support/Code"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "Temp folder",
        description: "OS temp directory. May contain files in use by running apps.",
        patterns: ["Temp"],
        baseDirs: ["{localAppData}"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Temp folder",
        description: "OS /tmp directory. May contain files in use by running apps.",
        patterns: ["tmp"],
        baseDirs: ["/"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "Trash",
        description: "User trash. Empties the trash.",
        patterns: [".Trash"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "unix",
      },
      {
        name: "Homebrew cache",
        description: "Homebrew download cache.",
        patterns: ["Homebrew"],
        baseDirs: ["{library}/Caches"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Logs folder",
        description: "Per-user application logs.",
        patterns: ["Logs"],
        baseDirs: ["{library}"],
        risk: "medium",
        safe: false,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Chrome cache",
        description: "Google Chrome cache for the default profile.",
        patterns: ["Cache", "Code Cache", "GPUCache"],
        baseDirs: ["{localAppData}/Google/Chrome/User Data/Default"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Chrome cache",
        description: "Google Chrome cache for the default profile.",
        patterns: ["Cache"],
        baseDirs: ["{library}/Caches/Google/Chrome/Default"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Edge cache",
        description: "Microsoft Edge cache for the default profile.",
        patterns: ["Cache", "Code Cache", "GPUCache"],
        baseDirs: ["{localAppData}/Microsoft/Edge/User Data/Default"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Firefox cache",
        description: "Firefox cache.",
        patterns: ["mozilla", "Firefox"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "unix",
      },
    ],
  },

  misc: {
    label: "Misc",
    targets: [
      {
        name: "project .cache",
        description: "Generic project cache dir (babel, etc.). Regenerates.",
        patterns: ["**/.cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "dist",
        description: "Build output. May be needed for deploys; rebuild to restore.",
        patterns: ["**/dist"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "build",
        description: "Build output. May be needed; rebuild to restore.",
        patterns: ["**/build"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "out",
        description: "Compiler/bundler output dir.",
        patterns: ["**/out"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
      },
      {
        name: "sass cache",
        description: "Sass/SCSS cache.",
        patterns: ["**/.sass-cache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
      },
    ],
  },

  unity: {
    label: "Unity",
    targets: [
      {
        name: "Unity Library",
        description:
          "Unity asset import cache. Regenerates on next editor open. Often very large.",
        patterns: ["**/Library"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: false,
        subcategory: "project",
        maxDepth: 5,
        validate: "unity-project",
      },
      {
        name: "Unity cache",
        description: "Global Unity package/asset cache. Re-downloaded as needed.",
        patterns: ["Unity/cache"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Unity cache",
        description: "Global Unity package/asset cache. Re-downloaded as needed.",
        patterns: ["cache"],
        baseDirs: ["{library}/Unity"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Unity cache",
        description: "Global Unity package/asset cache. Re-downloaded as needed.",
        patterns: ["unity3d"],
        baseDirs: ["{cache}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "linux",
      },
    ],
  },

  unreal: {
    label: "Unreal Engine",
    targets: [
      {
        name: "Unreal Intermediate",
        description:
          "UE build intermediates. Regenerates on next build. Can be very large.",
        patterns: ["**/Intermediate"],
        baseDirs: ["{home}"],
        risk: "medium",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
        validate: "unreal-project",
      },
      {
        name: "Unreal DerivedDataCache",
        description: "UE project derived data cache. Regenerates on demand.",
        patterns: ["**/DerivedDataCache"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
        validate: "unreal-project",
      },
      {
        name: "Unreal global DDC",
        description: "UE shared derived data cache.",
        patterns: ["UnrealEngine/Common/DerivedDataCache"],
        baseDirs: ["{localAppData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Unreal global DDC",
        description: "UE shared derived data cache.",
        patterns: ["Epic/UnrealEngine/Common/DerivedDataCache"],
        baseDirs: ["{library}/Application Support"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Unreal global DDC",
        description: "UE shared derived data cache.",
        patterns: ["Epic/UnrealEngine/Common/DerivedDataCache"],
        baseDirs: ["{config}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "linux",
      },
    ],
  },

  godot: {
    label: "Godot",
    targets: [
      {
        name: "Godot import cache",
        description: "Godot 4 .godot import cache. Regenerates on editor open.",
        patterns: ["**/.godot"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
        validate: "godot-project",
      },
      {
        name: "Godot 3 import cache",
        description: "Godot 3 .import cache. Regenerates on editor open.",
        patterns: ["**/.import"],
        baseDirs: ["{home}"],
        risk: "safe",
        safe: true,
        subcategory: "project",
        maxDepth: 5,
        validate: "godot-project",
      },
    ],
  },

  video: {
    label: "Video editors",
    targets: [
      {
        name: "After Effects disk cache",
        description:
          "AE rendered frame cache. Regenerated during playback/render.",
        patterns: [
          "Adobe/After Effects/Disk Cache",
          "Adobe/After Effects/*/Disk Cache",
        ],
        baseDirs: ["{appData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "After Effects disk cache",
        description:
          "AE rendered frame cache. Regenerated during playback/render.",
        patterns: ["Adobe/After Effects"],
        baseDirs: ["{library}/Caches"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
      {
        name: "Adobe media cache",
        description:
          "Shared Adobe media cache (Premiere Pro / After Effects). Rebuilt on demand.",
        patterns: ["Adobe/Common/Media Cache", "Adobe/Common/Media Cache Files"],
        baseDirs: ["{appData}"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "win",
      },
      {
        name: "Adobe media cache",
        description:
          "Shared Adobe media cache (Premiere Pro / After Effects). Rebuilt on demand.",
        patterns: ["Adobe/Common/Media Cache", "Adobe/Common/Media Cache Files"],
        baseDirs: ["{library}/Application Support"],
        risk: "safe",
        safe: true,
        subcategory: "global",
        platform: "darwin",
      },
    ],
  },
} satisfies Record<string, CategoryDef>;

export type Category = keyof typeof SCAN_TARGETS;
export const ALL_CATEGORIES: Category[] = Object.keys(SCAN_TARGETS) as Category[];
export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c, SCAN_TARGETS[c].label])
) as Record<Category, string>;

export interface ResolvedScanTarget extends ScanTargetDef {
  category: Category;
}

export function getScanTargetsForPlatform(
  platform: NodeJS.Platform
): ResolvedScanTarget[] {
  const osKey: "win" | "darwin" | "linux" =
    platform === "win32" ? "win" : platform === "darwin" ? "darwin" : "linux";

  const out: ResolvedScanTarget[] = [];
  for (const cat of ALL_CATEGORIES) {
    // widen to ScanTargetDef so optional fields (platform/validate/maxDepth)
    // are visible across the union of literal target types
    const targets: ScanTargetDef[] = SCAN_TARGETS[cat].targets;
    for (const t of targets) {
      const matches =
        !t.platform ||
        t.platform === osKey ||
        (t.platform === "unix" && (osKey === "darwin" || osKey === "linux"));
      if (matches) out.push({ ...t, category: cat });
    }
  }
  return out;
}
