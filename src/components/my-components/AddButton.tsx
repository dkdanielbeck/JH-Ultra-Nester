import TooltipButton from "./TooltipButton";
import { CirclePlus } from "lucide-react";

interface AddButtonProps {
  language: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function AddButton({
  language,
  disabled = false,
  onClick,
}: AddButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={CirclePlus}
      disabled={disabled}
      text={language === "da" ? "Tilføj" : "Add"}
      variant="default"
      onClick={onClick}
    />
  );
}
