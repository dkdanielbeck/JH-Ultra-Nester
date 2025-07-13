import type { Sheet, SheetElement, Machine, DPResult, PlacedRect, SteelLengthElement, SteelLength } from "./types";
import type { Rectangle } from "maxrects-packer";
import { MaxRectsPacker, PACKING_LOGIC } from "maxrects-packer";

export function packOneSheet(parent: Sheet | SteelLength, elements: SheetElement[] | SteelLengthElement[], selectedProfile: Machine | undefined): MaxRectsPacker<Rectangle> {
  const width = parent.width;
  const length = parent.length;

  const canFit = elements.filter((element) => (element.width <= width && element.length <= length) || (element.length <= width && element.width <= length));
  if (canFit.length === 0) {
    //@ts-ignore
    return {};
  }
  if (selectedProfile?.straightCuts) {
    return nestWithStraightCuts(parent, canFit, selectedProfile);
  }
  const packer = new MaxRectsPacker(width, length, selectedProfile ? selectedProfile.margin : 10, {
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

export function findBest(
  elements: SheetElement[] | SteelLengthElement[],
  selectedParents: Sheet[] | SteelLength[],
  selectedProfile: Machine | undefined,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity
): DPResult {
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

  for (const parent of [...selectedParents].sort((a, b) => b.width * b.length - a.width * a.length)) {
    if (!elements.some((element) => (element.width <= parent.width && element.length <= parent.length) || (element.length <= parent.width && element.width <= parent.length))) {
      continue;
    }

    const packer = packOneSheet(parent, elements, selectedProfile);

    const placedSheetElements = packer.bins[0].rects.map((rectangle) => rectangle.data as SheetElement);

    const bin = packer.bins[0];
    const thisLayout: PlacedRect[] = bin.rects.map((rect) => {
      const el = rect.data as SheetElement;
      return {
        element: el,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        length: rect.height,
        rotated: rect.rot,
      };
    });

    if (placedSheetElements.length === 0) continue;

    const remaining = elements.slice();
    for (const placedSheetElement of placedSheetElements) {
      const idx = remaining.findIndex((element) => element.id === placedSheetElement.id);
      remaining.splice(idx, 1);
    }

    const parentArea = parent.width * parent.length;
    if (parentArea >= bestSoFar) continue;

    // recurse
    const bestFound = findBest(remaining, selectedParents, selectedProfile, memory, bestSoFar - parentArea);

    const total = parentArea + bestFound.totalArea;
    if (total < best.totalArea) {
      best = {
        totalArea: total,
        counts: {
          ...bestFound.counts,
          [parent.id]: (bestFound.counts[parent.id] || 0) + 1,
        },
        layouts: [
          {
            parentId: parent.id,
            parentName: parent.name,
            parentSize: `${parent.length}×${parent.width}`,
            parentArea: parentArea,
            width: parent.width,
            length: parent.length,
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

export function nestWithStraightCuts(parent: Sheet | SteelLength, elements: (SheetElement | SteelLengthElement)[], profile: Machine): MaxRectsPacker<Rectangle> {
  const width = parent.width - 2 * profile.border;
  const height = parent.length - 2 * profile.border;
  const margin = profile.margin;

  const bins: PlacedRect[] = [];
  let currentY = profile.border;

  // Group sheetElement by size and sort largest first
  const grouped = new Map<string, SheetElement[] | SteelLengthElement[]>();
  for (const element of elements) {
    const elementKey = `${element.width}x${element.length}`;
    if (!grouped.has(elementKey)) grouped.set(elementKey, []);
    //@ts-ignore
    grouped.get(elementKey)!.push(element);
  }

  const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const [width1, height1] = a[0].split("x").map(Number);
    const [width2, height2] = b[0].split("x").map(Number);
    return height2 * width2 - height1 * width1; // Sort by area
  });

  for (const [key, group] of sortedGroups) {
    const [elementWidth, elementHeight] = key.split("x").map(Number);
    let currentX = profile.border;
    let rowMaxHeight = 0;

    for (const element of group) {
      // Row overflow → move to next line
      if (currentX + elementWidth > width + profile.border) {
        currentX = profile.border;
        currentY += rowMaxHeight + margin;
        rowMaxHeight = 0;
      }

      // Sheet overflow → stop placing
      if (currentY + elementHeight > height + profile.border) break;

      bins.push({
        element: element,
        x: currentX,
        y: currentY,
        width: elementWidth,
        length: elementHeight,
        rotated: false,
      });

      currentX += elementWidth + margin;
      rowMaxHeight = Math.max(rowMaxHeight, elementHeight);
    }

    currentY += rowMaxHeight + margin;
    if (currentY > height + profile.border) break;
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
          data: reactangle.element,
        })),
        width: parent.width,
        height: parent.length,
      },
    ],
  } as unknown as MaxRectsPacker<Rectangle>;
}
