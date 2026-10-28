// Persists the root FileSystemDirectoryHandle in IndexedDB so every route of the
// app (same origin) can reuse the folder picked once in the Hub.

const DB_NAME = "factorysuite";
const STORE_NAME = "handles";
const ROOT_KEY = "root";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await withStore<FileSystemDirectoryHandle | undefined>("readonly", (store) =>
    store.get(ROOT_KEY),
  );
  return handle ?? null;
}

export async function saveRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await withStore("readwrite", (store) => store.put(handle, ROOT_KEY));
}

export async function clearRootHandle(): Promise<void> {
  await withStore("readwrite", (store) => store.delete(ROOT_KEY));
}
