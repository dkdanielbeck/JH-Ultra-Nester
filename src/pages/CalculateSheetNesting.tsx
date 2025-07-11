import { loadLanguage } from "@/App";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2Icon, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { type Sheet, type MachineProfile, type SheetElement, STORAGE_KEYS, type NestingResults, ComponentNames } from "@/lib/types";
import { loadItemsFromLocalStorage, loadNestingConfigurationFromLocalStorage, saveNestingConfigurationToLocalStorage } from "@/lib/utils-local-storage";
import { findBest } from "@/lib/utils-nesting";

export default function CalculateSheetNesting() {
  const savedConfig = loadNestingConfigurationFromLocalStorage(ComponentNames.calculateSheetNesting);

  const [language] = useState<string>(() => loadLanguage());
  const [sheetElements] = useState<SheetElement[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.SHEETELEMENTS));
  const [sheets] = useState<Sheet[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.SHEETS));
  const [machines] = useState<MachineProfile[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.MACHINES));
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
  const [selectedSheetElements, setSelectedElements] = useState<SheetElement[]>(savedConfig?.selectedElements || []);
  const [selectedSheets, setSelectedSheets] = useState<Sheet[]>(savedConfig?.selectedParents || sheets);
  const [selectedProfile, setSelectedProfile] = useState<MachineProfile | undefined>(() => {
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

  const toggleProfileSelection = (profile: MachineProfile) => {
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
    setIsLoading(true);
    setTimeout(() => {
      const relevantElements: SheetElement[] = selectedSheetElements.flatMap((sheetElement) =>
        Array.from({ length: quantities[sheetElement.id] ?? 0 }).map(() => ({
          id: sheetElement.id,
          width: sheetElement.width,
          length: sheetElement.length,
          name: sheetElement.name,
          instanceId: crypto.randomUUID(),
        }))
      );

      const best = findBest(relevantElements, selectedSheets, selectedProfile);

      const results = selectedSheets
        .map((sheet) => ({
          name: sheet.name,
          size: `${sheet.width}×${sheet.length}`,
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

      setIsLoading(false);
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
      <div className="flex-grow p-4 mb-2 w-1/2" style={{ borderRight: "1px solid var(--border)" }}>
        <h1 className="text-2xl font-bold mb-4">{language === "da" ? "Udregn plade nesting" : "Calculate sheet nesting"}</h1>
        <p className="mb-4 ">
          {language === "da"
            ? "På denne side kan du vælge hvilke plader og hvilke plade emner du ønsker at udregne nesting med"
            : "On this page you can select which sheets and which sheet elements you wish to use to calculate nesting"}
        </p>

        <div className="flex flex-col gap-4 ">
          {(sheets.length === 0 || machines.length === 0 || sheetElements.length === 0) && (
            <div className="flex flex-col gap-4  mt-8">
              {sheetElements.length === 0 && (
                <div className="flex">
                  <ShieldAlert className="h-6 w-6 mr-2" />
                  <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen plade emner endnu." : "You have not yet created any sheet elements."}</p>

                  <Link to={"/sheet-elements"} className="flex items-center gap-2 link">
                    <span>{language === "da" ? "Opret plade emner her" : "Create sheet elements here"}</span>
                  </Link>
                </div>
              )}

              {sheets.length === 0 && (
                <div className="flex ">
                  <ShieldAlert className="h-6 w-6 mr-2" />
                  <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen plader endnu." : "You have not yet created any sheets."}</p>
                  <Link to={"/sheets"} className="link">
                    <span>{language === "da" ? "Opret plader her" : "Create sheets here"}</span>
                  </Link>
                </div>
              )}

              {machines.length === 0 && (
                <div className="flex">
                  <ShieldAlert className="h-6 w-6 mr-2" />
                  <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen maskiner endnu." : "You have not yet created any machines."}</p>
                  <Link to={"/sheet-machines"} className="link">
                    <span>{language === "da" ? "Opret maskiner her" : "Create machines here"}</span>
                  </Link>
                </div>
              )}
            </div>
          )}
          {sheets.length !== 0 && machines.length !== 0 && sheetElements.length !== 0 && (
            <div className="flex flex-col gap-6 ">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg plade emner" : "Select sheet elements"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sheetElements.map((sheetElement) => (
                    <DropdownMenuCheckboxItem
                      key={sheetElement.id}
                      checked={selectedSheetElements.some((selectedElement) => sheetElement.id === selectedElement.id)}
                      onCheckedChange={() => toggleElementSelection(sheetElement)}
                    >
                      {sheetElement.name} ({sheetElement.length}×{sheetElement.width} mm)
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg plader" : "Select sheets"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sheets.map((sheet) => (
                    <DropdownMenuCheckboxItem key={sheet.id} checked={selectedSheets.some((selectedSheet) => sheet.id === selectedSheet.id)} onCheckedChange={() => toggleSheetSelection(sheet)}>
                      {sheet.name} ({sheet.length}×{sheet.width} mm)
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg maskine profil" : "Select machine profile"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {machines.map((machine) => (
                    <DropdownMenuCheckboxItem key={machine.id} checked={selectedProfile ? selectedProfile.id === machine.id : false} onCheckedChange={() => toggleProfileSelection(machine)}>
                      {machine.machineName}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {machines.length !== 0 && sheets.length !== 0 && sheetElements.length !== 0 && (
                <div className="w-full flex justify-between">
                  <Button className="w-[48%]" disabled={isLoading || selectedSheets?.length === 0 || selectedSheetElements?.length === 0 || selectedProfile === undefined} onClick={() => getResults()}>
                    {isLoading ? <Loader2Icon className="animate-spin" /> : language === "da" ? "Udregn nesting" : "Calculate nesting"}
                  </Button>
                  <Button
                    className="w-[48%]"
                    disabled={isLoading || (selectedSheets?.length === 0 && selectedSheetElements?.length === 0 && selectedProfile === undefined)}
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
                  <TableRow>
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
                      <TableRow key={selectedSheetElement.id}>
                        <TableCell>{selectedSheetElement.name}</TableCell>
                        <TableCell>{selectedSheetElement.length}</TableCell>
                        <TableCell>{selectedSheetElement.width}</TableCell>
                        <TableCell>
                          <Input
                            className="max-w-40"
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
                          <Button disabled={isLoading} variant="destructive" size="sm" onClick={() => removeElement(selectedSheetElement.id)}>
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
      <div className="flex-grow pl-4 pr-4 w-1/2">
        {endResults.nestingParent.length !== 0 && selectedSheetElements.length !== 0 && selectedSheets.length !== 0 && (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">{language === "da" ? "Resultat" : "Result"}</h2>
            <ul className="list-disc list-inside space-y-1">
              {endResults.nestingParent.map((sheet, index) => (
                <li key={index}>{language === "da" ? `Brug ${sheet.count} stk. ${sheet.name} (${sheet.size} mm)` : `Use ${sheet.count} sheet(s) of ${sheet.name} (${sheet.size} mm)`}</li>
              ))}
            </ul>
          </div>
        )}
        <>
          {endResults.layouts.length > 0 && <h2 className="text-xl font-semibold mb-2 pl-4 mt-4">{language === "da" ? "visualiseret" : "Visualized"}</h2>}

          {endResults.layouts.length > 0 &&
            (() => {
              const MAX_DIM = 450;

              // 1) find the largest sheet in your result set
              const maxW = Math.max(...endResults.layouts.map((l) => l.width));
              const maxH = Math.max(...endResults.layouts.map((l) => l.length));

              // 2) one single global scale factor
              const globalScale = Math.min(MAX_DIM / maxW, MAX_DIM / maxH);

              return (
                <div style={{ borderRadius: "10px" }} className="flex flex-wrap gap-4 overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
                  {endResults.layouts.map((layout, i) => {
                    const width = layout.width * globalScale;
                    const height = layout.length * globalScale;
                    const stroke = 4;
                    const inset = stroke / 2;

                    return (
                      <div key={i} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                          {layout.sheetName} ({layout.sheetSize + " mm"})
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
  );
}
