import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { STORAGE_KEYS, type Element } from "@/lib/types";
import { addSheetOrElement, loadFromLocalStorage, saveSheetOrElement, saveToLocalStorage } from "@/lib/utils";
import { useSort } from "@/hooks/useSort";

export default function MyElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [elements, setElements] = useState<Element[]>(() => loadFromLocalStorage(STORAGE_KEYS.ELEMENTS));
  const [name, setName] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<Element>(elements, "length");
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ELEMENTS, elements);
  }, [elements]);

  const addElement = () => {
    const updatedElements = addSheetOrElement(width, length, name, elements);

    setElements(updatedElements);

    setName("");
    setWidth("");
    setLength("");
  };

  const SaveEditedElement = () => {
    const updatedElements = saveSheetOrElement(width, length, name, elements, beingEdited);

    setElements(updatedElements);

    setEditedName("");
    setEditedWidth("");
    setEditedLength("");
    setBeingEdited("");
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine emner" : "My elements"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje emner som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
            : "On this page you can add elements that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder={language === "da" ? "Emne navn" : "Element name"} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"} type="number" value={length} onChange={(e) => setLength(e.target.value)} />
          <Input placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"} type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
          <Button disabled={name === "" || length === "" || width === "" || !name || !width || !length} variant="secondary" onClick={addElement}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>

      {sortedItems.length !== 0 && (
        <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead onClick={() => handleSort("length")} className="cursor-pointer">
                  {language === "da" ? "Længde (mm)" : "Length (mm)"}
                </TableHead>{" "}
                <TableHead onClick={() => handleSort("width")} className="cursor-pointer">
                  {language === "da" ? "Bredde (mm)" : "Width (mm)"}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((element) => {
                const shouldEdit = element.id === beingEdited;

                return (
                  <TableRow key={element.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Emne navn" : "Element name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        element.name
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
                        element.length
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"} type="number" value={editedWidth} onChange={(e) => setEditedWidth(e.target.value)} />
                      ) : (
                        element.width
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => setElements(elements.filter((el) => el.id !== element.id))}>
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedElement()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(element.id);
                            setEditedName(element.name);
                            setEditedWidth(element.width.toString());
                            setEditedLength(element.length.toString());
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
