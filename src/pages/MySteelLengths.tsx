import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { STORAGE_KEYS, type SteelLength } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils-local-storage";
import { addSteelLengthOrSteelLengthElement, saveSteelLengthOrSteelLengthElement } from "@/lib/utils-steel-lengths-and-length-elements";

export default function MySteelLengths() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengths, setSteelLengths] = useState<SteelLength[]>(() => loadFromLocalStorage(STORAGE_KEYS.STEELLENGTHS));
  const [name, setName] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<SteelLength>(steelLengths, "length");

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.STEELLENGTHS, steelLengths);
  }, [steelLengths]);

  const addNewSteelLength = () => {
    const updatedSteelLengths = addSteelLengthOrSteelLengthElement(length, name, steelLengths);

    setSteelLengths(updatedSteelLengths);

    setName("");
    setLength("");
  };

  const SaveEditedSteelLength = () => {
    const updatedSteelLengths = saveSteelLengthOrSteelLengthElement(length, name, steelLengths, beingEdited);

    setSteelLengths(updatedSteelLengths);

    setEditedName("");
    setEditedLength("");
    setBeingEdited("");
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine stål længder" : "My steel Lengths"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje stål længder som du kontinuerligt kan genbruge når du udregner nesting."
            : "On this page you can add steel lengths that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder={language === "da" ? "Stål længde navn" : "Steel length name"} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"} type="number" value={length} onChange={(e) => setLength(e.target.value)} />
          <Button disabled={name === "" || length === "" || !name || !length} variant="secondary" onClick={addNewSteelLength}>
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
              {sortedItems.map((steelLength) => {
                const shouldEdit = steelLength.id === beingEdited;

                return (
                  <TableRow key={steelLength.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Stål længde navn" : "Steel length name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        steelLength.name
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
                        steelLength.length
                      )}
                    </TableCell>

                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => setSteelLengths(steelLengths.filter((el) => el.id !== steelLength.id))}>
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedSteelLength()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(steelLength.id);
                            setEditedName(steelLength.name);
                            setEditedLength(steelLength.length.toString());
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
