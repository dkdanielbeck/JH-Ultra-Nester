import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { ComponentNames, InputFieldValues, ITEMTYPES, type SteelLengthElement } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { clearInputsFromLocalStorage, loadInputFromLocalStorage, saveInputToLocalStorage } from "@/lib/utils-local-storage";
import { deleteSteelLengthElement, fetchSteelLengthElements, insertSteelLengthElement, updateSteelLengthElement } from "@/lib/database calls/steelLengthElements";
import TableSkeleton from "@/components/my-components/TableSkeleton";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";

export default function MySteelLengthElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengthElements, setSteelLengthElements] = useState<SteelLengthElement[]>([]);
  const [name, setName] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.name, ComponentNames.mySteelLengthElements) || "");
  const [length, setLength] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.length, ComponentNames.mySteelLengthElements) || "");
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<SteelLengthElement>(steelLengthElements, "length");
  const [loading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadSteelLengthElements = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSteelLengthElements();
        setSteelLengthElements(data);
      } catch (err) {
        console.error("Failed to fetch steel length elements:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSteelLengthElements();
  }, []);

  const addNewSteelLengthElement = async () => {
    const newStelLengthElement = await insertSteelLengthElement({
      name,
      length: parseFloat(length),
      width: 200,
      type: ITEMTYPES.SteelLengthElement,
    });

    setSteelLengthElements([...steelLengthElements, newStelLengthElement]);
    setName("");
    setLength("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.length], ComponentNames.mySteelLengthElements);
  };

  const clearInputs = () => {
    setName("");
    setLength("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.length], ComponentNames.mySteelLengthElements);
  };

  const SaveEditedSteelLengthElement = async () => {
    const newSteelLengthElement = {
      name: editedName,
      width: 200,
      length: parseFloat(editedLength),
      type: ITEMTYPES.SteelLengthElement,
    };
    await updateSteelLengthElement(beingEdited, newSteelLengthElement);

    const updated = steelLengthElements.map((steelLengthElement) => (steelLengthElement.id === beingEdited ? { ...steelLengthElement, ...newSteelLengthElement } : steelLengthElement));
    setSteelLengthElements(updated);
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
          <Input
            placeholder={language === "da" ? "Stål længde emne navn" : "Steel length element name"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(InputFieldValues.name, e.target.value, ComponentNames.mySteelLengthElements);
            }}
          />
          <Input
            placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
            type="number"
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              saveInputToLocalStorage(InputFieldValues.length, e.target.value, ComponentNames.mySteelLengthElements);
            }}
          />
          <Button disabled={(name === "" && length === "") || (!name && !length)} variant="ghost" onClick={clearInputs}>
            {language === "da" ? "Ryd" : "Clear"}
          </Button>
          <Button disabled={name === "" || length === "" || !name || !length} variant="secondary" onClick={addNewSteelLengthElement}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>

      {loading && <TableSkeleton />}
      {!loading && sortedItems.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.SteelLengthElement} />}
      {sortedItems.length !== 0 && !loading && (
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
                      <Button
                        className="mr-2"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await deleteSteelLengthElement(steelLengthElement.id);
                          setSteelLengthElements(steelLengthElements.filter((el) => el.id !== steelLengthElement.id));
                        }}
                      >
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
