import TooltipButton from "./TooltipButton";
import { ZoomOut } from "lucide-react";

interface ZoomOutButtonProps {
  language: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function ZoomOutButton({
  language,
  disabled = false,
  onClick,
}: ZoomOutButtonProps) {
  return (
    <TooltipButton
      ButtonIcon={ZoomOut}
      disabled={disabled}
      text={language === "da" ? "Zoom ud" : "Zoom out"}
      variant="outline"
      size="icon"
      onClick={onClick}
    />
  );
}
