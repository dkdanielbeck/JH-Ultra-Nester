import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { STORAGE_KEYS, type SteelLengthElement } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils-local-storage";
import { addSteelLengthOrSteelLengthElement, saveSteelLengthOrSteelLengthElement } from "@/lib/utils-steel-lengths-and-length-elements";

export default function MySteelLengthElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengthElements, setSteelLengthElements] = useState<SteelLengthElement[]>(() => loadFromLocalStorage(STORAGE_KEYS.STEELLENGTHELEMENTS));
  const [name, setName] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<SteelLengthElement>(steelLengthElements, "length");

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.STEELLENGTHELEMENTS, steelLengthElements);
  }, [steelLengthElements]);

  const addNewSteelLengthElement = () => {
    const updatedSteelLengthElements = addSteelLengthOrSteelLengthElement(length, name, steelLengthElements);

    setSteelLengthElements(updatedSteelLengthElements);

    setName("");
    setLength("");
  };

  const SaveEditedSteelLengthElement = () => {
    const updatedSteelLengthElements = saveSteelLengthOrSteelLengthElement(length, name, steelLengthElements, beingEdited);

    setSteelLengthElements(updatedSteelLengthElements);

    setEditedName("");
    setEditedLength("");
    setBeingEdited("");
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine stål længde emner" : "My steel Length elements"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje stål længde emner som du kontinuerligt kan genbruge når du udregner nesting."
            : "On this page you can add steel length elements that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder={language === "da" ? "Stål længde emne navn" : "Steel length element name"} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"} type="number" value={length} onChange={(e) => setLength(e.target.value)} />
          <Button disabled={name === "" || length === "" || !name || !length} variant="secondary" onClick={addNewSteelLengthElement}>
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
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((steelLengthElement) => {
                const shouldEdit = steelLengthElement.id === beingEdited;

                return (
                  <TableRow key={steelLengthElement.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Stål længde navn" : "Steel length name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        steelLengthElement.name
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
                        steelLengthElement.length
                      )}
                    </TableCell>

                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => setSteelLengthElements(steelLengthElements.filter((el) => el.id !== steelLengthElement.id))}>
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedSteelLengthElement()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(steelLengthElement.id);
                            setEditedName(steelLengthElement.name);
                            setEditedLength(steelLengthElement.length.toString());
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
