import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Eraser, Loader2Icon, Trash } from "lucide-react";
import {
  type Sheet,
  type Machine,
  type SheetElement,
  type NestingResults,
  ComponentNames,
  ITEMTYPES,
} from "@/lib/types";
import {
  loadLanguage,
  loadNestingConfigurationFromLocalStorage,
  saveNestingConfigurationToLocalStorage,
} from "@/lib/utils-local-storage";
import {
  assessSheetFit,
  findBestForSheets,
  findBestForSheetsStraightCuts,
} from "@/lib/utils-nesting";
import { formatEuropeanFloat } from "@/lib/utils";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import DropdownMenuConsolidated from "@/components/my-components/DropdownMenuConsolidated";
import { fetchSheets } from "@/lib/database calls/sheets";
import { fetchSheetElements } from "@/lib/database calls/sheetElements";
import { fetchMachines } from "@/lib/database calls/sheetMachines";
import TooltipButton from "@/components/my-components/TooltipButton";
import VisualisationCard from "@/components/my-components/VisualisationCard";
import ResultsCard from "@/components/my-components/ResultsCard";
import PageLayout from "@/components/my-components/PageLayout";
import NestingErrorModal from "@/components/my-components/NestingErrorModal";
import ZoomInButton from "@/components/my-components/ZoomInButton";
import ZoomOutButton from "@/components/my-components/ZoomOutButton";
import PrintButton from "@/components/my-components/PrintButton";
import {
  type PrintDensity,
  type PrintableItem,
  type PrintableResultsPage,
  printVisualisations,
} from "@/lib/print/print-manager";

