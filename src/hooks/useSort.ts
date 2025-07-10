import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc";

export function useSort<T>(items: T[], defaultKey: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [items, sortKey, sortOrder]);

  return {
    sortKey,
    sortOrder,
    handleSort,
    setSortKey,
    setSortOrder,
    sortedItems,
  };
}
