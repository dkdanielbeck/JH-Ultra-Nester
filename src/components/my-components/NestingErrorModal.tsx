import { Button } from "@/components/ui/button";
import type { Machine, SheetElement, SteelLengthElement } from "@/lib/types";
import { formatEuropeanFloat } from "@/lib/utils";

type UnusableElement = SheetElement | SteelLengthElement;

type NestingErrorModalProps = {
  language: string;
  unusableElements: UnusableElement[];
  parentSummaries: string[];
  selectedMachine?: Machine;
  parentLabel: string;
  onClose: () => void;
  extraDetails?: string[];
};

export default function NestingErrorModal({
  language,
  unusableElements,
  parentSummaries,
  selectedMachine,
  parentLabel,
  extraDetails,
  onClose,
}: NestingErrorModalProps) {
  const title = language === "da" ? "Nesting mislykkedes" : "Nesting failed";
  const intro =
    language === "da"
      ? "Et eller flere emner kan ikke placeres med de valgte indstillinger."
      : "One or more elements cannot be placed with the selected settings.";

  const elementsLabel = language === "da" ? "Emner:" : "Elements:";
  const machineLabel = language === "da" ? "Maskine:" : "Machine:";
  const extraLabel = language === "da" ? "Flere detaljer:" : "More details:";

  const elementsText = unusableElements
    .map(
      (el) =>
        `${el.name} (${formatEuropeanFloat(el.length)}×${formatEuropeanFloat(
          el.width
        )} mm)`
    )
    .join("\n");

  const machineText = selectedMachine
    ? `${selectedMachine.name} (border: ${formatEuropeanFloat(
        selectedMachine.border
      )} mm, margin: ${formatEuropeanFloat(selectedMachine.margin)} mm)`
    : "-";

  const parentText = parentSummaries.join("\n") || "-";
  const extraText = extraDetails?.join("\n") ?? "";

  const body = `${intro}\n\n${elementsLabel}\n${elementsText}\n\n${machineLabel}\n${machineText}\n\n${parentLabel}:\n${parentText}${
    extraText ? `\n\n${extraLabel}\n${extraText}` : ""
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {body}
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {language === "da" ? "Forstået" : "Got it"}
          </Button>
        </div>
      </div>
    </div>
  );
}
