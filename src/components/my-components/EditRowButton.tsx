import TooltipButton from "./TooltipButton";
import { Pencil } from "lucide-react";

interface EditRowButtonProps {
  language: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export default function EditRowButton({
  language,
  onClick,
  disabled = false,
}: EditRowButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={Pencil}
      disabled={disabled}
      text={language === "da" ? "Rediger" : "Edit"}
      variant="outline"
      onClick={onClick}
    />
  );
}
