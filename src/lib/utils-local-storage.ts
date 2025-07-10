import type { StorageKeyMap } from "./types";

export function saveToLocalStorage<StorageKey extends keyof StorageKeyMap>(storageKey: StorageKey, list: StorageKeyMap[StorageKey]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (e) {
    console.error(`Failed to save ${storageKey}:`, e);
  }
}

export function loadFromLocalStorage<StorageKey extends keyof StorageKeyMap>(storageKey: StorageKey): StorageKeyMap[StorageKey] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Failed to load ${storageKey}:`, e);
    return [] as StorageKeyMap[StorageKey];
  }
}
