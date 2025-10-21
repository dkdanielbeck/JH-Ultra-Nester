import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ITEMTYPES,
  type ItemTypeEnum,
  type Machine,
  type Sheet,
  type SheetElement,
  type SteelLength,
  type SteelLengthElement,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getResourceName = (
  language: string,
  itemType: ItemTypeEnum
): String => {
  switch (itemType) {
    case ITEMTYPES.Sheet:
      return language === "da" ? "plader" : "sheets";

    case ITEMTYPES.SheetElement:
      return language === "da" ? "plade emner" : "sheet elements";
    case ITEMTYPES.SteelLength:
      return language === "da" ? "stål længder" : "steel lengths";

    case ITEMTYPES.SteelLengthElement:
      return language === "da" ? "stål længde emner" : "steel length elements";
    case ITEMTYPES.Machine:
      return language === "da" ? "maskine" : "machine";
    default:
      return "";
  }
};

export function getNamingScheme(
  item: Sheet | SheetElement | SteelLength | SteelLengthElement | Machine
): string {
  switch (item.type) {
    case ITEMTYPES.Sheet:
    case ITEMTYPES.SheetElement:
      return `${item.name} (${formatEuropeanFloat(
        item.length
      )}×${formatEuropeanFloat(item.width)} mm)`;
    case ITEMTYPES.SteelLength:
    case ITEMTYPES.SteelLengthElement:
      return `${item.name} (${formatEuropeanFloat(item.length)} mm)`;
    case ITEMTYPES.Machine:
      return item.name;
    default:
      return "";
  }
}

export function ensureLengthIsLargest<
  T extends { width?: number; length?: number }
>(item: T): T {
  if (
    typeof item.width === "number" &&
    typeof item.length === "number" &&
    item.width > item.length
  ) {
    return {
      ...item,
      width: item.length,
      length: item.width,
    };
  }
  return item;
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export function parseEuropeanFloat(value: string) {
  if (typeof value === "string") {
    value = value.replace(",", ".");
  }
  return parseFloat(value);
}

export function formatEuropeanFloat(value: number | undefined) {
  if (typeof value !== "number") return value;

  return value.toString().replace(".", ",");
}

const europeanNumberLike = /^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+([.,]\d+)?$/;

export function isValidEuropeanNumberString(raw: string): boolean {
  if (!raw) return false;
  const noSpaces = raw.trim();
  return europeanNumberLike.test(noSpaces);
}

// Turn "1.234,56" → "1234.56" for JS/DB
export function normalizeEuropeanNumber(raw: string): string {
  return raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
}

export function parseEuropeanFloatString(raw: string): number {
  return Number.parseFloat(normalizeEuropeanNumber(raw));
}
