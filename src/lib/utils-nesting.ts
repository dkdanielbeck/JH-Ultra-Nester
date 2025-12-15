import type {
  Sheet,
  SheetElement,
  Machine,
  DPResult,
  PlacedRect,
  SteelLengthElement,
  SteelLength,
  ParentLayout,
  LengthTypeAssociations,
} from "./types";
import type { Rectangle } from "maxrects-packer";
import { MaxRectsPacker, PACKING_LOGIC } from "maxrects-packer";
import { formatEuropeanFloat } from "./utils";

type AnyElement = SheetElement | SteelLengthElement;

// Toggles to adjust packing behaviors; flip to revert to prior logic.
const USE_1D_LENGTH_PACKER = true; // length nesting uses kerf-style 1D packing
const USE_KERF_MARGIN_FOR_SHEETS = true; // margin acts like kerf (gap), not full padding on all sides
const SHEET_RANDOM_TRIALS = 12; // extra random orderings to reduce fragmentation (set 0 to revert)

// Toggle to revert length packing back to the 2D max-rects approach if desired.

export function packOneSheet(
  parent: Sheet | SteelLength,
  elements: AnyElement[],
  selectedProfile: Machine | undefined
): MaxRectsPacker<Rectangle> {
  const border = selectedProfile?.border ?? 0;
  const rawMargin = selectedProfile?.margin ?? 0;
  // Kerf style: padding half on each side so adjacent pieces have exactly `rawMargin` gap
  const marginPadding = USE_KERF_MARGIN_FOR_SHEETS ? rawMargin / 2 : rawMargin;
  const inflateBy = 0; // do not inflate footprint; rely on padding for spacing

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
    // Columns-first: wider pieces first to reduce right-hand bands
    (a, b) => b.width - a.width || b.length - a.length,
    // Rows-first: taller pieces first
    (a, b) => b.length - a.length || b.width - a.width,
    // Aspect ratio closeness to the sheet
    (a, b) => {
      const parentRatio = parent.width / parent.length;
      const ra = a.width / a.length;
      const rb = b.width / b.length;
      return Math.abs(rb - parentRatio) - Math.abs(ra - parentRatio);
    },
  ];

  // Add a few random shuffles to reduce fragmentation when enabled
  if (SHEET_RANDOM_TRIALS > 0) {
    for (let i = 0; i < SHEET_RANDOM_TRIALS; i++) {
      orderings.push(() => Math.random() - 0.5);
    }
  }

  type Candidate = { packer: MaxRectsPacker<Rectangle>; waste: number };
  // Only MAX_AREA is defined in our version; keep array for future expansion.
  const logics = [PACKING_LOGIC.MAX_AREA];

  let best: Candidate | null = null;

  for (const logic of logics) {
    for (const cmp of orderings) {
      const sorted = [...pool].sort(cmp);

      const packer = new MaxRectsPacker(
        parent.width,
        parent.length,
        marginPadding,
        {
          smart: true,
          pot: false,
          square: false,
          allowRotation: true,
          logic,
          border,
        }
      );

      packer.addArray(
        sorted.map((el) => ({
          width: el.width + inflateBy,
          height: el.length + inflateBy,
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
    if (best?.packer.bins.length === 1) break;
  }

  if (!best || best.packer.bins.length === 0) {
    // Greedy fallback: one bin per element to avoid returning an empty result
    const fallbackBins = pool.map((el) => {
      const fitsNoRotate =
        el.width <= parent.width && el.length <= parent.length;
      const useRot = !fitsNoRotate;
      const width = useRot ? el.length : el.width;
      const height = useRot ? el.width : el.length;
      return {
        width: parent.width,
        height: parent.length,
        rects: [
          {
            x: border,
            y: border,
            width,
            height,
            rot: useRot,
            data: el as unknown as Rectangle["data"],
          },
        ],
      };
    });
    //@ts-expect-error shape matches MaxRectsPacker bins contract
    return { bins: fallbackBins };
  }

  return best.packer;
}

/**
 * Simple 1D packer for steel lengths (treats margin as kerf between pieces).
 */
function packOneLength1D(
  parent: SteelLength,
  elements: SteelLengthElement[],
  profile: Machine | undefined
): MaxRectsPacker<Rectangle> {
  const border = profile?.border ?? 0;
  const kerf = profile?.margin ?? 0;

  const usableLength = parent.length - 2 * border;
  if (usableLength <= 0) {
    //@ts-expect-error deliberate shape match
    return { bins: [] };
  }

  const pool = elements.filter(
    (el) =>
      el.length <= usableLength &&
      el.width <= parent.width // keep width check for completeness
  );
  if (pool.length === 0) {
    //@ts-expect-error deliberate shape match
    return { bins: [] };
  }

  const orderings: ((a: SteelLengthElement, b: SteelLengthElement) => number)[] =
    [
      // Longest first
      (a, b) => b.length - a.length || b.width - a.width,
      // By area proxy
      (a, b) => b.length * b.width - a.length * a.width,
      // By width then length
      (a, b) => b.width - a.width || b.length - a.length,
    ];

  type Bin = {
    rects: Rectangle[];
    remaining: number;
    cursor: number;
  };

  let best: { bins: Bin[]; waste: number } | null = null;

  for (const cmp of orderings) {
    const sorted = [...pool].sort(cmp);
    const bins: Bin[] = [];

    for (const el of sorted) {
      let placed = false;

      for (const bin of bins) {
        const needed = (bin.rects.length === 0 ? 0 : kerf) + el.length;
        if (needed <= bin.remaining) {
          const y = bin.cursor + (bin.rects.length === 0 ? 0 : kerf);
          const rect = {
            x: border,
            y: border + y,
            width: parent.width - 2 * border,
            height: el.length,
            rot: false,
            data: el as unknown as Rectangle["data"],
          } as unknown as Rectangle;
          bin.rects.push(rect);
          bin.cursor = y + el.length;
          bin.remaining -= needed;
          placed = true;
          break;
        }
      }

      if (!placed) {
        if (el.length > usableLength) {
          continue;
        }
        const rect = {
          x: border,
          y: border,
          width: parent.width - 2 * border,
          height: el.length,
          rot: false,
          data: el as unknown as Rectangle["data"],
        } as unknown as Rectangle;

        const newBin: Bin = {
          rects: [rect],
          remaining: usableLength - el.length,
          cursor: el.length,
        };
        bins.push(newBin);
      }
    }

    const waste = bins.reduce((sum, b) => sum + b.remaining, 0);

    if (
      best === null ||
      bins.length < best.bins.length ||
      (bins.length === best.bins.length && waste < best.waste)
    ) {
      best = { bins, waste };
      if (bins.length <= 2) break;
    }
  }

  const outBins =
    best?.bins.map((b) => ({
      rects: b.rects,
      width: parent.width,
      height: parent.length,
    })) ?? [];

  return { bins: outBins } as unknown as MaxRectsPacker<Rectangle>;
}

function computeBest(
  elements: AnyElement[],
  selectedParents: Array<Sheet | SteelLength>,
  packerFactory: (
    parent: Sheet | SteelLength,
    elements: AnyElement[]
  ) => MaxRectsPacker<Rectangle>,
  allowedParentsByElementId?: Map<string, Set<string>>,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity,
  startTime = typeof performance !== "undefined" ? performance.now() : 0,
  deadlineMs = 1800
): DPResult {
  if (elements.length === 0) {
    return { totalArea: 0, counts: {}, layouts: [] };
  }

  // If we are over time budget, return a greedy approximation to keep UI responsive
  if (
    startTime &&
    typeof performance !== "undefined" &&
    performance.now() - startTime > deadlineMs
  ) {
    const greedy = approximateGreedy(elements, selectedParents, packerFactory);
    return greedy ?? { totalArea: Infinity, counts: {}, layouts: [] };
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
    const allowedElements = allowedParentsByElementId
      ? elements.filter((el) => {
          const allowed =
            allowedParentsByElementId.get(el.instanceId ?? "") ||
            allowedParentsByElementId.get(el.id);
          return !allowed || allowed.has(parent.id);
        })
      : elements;

    if (allowedElements.length === 0) continue;

    // If nothing can fit at all, skip this parent
    if (
      !allowedElements.some(
        (el) =>
          (el.width <= parent.width && el.length <= parent.length) ||
          (el.length <= parent.width && el.width <= parent.length)
      )
    ) {
      continue;
    }

    const packer = packerFactory(parent, allowedElements);
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

      const bestFound = computeBest(
        remaining,
        selectedParents,
        packerFactory,
        allowedParentsByElementId,
        memory,
        bestSoFar - areaCost,
        startTime,
        deadlineMs
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

function approximateGreedy(
  elements: AnyElement[],
  selectedParents: Array<Sheet | SteelLength>,
  packerFactory: (
    parent: Sheet | SteelLength,
    elements: AnyElement[]
  ) => MaxRectsPacker<Rectangle>
): DPResult | null {
  if (elements.length === 0 || selectedParents.length === 0) return null;

  const largestParent = [...selectedParents]
    .sort((a, b) => b.width * b.length - a.width * a.length)
    .find((p) => p);
  if (!largestParent) return null;

  const packer = packerFactory(largestParent, elements);
  const bins = packer.bins ?? [];
  if (bins.length === 0) return null;

  const layouts: ParentLayout[] = [];
  const parentArea = largestParent.width * largestParent.length;

  for (const bin of bins) {
    const rects = (bin.rects || []).map((r) => {
      const el = r.data as SheetElement;
      return {
        element: el,
        x: r.x,
        y: r.y,
        width: r.width,
        length: r.height,
        rotated: !!r.rot,
      } as PlacedRect;
    });

    if (rects.length === 0) continue;

    layouts.push({
      parentId: largestParent.id,
      parentName: largestParent.name,
      parentSize: `${formatEuropeanFloat(
        largestParent.length
      )}×${formatEuropeanFloat(largestParent.width)}`,
      parentArea,
      width: largestParent.width,
      length: largestParent.length,
      rectangles: rects,
    });
  }

  if (layouts.length === 0) return null;

  return {
    totalArea: parentArea * layouts.length,
    counts: { [largestParent.id]: layouts.length },
    layouts,
  };
}

/**
 * Sheet nesting with free rotation (default behavior).
 */
export function findBestForSheets(
  elements: SheetElement[],
  sheets: Sheet[],
  profile: Machine | undefined,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity
): DPResult {
  const packerFactory = (parent: Sheet | SteelLength, els: AnyElement[]) =>
    packOneSheet(parent as Sheet, els, profile);

  return computeBest(
    elements,
    sheets,
    packerFactory,
    undefined,
    memory,
    bestSoFar,
    typeof performance !== "undefined" ? performance.now() : 0,
    2400
  );
}

/**
 * Steel length nesting (uses the same packer but typically a fixed "saw" profile).
 */
export function findBestForLengths(
  elements: SteelLengthElement[],
  lengths: SteelLength[],
  profile: Machine | undefined,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity
): DPResult {
  const allowedParentsByElementId = new Map<string, Set<string>>();
  const packingAssociations = (profile as Machine & {
    lengthTypeAssociations?: LengthTypeAssociations[];
  }).lengthTypeAssociations;

  if (packingAssociations && packingAssociations.length > 0) {
    // Map by element id
    for (const association of packingAssociations) {
      if (!allowedParentsByElementId.has(association.childId)) {
        allowedParentsByElementId.set(association.childId, new Set<string>());
      }
      allowedParentsByElementId
        .get(association.childId)!
        .add(association.parentId);
    }

    // Also map by instanceId for the provided elements so per-instance lookups work
    for (const element of elements) {
      const allowedForId = allowedParentsByElementId.get(element.id);
      if (allowedForId && element.instanceId) {
        allowedParentsByElementId.set(element.instanceId, allowedForId);
      }
    }
  }

  const packerFactory = (parent: Sheet | SteelLength, els: AnyElement[]) =>
    USE_1D_LENGTH_PACKER
      ? packOneLength1D(parent as SteelLength, els as SteelLengthElement[], profile)
      : packOneSheet(parent as SteelLength, els, profile);

  return computeBest(
    elements,
    lengths,
    packerFactory,
    allowedParentsByElementId.size > 0 ? allowedParentsByElementId : undefined,
    memory,
    bestSoFar,
    typeof performance !== "undefined" ? performance.now() : 0,
    2400
  );
}

/**
 * Sheet nesting when only straight cuts are allowed.
 */
export function findBestForSheetsStraightCuts(
  elements: SheetElement[],
  sheets: Sheet[],
  profile: Machine,
  memory = new Map<string, DPResult>(),
  bestSoFar = Infinity
): DPResult {
  const packerFactory = (parent: Sheet | SteelLength, els: AnyElement[]) =>
    nestWithStraightCuts(parent as Sheet, els, profile);

  return computeBest(
    elements,
    sheets,
    packerFactory,
    undefined,
    memory,
    bestSoFar,
    typeof performance !== "undefined" ? performance.now() : 0,
    2400
  );
}

/** Straight-cuts: pack in rows/columns; now emits **multiple bins** */
export function nestWithStraightCuts(
  parent: Sheet | SteelLength,
  elements: AnyElement[],
  profile: Machine
): MaxRectsPacker<Rectangle> {
  const margin = profile.margin;

  const buildBins = (
    parentWidth: number,
    parentLength: number,
    items: AnyElement[]
  ) => {
    const usableWidth = parentWidth - 2 * profile.border;
    const usableHeight = parentLength - 2 * profile.border;
    const remaining: AnyElement[] = [...items];
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

    const byHeightWidth = (a: AnyElement, b: AnyElement) =>
      b.length - a.length || b.width - a.width;

    while (remaining.length > 0) {
      const rectsThisBin: PlacedRect[] = [];
      let currentY = profile.border;
      remaining.sort(byHeightWidth);

      while (remaining.length > 0) {
        const seed = remaining.shift();
        if (!seed) break;

        if (currentY + seed.length > usableHeight + profile.border) {
          // no space vertically; put back and break
          remaining.unshift(seed);
          break;
        }

        let rowX = profile.border;
        let rowRemaining = usableWidth;
        const rowHeight = seed.length;

        const place = (el: AnyElement) => {
          rectsThisBin.push({
            element: el,
            x: rowX,
            y: currentY,
            width: el.width,
            length: el.length,
            rotated: false,
          });
          rowX += el.width + margin;
          rowRemaining -= el.width + margin;
        };

        place(seed);

        // fill row with widest-first items that fit height
        for (let i = 0; i < remaining.length; ) {
          const cand = remaining[i];
          if (
            cand.length <= rowHeight &&
            cand.width + margin <= rowRemaining
          ) {
            place(cand);
            remaining.splice(i, 1);
          } else {
            i++;
          }
        }

        currentY += rowHeight + margin;
      }

      if (rectsThisBin.length === 0) {
        // Nothing fit in this bin; avoid emitting an empty bin that would recurse forever
        break;
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
        width: parentWidth,
        height: parentLength,
      });
    }
    return binsOut;
  };

  const binsA = buildBins(parent.width, parent.length, elements).filter(
    (b) => b.rects.length > 0
  );
  const binsB = buildBins(parent.length, parent.width, elements)
    .filter((b) => b.rects.length > 0)
    .map((b) => ({
      ...b,
      width: b.height,
      height: b.width,
      rects: b.rects.map((r) => ({
        ...r,
        x: r.y,
        y: r.x,
        width: r.height,
        height: r.width,
      })),
    }));

  const areaUsed = (bins: typeof binsA) =>
    bins.reduce(
      (s, b) => s + b.rects.reduce((t, r) => t + r.width * r.height, 0),
      0
    );

  const pick =
    binsA.length === 0 && binsB.length === 0
      ? []
      : binsA.length < binsB.length
      ? binsA
      : binsA.length > binsB.length
      ? binsB
      : areaUsed(binsA) >= areaUsed(binsB)
      ? binsA
      : binsB;

  return { bins: pick } as unknown as MaxRectsPacker<Rectangle>;
}

export function assessSheetFit(
  elements: SheetElement[],
  sheets: Sheet[],
  profile: Machine | undefined,
  language: string
): {
  unusableElements: SheetElement[];
  sheetSummaries: string[];
} {
  const border = profile?.border ?? 0;
  const unusableElements = elements.filter((element) => {
    return !sheets.some((sheet) => {
      const usableWidth = sheet.width - 2 * border;
      const usableLength = sheet.length - 2 * border;
      if (usableWidth <= 0 || usableLength <= 0) return false;

      return (
        (element.width <= usableWidth && element.length <= usableLength) ||
        (element.length <= usableWidth && element.width <= usableLength)
      );
    });
  });

  const usableLabel = language === "da" ? "brugbar" : "usable";
  const sheetSummaries = sheets.map((sheet) => {
    const base = `${sheet.name} (${formatEuropeanFloat(
      sheet.length
    )}×${formatEuropeanFloat(sheet.width)} mm)`;

    if (border > 0) {
      const usableWidth = Math.max(sheet.width - 2 * border, 0);
      const usableLength = Math.max(sheet.length - 2 * border, 0);
      return `${base} → ${usableLabel} ${formatEuropeanFloat(
        usableLength
      )}×${formatEuropeanFloat(usableWidth)} mm`;
    }

    return base;
  });

  return { unusableElements, sheetSummaries };
}

export function assessLengthFit(
  elements: SteelLengthElement[],
  lengths: SteelLength[],
  associations: LengthTypeAssociations[]
): {
  unusableElements: SteelLengthElement[];
  parentSummaries: string[];
} {
  const unusableElements = elements.filter((element) => {
    const associationsForElement = associations.filter(
      (association) => association.childId === element.id
    );

    const candidateLengths =
      associationsForElement.length > 0
        ? lengths.filter((steelLength) =>
            associationsForElement.some(
              (association) => association.parentId === steelLength.id
            )
          )
        : lengths;

    if (candidateLengths.length === 0) return true;

    return !candidateLengths.some((steelLength) => {
      const usableWidth = steelLength.width;
      const usableLength = steelLength.length;
      if (usableWidth <= 0 || usableLength <= 0) return false;

      return (
        (element.width <= usableWidth && element.length <= usableLength) ||
        (element.length <= usableWidth && element.width <= usableLength)
      );
    });
  });

  const parentSummaries = lengths.map(
    (steelLength) =>
      `${steelLength.name} (${formatEuropeanFloat(steelLength.length)} mm)`
  );

  return { unusableElements, parentSummaries };
}
