import { openDB } from "idb";

const DB_NAME = "securekey-db";
const DB_VERSION = 1;
const DB_STORE = "deviceKeys";

export async function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    },
  });
}

export async function idbSet(key, value) {
  const db = await openDatabase();
  await db.put(DB_STORE, value, key);
}

export async function idbGet(key) {
  const db = await openDatabase();
  const value = await db.get(DB_STORE, key);
  return value;
}

export async function idbDelete(key) {
  const db = await openDatabase();
  await db.delete(DB_STORE, key);
}

export async function idbClear() {
  const db = await openDatabase();
  await db.clear(DB_STORE);
}
