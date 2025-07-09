import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";

export type Sheet = {
  id: string;
  name: string;
  width: number;
  length: number;
};

const STORAGE_KEY = "my-sheets";

export function loadSheets(): Sheet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load sheets:", e);
    return [];
  }
}

function saveSheets(sheets: Sheet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  } catch (e) {
    console.error("Failed to save sheets:", e);
  }
}

export default function MySheets() {
  const [language] = useState<string>(() => loadLanguage());

  type SortKey = "name" | "width" | "length";
  type SortOrder = "asc" | "desc";

  const [sheets, setSheets] = useState<Sheet[]>(() => loadSheets());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [name, setName] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  useEffect(() => {
    saveSheets(sheets);
  }, [sheets]);

  const addSheet = () => {
    const largestNumberIsLength = parseInt(width) < parseInt(length) ? true : false;

    const parsedWidth = parseInt(largestNumberIsLength ? width : length);
    const parsedLength = parseInt(largestNumberIsLength ? length : width);

    if (!name.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return;

    // Check for duplicate name *with same dimensions*
    const exists = sheets.some((sheet) => sheet.name.toLowerCase() === name.trim().toLowerCase() && sheet.width === parsedWidth && sheet.length === parsedLength);

    if (exists) {
      alert("An element with this name and size already exists.");
      return;
    }

    const newSheet: Sheet = {
      id: crypto.randomUUID(),
      name: name.trim(),
      width: parsedWidth,
      length: parsedLength,
    };

    const updatedSheets = [...sheets, newSheet];
    setSheets(updatedSheets);

    // Clear input fields
    setName("");
    setWidth("");
    setLength("");
  };
  const SaveEditedSheet = () => {
    const largestNumberIsLength = parseInt(editedWidth) < parseInt(editedLength) ? true : false;

    const parsedWidth = parseInt(largestNumberIsLength ? editedWidth : editedLength);
    const parsedLength = parseInt(largestNumberIsLength ? editedLength : editedWidth);

    if (!editedName.trim() || isNaN(parsedWidth) || isNaN(parsedLength)) return;

    const exists = sheets.some((sheet) => sheet.name.toLowerCase() === editedName.trim().toLowerCase() && sheet.width === parsedWidth && sheet.length === parsedLength && sheet.id !== beingEdited);

    if (exists) {
      alert("A sheet with this name and size already exists.");
      return;
    }

    const newSheet: Sheet = {
      id: beingEdited,
      name: editedName.trim(),
      width: parsedWidth,
      length: parsedLength,
    };

    const updatedSheets = sheets.map((sheet) => {
      return sheet.id === beingEdited ? newSheet : sheet;
    });

    setSheets(updatedSheets);

    setEditedName("");
    setEditedWidth("");
    setEditedLength("");
    setBeingEdited("");
  };

  const removeSheet = (id: string) => {
    setSheets(sheets.filter((el) => el.id !== id));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedSheets = [...sheets].sort((a, b) => {
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

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine plader" : "My sheets"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje plader som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
            : "On this page you can add sheets that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder={language === "da" ? "Plade navn" : "Sheet name"} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"} type="number" value={length} onChange={(e) => setLength(e.target.value)} />
          <Input placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"} type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
          <Button disabled={name === "" || length === "" || width === "" || !name || !width || !length} variant="secondary" onClick={addSheet}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>

      {sortedSheets.length !== 0 && (
        <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead onClick={() => handleSort("length")} className="cursor-pointer">
                  {language === "da" ? "Længde (mm)" : "Length (mm)"}
                </TableHead>
                <TableHead onClick={() => handleSort("width")} className="cursor-pointer">
                  {language === "da" ? "Bredde (mm)" : "Width (mm)"}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSheets.map((sheet) => {
                const shouldEdit = sheet.id === beingEdited;
                return (
                  <TableRow key={sheet.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Plade navn" : "Sheet name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        sheet.name
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40"
                          placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
                          type="number"
                          value={editedLength}
                          onChange={(e) => setEditedLength(e.target.value)}
                        />
                      ) : (
                        sheet.length
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"} type="number" value={editedWidth} onChange={(e) => setEditedWidth(e.target.value)} />
                      ) : (
                        sheet.width
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => removeSheet(sheet.id)}>
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedSheet()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(sheet.id);
                            setEditedName(sheet.name);
                            setEditedWidth(sheet.width.toString());
                            setEditedLength(sheet.length.toString());
                          }}
                        >
                          {language === "da" ? "Rediger" : "Edit"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
