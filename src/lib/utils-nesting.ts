import type {
  Sheet,
  SheetElement,
  Machine,
  DPResult,
  PlacedRect,
  SteelLengthElement,
  SteelLength,
  ParentLayout,
} from "./types";
import type { Rectangle } from "maxrects-packer";
import { MaxRectsPacker, PACKING_LOGIC } from "maxrects-packer";
import { formatEuropeanFloat } from "./utils";

type AnyElement = SheetElement | SteelLengthElement;

export function packOneSheet(
  parent: Sheet | SteelLength,
  elements: AnyElement[],
  selectedProfile: Machine | undefined
): MaxRectsPacker<Rectangle> {
  const border = selectedProfile?.border ?? 0;
  const margin = selectedProfile?.margin ?? 0;

  const usableW = parent.width - 2 * border;
  const usableH = parent.length - 2 * border;

  // Only keep pieces that can possibly fit once inside border
  const pool = elements.filter(
    (el) =>
      (el.width <= usableW && el.length <= usableH) ||
      (el.length <= usableW && el.width <= usableH)
  );
  if (pool.length === 0) {
    //@ts-expect-error type mismatch but below object is as it should be
    return { bins: [] };
  }

  // A few robust orderings; different ones often reduce bin count dramatically
  const orderings: ((a: AnyElement, b: AnyElement) => number)[] = [
    // Largest area first
    (a, b) => b.width * b.length - a.width * a.length,
    // Decreasing longest side
    (a, b) =>
      Math.max(b.width, b.length) - Math.max(a.width, a.length) ||
      Math.min(b.width, b.length) - Math.min(a.width, a.length),
    // Decreasing width
    (a, b) => b.width - a.width || b.length - a.length,
    // Decreasing length
    (a, b) => b.length - a.length || b.width - a.width,
    // Perimeter
    (a, b) => b.width + b.length - (a.width + a.length),
  ];

  type Candidate = { packer: MaxRectsPacker<Rectangle>; waste: number };

  let best: Candidate | null = null;

  for (const cmp of orderings) {
    const sorted = [...pool].sort(cmp);

    const packer = new MaxRectsPacker(parent.width, parent.length, margin, {
      smart: true,
      pot: false,
      square: false,
      allowRotation: true,
      logic: PACKING_LOGIC.MAX_AREA, // this is ignored when smart=true; it will test several
      border,
    });

    packer.addArray(
      sorted.map((el) => ({
        width: el.width,
        height: el.length,
        data: el,
      })) as unknown as Rectangle[]
    );

    // Score: (bin count) then total unused area
    const binCount = packer.bins.length;
    const totalArea = parent.width * parent.length * binCount;
    const usedArea = packer.bins.reduce(
      (s, b) => s + b.rects.reduce((t, r) => t + r.width * r.height, 0),
      0
    );
    const waste = totalArea - usedArea;

    if (
      best === null ||
      packer.bins.length < best.packer.bins.length ||
      (packer.bins.length === best.packer.bins.length && waste < best.waste)
    ) {
      best = { packer, waste };
      // Early exit if we already hit the theoretical lower bound: 1 or 2 bins
      if (packer.bins.length <= 2) break;
    }
  }

  return best!.packer;
}

/**
 * Dynamic programming over sheet choices.
 * IMPORTANT: For each sheet size we now branch over taking k=1..bins.length
 * bins from a **single pack** (so we keep the packer’s cross-bin decisions).
 */
