import { ArrowDown, ArrowUp, Dot } from "lucide-react";
import { TableHead } from "../ui/table";
import type { SortOrder } from "@/hooks/useSort";

type StringKey<ElementType> = Extract<keyof ElementType, string>;

interface SortingTableHeadProps<ElementType> {
  text: string;
  columnKey: StringKey<ElementType>;
  activeKey: keyof ElementType;
  sortOrder: SortOrder;
  onSort: (key: StringKey<ElementType>) => void;
}

export default function SortingTableHead<ElementType>({
  text,
  columnKey,
  activeKey,
  sortOrder,
  onSort,
}: SortingTableHeadProps<ElementType>) {
  const isActive = activeKey === columnKey;

  return (
    <TableHead
      onClick={() => onSort(columnKey)}
      className="cursor-pointer select-none"
    >
      <div className="flex items-center gap-1">
        {text}
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp style={{ marginBottom: "-2px" }} className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown
              style={{ marginBottom: "-2px" }}
              className="h-3.5 w-3.5"
            />
          )
        ) : (
          <Dot
            style={{ marginBottom: "-2px", color: "grey" }}
            className="h-3.5 w-3.5"
          />
        )}
      </div>
    </TableHead>
  );
}
