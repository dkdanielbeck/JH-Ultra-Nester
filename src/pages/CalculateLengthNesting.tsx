import { loadLanguage } from "@/App";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2Icon } from "lucide-react";
import { STORAGE_KEYS, type SteelLength, type SteelLengthElement, type NestingResults, ComponentNames, ITEMTYPES } from "@/lib/types";
import { loadItemsFromLocalStorage, loadNestingConfigurationFromLocalStorage, saveNestingConfigurationToLocalStorage } from "@/lib/utils-local-storage";
import { findBest } from "@/lib/utils-nesting";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import { formatResultsLine, getTotalPrice } from "@/lib/utils";

export default function CalculateLengthNesting() {
  const savedConfig = loadNestingConfigurationFromLocalStorage(ComponentNames.calculateLengthNesting);

  const [language] = useState<string>(() => loadLanguage());
  const [steelLengthElements] = useState<SteelLengthElement[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.STEELLENGTHELEMENTS));
  const [steelLengths] = useState<SteelLength[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.STEELLENGTHS));
  const [quantities, setQuantities] = useState<Record<string, number>>(savedConfig?.quantities || {});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [endResults, setEndResults] = useState<NestingResults>(
    savedConfig?.endResults || {
      nestingParent: [],
      totalMaterialArea: 0,
      totalElementsArea: 0,
      totalWaste: 0,
      layouts: [],
    }
  );
  const [selectedSteelLengthElements, setSelectedSteelLengthElements] = useState<SteelLengthElement[]>((savedConfig?.selectedElements as SteelLengthElement[]) || []);
  const [selectedSteelLengths, setSelectedSteelLengths] = useState<SteelLength[]>((savedConfig?.selectedParents as SteelLength[]) || steelLengths);

  useEffect(() => {
    saveNestingConfigurationToLocalStorage(
      {
        selectedElements: selectedSteelLengthElements,
        selectedParents: selectedSteelLengths,
        selectedProfileId: "",
        quantities,
        endResults,
      },
      ComponentNames.calculateLengthNesting
    );
  }, [selectedSteelLengthElements, selectedSteelLengths, quantities, endResults]);

  const toggleSteelElementSelection = (steelLengthElement: SteelLengthElement) => {
    setSelectedSteelLengthElements((previous) =>
      previous.some((selectedSteelLengthElement) => steelLengthElement.id === selectedSteelLengthElement.id) ? previous : [...previous, steelLengthElement]
    );
    setQuantities((previous) => ({
      ...previous,
      [steelLengthElement.id]: 1,
    }));
  };

  const toggleSteelLengthSelection = (steelLength: SteelLength) => {
    setSelectedSteelLengths((previous) =>
      previous.some((selectedSteelLength) => steelLength.id === selectedSteelLength.id)
        ? previous.filter((previousSteelLength) => previousSteelLength.id !== steelLength.id)
        : [...previous, steelLength]
    );
  };

  const removeSteelLengthElement = (steelLengthElementId: string) => {
    setSelectedSteelLengthElements((previous) => previous.filter((previousSteelLengthElement) => previousSteelLengthElement.id !== steelLengthElementId));
    setQuantities((previous) => {
      const newQs = { ...previous };

      delete newQs[steelLengthElementId];
      return newQs;
    });
  };

  const getResults = () => {
    setIsLoading(true);
    setTimeout(() => {
      const relevantElements: SteelLengthElement[] = selectedSteelLengthElements.flatMap((selectedSteelLengthElement) =>
        Array.from({ length: quantities[selectedSteelLengthElement.id] ?? 0 }).map(() => ({
          id: selectedSteelLengthElement.id,
          width: selectedSteelLengthElement.width,
          length: selectedSteelLengthElement.length,
          name: selectedSteelLengthElement.name,
          type: selectedSteelLengthElement.type,
          instanceId: crypto.randomUUID(),
        }))
      );

      const best = findBest(relevantElements, selectedSteelLengths, { border: 0, margin: 1.6, name: "Saw", id: "saw", default: false, straightCuts: false, type: ITEMTYPES.Machine });

      const results = selectedSteelLengths
        .map((steelLength) => ({
          price: steelLength?.price ?? 0,
          weight: steelLength?.weight ?? 0,
          name: steelLength.name,
          size: `${steelLength.length}`,
          count: best.counts[steelLength.id] || 0,
          area: steelLength.width * steelLength.length,
        }))

        .filter((steelLength) => steelLength.count > 0)
        .sort((a, b) => b.count - a.count);

      setEndResults({
        nestingParent: results,
        totalMaterialArea: best.totalArea,
        totalElementsArea: relevantElements.reduce((sum, element) => sum + element.width * element.length, 0),
        totalWaste: best.totalArea - relevantElements.reduce((sum, element) => sum + element.width * element.length, 0),
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
    setSelectedSteelLengthElements([]);
    setSelectedSteelLengths(steelLengths);
  };

  return (
    <div className="flex max-h-[calc(100vh-100px)]">
      <div className="flex-grow p-4 mb-2 w-1/2" style={{ borderRight: "1px solid var(--border)" }}>
        <h1 className="text-2xl font-bold mb-4">{language === "da" ? "Udregn stål længde nesting" : "Calculate steel length nesting"}</h1>
        <p className="mb-4 ">
          {language === "da"
            ? "På denne side kan du vælge hvilke stål længder og hvilke stål længde emner du ønsker at udregne nesting med"
            : "On this page you can select which steel lengths and which steel length elements you wish to use to calculate nesting"}
        </p>

        <div className="flex flex-col gap-4 ">
          {(steelLengths.length === 0 || steelLengthElements.length === 0) && (
            <div className="flex flex-col gap-4  mt-8">
              {steelLengthElements.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.SteelLengthElement} href="/steel-length-elements" />}

              {steelLengths.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.SteelLength} href="/steel-lengths" />}
            </div>
          )}
          {steelLengths.length !== 0 && steelLengthElements.length !== 0 && (
            <div className="flex flex-col gap-6 ">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg stål længde emmer" : "Select steel length elements"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {steelLengthElements.map((steelLengthElement) => (
                    <DropdownMenuCheckboxItem
                      key={steelLengthElement.id}
                      checked={selectedSteelLengthElements.some((selectedElement) => steelLengthElement.id === selectedElement.id)}
                      onCheckedChange={() => toggleSteelElementSelection(steelLengthElement)}
                    >
                      {steelLengthElement.name} ({steelLengthElement.length} mm)
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language === "da" ? "Vælg stål længder" : "Select steel lengths"}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {steelLengths.map((steelLength) => (
                    <DropdownMenuCheckboxItem
                      key={steelLength.id}
                      checked={selectedSteelLengths.some((selectedSteelLength) => steelLength.id === selectedSteelLength.id)}
                      onCheckedChange={() => toggleSteelLengthSelection(steelLength)}
                    >
                      {steelLength.name} ({steelLength.length} mm)
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {steelLengths.length !== 0 && steelLengthElements.length !== 0 && (
                <div className="w-full flex justify-between">
                  <Button className="w-[48%]" disabled={isLoading || selectedSteelLengths?.length === 0 || selectedSteelLengthElements?.length === 0} onClick={() => getResults()}>
                    {isLoading ? <Loader2Icon className="animate-spin" /> : language === "da" ? "Udregn nesting" : "Calculate nesting"}
                  </Button>
                  <Button className="w-[48%]" disabled={isLoading || (selectedSteelLengths?.length === 0 && selectedSteelLengthElements?.length === 0)} variant="ghost" onClick={clearSelections}>
                    {language === "da" ? "Ryd" : "Clear"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedSteelLengthElements.length !== 0 && (
            <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted ">
              <Table>
                <TableHeader className="top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="cursor-pointer">{language === "da" ? "Navn" : "Name"}</TableHead>
                    <TableHead className="cursor-pointer">{language === "da" ? "Længde (mm)" : "Length (mm)"}</TableHead>

                    <TableHead>{language === "da" ? "Antal" : "Quantity"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSteelLengthElements.map((selectedSteelLengthElement) => {
                    if (!selectedSteelLengthElement) return null;
                    return (
                      <TableRow key={selectedSteelLengthElement.id}>
                        <TableCell>{selectedSteelLengthElement.name}</TableCell>
                        <TableCell>{selectedSteelLengthElement.length}</TableCell>
                        <TableCell>
                          <Input
                            className="max-w-40"
                            placeholder={language === "da" ? "Antal" : "Quantity"}
                            type="number"
                            value={quantities[selectedSteelLengthElement.id] ?? 1}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [selectedSteelLengthElement.id]: parseInt(e.target.value || "1"),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="flex justify-end space-x-2">
                          <Button disabled={isLoading} variant="destructive" size="sm" onClick={() => removeSteelLengthElement(selectedSteelLengthElement.id)}>
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
        {endResults.nestingParent.length !== 0 && selectedSteelLengthElements.length !== 0 && selectedSteelLengths.length !== 0 && (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">{language === "da" ? "Resultat" : "Result"}</h2>
            <ul className="list-disc list-inside space-y-1">{endResults.nestingParent.map((parent, index) => formatResultsLine(parent, index))}</ul>
            {getTotalPrice(endResults.nestingParent)}
          </div>
        )}
        <>
          {endResults.layouts.length > 0 && <h2 className="text-xl font-semibold mb-2 pl-4 mt-4">{language === "da" ? "visualiseret" : "Visualized"}</h2>}

          {endResults.layouts.length > 0 &&
            (() => {
              const MAX_DIM = 500;

              // 1) find the largest sheet in your result set
              const maxW = Math.max(...endResults.layouts.map((l) => l.width));
              const maxH = Math.max(...endResults.layouts.map((l) => l.length));

              // 2) one single global scale factor
              const globalScale = Math.min(MAX_DIM / maxW, MAX_DIM / maxH);

              return (
                <div style={{ borderRadius: "10px" }} className="flex flex-wrap gap-4 overflow-auto p-4 bg-muted max-h-[calc(75vh)]">
                  {endResults.layouts.map((layout, i) => {
                    const width = layout.width * globalScale;
                    const height = layout.length * globalScale;
                    const stroke = 4;
                    const inset = stroke / 2;

                    return (
                      <div key={i} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                          {layout.parentName} ({layout.parentSize.slice(0, -4) + " mm"})
                        </h3>
                        <svg className="sheet mx-auto" width={width} height={height} viewBox={`0 0 ${layout.width} ${layout.length}`}>
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
