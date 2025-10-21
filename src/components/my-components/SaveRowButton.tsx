import TooltipButton from "./TooltipButton";
import { Save } from "lucide-react";

interface SaveRowButtonProps {
  language: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export default function SaveRowButton({
  language,
  onClick,
  disabled = false,
}: SaveRowButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={Save}
      disabled={disabled}
      text={language === "da" ? "Gem" : "Save"}
      variant="outline"
      onClick={onClick}
    />
  );
}
