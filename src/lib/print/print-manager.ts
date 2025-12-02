export type PrintDensity = 1 | 2 | 4;

export interface PrintableItem {
  id: string;
  name: string;
  svgNode: SVGSVGElement;
}

interface NormalizedSvg {
  svg: SVGSVGElement;
  width: number;
  height: number;
}

const A4_WIDTH = 794; // px at 96 DPI
const A4_HEIGHT = 1123; // px at 96 DPI
const PAGE_PADDING = 32;
const GRID_GAP = 16;
const CELL_PADDING = 16;
const LABEL_HEIGHT = 22;
const SAFETY_MARGIN = 32; // leave headroom for browser headers/footers and rounding

export async function printVisualisations({
  items,
  density,
}: {
  items: PrintableItem[];
  density: PrintDensity;
}) {
  if (!items.length) {
    console.warn("printVisualisations: no items to print.");
    return;
  }

  const iframe = createIframe();
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;

  if (!doc || !win) {
    console.warn("printVisualisations: unable to access iframe document/window.");
    return;
  }

  doc.open();
  doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
  doc.close();

  injectStyles(doc);
  layoutPages(doc, items, density);

  await waitForReady(win);

  win.focus();
  win.print();

  const cleanup = () => iframe.remove();
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 1000);
}

function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);
  return iframe;
}

function injectStyles(doc: Document) {
  const style = doc.createElement("style");
  style.textContent = `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: white;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .print-page {
      width: ${A4_WIDTH}px;
      height: ${A4_HEIGHT}px;
      padding: ${PAGE_PADDING}px;
      display: grid;
      gap: ${GRID_GAP}px;
      background: white;
    }
    .print-page.page-break {
      page-break-after: always;
    }
    .viz-cell {
      background: white;
      border: 1px solid #dcdfe4;
      display: flex;
      flex-direction: column;
      padding: ${CELL_PADDING}px;
    }
    .viz-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 8px;
      text-align: center;
      color: #111827;
      min-height: ${LABEL_HEIGHT}px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .viz-svg-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      padding-bottom: 8px;
    }
    svg { display: block; }
    .sheet {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25), 0 4px 6px rgba(0, 0, 0, 0.15);
      filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2));
      background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
    }
  `;
  doc.head.appendChild(style);
}

function layoutPages(doc: Document, items: PrintableItem[], density: PrintDensity) {
  const pages = chunk(items, density);

  pages.forEach((pageItems, pageIndex) => {
    const { columns, rows } = getGrid(density);
    const page = doc.createElement("div");
    page.className = "print-page";

    if (pageIndex !== pages.length - 1) {
      page.classList.add("page-break");
    }

    page.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    page.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const { cellWidth, cellHeight } = computeCellSize(columns, rows);

    pageItems.forEach((item) => {
      const cell = doc.createElement("div");
      cell.className = "viz-cell";

      const title = doc.createElement("div");
      title.className = "viz-title";
      title.textContent = item.name;

      const svgWrapper = doc.createElement("div");
      svgWrapper.className = "viz-svg-wrapper";

      const normalized = normalizeSvg(item.svgNode);
      const innerWidth = Math.max(1, cellWidth - CELL_PADDING * 2);
      const innerHeight = Math.max(
        1,
        cellHeight - CELL_PADDING * 2 - LABEL_HEIGHT
      );
      const scale = Math.min(
        innerWidth / normalized.width,
        innerHeight / normalized.height
      );

      normalized.svg.setAttribute(
        "width",
        String(normalized.width * scale)
      );
      normalized.svg.setAttribute(
        "height",
        String(normalized.height * scale)
      );

      svgWrapper.appendChild(normalized.svg);
      cell.appendChild(title);
      cell.appendChild(svgWrapper);
      page.appendChild(cell);
    });

    doc.body.appendChild(page);
  });
}

function getGrid(density: PrintDensity): { columns: number; rows: number } {
  if (density === 1) return { columns: 1, rows: 1 };
  if (density === 2) return { columns: 2, rows: 1 };
  return { columns: 2, rows: 2 };
}

function computeCellSize(columns: number, rows: number) {
  const usableWidth = A4_WIDTH - PAGE_PADDING * 2;
  const usableHeight = A4_HEIGHT - PAGE_PADDING * 2 - SAFETY_MARGIN;

  const cellWidth =
    (usableWidth - GRID_GAP * Math.max(0, columns - 1)) / columns;
  const cellHeight =
    (usableHeight - GRID_GAP * Math.max(0, rows - 1)) / rows;

  return { cellWidth, cellHeight };
}

function normalizeSvg(svgNode: SVGSVGElement): NormalizedSvg {
  const clone = svgNode.cloneNode(true) as SVGSVGElement;
  const intrinsic = getIntrinsicSize(svgNode);

  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${intrinsic.width} ${intrinsic.height}`);
  }

  clone.style.transform = "";
  clone.removeAttribute("transform");
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");

  return { svg: clone, width: intrinsic.width, height: intrinsic.height };
}

function getIntrinsicSize(svgNode: SVGSVGElement): { width: number; height: number } {
  const viewBox = svgNode.viewBox?.baseVal;
  if (viewBox && viewBox.width && viewBox.height) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const widthAttr = svgNode.getAttribute("width");
  const heightAttr = svgNode.getAttribute("height");
  const width = widthAttr ? parseFloat(widthAttr) : 0;
  const height = heightAttr ? parseFloat(heightAttr) : 0;

  if (width && height) {
    return { width, height };
  }

  try {
    const bbox = svgNode.getBBox();
    if (bbox.width && bbox.height) {
      return { width: bbox.width, height: bbox.height };
    }
  } catch {
    // ignore
  }

  return { width: 1, height: 1 };
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function waitForReady(win: Window) {
  const doc = win.document as Document & { fonts?: { ready: Promise<void> } };

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  if (doc.fonts?.ready) {
    try {
      await doc.fonts.ready;
    } catch {
      // ignore font readiness errors
    }
  }
}
