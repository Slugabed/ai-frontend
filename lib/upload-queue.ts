const DB_NAME = "upload-queue";
const STORE_NAME = "uploads";
const DB_VERSION = 1;

export interface QueuedUpload {
  id: string;
  fileName: string;
  fileType: "pdf" | "image";
  contentType: string;
  blob: Blob;
  status: "queued" | "uploading" | "completed" | "failed";
  retryCount: number;
  createdAt: number;
  errorMessage?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueFiles(
  files: File[],
  fileType: "pdf" | "image"
): Promise<QueuedUpload[]> {
  const db = await openDB();
  const entries: QueuedUpload[] = files.map((file) => ({
    id: crypto.randomUUID(),
    fileName: file.name,
    fileType,
    contentType: file.type,
    blob: file,
    status: "queued" as const,
    retryCount: 0,
    createdAt: Date.now(),
  }));

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const entry of entries) {
    store.put(entry);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return entries;
}

export async function getPendingUploads(): Promise<QueuedUpload[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const all: QueuedUpload[] = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return all.filter((u) => u.status === "queued" || u.status === "uploading");
}

export async function getAllUploads(): Promise<QueuedUpload[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const all: QueuedUpload[] = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return all;
}

export async function updateStatus(
  id: string,
  status: QueuedUpload["status"],
  errorMessage?: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const entry: QueuedUpload = await new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (entry) {
    entry.status = status;
    if (errorMessage !== undefined) {
      entry.errorMessage = errorMessage;
    }
    if (status === "uploading") {
      entry.retryCount += 1;
    }
    store.put(entry);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

export async function removeEntry(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

export async function cleanupOld(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const all: QueuedUpload[] = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  for (const entry of all) {
    const age = now - entry.createdAt;
    if (entry.status === "completed" && age > ONE_HOUR) {
      store.delete(entry.id);
    } else if (age > ONE_DAY) {
      store.delete(entry.id);
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}
