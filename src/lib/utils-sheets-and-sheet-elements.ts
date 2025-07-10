import type { Sheet, SheetElement } from "./types";

export function addSheetOrSheetElement(width: string, length: string, name: string, list: Sheet[] | SheetElement[]): Sheet[] | SheetElement[] {
  const largestNumberIsLength = parseInt(width) < parseInt(length) ? true : false;

  const parsedWidth = parseInt(largestNumberIsLength ? width : length);
  const parsedLength = parseInt(largestNumberIsLength ? length : width);

  if (!name.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return list;

  // Check for duplicate name *with same dimensions*
  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.width === parsedWidth && listItem.length === parsedLength);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const newItem: Sheet | SheetElement = {
    id: crypto.randomUUID(),
    name: name.trim(),
    width: parsedWidth,
    length: parsedLength,
  };

  const updatedList = [...list, newItem];
  return updatedList;
}

export function saveSheetOrSheetElement(width: string, length: string, name: string, list: Sheet[] | SheetElement[], itemId: string): Sheet[] | SheetElement[] {
  const largestNumberIsLength = parseInt(width) < parseInt(length) ? true : false;

  const parsedWidth = parseInt(largestNumberIsLength ? width : length);
  const parsedLength = parseInt(largestNumberIsLength ? length : width);

  if (!name.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return list;

  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.width === parsedWidth && listItem.length === parsedLength && listItem.id !== itemId);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const newItem: Sheet | SheetElement = {
    id: itemId,
    name: name.trim(),
    width: parsedWidth,
    length: parsedLength,
  };

  const updatedItems = list.map((listItem) => {
    return listItem.id === itemId ? newItem : listItem;
  });
  return updatedItems;
}
