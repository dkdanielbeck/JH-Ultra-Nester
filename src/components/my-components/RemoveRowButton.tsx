import TooltipButton from "./TooltipButton";
import { Trash } from "lucide-react";

interface RemoveRowButtonProps {
  language: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export default function RemoveRowButton({
  language,
  onClick,
  disabled = false,
}: RemoveRowButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={Trash}
      disabled={disabled}
      text={language === "da" ? "Slet" : "Remove"}
      variant="destructive"
      onClick={onClick}
    />
  );
}
