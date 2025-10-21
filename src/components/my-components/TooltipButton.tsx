import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import type { LucideIcon } from "lucide-react";

interface TooltipButtonProps {
  ButtonIcon?: LucideIcon;
  className?: string;
  text: string;
  onClick: () => void;
  variant:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost";
  disabled?: boolean;
}

export default function TooltipButton({
  ButtonIcon,
  text,
  onClick,
  className,
  disabled,
  variant,
}: TooltipButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-tooltip-variant={variant}
            className={`tooltip-button ${className}`}
            disabled={disabled}
            variant={variant}
            size="icon"
            onClick={() => onClick()}
          >
            {ButtonIcon ? <ButtonIcon /> : text}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {ButtonIcon ? <p>{text}</p> : undefined}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
