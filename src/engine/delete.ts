import fs from "fs-extra";

import type { DeletionReport,DeletionResult, ScanItem } from "../cli/types.js";

export interface DeleteProgress {
  current: number;
  total: number;
  currentPath: string;
  currentName: string;
}

type DeleteProgressCallback = (progress: DeleteProgress) => void;

async function deleteItem(item: ScanItem): Promise<DeletionResult> {
  try {
    await fs.remove(item.path);
    return {
      id: item.id,
      path: item.path,
      success: true,
      size: item.size,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: item.id,
      path: item.path,
      success: false,
      error: message,
      size: 0,
    };
  }
}

export async function deleteItems(
  items: ScanItem[],
  onProgress?: DeleteProgressCallback
): Promise<DeletionReport> {
  const results: DeletionResult[] = [];
  let totalReclaimed = 0;
  let totalFailed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;

    onProgress?.({
      current: i + 1,
      total: items.length,
      currentPath: item.path,
      currentName: item.name,
    });

    const result = await deleteItem(item);
    results.push(result);

    if (result.success) {
      totalReclaimed += item.size;
    } else {
      totalFailed++;
    }

    // yield to event loop between deletions to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return {
    results,
    totalReclaimed,
    totalFailed,
  };
}
