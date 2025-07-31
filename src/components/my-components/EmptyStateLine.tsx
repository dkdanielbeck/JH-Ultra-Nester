import { type ItemTypeEnum } from "@/lib/types";
import { getResourceName } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export interface EmptyStateLineProps {
  href?: string;
  language: string;
  type: ItemTypeEnum;
}

export default function EmptyStateLine({ href, language, type }: EmptyStateLineProps) {
  return (
    <div className="flex ">
      <ShieldAlert className="h-6 w-6 mr-2" />
      <div>
        <p className="mr-2">{language === "da" ? `Du har ikke oprettet nogen ${getResourceName(language, type)} endnu.` : `You have not yet created any ${getResourceName(language, type)}.`}</p>
        {href && (
          <Link to={href} className="link">
            <span>{language === "da" ? `Opret ${getResourceName(language, type)} her` : `Create ${getResourceName(language, type)} here`}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
