import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ITEMTYPES, type ItemTypeEnum, type Machine, type NestingParent, type Sheet, type SheetElement, type SteelLength, type SteelLengthElement } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResultsLine(item: NestingParent, index: number) {
  const noPrice = !item.weight || item.weight === 0 || !item.price || item.price === 0 ? true : false;

  return (
    <li className="flex" key={index}>
      <p>
        <li>
          {" "}
          <strong>{item.count}</strong>{" "}
          <em>
            {item.name} ({item.size} mm)
          </em>
          {!noPrice && (
            <>
              {" = "}
              <strong>{item.price * item.weight} kr.</strong>
            </>
          )}
        </li>
      </p>
    </li>
  );
}
export function getTotalPrice(nestingParent: NestingParent[]) {
  const totalPrice = nestingParent.reduce((sum, item) => {
    return sum + (item.price ?? 0) * (item.weight ?? 0);
  }, 0);

  return totalPrice === 0 ? (
    <></>
  ) : (
    <p className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
      Total: <strong>{totalPrice} kr.</strong>
    </p>
  );
}

export const getResourceName = (language: string, itemType: ItemTypeEnum): String => {
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

export function getNamingScheme(item: Sheet | SheetElement | SteelLength | SteelLengthElement | Machine): string {
  switch (item.type) {
    case ITEMTYPES.Sheet:
    case ITEMTYPES.SheetElement:
      return `${item.name} (${item.length}×${item.width} mm)`;
    case ITEMTYPES.SteelLength:
    case ITEMTYPES.SteelLengthElement:
      return `${item.name} (${item.length} mm)`;
    case ITEMTYPES.Machine:
      return item.name;
    default:
      return "";
  }
}
