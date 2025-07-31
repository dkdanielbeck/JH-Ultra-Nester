export type Sheet = {
  id: string;
  name: string;
  width: number;
  length: number;
  weight?: number;
  price?: number;
  type: typeof ITEMTYPES.Sheet;
};

export type SheetElement = {
  id: string;
  name: string;
  width: number;
  length: number;
  instanceId?: string;
  type: typeof ITEMTYPES.SheetElement;
};
export type SteelLength = {
  id: string;
  name: string;
  length: number;
  width: number;
  weight?: number;
  price?: number;
  type: typeof ITEMTYPES.SteelLength;
};
export type SteelLengthElement = {
  id: string;
  name: string;
  length: number;
  width: number;
  instanceId?: string;

  type: typeof ITEMTYPES.SteelLengthElement;
};

export type Machine = {
  name: string;
  margin: number;
  border: number;
  id: string;
  default: boolean;
  straightCuts: boolean;
  type: typeof ITEMTYPES.Machine;
};

export const ITEMTYPES = {
  Sheet: "sheet",
  SheetElement: "sheet-element",
  SteelLength: "steel-length",
  SteelLengthElement: "steel-length-element",
  Machine: "machine",
} as const;

export type ItemTypeEnum = (typeof ITEMTYPES)[keyof typeof ITEMTYPES];

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
  [STORAGE_KEYS.MACHINES]: Machine[];
};

export interface PlacedRect {
  element: SheetElement | SteelLengthElement;
  x: number;
  y: number;
  width: number;
  length: number;

  rotated: boolean;
}
export interface ParentLayout {
  parentId: string;
  parentName: string;
  parentSize: string;
  parentArea: number;
  width: number;
  length: number;
  rectangles: PlacedRect[];
}
export type SheetCount = Record<string, number>;

export type DPResult = {
  totalArea: number;
  counts: SheetCount;
  layouts: ParentLayout[];
};

export interface NestingResults {
  nestingParent: NestingParent[];
  layouts: ParentLayout[];
  totalMaterialArea: number;
  totalElementsArea: number;
  totalWaste: number;
}

export interface NestingParent {
  name: string;
  size: string;
  count: number;
  area: number;
  weight: number;
  price: number;
}

export type InputField = "name" | "width" | "length" | "margin" | "border" | "weight" | "price" | "email";

export const InputFieldValues: Record<InputField, InputField> = {
  name: "name",
  email: "email",
  width: "width",
  length: "length",
  margin: "margin",
  border: "border",
  weight: "border",
  price: "border",
};

export type ComponentName = "mySheetElements" | "mySheets" | "mySteelLengths" | "mySteelLengthElements" | "myMachines" | "calculateSheetNesting" | "calculateLengthNesting" | "signIn";

export const ComponentNames: Record<ComponentName, ComponentName> = {
  mySheetElements: "mySheetElements",
  mySheets: "mySheets",
  mySteelLengths: "mySteelLengths",
  mySteelLengthElements: "mySteelLengthElements",
  myMachines: "myMachines",
  calculateSheetNesting: "calculateSheetNesting",
  calculateLengthNesting: "calculateLengthNesting",
  signIn: "signIn",
};

export interface SavedNestingConfiguration {
  selectedElements: SheetElement[] | SteelLengthElement[];
  selectedParents: Sheet[] | SteelLength[];
  selectedProfileId: string | undefined;
  quantities: Record<string, number>;
  endResults: NestingResults;
}

export type ItemType = Sheet | SheetElement | SteelLength | SteelLengthElement | Machine;
