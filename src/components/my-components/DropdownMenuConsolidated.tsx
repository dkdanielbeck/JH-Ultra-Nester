import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ITEMTYPES, type ItemType } from "@/lib/types";
import { Button } from "../ui/button";
import { getNamingScheme, getResourceName } from "@/lib/utils";

interface DropdownMenuConsolidatedProps<NamedItem extends ItemType> {
  language: string;
  items: NamedItem[];
  selectedItems: NamedItem[];
  onSelect: (item: NamedItem) => void;
}

export default function DropdownMenuConsolidated<NamedItem extends ItemType>({ language, items, selectedItems, onSelect }: DropdownMenuConsolidatedProps<NamedItem>) {
  const itemType = items.length !== 0 ? items[0].type : ITEMTYPES.Machine;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{language === "da" ? `Vælg ${getResourceName(language, itemType)}` : `Select ${getResourceName(language, itemType)}`}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuCheckboxItem key={item.id} checked={selectedItems.some((selectedItem) => item.id === selectedItem.id)} onCheckedChange={() => onSelect(item)}>
            {getNamingScheme(item)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
