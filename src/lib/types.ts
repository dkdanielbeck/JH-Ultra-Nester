export type Element = {
  id: string;
  name: string;
  width: number;
  length: number;
  instanceId?: string;
};

export type MachineProfile = {
  machineName: string;
  margin: number;
  border: number;
  id: string;
  default: boolean;
  straightCuts: boolean;
};

export type Sheet = {
  id: string;
  name: string;
  width: number;
  length: number;
};

export const STORAGE_KEYS = {
  ELEMENTS: "my-elements",
  SHEETS: "my-sheets",
  MACHINES: "my-machines",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageKeyMap = {
  [STORAGE_KEYS.ELEMENTS]: Element[];
  [STORAGE_KEYS.SHEETS]: Sheet[];
  [STORAGE_KEYS.MACHINES]: MachineProfile[];
};

export interface PlacedRect {
  element: Element;
  x: number;
  y: number;
  width: number;
  length: number;

  rotated: boolean;
}
export interface SheetLayout {
  sheetId: string;
  sheetName: string;
  sheetSize: string;
  sheetArea: number;
  width: number;
  length: number;
  rectangles: PlacedRect[];
}
export type SheetCount = Record<string, number>;

export type DPResult = {
  totalArea: number;
  counts: SheetCount;
  layouts: SheetLayout[];
};

export interface NestingResults {
  sheets: { sheetName: string; sheetSize: string; count: number; sheetArea: number }[];
  layouts: SheetLayout[];
  totalMaterialArea: number;
  totalElementsArea: number;
  totalWaste: number;
}
