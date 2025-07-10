import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Sheet, StorageKeyMap, Element, MachineProfile, DPResult, PlacedRect } from "./types";
import type { Rectangle } from "maxrects-packer";
import { MaxRectsPacker, PACKING_LOGIC } from "maxrects-packer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function addSheetOrElement(width: string, length: string, name: string, list: Sheet[] | Element[]): Sheet[] | Element[] {
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

  const newItem: Sheet = {
    id: crypto.randomUUID(),
    name: name.trim(),
    width: parsedWidth,
    length: parsedLength,
  };

  const updatedList = [...list, newItem];
  return updatedList;
}

export function saveSheetOrElement(width: string, length: string, name: string, list: Sheet[] | Element[], itemId: string): Sheet[] | Element[] {
  const largestNumberIsLength = parseInt(width) < parseInt(length) ? true : false;

  const parsedWidth = parseInt(largestNumberIsLength ? width : length);
  const parsedLength = parseInt(largestNumberIsLength ? length : width);

  if (!name.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return list;

  const exists = list.some((listItem) => listItem.name.toLowerCase() === name.trim().toLowerCase() && listItem.width === parsedWidth && listItem.length === parsedLength && listItem.id !== itemId);

  if (exists) {
    alert("An item with this name and size already exists.");
    return list;
  }

  const newItem: Sheet = {
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

export function saveMachine(border: string, margin: string, name: string, machines: MachineProfile[], itemId: string): MachineProfile[] {
  const editedMachine = machines.find((machine) => machine.id === itemId);

  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some(
    (machine) => machine.machineName.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin && machine.id !== itemId
  );

  if (exists) {
    alert("A machine with this name and size already exists.");
    return machines;
  }

  const newMachine: MachineProfile = {
    id: itemId,
    machineName: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: editedMachine?.default ?? false,
    straightCuts: editedMachine?.straightCuts ?? false,
  };

  const updatedMachines = machines.map((machine) => {
    return machine.id === itemId ? newMachine : machine;
  });

  return updatedMachines;
}

export function addMachine(border: string, margin: string, name: string, machines: MachineProfile[]): MachineProfile[] {
  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some((machine) => machine.machineName.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin);

  if (exists) {
    alert("A machine with this name and configurations already exist.");
    return machines;
  }

  const newMachine: MachineProfile = {
    id: crypto.randomUUID(),
    machineName: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: machines.length === 0 ? true : false,
    straightCuts: false,
  };

  const updatedMachines = [...machines, newMachine];
  return updatedMachines;
}

export function packOneSheet(sheet: Sheet, elements: Element[], selectedProfile: MachineProfile | undefined): MaxRectsPacker<Rectangle> {
  const sheetWidth = sheet.width;
  const sheetLength = sheet.length;

  const canFit = elements.filter((element) => (element.width <= sheetWidth && element.length <= sheetLength) || (element.length <= sheetWidth && element.width <= sheetLength));
  if (canFit.length === 0) {
    //@ts-ignore
    return {};
  }
  if (selectedProfile?.straightCuts) {
    return nestWithStraightCuts(sheet, canFit, selectedProfile);
  }
  const packer = new MaxRectsPacker(sheetWidth, sheetLength, selectedProfile ? selectedProfile.margin : 10, {
    smart: true,
    pot: false,
    square: false,
    allowRotation: true,
    logic: PACKING_LOGIC.MAX_AREA,
    border: selectedProfile ? selectedProfile.border : 10,
  });
  packer.addArray(
    canFit.map((element) => ({
      width: element.width,
      height: element.length,
      data: element,
    })) as unknown as Rectangle[]
  );

  return packer;
}

export function findBest(elements: Element[], selectedSheets: Sheet[], selectedProfile: MachineProfile | undefined, memory = new Map<string, DPResult>(), bestSoFar = Infinity): DPResult {
  if (elements.length === 0) {
    return { totalArea: 0, counts: {}, layouts: [] };
  }

  const key = elements
    .map((element) => element.id)
    .sort()
    .join("|");
  if (memory.has(key)) {
    return memory.get(key)!;
  }

  let best: DPResult = { totalArea: Infinity, counts: {}, layouts: [] };

  for (const sheet of [...selectedSheets].sort((a, b) => b.width * b.length - a.width * a.length)) {
    if (!elements.some((element) => (element.width <= sheet.width && element.length <= sheet.length) || (element.length <= sheet.width && element.width <= sheet.length))) {
      continue;
    }

    const packer = packOneSheet(sheet, elements, selectedProfile);

    const placedElements = packer.bins[0].rects.map((rectangle) => rectangle.data as Element);

    const bin = packer.bins[0];
    const thisLayout: PlacedRect[] = bin.rects.map((rect) => {
      const el = rect.data as Element;
      return {
        element: el,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        length: rect.height,
        rotated: rect.rot,
      };
    });

    if (placedElements.length === 0) continue;

    const remaining = elements.slice();
    for (const placedElement of placedElements) {
      const idx = remaining.findIndex((element) => element.id === placedElement.id);
      remaining.splice(idx, 1);
    }

    const sheetArea = sheet.width * sheet.length;
    if (sheetArea >= bestSoFar) continue;

    // recurse
    const bestFound = findBest(remaining, selectedSheets, selectedProfile, memory, bestSoFar - sheetArea);

    const total = sheetArea + bestFound.totalArea;
    if (total < best.totalArea) {
      best = {
        totalArea: total,
        counts: {
          ...bestFound.counts,
          [sheet.id]: (bestFound.counts[sheet.id] || 0) + 1,
        },
        layouts: [
          {
            sheetId: sheet.id,
            sheetName: sheet.name,
            sheetSize: `${sheet.length}×${sheet.width}`,
            sheetArea,
            width: sheet.width,
            length: sheet.length,
            rectangles: thisLayout,
          },
          ...bestFound.layouts,
        ],
      };
      bestSoFar = total;
    }
  }

  memory.set(key, best);
  return best;
}

export function nestWithStraightCuts(sheet: Sheet, elements: Element[], profile: MachineProfile): MaxRectsPacker<Rectangle> {
  const sheetWidth = sheet.width - 2 * profile.border;
  const sheetHeight = sheet.length - 2 * profile.border;
  const margin = profile.margin;

  const bins: PlacedRect[] = [];
  let currentY = profile.border;

  // Group elements by size and sort largest first
  const grouped = new Map<string, Element[]>();
  for (const el of elements) {
    const key = `${el.width}x${el.length}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(el);
  }

  const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const [w1, h1] = a[0].split("x").map(Number);
    const [w2, h2] = b[0].split("x").map(Number);
    return h2 * w2 - h1 * w1; // Sort by area
  });

  for (const [key, group] of sortedGroups) {
    const [elWidth, elHeight] = key.split("x").map(Number);
    let currentX = profile.border;
    let rowMaxHeight = 0;

    for (const el of group) {
      // Row overflow → move to next line
      if (currentX + elWidth > sheetWidth + profile.border) {
        currentX = profile.border;
        currentY += rowMaxHeight + margin;
        rowMaxHeight = 0;
      }

      // Sheet overflow → stop placing
      if (currentY + elHeight > sheetHeight + profile.border) break;

      bins.push({
        element: el,
        x: currentX,
        y: currentY,
        width: elWidth,
        length: elHeight,
        rotated: false,
      });

      currentX += elWidth + margin;
      rowMaxHeight = Math.max(rowMaxHeight, elHeight);
    }

    currentY += rowMaxHeight + margin;
    if (currentY > sheetHeight + profile.border) break;
  }

  return {
    bins: [
      {
        rects: bins.map((r) => ({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.length,
          rot: r.rotated,
          data: r.element,
        })),
        width: sheet.width,
        height: sheet.length,
      },
    ],
  } as unknown as MaxRectsPacker<Rectangle>;
}
