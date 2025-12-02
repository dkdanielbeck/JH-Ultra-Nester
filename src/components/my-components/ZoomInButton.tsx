import TooltipButton from "./TooltipButton";
import { ZoomIn } from "lucide-react";

interface ZoomInButtonProps {
  language: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function ZoomInButton({
  language,
  disabled = false,
  onClick,
}: ZoomInButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={ZoomIn}
      disabled={disabled}
      text={language === "da" ? "Zoom ind" : "Zoom in"}
      variant="outline"
      size="icon"
      onClick={onClick}
    />
  );
}
