import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { scan, type ScanOptions } from "../../engine/scan.js";
import type {
  Category,
  DeletionReport,
  ScanItem,
  Screen,
  Subcategory,
} from "../types.js";
import { ALL_CATEGORIES } from "../types.js";

export type ScanStatus = "idle" | "scanning" | "done";

export interface AppState {
  screen: Screen;
  setScreen: (s: Screen) => void;

  scanItems: ScanItem[];
  setScanItems: (items: ScanItem[]) => void;

  selectedCategory: Category;
  setSelectedCategory: (c: Category) => void;

  activeSubcategory: Subcategory | "all";
  setActiveSubcategory: (s: Subcategory | "all") => void;

  cursor: number;
  setCursor: (c: number) => void;

  scrollOffset: number;
  setScrollOffset: (o: number) => void;

  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;

  scanPhase: string;
  setScanPhase: (p: string) => void;

  // background scan started on app launch; consumers read these to show
  // remaining progress or jump straight to results when already finished
  scanStatus: ScanStatus;
  scanFound: number;

  deletionReport: DeletionReport | null;
  setDeletionReport: (r: DeletionReport | null) => void;

  toggleItem: (id: string) => void;
  selectAllInCategory: (category: Category) => void;
  deselectAllInCategory: (category: Category) => void;
  getItemsForCategory: (category: Category) => ScanItem[];
  getFilteredItems: (category: Category, sub: Subcategory | "all") => ScanItem[];
  getSelectedItems: () => ScanItem[];
  getCategoryTotals: () => Map<Category, number>;
  getCategoryCounts: () => Map<Category, number>;
  getSubcategoryCounts: (category: Category) => { global: number; project: number };
  getTotalSelected: () => { count: number; size: number };
  getLargestCategory: () => Category;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({
  children,
  scanOptions = {},
}: {
  children: React.ReactNode;
  scanOptions?: ScanOptions;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [scanItems, setScanItemsRaw] = useState<ScanItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("node");
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory | "all">("all");
  const [cursor, setCursor] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState("starting...");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanFound, setScanFound] = useState(0);
  const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);

  const scanStartedRef = useRef(false);

  const setScanItems = useCallback((items: ScanItem[]) => {
    setScanItemsRaw(items);
  }, []);

  const toggleItem = useCallback((id: string) => {
    setScanItemsRaw((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const selectAllInCategory = useCallback((category: Category) => {
    setScanItemsRaw((prev) =>
      prev.map((item) =>
        item.category === category ? { ...item, selected: true } : item
      )
    );
  }, []);

  const deselectAllInCategory = useCallback((category: Category) => {
    setScanItemsRaw((prev) =>
      prev.map((item) =>
        item.category === category ? { ...item, selected: false } : item
      )
    );
  }, []);

  const getItemsForCategory = useCallback(
    (category: Category) => scanItems.filter((i) => i.category === category),
    [scanItems]
  );

  const getFilteredItems = useCallback(
    (category: Category, sub: Subcategory | "all") => {
      return scanItems.filter(
        (i) => i.category === category && (sub === "all" || i.subcategory === sub)
      );
    },
    [scanItems]
  );

  const getSelectedItems = useCallback(
    () => scanItems.filter((i) => i.selected),
    [scanItems]
  );

  const getCategoryTotals = useCallback(() => {
    const totals = new Map<Category, number>();
    for (const cat of ALL_CATEGORIES) totals.set(cat, 0);
    for (const item of scanItems) {
      totals.set(item.category, (totals.get(item.category) || 0) + item.size);
    }
    return totals;
  }, [scanItems]);

  const getCategoryCounts = useCallback(() => {
    const counts = new Map<Category, number>();
    for (const cat of ALL_CATEGORIES) counts.set(cat, 0);
    for (const item of scanItems) {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }
    return counts;
  }, [scanItems]);

  const getSubcategoryCounts = useCallback(
    (category: Category) => {
      let global = 0;
      let project = 0;
      for (const item of scanItems) {
        if (item.category !== category) continue;
        if (item.subcategory === "global") global++;
        else project++;
      }
      return { global, project };
    },
    [scanItems]
  );

  const getTotalSelected = useCallback(() => {
    let count = 0;
    let size = 0;
    for (const item of scanItems) {
      if (item.selected) {
        count++;
        size += item.size;
      }
    }
    return { count, size };
  }, [scanItems]);

  const getLargestCategory = useCallback(() => {
    const totals = getCategoryTotals();
    let largest: Category = "node";
    let largestSize = 0;
    for (const [cat, size] of totals) {
      if (size > largestSize) {
        largest = cat;
        largestSize = size;
      }
    }
    return largest;
  }, [getCategoryTotals]);

  // starts the scan exactly once (guarded by a ref so double-invoked effects
  // or multiple callers never re-scan); progress is streamed into scanPhase/
  // scanFound so any screen can display remaining progress, and results land
  // in scanItems with the default category set to the largest bucket
  const beginScan = useCallback(() => {
    if (scanStartedRef.current) return;
    scanStartedRef.current = true;
    setScanStatus("scanning");

    void (async () => {
      try {
        const items = await scan((p) => {
          setScanPhase(p.phase);
          setScanFound(p.found);
        }, scanOptions);

        setScanItems(items);

        if (items.length > 0) {
          const totals = new Map<string, number>();
          for (const item of items) {
            totals.set(
              item.category,
              (totals.get(item.category) || 0) + item.size
            );
          }
          let largest: Category = "node";
          let largestSize = 0;
          for (const [cat, size] of totals) {
            if (size > largestSize) {
              largest = cat as Category;
              largestSize = size;
            }
          }
          setSelectedCategory(largest);
        }
      } catch {
        // ignore scan failures; scanItems stays empty and status flips to done
      } finally {
        setScanStatus("done");
      }
    })();
  }, [setScanItems, scanOptions]);

  // kick off the background scan as soon as the app mounts
  useEffect(() => {
    beginScan();
  }, [beginScan]);

  const value = useMemo(
    (): AppState => ({
      screen, setScreen,
      scanItems, setScanItems,
      selectedCategory, setSelectedCategory,
      activeSubcategory, setActiveSubcategory,
      cursor, setCursor,
      scrollOffset, setScrollOffset,
      focusedItemId, setFocusedItemId,
      scanPhase, setScanPhase,
      scanStatus, scanFound,
      deletionReport, setDeletionReport,
      toggleItem, selectAllInCategory, deselectAllInCategory,
      getItemsForCategory, getFilteredItems, getSelectedItems,
      getCategoryTotals, getCategoryCounts, getSubcategoryCounts,
      getTotalSelected, getLargestCategory,
    }),
    [
      screen, scanItems, selectedCategory, activeSubcategory,
      cursor, scrollOffset, focusedItemId, scanPhase, scanStatus, scanFound,
      deletionReport,
      setScanItems, toggleItem, selectAllInCategory, deselectAllInCategory,
      getItemsForCategory, getFilteredItems, getSelectedItems,
      getCategoryTotals, getCategoryCounts, getSubcategoryCounts,
      getTotalSelected, getLargestCategory,
    ]
  );

  return React.createElement(AppStateContext.Provider, { value }, children);
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
