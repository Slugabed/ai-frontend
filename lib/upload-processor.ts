import {
  QueuedUpload,
  getPendingUploads,
  updateStatus,
  cleanupOld,
} from "./upload-queue";
import { uploadFile, uploadImage } from "./api";

export type QueueListener = () => void;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

let processing = false;
let abortController: AbortController | null = null;
const listeners: Set<QueueListener> = new Set();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: QueueListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isProcessing(): boolean {
  return processing;
}

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  notifyListeners();

  try {
    await cleanupOld();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pending = await getPendingUploads();
      if (pending.length === 0) break;

      // Sort by createdAt to process oldest first
      pending.sort((a, b) => a.createdAt - b.createdAt);
      const item = pending[0];

      await processItem(item);
    }
  } finally {
    processing = false;
    notifyListeners();
  }
}

async function processItem(item: QueuedUpload): Promise<void> {
  if (item.retryCount >= MAX_RETRIES) {
    await updateStatus(item.id, "failed", "Max retries exceeded");
    notifyListeners();
    return;
  }

  await updateStatus(item.id, "uploading");
  notifyListeners();

  abortController = new AbortController();

  try {
    const result =
      item.fileType === "pdf"
        ? await uploadFile(item.blob, item.fileName, abortController.signal)
        : await uploadImage(item.blob, item.fileName, abortController.signal);

    if (result.success) {
      await updateStatus(item.id, "completed");
    } else {
      await updateStatus(item.id, "failed", result.message);
    }
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // Upload was aborted (e.g., page unloading), keep as queued for resume
      await updateStatus(item.id, "queued");
    } else if (isAuthError(error)) {
      // 401 — stop processing entirely
      await updateStatus(item.id, "queued");
      processing = false;
      notifyListeners();
      return;
    } else {
      // Network error or other — will be retried on next pass
      const msg =
        error instanceof Error ? error.message : "Unknown error";
      await updateStatus(item.id, "failed", msg);

      // Exponential backoff before next item
      const delay = BASE_DELAY_MS * Math.pow(2, item.retryCount);
      await sleep(delay);
    }
  } finally {
    abortController = null;
    notifyListeners();
  }
}

function isAuthError(error: unknown): boolean {
  // Check for 401 responses
  if (error instanceof Response && error.status === 401) return true;
  if (error instanceof Error && error.message.includes("401")) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Warn user if uploads are in progress when closing the page
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (processing) {
      e.preventDefault();
    }
  });
}
