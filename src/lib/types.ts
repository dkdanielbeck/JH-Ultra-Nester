export type SheetElement = {
  id: string;
  name: string;
  width: number;
  length: number;
  instanceId?: string;
};
export type SteelLength = {
  id: string;
  name: string;
  length: number;
  width: number;
};
export type SteelLengthElement = {
  id: string;
  name: string;
  length: number;
  width: number;
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
  SHEETELEMENTS: "my-sheet-elements",
  SHEETS: "my-sheets",
  MACHINES: "my-machines",
  STEELLENGTHS: "my-steel-lengths",
  STEELLENGTHELEMENTS: "my-steel-length-elements",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageKeyMap = {
  [STORAGE_KEYS.SHEETELEMENTS]: SheetElement[];
  [STORAGE_KEYS.SHEETS]: Sheet[];
  [STORAGE_KEYS.STEELLENGTHS]: SteelLength[];
  [STORAGE_KEYS.STEELLENGTHELEMENTS]: SteelLengthElement[];
  [STORAGE_KEYS.MACHINES]: MachineProfile[];
};

export interface PlacedRect {
  sheetElement: SheetElement;
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
  nestingParent: { name: string; size: string; count: number; area: number }[];
  layouts: SheetLayout[];
  totalMaterialArea: number;
  totalElementsArea: number;
  totalWaste: number;
}

export type InputField = "name" | "width" | "length" | "margin" | "border";

export const InputFieldValues: Record<InputField, InputField> = {
  name: "name",
  width: "width",
  length: "length",
  margin: "margin",
  border: "border",
};

export type ComponentName = "mySheetElements" | "mySheets" | "mySteelLengths" | "mySteelLengthElements" | "myMachines" | "calculateSheetNesting" | "calculateLengthNesting";

export const ComponentNames: Record<ComponentName, ComponentName> = {
  mySheetElements: "mySheetElements",
  mySheets: "mySheets",
  mySteelLengths: "mySteelLengths",
  mySteelLengthElements: "mySteelLengthElements",
  myMachines: "myMachines",
  calculateSheetNesting: "calculateSheetNesting",
  calculateLengthNesting: "calculateLengthNesting",
};

export interface SavedNestingConfiguration {
  selectedElements: SheetElement[] | SteelLengthElement[];
  selectedParents: Sheet[] | SteelLength[];
  selectedProfileId: string | undefined;
  quantities: Record<string, number>;
  endResults: NestingResults;
}
