import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ITEMTYPES, type ItemType } from "@/lib/types";
import { Button } from "../ui/button";
import { getNamingScheme, getResourceName } from "@/lib/utils";

interface DropdownMenuConsolidatedProps<NamedItem extends ItemType> {
  language: string;
  items: NamedItem[];
  selectedItems: NamedItem[];
  onSelect: (item: NamedItem) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  disableSelectAll?: boolean;
  disableDeselectAll?: boolean;
}

export default function DropdownMenuConsolidated<NamedItem extends ItemType>({
  language,
  items,
  selectedItems,
  onSelect,
  onSelectAll,
  onDeselectAll,
  disableSelectAll,
  disableDeselectAll,
}: DropdownMenuConsolidatedProps<NamedItem>) {
  const itemType = items.length !== 0 ? items[0].type : ITEMTYPES.Machine;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="tooltip-button" variant="outline">
          {language === "da"
            ? `Vælg ${getResourceName(language, itemType)}`
            : `Select ${getResourceName(language, itemType)}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(onSelectAll || onDeselectAll) && (
          <>
            {onSelectAll && (
              <DropdownMenuCheckboxItem
                disabled={disableSelectAll}
                onSelect={(event) => event.preventDefault()}
                checked={false}
                onCheckedChange={() => {
                  if (!disableSelectAll) onSelectAll();
                }}
              >
                {language === "da" ? "Vælg alle" : "Select all"}
              </DropdownMenuCheckboxItem>
            )}
            {onDeselectAll && (
              <DropdownMenuCheckboxItem
                disabled={disableDeselectAll}
                onSelect={(event) => event.preventDefault()}
                checked={false}
                onCheckedChange={() => {
                  if (!disableDeselectAll) onDeselectAll();
                }}
              >
                {language === "da" ? "Fravælg alle" : "Deselect all"}
              </DropdownMenuCheckboxItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            key={item.id}
            checked={selectedItems.some(
              (selectedItem) => item.id === selectedItem.id
            )}
            onCheckedChange={() => onSelect(item)}
          >
            {getNamingScheme(item)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
