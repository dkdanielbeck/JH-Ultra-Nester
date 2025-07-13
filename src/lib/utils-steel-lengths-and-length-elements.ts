import { ITEMTYPES, type ItemTypeEnum, type SteelLength, type SteelLengthElement } from "./types";

export function addSteelLengthOrSteelLengthElement(
  length: string,
  name: string,
  price: string | undefined,
  weight: string | undefined,
  list: SteelLength[] | SteelLengthElement[],
  type: ItemTypeEnum
): SteelLength[] | SteelLengthElement[] {
  const parsedLength = parseInt(length);

  if (!name.trim() || isNaN(parsedLength)) return list;

  // Check for duplicate name *with same dimensions*
  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.length === parsedLength);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const baseItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    width: 200,
    length: parsedLength,
    weight: weight ? parseInt(weight) : undefined,
    price: price ? parseInt(price) : undefined,
    type,
  };

  const updatedList = type === ITEMTYPES.SteelLength ? [...(list as SteelLength[]), baseItem as SteelLength] : [...(list as SteelLengthElement[]), baseItem as SteelLengthElement];
  return updatedList;
}

export function saveSteelLengthOrSteelLengthElement(
  length: string,
  name: string,
  price: string | undefined,
  weight: string | undefined,
  list: SteelLength[] | SteelLengthElement[],
  itemId: string,
  type: ItemTypeEnum
): SteelLength[] | SteelLengthElement[] {
  const parsedLength = parseInt(length);

  if (!name.trim() || isNaN(parsedLength)) return list;

  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.length === parsedLength && listItem.id !== itemId);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const baseItem = {
    id: itemId,
    name: name.trim(),
    width: 200,
    length: parsedLength,
    weight: weight ? parseInt(weight) : undefined,
    price: price ? parseInt(price) : undefined,
    type,
  };

  const updatedList =
    type === ITEMTYPES.SteelLength
      ? (list as SteelLength[]).map((item) => (item.id === itemId ? (baseItem as SteelLength) : item))
      : (list as SteelLengthElement[]).map((item) => (item.id === itemId ? (baseItem as SteelLengthElement) : item));

  return updatedList;
}
