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
  type SteelLength,
  type SteelLengthElement,
  type NestingResults,
  ComponentNames,
  ITEMTYPES,
  type Machine,
  type LengthTypeAssociations,
} from "@/lib/types";
import {
  loadLanguage,
  loadNestingConfigurationFromLocalStorage,
  saveNestingConfigurationToLocalStorage,
} from "@/lib/utils-local-storage";
import { assessLengthFit, findBestForLengths } from "@/lib/utils-nesting";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import { formatEuropeanFloat } from "@/lib/utils";
import DropdownMenuConsolidated from "@/components/my-components/DropdownMenuConsolidated";
import { fetchSteelLengthElements } from "@/lib/database calls/steelLengthElements";
import { fetchSteelLengths } from "@/lib/database calls/steelLengths";
import TooltipButton from "@/components/my-components/TooltipButton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  printVisualisations,
} from "@/lib/print/print-manager";

export default function CalculateLengthNesting() {
  const savedConfigRef = useRef(
    loadNestingConfigurationFromLocalStorage(
      ComponentNames.calculateLengthNesting
    )
  );
  const savedConfig = savedConfigRef.current;

  const [loading, setIsLoading] = useState<boolean>(false);

  const [language] = useState<string>(() => loadLanguage());
  const [steelLengthElements, setSteelLengthElements] = useState<
    SteelLengthElement[]
  >([]);
  const [steelLengths, setSteelLengths] = useState<SteelLength[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    savedConfig?.quantities || {}
  );
  const [calculating, setIsCalculating] = useState<boolean>(false);
  const [endResults, setEndResults] = useState<NestingResults>(
    savedConfig?.endResults || {
      nestingParent: [],
      totalMaterialArea: 0,
      totalElementsArea: 0,
      totalWaste: 0,
      layouts: [],
    }
  );
  const [vizSize, setVizSize] = useState<number>(savedConfig?.vizSize ?? 500);
  const [printDensity, setPrintDensity] = useState<PrintDensity>(1);
  const [selectedSteelLengthElements, setSelectedSteelLengthElements] =
    useState<SteelLengthElement[]>([]);
  const [selectedSteelLengths, setSelectedSteelLengths] = useState<
    SteelLength[]
  >([]);
  const [selectedLengthTypeAssociations, setSelectedLengthTypeAssociations] =
    useState<LengthTypeAssociations[]>([]);
  const [unusableData, setUnusableData] = useState<{
    unusableElements: SteelLengthElement[];
    parentSummaries: string[];
    selectedMachine?: Machine;
  } | null>(null);
  const vizRef = useRef<HTMLDivElement | null>(null);
  const svgRefs = useRef<Map<string, SVGSVGElement | null>>(new Map());

  useEffect(() => {
    saveNestingConfigurationToLocalStorage(
      {
        selectedElements: selectedSteelLengthElements,
        selectedParents: selectedSteelLengths,
        selectedProfileId: "",
        quantities,
        endResults,
        lengthTypeAssociations: selectedLengthTypeAssociations,
        vizSize,
      },
      ComponentNames.calculateLengthNesting
    );
  }, [
    selectedSteelLengthElements,
    selectedSteelLengths,
    selectedLengthTypeAssociations,
    quantities,
    endResults,
    vizSize,
  ]);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const steelLengths = await fetchSteelLengths();
        const steelLengthElements = await fetchSteelLengthElements();
        setSteelLengths(steelLengths);
        setSteelLengthElements(steelLengthElements);
        setSelectedSteelLengths(
          (savedConfigRef.current?.selectedParents as SteelLength[]) ??
            steelLengths
        );
        setSelectedSteelLengthElements(
          (savedConfigRef.current?.selectedElements as SteelLengthElement[]) ??
            []
        );
        setSelectedLengthTypeAssociations(
          (savedConfigRef.current
            ?.lengthTypeAssociations as LengthTypeAssociations[]) ?? []
        );
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [savedConfigRef]);

  const lengthLayoutData = useMemo(() => {
    const layouts = [...endResults.layouts];
    const maxWidth =
      layouts.length > 0 ? Math.max(...layouts.map((l) => l.width)) : 1;
    const maxHeight =
      layouts.length > 0 ? Math.max(...layouts.map((l) => l.length)) : 1;

    return { layouts, maxWidth, maxHeight };
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

    lengthLayoutData.layouts.forEach((layout, index) => {
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

    await printVisualisations({
      items: printableItems,
      density: printDensity,
    });
  }, [lengthLayoutData.layouts, printDensity]);

  const globalScale =
    lengthLayoutData.layouts.length > 0
      ? Math.min(
          vizSize / lengthLayoutData.maxWidth,
          vizSize / lengthLayoutData.maxHeight
        )
      : 1;

  const toggleSteelElementSelection = (
    steelLengthElement: SteelLengthElement
  ) => {
    setSelectedSteelLengthElements((previous) =>
      previous.some(
        (selectedSteelLengthElement) =>
          steelLengthElement.id === selectedSteelLengthElement.id
      )
        ? previous
        : [...previous, steelLengthElement]
    );
    setQuantities((previous) => ({
      ...previous,
      [steelLengthElement.id]: 1,
    }));
  };

  const selectAllElements = () => {
    setSelectedSteelLengthElements(steelLengthElements);
    setQuantities((prev) => {
      const next = { ...prev };
      for (const el of steelLengthElements) {
        if (!next[el.id]) next[el.id] = 1;
      }
      return next;
    });
  };

  const deselectAllElements = () => {
    setSelectedSteelLengthElements([]);
    setQuantities({});
    setSelectedLengthTypeAssociations([]);
  };

  const toggleSteelLengthSelection = (steelLength: SteelLength) => {
    setSelectedSteelLengths((previous) =>
      previous.some(
        (selectedSteelLength) => steelLength.id === selectedSteelLength.id
      )
        ? previous.filter(
            (previousSteelLength) => previousSteelLength.id !== steelLength.id
          )
        : [...previous, steelLength]
    );
  };

  const selectAllLengths = () => {
    setSelectedSteelLengths(steelLengths);
  };

  const deselectAllLengths = () => {
    setSelectedSteelLengths([]);
    setSelectedLengthTypeAssociations([]);
  };

  const removeSteelLengthElement = (steelLengthElementId: string) => {
    setSelectedSteelLengthElements((previous) =>
      previous.filter(
        (previousSteelLengthElement) =>
          previousSteelLengthElement.id !== steelLengthElementId
      )
    );
    setQuantities((previous) => {
      const newQs = { ...previous };

      delete newQs[steelLengthElementId];
      return newQs;
    });
  };

  const getResults = () => {
    setUnusableData(null);
    setIsCalculating(true);
    setTimeout(() => {
      const { unusableElements, parentSummaries } = assessLengthFit(
        selectedSteelLengthElements,
        selectedSteelLengths,
        selectedLengthTypeAssociations
      );

      const sawMachine: Machine & {
        lengthTypeAssociations: LengthTypeAssociations[];
      } = {
        border: 0,
        margin: 1.6,
        name: "Saw",
        id: "saw",
        default: false,
        straightCuts: false,
        type: ITEMTYPES.Machine,
        lengthTypeAssociations: selectedLengthTypeAssociations,
      };

      if (unusableElements.length > 0) {
        setIsCalculating(false);

        setUnusableData({
          unusableElements,
          parentSummaries,
          selectedMachine: sawMachine,
        });
        return;
      }

      const relevantElements: SteelLengthElement[] =
        selectedSteelLengthElements.flatMap((selectedSteelLengthElement) =>
          Array.from({
            length: quantities[selectedSteelLengthElement.id] ?? 0,
          }).map(() => ({
            id: selectedSteelLengthElement.id,
            width: selectedSteelLengthElement.width,
            length: selectedSteelLengthElement.length,
            name: selectedSteelLengthElement.name,
            type: selectedSteelLengthElement.type,
            instanceId: crypto.randomUUID(),
          }))
        );

      const best = findBestForLengths(
        relevantElements,
        selectedSteelLengths,
        sawMachine
      );

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
        totalElementsArea: relevantElements.reduce(
          (sum, element) => sum + element.width * element.length,
          0
        ),
        totalWaste:
          best.totalArea -
          relevantElements.reduce(
            (sum, element) => sum + element.width * element.length,
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
    setSelectedSteelLengthElements([]);
    setSelectedSteelLengths(steelLengths);
    setSelectedLengthTypeAssociations([]);
  };
  return (
    <PageLayout
      title={
        language === "da"
          ? "Udregn stål længde nesting"
          : "Calculate steel length nesting"
      }
      description={
        language === "da"
          ? "På denne side kan du vælge hvilke stål længder og hvilke stål længde emner du ønsker at udregne nesting med"
          : "On this page you can select which steel lengths and which steel length elements you wish to use to calculate nesting"
      }
    >
      <div className="w-full">
        {(steelLengths.length === 0 || steelLengthElements.length === 0) &&
          !loading && (
            <div className="flex flex-col gap-4 mt-8">
              {steelLengthElements.length === 0 && (
                <EmptyStateLine
                  language={language}
                  type={ITEMTYPES.SteelLengthElement}
                  href="/steel-length-elements"
                />
              )}

              {steelLengths.length === 0 && (
                <EmptyStateLine
                  language={language}
                  type={ITEMTYPES.SteelLength}
                  href="/steel-lengths"
                />
              )}
            </div>
          )}
      </div>
      {steelLengthElements.length !== 0 && steelLengths.length !== 0 && (
        <div className="flex w-full flex-col sm:flex-row gap-4">
          <div className="flex-grow mb-2 sm:w-1/2 w-full">
              <div className="flex flex-col gap-4 mt-9">
                {steelLengths.length !== 0 &&
                  steelLengthElements.length !== 0 && (
                    <div className="flex flex-col gap-6 ">
                      <DropdownMenuConsolidated<SteelLengthElement>
                        language={language}
                        items={steelLengthElements}
                        selectedItems={selectedSteelLengthElements}
                        onSelect={(steelLengthElement) =>
                          toggleSteelElementSelection(steelLengthElement)
                        }
                        onSelectAll={selectAllElements}
                        onDeselectAll={deselectAllElements}
                        disableSelectAll={
                          selectedSteelLengthElements.length ===
                          steelLengthElements.length
                        }
                        disableDeselectAll={
                          selectedSteelLengthElements.length === 0
                        }
                      />
                    <DropdownMenuConsolidated<SteelLength>
                      language={language}
                      items={steelLengths}
                      selectedItems={selectedSteelLengths}
                      onSelect={(steelLength) =>
                        toggleSteelLengthSelection(steelLength)
                      }
                      onSelectAll={selectAllLengths}
                      onDeselectAll={deselectAllLengths}
                      disableSelectAll={
                        selectedSteelLengths.length === steelLengths.length
                      }
                      disableDeselectAll={selectedSteelLengths.length === 0}
                    />

                    {steelLengths.length !== 0 &&
                      steelLengthElements.length !== 0 && (
                        <div className="w-full flex justify-between">
                          <TooltipButton
                            disabled={
                              calculating ||
                              (selectedSteelLengths?.length === 0 &&
                                selectedSteelLengthElements?.length === 0)
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
                              calculating ||
                              selectedSteelLengths?.length === 0 ||
                              selectedSteelLengthElements?.length === 0
                            }
                            onClick={() => getResults()}
                          >
                            {calculating ? (
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

              {selectedSteelLengthElements.length !== 0 && (
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
                          {language === "da" ? "Antal" : "Quantity"}
                        </TableHead>
                        <TableHead>
                          {language === "da" ? "Længde type" : "Length type"}
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSteelLengthElements.map(
                        (selectedSteelLengthElement) => {
                          if (!selectedSteelLengthElement) return null;
                          return (
                            <TableRow
                              className="text-xs sm:text-base"
                              key={selectedSteelLengthElement.id}
                            >
                              <TableCell>
                                {selectedSteelLengthElement.name}
                              </TableCell>
                              <TableCell>
                                {formatEuropeanFloat(
                                  selectedSteelLengthElement.length
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
                                    quantities[selectedSteelLengthElement.id] ??
                                    1
                                  }
                                  onChange={(e) =>
                                    setQuantities((prev) => ({
                                      ...prev,
                                      [selectedSteelLengthElement.id]: parseInt(
                                        e.target.value || "1"
                                      ),
                                    }))
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="tooltip-button"
                                    >
                                      {(() => {
                                        const matches =
                                          selectedLengthTypeAssociations.filter(
                                            (assoc) =>
                                              assoc.childId ===
                                              selectedSteelLengthElement.id
                                          );
                                        if (matches.length === 0) {
                                          return language === "da"
                                            ? "Vælg længde type"
                                            : "Select length type";
                                        }
                                        const names = matches
                                          .map((assoc) => {
                                            const length =
                                              selectedSteelLengths.find(
                                                (sl) => sl.id === assoc.parentId
                                              ) ||
                                              steelLengths.find(
                                                (sl) => sl.id === assoc.parentId
                                              );
                                            return length?.name;
                                          })
                                          .filter(Boolean);
                                        return names.join(", ") ||
                                          (language === "da"
                                            ? "Vælg længde type"
                                            : "Select length type");
                                      })()}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {selectedSteelLengths.map((steelLength) => {
                                      const checked =
                                        selectedLengthTypeAssociations.some(
                                          (lengthTypeAssociation) =>
                                            lengthTypeAssociation.childId ===
                                              selectedSteelLengthElement.id &&
                                            lengthTypeAssociation.parentId ===
                                              steelLength.id
                                        );

                                      return (
                                        <DropdownMenuCheckboxItem
                                          key={
                                            steelLength.id +
                                            selectedSteelLengthElement.id
                                          }
                                          checked={checked}
                                          onCheckedChange={() => {
                                            const currentAssociations: LengthTypeAssociations[] =
                                              structuredClone(
                                                selectedLengthTypeAssociations
                                              );
                                            let newAssociations =
                                              currentAssociations.filter(
                                                (association) =>
                                                  association.childId !==
                                                  selectedSteelLengthElement.id
                                              );

                                            if (!checked) {
                                              newAssociations = [
                                                ...newAssociations,
                                                {
                                                  parentId: steelLength.id,
                                                  childId:
                                                    selectedSteelLengthElement.id,
                                                },
                                              ];
                                            }

                                            setSelectedLengthTypeAssociations(
                                              newAssociations
                                            );
                                          }}
                                        >
                                          {steelLength.name}
                                        </DropdownMenuCheckboxItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell className="flex justify-end space-x-2">
                                <TooltipButton
                                  disabled={calculating}
                                  variant="destructive"
                                  ButtonIcon={Trash}
                                  text={language === "da" ? "Slet" : "Remove"}
                                  onClick={() =>
                                    removeSteelLengthElement(
                                      selectedSteelLengthElement.id
                                    )
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow  w-full sm:w-1/2">
            {endResults.nestingParent.length !== 0 &&
              selectedSteelLengthElements.length !== 0 &&
              selectedSteelLengths.length !== 0 && (
                <ResultsCard language={language} endResults={endResults} />
              )}
            <>
              {lengthLayoutData.layouts.length > 0 && (
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
                        calculating || lengthLayoutData.layouts.length === 0
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

              {lengthLayoutData.layouts.length > 0 && (
                <div
                  ref={vizRef}
                  style={{ borderRadius: "10px" }}
                  className="flex mb-4 flex-wrap gap-4 overflow-auto p-4 bg-muted max-h-[calc(68vh)]"
                >
                  {lengthLayoutData.layouts.map((layout, i) => (
                    <VisualisationCard
                      key={layout.parentId + i}
                      layout={layout}
                      scaleFactor={globalScale}
                      isLength
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
          parentLabel={
            language === "da" ? "Valgte længder" : "Selected lengths"
          }
          onClose={() => setUnusableData(null)}
        />
      )}
    </PageLayout>
  );
}
