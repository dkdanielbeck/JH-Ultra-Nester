import type { SteelLength, SteelLengthElement } from "./types";

export function addSteelLengthOrSteelLengthElement(length: string, name: string, list: SteelLength[] | SteelLengthElement[]): SteelLength[] | SteelLengthElement[] {
  const parsedLength = parseInt(length);

  if (!name.trim() || isNaN(parsedLength)) return list;

  // Check for duplicate name *with same dimensions*
  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.length === parsedLength);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const newItem: SteelLength | SteelLengthElement = {
    id: crypto.randomUUID(),
    name: name.trim(),
    width: 200,
    length: parsedLength,
  };

  const updatedList = [...list, newItem];
  return updatedList;
}

export function saveSteelLengthOrSteelLengthElement(length: string, name: string, list: SteelLength[] | SteelLengthElement[], itemId: string): SteelLength[] | SteelLengthElement[] {
  const parsedLength = parseInt(length);

  if (!name.trim() || isNaN(parsedLength)) return list;

  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.length === parsedLength && listItem.id !== itemId);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const newItem: SteelLength | SteelLengthElement = {
    id: itemId,
    name: name.trim(),
    width: 200,
    length: parsedLength,
  };

  const updatedItems = list.map((listItem) => {
    return listItem.id === itemId ? newItem : listItem;
  });
  return updatedItems;
}
