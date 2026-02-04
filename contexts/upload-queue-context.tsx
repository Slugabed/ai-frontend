"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  QueuedUpload,
  enqueueFiles,
  getAllUploads,
  removeEntry,
  updateStatus,
} from "@/lib/upload-queue";
import {
  processQueue,
  subscribe,
  isProcessing as checkIsProcessing,
} from "@/lib/upload-processor";

interface UploadQueueContextType {
  queuedItems: QueuedUpload[];
  isProcessing: boolean;
  enqueue: (files: File[], fileType: "pdf" | "image") => Promise<void>;
  retryFailed: () => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
}

const UploadQueueContext = createContext<UploadQueueContextType | undefined>(
  undefined
);

interface UploadQueueProviderProps {
  children: ReactNode;
  onUploadComplete?: () => void;
}

export function UploadQueueProvider({
  children,
  onUploadComplete,
}: UploadQueueProviderProps) {
  const [queuedItems, setQueuedItems] = useState<QueuedUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const onUploadCompleteRef = useRef(onUploadComplete);
  onUploadCompleteRef.current = onUploadComplete;

  const refreshState = useCallback(async () => {
    try {
      const items = await getAllUploads();
      // Sort: active items first, then by creation time
      items.sort((a, b) => {
        const statusOrder = { uploading: 0, queued: 1, failed: 2, completed: 3 };
        const diff = statusOrder[a.status] - statusOrder[b.status];
        if (diff !== 0) return diff;
        return a.createdAt - b.createdAt;
      });
      setQueuedItems(items);
      setIsProcessing(checkIsProcessing());
    } catch {
      // IndexedDB may not be available (SSR, private mode)
    }
  }, []);

  useEffect(() => {
    refreshState();

    const unsubscribe = subscribe(() => {
      refreshState();
    });

    // Auto-resume pending uploads on mount
    processQueue().then(() => {
      // After processing completes, notify parent if there were completions
      onUploadCompleteRef.current?.();
    });

    return unsubscribe;
  }, [refreshState]);

  // Track completed items to trigger onUploadComplete
  const prevCompletedCountRef = useRef(0);
  useEffect(() => {
    const completedCount = queuedItems.filter(
      (i) => i.status === "completed"
    ).length;
    if (completedCount > prevCompletedCountRef.current && prevCompletedCountRef.current > 0) {
      onUploadCompleteRef.current?.();
    }
    prevCompletedCountRef.current = completedCount;
  }, [queuedItems]);

  const enqueue = useCallback(
    async (files: File[], fileType: "pdf" | "image") => {
      await enqueueFiles(files, fileType);
      await refreshState();
      processQueue().then(() => {
        onUploadCompleteRef.current?.();
      });
    },
    [refreshState]
  );

  const retryFailed = useCallback(async () => {
    const items = await getAllUploads();
    for (const item of items) {
      if (item.status === "failed") {
        await updateStatus(item.id, "queued");
      }
    }
    await refreshState();
    processQueue().then(() => {
      onUploadCompleteRef.current?.();
    });
  }, [refreshState]);

  const removeFromQueue = useCallback(
    async (id: string) => {
      await removeEntry(id);
      await refreshState();
    },
    [refreshState]
  );

  return (
    <UploadQueueContext.Provider
      value={{ queuedItems, isProcessing, enqueue, retryFailed, removeFromQueue }}
    >
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const context = useContext(UploadQueueContext);
  if (context === undefined) {
    throw new Error(
      "useUploadQueue must be used within an UploadQueueProvider"
    );
  }
  return context;
}
