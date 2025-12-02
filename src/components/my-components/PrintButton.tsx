import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Printer } from "lucide-react";
import TooltipButton from "./TooltipButton";
import type { PrintDensity } from "@/lib/print/print-manager";

interface PrintButtonProps {
  language: string;
  density: PrintDensity;
  onDensityChange: (density: PrintDensity) => void;
  onPrint: () => void;
  disabled?: boolean;
}

export default function PrintButton({
  language,
  density,
  onDensityChange,
  onPrint,
  disabled = false,
}: PrintButtonProps) {
  const labels =
    language === "da"
      ? {
          title: "Udskriv",
          perPage: "Visualiseringer pr. side",
          one: "1 pr. side",
          two: "2 pr. side",
          four: "4 pr. side",
          options: "Udskriftsindstillinger",
        }
      : {
          title: "Print",
          perPage: "Visualisations per page",
          one: "1 per page",
          two: "2 per page",
          four: "4 per page",
          options: "Print options",
        };

  return (
    <div className="flex items-center space-x-1">
      <TooltipButton
        ButtonIcon={Printer}
        disabled={disabled}
        text={labels.title}
        variant="outline"
        size="icon"
        onClick={onPrint}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipButton
            ButtonIcon={ChevronDown}
            disabled={disabled}
            text={labels.options}
            variant="outline"
            size="icon"
            onClick={() => {}}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuLabel>{labels.perPage}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={density.toString()}
            onValueChange={(value) =>
              onDensityChange(Number(value) as PrintDensity)
            }
          >
            <DropdownMenuRadioItem value="1">
              {labels.one}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">
              {labels.two}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="4">
              {labels.four}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