export function findBest(
  elements: AnyElement[],
  selectedParents: Sheet[] | SteelLength[],
  selectedProfile: Machine | undefined,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity
): DPResult {
  if (elements.length === 0) {
    return { totalArea: 0, counts: {}, layouts: [] };
  }

  const memoKey = elements
    .map((el) => el.instanceId ?? el.id)
    .sort()
    .join("|");
  const cached = memory.get(memoKey);
  if (cached) return cached;

  let best: DPResult = { totalArea: Infinity, counts: {}, layouts: [] };

  // Try sheet sizes largest first (helps pruning)
  const parentsByArea = [...selectedParents].sort(
    (a, b) => b.width * b.length - a.width * a.length
  );

  for (const parent of parentsByArea) {
    // If nothing can fit at all, skip this parent
    if (
      !elements.some(
        (el) =>
          (el.width <= parent.width && el.length <= parent.length) ||
          (el.length <= parent.width && el.width <= parent.length)
      )
    ) {
      continue;
    }

    const packer = packOneSheet(parent, elements, selectedProfile);
    const bins = packer.bins ?? [];
    if (bins.length === 0) continue;

    const parentArea = parent.width * parent.length;

    // Take the first k bins from this single run to preserve global choices
    for (
      let numberOfBinsToTake = 1;
      numberOfBinsToTake <= bins.length;
      numberOfBinsToTake++
    ) {
      const areaCost = numberOfBinsToTake * parentArea;
      if (areaCost >= bestSoFar) break; // pruning

      // Rectangles placed in the first k bins
      const placedNow = new Set<string>(); // instance-aware via reference fallback to id
      const layoutsNow: ParentLayout[] = [];

      for (let b = 0; b < numberOfBinsToTake; b++) {
        const bin = bins[b];
        const rects = bin.rects || [];

        const thisLayoutRects: PlacedRect[] = rects.map((r) => {
          const el = r.data as SheetElement;
          // Mark as placed (object identity if present, else by id)
          placedNow.add(el.instanceId ?? el.id);

          return {
            element: el,
            x: r.x,
            y: r.y,
            width: r.width,
            length: r.height,
            rotated: !!r.rot,
          };
        });

        if (thisLayoutRects.length > 0) {
          layoutsNow.push({
            parentId: parent.id,
            parentName: parent.name,
            parentSize: `${formatEuropeanFloat(
              parent.length
            )}×${formatEuropeanFloat(parent.width)}`,
            parentArea,
            width: parent.width,
            length: parent.length,
            rectangles: thisLayoutRects,
          });
        }
      }

      // Build remaining list (respect possible duplicate ids via instanceId)
      const remaining: AnyElement[] = [];
      for (const element of elements as AnyElement[]) {
        const instanceOrId = element.instanceId ?? element.id;
        if (!placedNow.has(instanceOrId)) remaining.push(element);
      }

      const bestFound = findBest(
        remaining,
        selectedParents,
        selectedProfile,
        memory,
        bestSoFar - areaCost
      );

      const totalArea = areaCost + bestFound.totalArea;
      if (totalArea < best.totalArea) {
        best = {
          totalArea,
          counts: {
            ...bestFound.counts,
            [parent.id]:
              (bestFound.counts[parent.id] || 0) + numberOfBinsToTake,
          },
          layouts: [...layoutsNow, ...bestFound.layouts],
        };
        bestSoFar = totalArea;
      }
    }
  }

  memory.set(memoKey, best);
  return best;
}

/** Straight-cuts: pack in rows/columns; now emits **multiple bins** */
export function nestWithStraightCuts(
  parent: Sheet | SteelLength,
  elements: AnyElement[],
  profile: Machine
): MaxRectsPacker<Rectangle> {
  const usableWidth = parent.width - 2 * profile.border;
  const usableHeight = parent.length - 2 * profile.border;
  const margin = profile.margin;

  // Work on a mutable pool so we can create multiple bins
  const remaining: AnyElement[] = [...(elements as AnyElement[])];
  const binsOut: {
    rects: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      rot: boolean;
      data: SheetElement | SteelLengthElement;
    }>;
    width: number;
    height: number;
  }[] = [];

  while (remaining.length > 0) {
    const rectsThisBin: PlacedRect[] = [];
    let currentY = profile.border;

    // Group by (w×h), largest area groups first – helps row packing
    const grouped = new Map<string, AnyElement[]>();
    for (const el of remaining) {
      const key = `${el.width}x${el.length}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(el);
    }
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
      const [w1, h1] = a[0].split("x").map(Number);
      const [w2, h2] = b[0].split("x").map(Number);
      return w2 * h2 - w1 * h1;
    });

    for (const [key, group] of sortedGroups) {
      const [elementWidth, elementHeight] = key.split("x").map(Number);
      let currentX = profile.border;
      let rowMaxHeight = 0;

      for (const el of group) {
        if (currentX + elementWidth > usableWidth + profile.border) {
          // next row
          currentX = profile.border;
          currentY += rowMaxHeight + margin;
          rowMaxHeight = 0;
        }
        if (currentY + elementHeight > usableHeight + profile.border) break;

        rectsThisBin.push({
          element: el,
          x: currentX,
          y: currentY,
          width: elementWidth,
          length: elementHeight,
          rotated: false,
        });

        // consume this element
        const idx = remaining.indexOf(el);
        if (idx !== -1) remaining.splice(idx, 1);

        currentX += elementWidth + margin;
        rowMaxHeight = Math.max(rowMaxHeight, elementHeight);
      }

      currentY += rowMaxHeight + margin;
      if (currentY > usableHeight + profile.border) break;
    }

    binsOut.push({
      rects: rectsThisBin.map((r) => ({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.length,
        rot: r.rotated,
        data: r.element,
      })),
      width: parent.width,
      height: parent.length,
    });

    // Safety: if we didn’t place anything, abort to avoid infinite loop
    if (rectsThisBin.length === 0) break;
  }

  return { bins: binsOut } as unknown as MaxRectsPacker<Rectangle>;
}
