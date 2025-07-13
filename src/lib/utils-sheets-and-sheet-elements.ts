import { ITEMTYPES, type ItemTypeEnum, type Sheet, type SheetElement } from "./types";

export function addSheetOrSheetElement(
  width: string,
  length: string,
  name: string,
  price: string | undefined,
  weight: string | undefined,
  list: Sheet[] | SheetElement[],
  type: ItemTypeEnum
): Sheet[] | SheetElement[] {
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

  const baseItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    width: parsedWidth,
    length: parsedLength,
    weight: weight ? parseInt(weight) : undefined,
    price: price ? parseInt(price) : undefined,
    type,
  };

  const updatedList = type === ITEMTYPES.Sheet ? [...(list as Sheet[]), baseItem as Sheet] : [...(list as SheetElement[]), baseItem as SheetElement];

  return updatedList;
}

export function saveSheetOrSheetElement(
  width: string,
  length: string,
  name: string,
  price: string | undefined,
  weight: string | undefined,
  list: Sheet[] | SheetElement[],
  itemId: string,
  type: ItemTypeEnum
): Sheet[] | SheetElement[] {
  const largestNumberIsLength = parseInt(width) < parseInt(length) ? true : false;

  const parsedWidth = parseInt(largestNumberIsLength ? width : length);
  const parsedLength = parseInt(largestNumberIsLength ? length : width);

  if (!name.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return list;

  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.width === parsedWidth && listItem.length === parsedLength && listItem.id !== itemId);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const baseItem = {
    id: itemId,
    name: name.trim(),
    width: parsedWidth,
    length: parsedLength,
    weight: weight ? parseInt(weight) : undefined,
    price: price ? parseInt(price) : undefined,
    type,
  };

  const updatedList =
    type === ITEMTYPES.Sheet
      ? (list as Sheet[]).map((item) => (item.id === itemId ? (baseItem as Sheet) : item))
      : (list as SheetElement[]).map((item) => (item.id === itemId ? (baseItem as SheetElement) : item));

  return updatedList;
}
