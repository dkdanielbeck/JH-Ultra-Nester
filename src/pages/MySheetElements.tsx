import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { ComponentNames, InputFieldValues, ITEMTYPES, STORAGE_KEYS, type SheetElement } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { clearInputsFromLocalStorage, loadItemsFromLocalStorage, loadInputFromLocalStorage, saveInputToLocalStorage, saveItemsToLocalStorage } from "@/lib/utils-local-storage";
import { addSheetOrSheetElement, saveSheetOrSheetElement } from "@/lib/utils-sheets-and-sheet-elements";

export default function MySheetElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [sheetElements, setSheetElements] = useState<SheetElement[]>(() => loadItemsFromLocalStorage(STORAGE_KEYS.SHEETELEMENTS));
  const [name, setName] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.name, ComponentNames.mySheetElements) || "");
  const [width, setWidth] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.width, ComponentNames.mySheetElements) || "");
  const [length, setLength] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.length, ComponentNames.mySheetElements) || "");

  const [editedName, setEditedName] = useState<string>("");
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<SheetElement>(sheetElements, "length");
  useEffect(() => {
    saveItemsToLocalStorage(STORAGE_KEYS.SHEETELEMENTS, sheetElements);
  }, [sheetElements]);

  const addSheetElement = () => {
    const updatedSheetElements = addSheetOrSheetElement(width, length, name, undefined, undefined, sheetElements, ITEMTYPES.SheetElement);

    setSheetElements(updatedSheetElements as SheetElement[]);

    setName("");
    setWidth("");
    setLength("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.width, InputFieldValues.length], ComponentNames.mySheetElements);
  };
  const clearInputs = () => {
    setName("");
    setWidth("");
    setLength("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.width, InputFieldValues.length], ComponentNames.mySheetElements);
  };

  const SaveEditedSheetElement = () => {
    const updatedSheetElements = saveSheetOrSheetElement(editedWidth, editedLength, editedName, undefined, undefined, sheetElements, beingEdited, ITEMTYPES.SheetElement);

    setSheetElements(updatedSheetElements as SheetElement[]);

    setEditedName("");
    setEditedWidth("");
    setEditedLength("");
    setBeingEdited("");
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine plade emner" : "My sheet elements"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje plade emner som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
            : "On this page you can add sheet elements that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={language === "da" ? "Plade emne navn" : "Sheet element name"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(InputFieldValues.name, e.target.value, ComponentNames.mySheetElements);
            }}
          />
          <Input
            placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
            type="number"
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              saveInputToLocalStorage(InputFieldValues.length, e.target.value, ComponentNames.mySheetElements);
            }}
          />
          <Input
            placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"}
            type="number"
            value={width}
            onChange={(e) => {
              setWidth(e.target.value);
              saveInputToLocalStorage(InputFieldValues.width, e.target.value, ComponentNames.mySheetElements);
            }}
          />
          <Button disabled={(name === "" && length === "" && width === "") || (!name && !width && !length)} variant="ghost" onClick={clearInputs}>
            {language === "da" ? "Ryd" : "Clear"}
          </Button>
          <Button disabled={name === "" || length === "" || width === "" || !name || !width || !length} variant="secondary" onClick={addSheetElement}>
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
              {sortedItems.map((sheetElement) => {
                const shouldEdit = sheetElement.id === beingEdited;

                return (
                  <TableRow key={sheetElement.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Emne navn" : "Element name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        sheetElement.name
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
                        sheetElement.length
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"} type="number" value={editedWidth} onChange={(e) => setEditedWidth(e.target.value)} />
                      ) : (
                        sheetElement.width
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => setSheetElements(sheetElements.filter((el) => el.id !== sheetElement.id))}>
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedSheetElement()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(sheetElement.id);
                            setEditedName(sheetElement.name);
                            setEditedWidth(sheetElement.width.toString());
                            setEditedLength(sheetElement.length.toString());
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
