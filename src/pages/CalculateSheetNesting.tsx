import { loadLanguage } from "@/App";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2Icon } from "lucide-react";
import { type Sheet, type Machine, type SheetElement, type NestingResults, ComponentNames, ITEMTYPES } from "@/lib/types";
import { loadNestingConfigurationFromLocalStorage, saveNestingConfigurationToLocalStorage } from "@/lib/utils-local-storage";
import { findBest } from "@/lib/utils-nesting";
import { formatResultsLine, getTotalPrice } from "@/lib/utils";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import DropdownMenuConsolidated from "@/components/my-components/DropdownMenuConsolidated";
import { fetchSheets } from "@/lib/database calls/sheets";
import { fetchSheetElements } from "@/lib/database calls/sheetElements";
import { fetchMachines } from "@/lib/database calls/sheetMachines";

export default function CalculateSheetNesting() {
  const savedConfig = loadNestingConfigurationFromLocalStorage(ComponentNames.calculateSheetNesting);

  const [language] = useState<string>(() => loadLanguage());
  const [sheetElements, setSheetElements] = useState<SheetElement[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(savedConfig?.quantities || {});
  const [endResults, setEndResults] = useState<NestingResults>(
    savedConfig?.endResults || {
      nestingParent: [],
      totalMaterialArea: 0,
      totalElementsArea: 0,
      totalWaste: 0,
      layouts: [],
    }
  );
  const [loading, setIsLoading] = useState<boolean>(false);

  const [selectedSheetElements, setSelectedElements] = useState<SheetElement[]>((savedConfig?.selectedElements as SheetElement[]) || []);
  const [selectedSheets, setSelectedSheets] = useState<Sheet[]>((savedConfig?.selectedParents as Sheet[]) || sheets);
  const [selectedProfile, setSelectedProfile] = useState<Machine | undefined>(() => {
    if (savedConfig?.selectedProfileId) {
      return machines.find((m) => m.id === savedConfig.selectedProfileId);
    }
    return machines.find((m) => m.default);
  });

  useEffect(() => {
    saveNestingConfigurationToLocalStorage(
      {
        selectedElements: selectedSheetElements,
        selectedParents: selectedSheets,
        selectedProfileId: selectedProfile?.id,
        quantities,
        endResults,
      },
      ComponentNames.calculateSheetNesting
    );
  }, [selectedSheetElements, selectedSheets, selectedProfile, quantities, endResults]);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const sheets = await fetchSheets();
        const machines = await fetchMachines();
        const sheetElements = await fetchSheetElements();
        setSheets(sheets);
        setMachines(machines);
        setSheetElements(sheetElements);
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (savedConfig?.selectedProfileId) {
      setSelectedProfile(machines.find((m) => m.id === savedConfig.selectedProfileId));
    }
    setSelectedProfile(machines.find((m) => m.default));
  }, [machines]);

  const toggleElementSelection = (sheetElement: SheetElement) => {
    setSelectedElements((previous) => (previous.some((selectedElement) => sheetElement.id === selectedElement.id) ? previous : [...previous, sheetElement]));
    setQuantities((previous) => ({
      ...previous,
      [sheetElement.id]: 1,
    }));
  };

  const toggleSheetSelection = (sheet: Sheet) => {
    setSelectedSheets((previous) => (previous.some((selectedSheet) => sheet.id === selectedSheet.id) ? previous.filter((previousSheet) => previousSheet.id !== sheet.id) : [...previous, sheet]));
  };

  const toggleProfileSelection = (profile: Machine) => {
    setSelectedProfile(profile);
  };

  const removeElement = (sheetElementId: string) => {
    setSelectedElements((previous) => previous.filter((previousElement) => previousElement.id !== sheetElementId));
    setQuantities((previous) => {
      const newQs = { ...previous };

      delete newQs[sheetElementId];
      return newQs;
    });
  };

  const getResults = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const relevantElements: SheetElement[] = selectedSheetElements.flatMap((sheetElement) =>
        Array.from({ length: quantities[sheetElement.id] ?? 0 }).map(() => ({
          id: sheetElement.id,
          width: sheetElement.width,
          length: sheetElement.length,
          name: sheetElement.name,
          type: sheetElement.type,
          instanceId: crypto.randomUUID(),
        }))
      );

      const best = findBest(relevantElements, selectedSheets, selectedProfile);

      const results = selectedSheets
        .map((sheet) => ({
          price: sheet?.price ?? 0,
          weight: sheet?.weight ?? 0,
          name: sheet.name,
          size: `${sheet.length}×${sheet.width}`,
          count: best.counts[sheet.id] || 0,
          area: sheet.width * sheet.length,
        }))

        .filter((sheet) => sheet.count > 0)
        .sort((a, b) => b.count - a.count);

      setEndResults({
        nestingParent: results,
        totalMaterialArea: best.totalArea,
        totalElementsArea: relevantElements.reduce((sum, sheetElement) => sum + sheetElement.width * sheetElement.length, 0),
        totalWaste: best.totalArea - relevantElements.reduce((sum, sheetElement) => sum + sheetElement.width * sheetElement.length, 0),
        layouts: best.layouts,
      });

      setIsCalculating(false);
    }, 0);
  };

  const clearSelections = () => {
    setEndResults({
      nestingParent: [],
      totalMaterialArea: 0,
      totalElementsArea: 0,
      totalWaste: 0,
      layouts: [],
    });
    setQuantities({});
    setSelectedElements([]);
    setSelectedSheets(sheets);
    setSelectedProfile(machines.find((m) => m.default));
  };

  return (
    <div className="flex max-h-[calc(100vh-100px)]">
      <div className="w-full">
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-4">{language === "da" ? "Udregn plade nesting" : "Calculate sheet nesting"}</h1>
          <p className="mb-4 w-full">
            {language === "da"
              ? "På denne side kan du vælge hvilke plader og hvilke plade emner du ønsker at udregne nesting med"
              : "On this page you can select which sheets and which sheet elements you wish to use to calculate nesting"}
          </p>
          {(sheets.length === 0 || machines.length === 0 || sheetElements.length === 0) && !loading && (
            <div className="flex flex-col gap-4 mt-8">
              {sheetElements.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.SheetElement} href="/sheet-elements" />}

              {sheets.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.Sheet} href="/sheets" />}

              {machines.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.Machine} href="/sheet-machines" />}
            </div>
          )}
        </div>
        {sheets.length !== 0 && sheetElements.length !== 0 && machines.length !== 0 && (
          <div className="flex w-full flex-col sm:flex-row ">
            <div className="flex-grow p-4 mb-2 sm:w-1/2 w-full">
              <div className="flex flex-col gap-4 ">
                {sheets.length !== 0 && machines.length !== 0 && sheetElements.length !== 0 && (
                  <div className="flex flex-col gap-6 mt-9">
                    <DropdownMenuConsolidated<SheetElement>
                      language={language}
                      items={sheetElements}
                      selectedItems={selectedSheetElements}
                      onSelect={(sheetElement) => toggleElementSelection(sheetElement)}
                    />

                    <DropdownMenuConsolidated<Sheet> language={language} items={sheets} selectedItems={selectedSheets} onSelect={(sheet) => toggleSheetSelection(sheet)} />
                    <DropdownMenuConsolidated<Machine>
                      language={language}
                      items={machines}
                      selectedItems={selectedProfile ? [selectedProfile] : []}
                      onSelect={(machine) => toggleProfileSelection(machine)}
                    />

                    {machines.length !== 0 && sheets.length !== 0 && sheetElements.length !== 0 && (
                      <div className="w-full flex justify-between">
                        <Button
                          className="w-[48%]"
                          disabled={isCalculating || selectedSheets?.length === 0 || selectedSheetElements?.length === 0 || selectedProfile === undefined}
                          onClick={() => getResults()}
                        >
                          {isCalculating ? <Loader2Icon className="animate-spin" /> : language === "da" ? "Udregn nesting" : "Calculate nesting"}
                        </Button>
                        <Button
                          className="w-[48%]"
                          disabled={isCalculating || (selectedSheets?.length === 0 && selectedSheetElements?.length === 0 && selectedProfile === undefined)}
                          variant="ghost"
                          onClick={clearSelections}
                        >
                          {language === "da" ? "Ryd" : "Clear"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {selectedSheetElements.length !== 0 && (
                  <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted ">
                    <Table>
                      <TableHeader className="top-0 bg-muted z-10">
                        <TableRow className="text-xs sm:text-base">
                          <TableHead className="cursor-pointer">{language === "da" ? "Navn" : "Name"}</TableHead>
                          <TableHead className="cursor-pointer">{language === "da" ? "Længde (mm)" : "Length (mm)"}</TableHead>

                          <TableHead className="cursor-pointer">{language === "da" ? "Bredde (mm)" : "Width (mm)"}</TableHead>
                          <TableHead>{language === "da" ? "Antal" : "Quantity"}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSheetElements.map((selectedSheetElement) => {
                          if (!selectedSheetElement) return null;
                          return (
                            <TableRow className="text-xs sm:text-base" key={selectedSheetElement.id}>
                              <TableCell>{selectedSheetElement.name}</TableCell>
                              <TableCell>{selectedSheetElement.length}</TableCell>
                              <TableCell>{selectedSheetElement.width}</TableCell>
                              <TableCell>
                                <Input
                                  className="max-w-40 text-xs sm:text-base"
                                  placeholder={language === "da" ? "Antal" : "Quantity"}
                                  type="number"
                                  value={quantities[selectedSheetElement.id] ?? 1}
                                  onChange={(e) =>
                                    setQuantities((prev) => ({
                                      ...prev,
                                      [selectedSheetElement.id]: parseInt(e.target.value || "1"),
                                    }))
                                  }
                                />
                              </TableCell>
                              <TableCell className="flex justify-end space-x-2">
                                <Button disabled={isCalculating} variant="destructive" size="sm" className="text-xs sm:text-base" onClick={() => removeElement(selectedSheetElement.id)}>
                                  {language === "da" ? "Slet" : "Remove"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow pl-4 pr-4 sm:w-1/2 w-full">
              {endResults.nestingParent.length !== 0 && selectedSheetElements.length !== 0 && selectedSheets.length !== 0 && (
                <>
                  <h2 className="text-xl font-semibold mb-2 pl-4 mt-4">{language === "da" ? "Resultat" : "Result"}</h2>
                  <div style={{ borderRadius: "10px" }} className="p-4 bg-muted text-xs sm:text-base">
                    <ul className="list-disc list-inside space-y-1">{endResults.nestingParent.map((parent, index) => formatResultsLine(parent, index))}</ul>
                    {getTotalPrice(endResults.nestingParent)}
                  </div>
                </>
              )}
              <>
                {endResults.layouts.length > 0 && <h2 className="text-xl font-semibold mb-2 pl-4 mt-4">{language === "da" ? "Visualiseret" : "Visualized"}</h2>}

                {endResults.layouts.length > 0 &&
                  (() => {
                    const MAX_DIM = 450;

                    // 1) find the largest sheet in your result set
                    const maxW = Math.max(...endResults.layouts.map((l) => l.width));
                    const maxH = Math.max(...endResults.layouts.map((l) => l.length));

                    // 2) one single global scale factor
                    const globalScale = Math.min(MAX_DIM / maxW, MAX_DIM / maxH);

                    return (
                      <div style={{ borderRadius: "10px" }} className="flex mb-4 flex-wrap gap-4 overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
                        {endResults.layouts.map((layout, i) => {
                          const width = layout.width * globalScale;
                          const height = layout.length * globalScale;
                          const stroke = 4;
                          const inset = stroke / 2;

                          return (
                            <div key={i} className="mb-4">
                              <h3 className="text-lg font-semibold mb-2">
                                {layout.parentName} ({layout.parentSize + " mm"})
                              </h3>
                              <svg className="sheet" width={width} height={height} viewBox={`0 0 ${layout.width} ${layout.length}`}>
                                {layout.rectangles.map((rectangle, idx) => (
                                  <rect
                                    key={idx}
                                    x={rectangle.x + inset}
                                    y={rectangle.y + inset}
                                    width={(rectangle.rotated ? rectangle.length : rectangle.width) - stroke}
                                    height={(rectangle.rotated ? rectangle.width : rectangle.length) - stroke}
                                    fill="#009eba"
                                    stroke="#0F47A1"
                                    strokeWidth={stroke}
                                  />
                                ))}
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
              </>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
