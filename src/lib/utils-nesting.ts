import type { Sheet, SheetElement, MachineProfile, DPResult, PlacedRect } from "./types";
import type { Rectangle } from "maxrects-packer";
import { MaxRectsPacker, PACKING_LOGIC } from "maxrects-packer";

export function packOneSheet(sheet: Sheet, sheetElements: SheetElement[], selectedProfile: MachineProfile | undefined): MaxRectsPacker<Rectangle> {
  const sheetWidth = sheet.width;
  const sheetLength = sheet.length;

  const canFit = sheetElements.filter(
    (sheetElement) => (sheetElement.width <= sheetWidth && sheetElement.length <= sheetLength) || (sheetElement.length <= sheetWidth && sheetElement.width <= sheetLength)
  );
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
    canFit.map((sheetElement) => ({
      width: sheetElement.width,
      height: sheetElement.length,
      data: sheetElement,
    })) as unknown as Rectangle[]
  );

  return packer;
}

export function findBest(sheetElements: SheetElement[], selectedSheets: Sheet[], selectedProfile: MachineProfile | undefined, memory = new Map<string, DPResult>(), bestSoFar = Infinity): DPResult {
  if (sheetElements.length === 0) {
    return { totalArea: 0, counts: {}, layouts: [] };
  }

  const key = sheetElements
    .map((sheetElement) => sheetElement.id)
    .sort()
    .join("|");
  if (memory.has(key)) {
    return memory.get(key)!;
  }

  let best: DPResult = { totalArea: Infinity, counts: {}, layouts: [] };

  for (const sheet of [...selectedSheets].sort((a, b) => b.width * b.length - a.width * a.length)) {
    if (
      !sheetElements.some((sheetElement) => (sheetElement.width <= sheet.width && sheetElement.length <= sheet.length) || (sheetElement.length <= sheet.width && sheetElement.width <= sheet.length))
    ) {
      continue;
    }

    const packer = packOneSheet(sheet, sheetElements, selectedProfile);

    const placedSheetElements = packer.bins[0].rects.map((rectangle) => rectangle.data as SheetElement);

    const bin = packer.bins[0];
    const thisLayout: PlacedRect[] = bin.rects.map((rect) => {
      const el = rect.data as SheetElement;
      return {
        sheetElement: el,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        length: rect.height,
        rotated: rect.rot,
      };
    });

    if (placedSheetElements.length === 0) continue;

    const remaining = sheetElements.slice();
    for (const placedSheetElement of placedSheetElements) {
      const idx = remaining.findIndex((sheetElement) => sheetElement.id === placedSheetElement.id);
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

export function nestWithStraightCuts(sheet: Sheet, sheetElements: SheetElement[], profile: MachineProfile): MaxRectsPacker<Rectangle> {
  const sheetWidth = sheet.width - 2 * profile.border;
  const sheetHeight = sheet.length - 2 * profile.border;
  const margin = profile.margin;

  const bins: PlacedRect[] = [];
  let currentY = profile.border;

  // Group sheetElement by size and sort largest first
  const grouped = new Map<string, SheetElement[]>();
  for (const sheetElement of sheetElements) {
    const sheetElementKey = `${sheetElement.width}x${sheetElement.length}`;
    if (!grouped.has(sheetElementKey)) grouped.set(sheetElementKey, []);
    grouped.get(sheetElementKey)!.push(sheetElement);
  }

  const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const [width1, height1] = a[0].split("x").map(Number);
    const [width2, height2] = b[0].split("x").map(Number);
    return height2 * width2 - height1 * width1; // Sort by area
  });

  for (const [key, group] of sortedGroups) {
    const [sheetElementWidth, sheetElementHeight] = key.split("x").map(Number);
    let currentX = profile.border;
    let rowMaxHeight = 0;

    for (const sheetElement of group) {
      // Row overflow → move to next line
      if (currentX + sheetElementWidth > sheetWidth + profile.border) {
        currentX = profile.border;
        currentY += rowMaxHeight + margin;
        rowMaxHeight = 0;
      }

      // Sheet overflow → stop placing
      if (currentY + sheetElementHeight > sheetHeight + profile.border) break;

      bins.push({
        sheetElement: sheetElement,
        x: currentX,
        y: currentY,
        width: sheetElementWidth,
        length: sheetElementHeight,
        rotated: false,
      });

      currentX += sheetElementWidth + margin;
      rowMaxHeight = Math.max(rowMaxHeight, sheetElementHeight);
    }

    currentY += rowMaxHeight + margin;
    if (currentY > sheetHeight + profile.border) break;
  }

  return {
    bins: [
      {
        rects: bins.map((reactangle) => ({
          x: reactangle.x,
          y: reactangle.y,
          width: reactangle.width,
          height: reactangle.length,
          rot: reactangle.rotated,
          data: reactangle.sheetElement,
        })),
        width: sheet.width,
        height: sheet.length,
      },
    ],
  } as unknown as MaxRectsPacker<Rectangle>;
}
