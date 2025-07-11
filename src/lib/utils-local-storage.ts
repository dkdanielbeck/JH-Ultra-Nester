import type { ComponentName, InputField, SavedNestingConfiguration, StorageKeyMap } from "./types";

export function saveItemsToLocalStorage<StorageKey extends keyof StorageKeyMap>(storageKey: StorageKey, list: StorageKeyMap[StorageKey]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (e) {
    console.error(`Failed to save ${storageKey}:`, e);
  }
}

export function loadItemsFromLocalStorage<StorageKey extends keyof StorageKeyMap>(storageKey: StorageKey): StorageKeyMap[StorageKey] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Failed to load ${storageKey}:`, e);
    return [] as StorageKeyMap[StorageKey];
  }
}

export function saveInputToLocalStorage(field: InputField, value: string, component: ComponentName) {
  localStorage.setItem(`${component}-${field}`, value);
}

export function clearInputsFromLocalStorage(fields: InputField[], component: ComponentName) {
  for (const field of fields) {
    localStorage.removeItem(`${component}-${field}`);
  }
}

export function loadInputFromLocalStorage(field: InputField, component: ComponentName): string {
  return localStorage.getItem(`${component}-${field}`) || "";
}

export function saveNestingConfigurationToLocalStorage(config: SavedNestingConfiguration, component: ComponentName) {
  try {
    localStorage.setItem(component, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save nesting configuration:", error);
  }
}

export function loadNestingConfigurationFromLocalStorage(component: ComponentName): SavedNestingConfiguration | null {
  try {
    const data = localStorage.getItem(component);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load nesting configuration:", error);
    return null;
  }
}
