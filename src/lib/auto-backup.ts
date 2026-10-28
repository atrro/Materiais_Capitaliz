// Backup automático em arquivo (File System Access API, Chrome/Edge). O arquivo fica numa pasta escolhida pelo usuário.
const DB_NAME = "materiais-capitalizaveis-backup-handle";
const STORE = "h";
const KEY = "handle";

type Handle = any;

export const isAutoBackupSupported = () =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const loadBackupHandle = () => run<Handle | undefined>("readonly", (s) => s.get(KEY)).catch(() => undefined);
export const saveBackupHandle = (h: Handle) => run("readwrite", (s) => s.put(h, KEY));
export const clearBackupHandle = () => run("readwrite", (s) => s.delete(KEY));

export async function pickBackupFile(): Promise<Handle> {
  return (window as any).showSaveFilePicker({
    suggestedName: "materiais-capitalizaveis-backup-automatico.json",
    types: [{ description: "Backup JSON", accept: { "application/json": [".json"] } }],
  });
}

export async function hasWritePermission(h: Handle): Promise<boolean> {
  try {
    return (await h.queryPermission({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

export async function requestWritePermission(h: Handle): Promise<boolean> {
  try {
    return (await h.requestPermission({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

export async function readBackupFileText(h: Handle): Promise<string> {
  return (await h.getFile()).text();
}

export async function writeBackupFile(h: Handle, text: string): Promise<void> {
  const w = await h.createWritable();
  try {
    await w.write(text);
  } finally {
    await w.close();
  }
}
