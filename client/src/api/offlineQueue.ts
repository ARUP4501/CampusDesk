import { openDB, DBSchema } from "idb";

export interface QueuedRequest {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: any;
  contentType?: string;
  isFormData?: boolean;
  createdAt: number;
  label: string;
}

interface CampusDeskDB extends DBSchema {
  offlineQueue: {
    key: string;
    value: QueuedRequest;
  };
}

const DB_NAME = "campusdesk_offline_db";
const STORE_NAME = "offlineQueue";

async function getDB() {
  return openDB<CampusDeskDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    }
  });
}

// Enqueue request when offline
export async function enqueueOfflineRequest(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: any,
  label: string
): Promise<string> {
  const db = await getDB();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item: QueuedRequest = {
    id,
    url,
    method,
    body,
    createdAt: Date.now(),
    label
  };
  await db.put(STORE_NAME, item);
  return id;
}

// Get all pending queued items
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch {
    return [];
  }
}

// Delete item once processed
export async function removeQueuedRequest(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

// Process and replay all queued requests when connection returns
export async function flushOfflineQueue(
  onSuccess?: (item: QueuedRequest) => void,
  onError?: (item: QueuedRequest, error: any) => void
): Promise<number> {
  const queued = await getQueuedRequests();
  if (queued.length === 0) return 0;

  let successfulCount = 0;
  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(item.body)
      });

      if (response.ok) {
        await removeQueuedRequest(item.id);
        successfulCount++;
        if (onSuccess) onSuccess(item);
      } else {
        if (onError) onError(item, await response.text());
      }
    } catch (err) {
      if (onError) onError(item, err);
      break; // Still offline or network failure
    }
  }
  return successfulCount;
}

// Set up automatic online network listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Network online. Flushing offline action queue...");
    flushOfflineQueue();
  });
}
