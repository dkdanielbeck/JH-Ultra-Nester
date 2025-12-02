import TooltipButton from "./TooltipButton";
import { CirclePlus } from "lucide-react";

interface AddButtonProps {
  language: string;
  disabled?: boolean;
  onClick: () => void;
  type?: "button" | "submit" | "reset";
}

export default function AddButton({
  language,
  disabled = false,
  onClick,
  type = "button",
}: AddButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={CirclePlus}
      disabled={disabled}
      text={language === "da" ? "Tilføj" : "Add"}
      variant="default"
      type={type}
      onClick={onClick}
    />
  );
}
