import TooltipButton from "./TooltipButton";
import { Eraser } from "lucide-react";

interface ClearButtonProps {
  language: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function ClearButton({
  language,
  disabled = false,
  onClick,
}: ClearButtonProps) {
  return (
    <TooltipButton
      disabled={disabled}
      ButtonIcon={Eraser}
      text={language === "da" ? "Ryd" : "Clear"}
      variant="ghost"
      onClick={onClick}
    />
  );
}
