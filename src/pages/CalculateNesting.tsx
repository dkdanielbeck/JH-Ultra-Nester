import { loadLanguage } from "@/App";
import { useState } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2Icon, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { type Sheet, type MachineProfile, type Element, STORAGE_KEYS, type NestingResults } from "@/lib/types";
import { findBest, loadFromLocalStorage } from "@/lib/utils";

export default function CalculateNesting() {
  const [language] = useState<string>(() => loadLanguage());
  const [elements] = useState<Element[]>(() => loadFromLocalStorage(STORAGE_KEYS.ELEMENTS));
  const [sheets] = useState<Sheet[]>(() => loadFromLocalStorage(STORAGE_KEYS.SHEETS));
  const [machines] = useState<MachineProfile[]>(() => loadFromLocalStorage(STORAGE_KEYS.MACHINES));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [endResults, setEndResults] = useState<NestingResults>({
    sheets: [],
    totalMaterialArea: 0,
    totalElementsArea: 0,
    totalWaste: 0,
    layouts: [],
  });
  const [selectedElements, setSelectedElements] = useState<Element[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Sheet[]>(sheets);
  const [selectedProfile, setSelectedProfile] = useState<MachineProfile | undefined>(machines.length !== 0 ? machines.find((machine) => machine.default === true) : undefined);

  const toggleElementSelection = (element: Element) => {
    setSelectedElements((previous) => (previous.some((selectedElement) => element.id === selectedElement.id) ? previous : [...previous, element]));
    setQuantities((previous) => ({
      ...previous,
      [element.id]: 1,
    }));
  };

  const toggleSheetSelection = (sheet: Sheet) => {
    setSelectedSheets((previous) => (previous.some((selectedSheet) => sheet.id === selectedSheet.id) ? previous.filter((previousSheet) => previousSheet.id !== sheet.id) : [...previous, sheet]));
  };

  const toggleProfileSelection = (profile: MachineProfile) => {
    setSelectedProfile(profile);
  };

  const removeElement = (elementId: string) => {
    setSelectedElements((previous) => previous.filter((previousElement) => previousElement.id !== elementId));
    setQuantities((previous) => {
      const newQs = { ...previous };

      delete newQs[elementId];
      return newQs;
    });
  };

  const getResults = () => {
    setIsLoading(true);
    setTimeout(() => {
      const relevantElements: Element[] = selectedElements.flatMap((element) =>
        Array.from({ length: quantities[element.id] ?? 0 }).map(() => ({
          id: element.id,
          width: element.width,
          length: element.length,
          name: element.name,
          instanceId: crypto.randomUUID(),
        }))
      );

      const best = findBest(relevantElements, selectedSheets, selectedProfile);

      const results = selectedSheets
        .map((sheet) => ({
          sheetName: sheet.name,
          sheetSize: `${sheet.width}×${sheet.length}`,
          count: best.counts[sheet.id] || 0,
          sheetArea: sheet.width * sheet.length,
        }))

        .filter((sheet) => sheet.count > 0)
        .sort((a, b) => b.count - a.count);

      setEndResults({
        sheets: results,
        totalMaterialArea: best.totalArea,
        totalElementsArea: relevantElements.reduce((sum, element) => sum + element.width * element.length, 0),
        totalWaste: best.totalArea - relevantElements.reduce((sum, element) => sum + element.width * element.length, 0),
        layouts: best.layouts,
      });

      setIsLoading(false);
    }, 0);
  };

  return (
    <div className="flex max-h-[calc(100vh-100px)]">
      <div className="p-4 mb-2">
        <h1 className="text-2xl font-bold mb-4">{language === "da" ? "Udregn nesting" : "Calculate nesting"}</h1>
        <p className="mb-4">
          {language === "da"
            ? "På denne side kan du vælge hvilke plader og hvilke emner du ønsker at udregne nesting med"
            : "On this page you can select which sheets and which elements you wish to use to calculate nesting"}
        </p>

        <div className="flex flex-col gap-4 max-w-[calc(40vw)]">
          <div className="flex flex-row gap-6 max-w-[calc(40vw)]">
            {elements.length === 0 ? (
              <div className="flex">
                <ShieldAlert className="h-6 w-6 mr-2" />
                <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen emner endnu." : "You have not yet created any elements."}</p>

                <Link to={"/elements"} className="flex items-center gap-2 link">
                  <span>{language === "da" ? "Opret emner her" : "Create elements here"}</span>
                </Link>
              </div>
            ) : sheets.length === 0 || machines.length === 0 ? (
              <></>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg emner" : "Select elements"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {elements.map((element) => (
                    <DropdownMenuCheckboxItem
                      key={element.id}
                      checked={selectedElements.some((selectedElement) => element.id === selectedElement.id)}
                      onCheckedChange={() => toggleElementSelection(element)}
                    >
                      {element.name} ({element.length}×{element.width} mm)
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {sheets.length === 0 ? (
              <div className="flex">
                <ShieldAlert className="h-6 w-6 mr-2" />
                <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen plader endnu." : "You have not yet created any sheets."}</p>
                <Link to={"/sheets"} className="link">
                  <span>{language === "da" ? "Opret plader her" : "Create sheets here"}</span>
                </Link>
              </div>
            ) : elements.length === 0 || machines.length === 0 ? (
              <></>
            ) : (
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
            )}
            {machines.length === 0 ? (
              <div className="flex">
                <ShieldAlert className="h-6 w-6 mr-2" />
                <p className="mr-2">{language === "da" ? "Du har ikke oprettet nogen maskiner endnu." : "You have not yet created any machines."}</p>
                <Link to={"/machines"} className="link">
                  <span>{language === "da" ? "Opret maskiner her" : "Create machines here"}</span>
                </Link>
              </div>
            ) : sheets.length === 0 || elements.length === 0 ? (
              <></>
            ) : (
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
            )}

            {machines.length !== 0 && sheets.length !== 0 && elements.length !== 0 && (
              <div className="ml-auto">
                <Button disabled={isLoading || selectedSheets?.length === 0 || selectedElements?.length === 0 || selectedProfile === undefined} onClick={() => getResults()}>
                  {isLoading ? <Loader2Icon className="animate-spin" /> : language === "da" ? "Udregn nesting" : "Calculate nesting"}
                </Button>
              </div>
            )}
          </div>
          {selectedElements.length !== 0 && (
            <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
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
                  {selectedElements.map((selectedElement) => {
                    if (!selectedElement) return null;
                    return (
                      <TableRow key={selectedElement.id}>
                        <TableCell>{selectedElement.name}</TableCell>
                        <TableCell>{selectedElement.length}</TableCell>
                        <TableCell>{selectedElement.width}</TableCell>
                        <TableCell>
                          <Input
                            className="max-w-40"
                            placeholder={language === "da" ? "Antal" : "Quantity"}
                            type="number"
                            value={quantities[selectedElement.id] ?? 1}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [selectedElement.id]: parseInt(e.target.value || "1"),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="flex justify-end space-x-2">
                          <Button disabled={isLoading} variant="destructive" size="sm" onClick={() => removeElement(selectedElement.id)}>
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
      <div className="flex-grow pl-4 pr-4 max-w-[calc(47vw)]">
        {endResults.sheets.length !== 0 && selectedElements.length !== 0 && selectedSheets.length !== 0 && (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">{language === "da" ? "Resultat" : "Result"}</h2>
            <ul className="list-disc list-inside space-y-1">
              {endResults.sheets.map((sheet, index) => (
                <li key={index}>{language === "da" ? `Brug ${sheet.count} stk. ${sheet.sheetName} (${sheet.sheetSize})` : `Use ${sheet.count} sheet(s) of ${sheet.sheetName} (${sheet.sheetSize})`}</li>
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
                    const w = layout.width * globalScale;
                    const h = layout.length * globalScale;
                    const stroke = 4;
                    const inset = stroke / 2;

                    return (
                      <div key={i} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                          {layout.sheetName} ({layout.sheetSize})
                        </h3>
                        <svg className="sheet" width={w} height={h} viewBox={`0 0 ${layout.width} ${layout.length}`}>
                          {layout.rectangles.map((r, idx) => (
                            <rect
                              key={idx}
                              x={r.x + inset}
                              y={r.y + inset}
                              width={(r.rotated ? r.length : r.width) - stroke}
                              height={(r.rotated ? r.width : r.length) - stroke}
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
