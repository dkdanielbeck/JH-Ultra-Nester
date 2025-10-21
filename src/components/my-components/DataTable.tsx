import { useEffect, useMemo, useState, type Key, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ArrowDown, ArrowUp, Dot } from "lucide-react";

export type SortOrder = "asc" | "desc";

export type Row = {
  rowKey: Key;
  cells: {
    headerKey: Key;
    sortValue?: string | number | boolean;
    content: ReactNode;
    className?: string;
  }[];
};

interface DataTableProps {
  headers: { text: string; headerKey: Key; canSort: boolean }[];
  rows: Row[];
}

export default function DataTable({ headers, rows }: DataTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [sortKey, setSortKey] = useState<Key>(
    () => headers[0]?.headerKey ?? ""
  );

  useEffect(() => {
    if (!headers.some((header) => header.headerKey === sortKey)) {
      setSortKey(headers[0]?.headerKey ?? "");
    }
  }, [headers, sortKey]);

  const sortedItems = useMemo(() => {
    const sorted = [...rows];

    sorted.sort((a, b) => {
      const aCell = a.cells.find((cell) => cell.headerKey === sortKey);
      const bCell = b.cells.find((cell) => cell.headerKey === sortKey);

      const aVal = aCell?.sortValue;
      const bVal = bCell?.sortValue;

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === "asc" ? 1 : -1;
      if (bVal == null) return sortOrder === "asc" ? -1 : 1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);

      return sortOrder === "asc"
        ? aStr.localeCompare(bStr, undefined, { numeric: true })
        : bStr.localeCompare(aStr, undefined, { numeric: true });
    });

    return sorted;
  }, [rows, sortKey, sortOrder]);

  return (
    <Table>
      <TableHeader className="top-0 z-10">
        <TableRow className="text-xs sm:text-base">
          {headers.map((header) => (
            <TableHead
              key={header.headerKey}
              onClick={
                header.canSort
                  ? () => {
                      if (header.headerKey === sortKey) {
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortKey(header.headerKey);
                        setSortOrder("asc");
                      }
                    }
                  : undefined
              }
              className={
                header.canSort ? "cursor-pointer select-none" : undefined
              }
            >
              {header.canSort ? (
                <div className="flex items-center gap-1">
                  {header.text}
                  {sortKey === header.headerKey ? (
                    sortOrder === "asc" ? (
                      <ArrowUp
                        style={{ marginBottom: "-2px" }}
                        className="h-3.5 w-3.5"
                      />
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
              ) : (
                header.text
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((row) => {
          return (
            <TableRow className="text-xs sm:text-base" key={row.rowKey}>
              {row.cells.map((cell) => (
                <TableCell key={cell.headerKey} className={cell.className}>
                  {cell.content}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