export default function CalculateSheetNesting() {
  const savedConfigRef = useRef(
    loadNestingConfigurationFromLocalStorage(
      ComponentNames.calculateSheetNesting
    )
  );
  const savedConfig = savedConfigRef.current;

  const [language] = useState<string>(() => loadLanguage());
  const [sheetElements, setSheetElements] = useState<SheetElement[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    savedConfig?.quantities || {}
  );
  const [endResults, setEndResults] = useState<NestingResults>(
    savedConfig?.endResults || {
      nestingParent: [],
      totalMaterialArea: 0,
      totalElementsArea: 0,
      totalWaste: 0,
      layouts: [],
    }
  );
  const [vizSize, setVizSize] = useState<number>(savedConfig?.vizSize ?? 450);
  const [printDensity, setPrintDensity] = useState<PrintDensity>(1);
  const [loading, setIsLoading] = useState<boolean>(false);

  const [selectedSheetElements, setSelectedElements] = useState<SheetElement[]>(
    []
  );
  const [selectedSheets, setSelectedSheets] = useState<Sheet[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Machine | undefined>();
  const [unusableData, setUnusableData] = useState<{
    unusableElements: SheetElement[];
    parentSummaries: string[];
    selectedMachine?: Machine;
    extraDetails?: string[];
  } | null>(null);
  const vizRef = useRef<HTMLDivElement | null>(null);
  const svgRefs = useRef<Map<string, SVGSVGElement | null>>(new Map());

  useEffect(() => {
    saveNestingConfigurationToLocalStorage(
      {
        selectedElements: selectedSheetElements,
        selectedParents: selectedSheets,
        selectedProfileId: selectedProfile?.id,
        quantities,
        endResults,
        vizSize,
      },
      ComponentNames.calculateSheetNesting
    );
  }, [
    selectedSheetElements,
    selectedSheets,
    selectedProfile,
    quantities,
    endResults,
    vizSize,
  ]);

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
        setSelectedSheets(
          (savedConfigRef.current?.selectedParents as Sheet[]) ?? sheets
        );
        setSelectedElements(
          (savedConfigRef.current?.selectedElements as SheetElement[]) ?? []
        );
        setSelectedProfile(() => {
          if (savedConfigRef.current?.selectedProfileId) {
            return machines.find(
              (m) => m.id === savedConfigRef.current?.selectedProfileId
            );
          }
          return machines.find((m) => m.default);
        });
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [savedConfigRef]);

  useEffect(() => {
    if (savedConfig?.selectedProfileId) {
      setSelectedProfile(
        machines.find((m) => m.id === savedConfig.selectedProfileId)
      );
    } else {
      setSelectedProfile(machines.find((m) => m.default));
    }
  }, [machines, savedConfig]);

  const sheetLayoutData = useMemo(() => {
    const sortedLayouts = [...endResults.layouts].sort(
      (a, b) => b.width * b.length - a.width * a.length || b.width - a.width
    );

    const maxWidth =
      sortedLayouts.length > 0
        ? Math.max(...sortedLayouts.map((l) => l.width))
        : 1;
    const maxHeight =
      sortedLayouts.length > 0
        ? Math.max(...sortedLayouts.map((l) => l.length))
        : 1;

    return { sortedLayouts, maxWidth, maxHeight };
  }, [endResults.layouts]);

  const registerSvgRef = useCallback(
    (key: string) => (node: SVGSVGElement | null) => {
      if (node) {
        svgRefs.current.set(key, node);
      } else {
        svgRefs.current.delete(key);
      }
    },
    []
  );

  const handlePrint = useCallback(async () => {
    const printableItems: PrintableItem[] = [];

    sheetLayoutData.sortedLayouts.forEach((layout, index) => {
      const refKey = `${layout.parentId}-${index}`;
      const svgNode = svgRefs.current.get(refKey);
      if (!svgNode) return;
      printableItems.push({
        id: refKey,
        name: `${layout.parentName} (${layout.parentSize})`,
        svgNode,
      });
    });

    if (printableItems.length === 0) {
      console.warn("No visualisations available to print.");
      return;
    }

    const resultsPage: PrintableResultsPage | undefined =
      endResults.nestingParent.length > 0
        ? {
            title:
              language === "da"
                ? "Nesting resultat"
                : "Nesting results",
            items: endResults.nestingParent.map((parent) => {
              const pricePart =
                parent.weight && parent.price
                  ? ` → ${formatEuropeanFloat(
                      parent.count * parent.weight * parent.price
                    )} kr.`
                  : "";
              return `${parent.count} × ${parent.name} (${parent.size} mm)${pricePart}`;
            }),
            footer: [
              `${language === "da" ? "Materialeareal" : "Material area"}: ${formatEuropeanFloat(
                endResults.totalMaterialArea
              )} mm²`,
              `${language === "da" ? "Emneareal" : "Elements area"}: ${formatEuropeanFloat(
                endResults.totalElementsArea
              )} mm²`,
              `${language === "da" ? "Spild" : "Waste"}: ${formatEuropeanFloat(
                endResults.totalWaste
              )} mm²`,
            ],
          }
        : undefined;

    await printVisualisations({
      items: printableItems,
      density: printDensity,
      resultsPage,
    });
  }, [
    endResults.nestingParent,
    endResults.totalElementsArea,
    endResults.totalMaterialArea,
    endResults.totalWaste,
    language,
    printDensity,
    sheetLayoutData.sortedLayouts,
  ]);

  const globalScale =
    sheetLayoutData.sortedLayouts.length > 0
      ? Math.min(
          vizSize / sheetLayoutData.maxWidth,
          vizSize / sheetLayoutData.maxHeight
        )
      : 1;

  const toggleElementSelection = (sheetElement: SheetElement) => {
    setSelectedElements((previous) =>
      previous.some((selectedElement) => sheetElement.id === selectedElement.id)
        ? previous
        : [...previous, sheetElement]
    );
    setQuantities((previous) => ({
      ...previous,
      [sheetElement.id]: 1,
    }));
  };

  const selectAllElements = () => {
    setSelectedElements(sheetElements);
    setQuantities((prev) => {
      const next = { ...prev };
      for (const el of sheetElements) {
        if (!next[el.id]) next[el.id] = 1;
      }
      return next;
    });
  };

  const deselectAllElements = () => {
    setSelectedElements([]);
    setQuantities({});
  };

  const toggleSheetSelection = (sheet: Sheet) => {
    setSelectedSheets((previous) =>
      previous.some((selectedSheet) => sheet.id === selectedSheet.id)
        ? previous.filter((previousSheet) => previousSheet.id !== sheet.id)
        : [...previous, sheet]
    );
  };

  const selectAllSheets = () => {
    setSelectedSheets(sheets);
  };

  const deselectAllSheets = () => {
    setSelectedSheets([]);
  };

  const toggleProfileSelection = (profile: Machine) => {
    setSelectedProfile(profile);
  };

  const removeElement = (sheetElementId: string) => {
    setSelectedElements((previous) =>
      previous.filter(
        (previousElement) => previousElement.id !== sheetElementId
      )
    );
    setQuantities((previous) => {
      const newQs = { ...previous };

      delete newQs[sheetElementId];
      return newQs;
    });
  };

  const getResults = () => {
    setUnusableData(null);
    setIsCalculating(true);
    setTimeout(() => {
      const { unusableElements, sheetSummaries } = assessSheetFit(
        selectedSheetElements,
        selectedSheets,
        selectedProfile,
        language
      );

      if (unusableElements.length > 0) {
        setIsCalculating(false);

        setUnusableData({
          unusableElements,
          parentSummaries: sheetSummaries,
          selectedMachine: selectedProfile,
        });
        return;
      }

      const relevantElements: SheetElement[] = selectedSheetElements.flatMap(
        (sheetElement) =>
          Array.from({ length: quantities[sheetElement.id] ?? 0 }).map(() => ({
            id: sheetElement.id,
            width: sheetElement.width,
            length: sheetElement.length,
            name: sheetElement.name,
            type: sheetElement.type,
            instanceId: crypto.randomUUID(),
          }))
      );

      const computePrimary = () =>
        selectedProfile?.straightCuts
          ? findBestForSheetsStraightCuts(
              relevantElements,
              selectedSheets,
              selectedProfile
            )
          : findBestForSheets(
              relevantElements,
              selectedSheets,
              selectedProfile
            );

      const computeFallback = () =>
        selectedProfile?.straightCuts
          ? findBestForSheets(relevantElements, selectedSheets, selectedProfile)
          : selectedProfile
          ? findBestForSheetsStraightCuts(
              relevantElements,
              selectedSheets,
              selectedProfile
            )
          : null;

      let best = computePrimary();
      if (!best.layouts || best.layouts.length === 0) {
        const alt = computeFallback();
        if (alt && alt.layouts.length > 0) {
          best = alt;
        }
      }

      if (!best.layouts || best.layouts.length === 0) {
        setIsCalculating(false);
        const elementSummaries = relevantElements.map(
          (el) =>
            `${el.name ?? el.id} (${formatEuropeanFloat(
              el.length
            )}×${formatEuropeanFloat(el.width)} mm)`
        );

        setUnusableData({
          unusableElements: [],
          parentSummaries: [
            language === "da"
              ? "Ingen gyldig nesting kunne findes med de valgte plader og margin/border indstillinger."
              : "No valid nesting could be found with the selected sheets and margin/border settings.",
            language === "da"
              ? `Forsøgt med ${selectedProfile?.straightCuts ? "lige snit" : "fri rotation"}, samt alternativ strategi som også fejlede.`
              : `Tried with ${selectedProfile?.straightCuts ? "straight cuts" : "free rotation"}, plus the alternate strategy, but both failed.`,
          ],
          selectedMachine: selectedProfile,
          extraDetails: elementSummaries,
        });
        return;
      }

      const results = selectedSheets
        .map((sheet) => ({
          price: sheet?.price ?? 0,
          weight: sheet?.weight ?? 0,
          name: sheet.name,
          size: `${formatEuropeanFloat(sheet.length)}×${formatEuropeanFloat(
            sheet.width
          )}`,
          count: best.counts[sheet.id] || 0,
          area: sheet.width * sheet.length,
        }))

        .filter((sheet) => sheet.count > 0)
        .sort((a, b) => b.count - a.count);

      setEndResults({
        nestingParent: results,
        totalMaterialArea: best.totalArea,
        totalElementsArea: relevantElements.reduce(
          (sum, sheetElement) => sum + sheetElement.width * sheetElement.length,
          0
        ),
        totalWaste:
          best.totalArea -
          relevantElements.reduce(
            (sum, sheetElement) =>
              sum + sheetElement.width * sheetElement.length,
            0
          ),
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
    <PageLayout
      title={
        language === "da" ? "Udregn plade nesting" : "Calculate sheet nesting"
      }
      description={
        language === "da"
          ? "På denne side kan du vælge hvilke plader og hvilke plade emner du ønsker at udregne nesting med"
          : "On this page you can select which sheets and which sheet elements you wish to use to calculate nesting"
      }
    >
      <div className="w-full">
        {(sheets.length === 0 ||
          machines.length === 0 ||
          sheetElements.length === 0) &&
          !loading && (
            <div className="flex flex-col gap-4 mt-8">
              {sheetElements.length === 0 && (
                <EmptyStateLine
                  language={language}
                  type={ITEMTYPES.SheetElement}
                  href="/sheet-elements"
                />
              )}

              {sheets.length === 0 && (
                <EmptyStateLine
                  language={language}
                  type={ITEMTYPES.Sheet}
                  href="/sheets"
                />
              )}

              {machines.length === 0 && (
                <EmptyStateLine
                  language={language}
                  type={ITEMTYPES.Machine}
                  href="/sheet-machines"
                />
              )}
            </div>
          )}
      </div>
      {sheets.length !== 0 &&
        sheetElements.length !== 0 &&
        machines.length !== 0 && (
          <div className="flex w-full flex-col sm:flex-row gap-4">
            <div className="flex-grow mb-2 sm:w-1/2 w-full">
              <div className="flex flex-col gap-4">
                {sheets.length !== 0 &&
                  machines.length !== 0 &&
                  sheetElements.length !== 0 && (
                    <div className="flex flex-col gap-6 mt-9">
                      <DropdownMenuConsolidated<SheetElement>
                        language={language}
                        items={sheetElements}
                        selectedItems={selectedSheetElements}
                        onSelect={(sheetElement) =>
                          toggleElementSelection(sheetElement)
                        }
                        onSelectAll={selectAllElements}
                        onDeselectAll={deselectAllElements}
                        disableSelectAll={
                          selectedSheetElements.length === sheetElements.length
                        }
                        disableDeselectAll={selectedSheetElements.length === 0}
                      />

                      <DropdownMenuConsolidated<Sheet>
                        language={language}
                        items={sheets}
                        selectedItems={selectedSheets}
                        onSelect={(sheet) => toggleSheetSelection(sheet)}
                        onSelectAll={selectAllSheets}
                        onDeselectAll={deselectAllSheets}
                        disableSelectAll={selectedSheets.length === sheets.length}
                        disableDeselectAll={selectedSheets.length === 0}
                      />
                      <DropdownMenuConsolidated<Machine>
                        language={language}
                        items={machines}
                        selectedItems={selectedProfile ? [selectedProfile] : []}
                        onSelect={(machine) => toggleProfileSelection(machine)}
                      />

                      {machines.length !== 0 &&
                        sheets.length !== 0 &&
                        sheetElements.length !== 0 && (
                          <div className="w-full flex justify-between">
                            <TooltipButton
                              disabled={
                                isCalculating ||
                                (selectedSheets?.length === 0 &&
                                  selectedSheetElements?.length === 0 &&
                                  selectedProfile === undefined)
                              }
                              ButtonIcon={Eraser}
                              text={language === "da" ? "Ryd" : "Clear"}
                              variant="ghost"
                              onClick={clearSelections}
                            />

                            <Button
                              className="w-[92%] tooltip-button"
                              data-tooltip-variant={"default"}
                              disabled={
                                isCalculating ||
                                selectedSheets?.length === 0 ||
                                selectedSheetElements?.length === 0 ||
                                selectedProfile === undefined
                              }
                              onClick={() => getResults()}
                            >
                              {isCalculating ? (
                                <Loader2Icon className="animate-spin" />
                              ) : language === "da" ? (
                                "Udregn nesting"
                              ) : (
                                "Calculate nesting"
                              )}
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                {selectedSheetElements.length !== 0 && (
                  <div
                    style={{ borderRadius: "10px" }}
                    className="flex-grow overflow-auto p-4 bg-muted "
                  >
                    <Table>
                      <TableHeader className="top-0 bg-muted z-10">
                        <TableRow className="text-xs sm:text-base">
                          <TableHead>
                            {language === "da" ? "Navn" : "Name"}
                          </TableHead>
                          <TableHead>
                            {language === "da" ? "Længde (mm)" : "Length (mm)"}
                          </TableHead>

                          <TableHead>
                            {language === "da" ? "Bredde (mm)" : "Width (mm)"}
                          </TableHead>
                          <TableHead>
                            {language === "da" ? "Antal" : "Quantity"}
                          </TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSheetElements.map((selectedSheetElement) => {
                          if (!selectedSheetElement) return null;
                          return (
                            <TableRow
                              className="text-xs sm:text-base"
                              key={selectedSheetElement.id}
                            >
                              <TableCell>{selectedSheetElement.name}</TableCell>
                              <TableCell>
                                {formatEuropeanFloat(
                                  selectedSheetElement.length
                                )}
                              </TableCell>
                              <TableCell>
                                {formatEuropeanFloat(
                                  selectedSheetElement.width
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="max-w-20 text-xs sm:text-base"
                                  placeholder={
                                    language === "da" ? "Antal" : "Quantity"
                                  }
                                  type="number"
                                  value={
                                    quantities[selectedSheetElement.id] ?? 1
                                  }
                                  onChange={(e) =>
                                    setQuantities((prev) => ({
                                      ...prev,
                                      [selectedSheetElement.id]: parseInt(
                                        e.target.value || "1"
                                      ),
                                    }))
                                  }
                                />
                              </TableCell>
                              <TableCell className="flex justify-end space-x-2">
                                <TooltipButton
                                  disabled={isCalculating}
                                  variant="destructive"
                                  ButtonIcon={Trash}
                                  text={language === "da" ? "Slet" : "Remove"}
                                  onClick={() =>
                                    removeElement(selectedSheetElement.id)
                                  }
                                />
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
            <div className="flex-grow sm:w-1/2 w-full">
              {endResults.nestingParent.length !== 0 &&
                selectedSheetElements.length !== 0 &&
                selectedSheets.length !== 0 && (
                  <ResultsCard language={language} endResults={endResults} />
                )}
              <>
                {sheetLayoutData.sortedLayouts.length > 0 && (
                  <div className="flex items-center justify-between pr-4 pl-4 mt-4 mb-2">
                    <h2 className="text-xl font-semibold">
                      {language === "da" ? "Visualiseret" : "Visualized"}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <PrintButton
                        language={language}
                        density={printDensity}
                        onDensityChange={(next) => setPrintDensity(next)}
                        onPrint={handlePrint}
                        disabled={
                          isCalculating || sheetLayoutData.sortedLayouts.length === 0
                        }
                      />
                      <ZoomOutButton
                        language={language}
                        disabled={vizSize <= 400}
                        onClick={() =>
                          setVizSize((prev) => Math.max(400, prev - 50))
                        }
                      />
                      <ZoomInButton
                        language={language}
                        disabled={vizSize >= 1000}
                        onClick={() =>
                          setVizSize((prev) => Math.min(1000, prev + 50))
                        }
                      />
                    </div>
                  </div>
                )}

                {sheetLayoutData.sortedLayouts.length > 0 && (
                  <div
                    ref={vizRef}
                    style={{ borderRadius: "10px" }}
                    className="flex mb-4 flex-wrap gap-4 overflow-auto p-4 bg-muted max-h-[calc(68vh)]"
                  >
                    {sheetLayoutData.sortedLayouts.map((layout, i) => (
                      <VisualisationCard
                        key={layout.parentId + i}
                        layout={layout}
                        scaleFactor={globalScale}
                        svgRef={registerSvgRef(`${layout.parentId}-${i}`)}
                      />
                    ))}
                  </div>
                )}
              </>
            </div>
          </div>
        )}
      {unusableData && (
        <NestingErrorModal
          language={language}
          unusableElements={unusableData.unusableElements}
          parentSummaries={unusableData.parentSummaries}
          selectedMachine={unusableData.selectedMachine}
          parentLabel={language === "da" ? "Valgte plader" : "Selected sheets"}
          onClose={() => setUnusableData(null)}
        />
      )}
    </PageLayout>
  );
}
