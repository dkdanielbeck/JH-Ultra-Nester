import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { ComponentNames, InputFieldValues, ITEMTYPES, type SteelLength } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { clearInputsFromLocalStorage, loadInputFromLocalStorage, saveInputToLocalStorage } from "@/lib/utils-local-storage";
import { deleteSteelLength, fetchSteelLengths, insertSteelLength, updateSteelLength } from "@/lib/database calls/steelLengths";
import TableSkeleton from "@/components/my-components/TableSkeleton";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";

export default function MySteelLengths() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengths, setSteelLengths] = useState<SteelLength[]>([]);
  const [name, setName] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.name, ComponentNames.mySteelLengths) || "");
  const [length, setLength] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.length, ComponentNames.mySteelLengths) || "");
  const [price, setPrice] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.price, ComponentNames.mySteelLengths) || "");
  const [weight, setWeight] = useState<string>(() => loadInputFromLocalStorage(InputFieldValues.weight, ComponentNames.mySteelLengths) || "");
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [editedPrice, setEditedPrice] = useState<string>("");
  const [editedWeight, setEditedWeight] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<SteelLength>(steelLengths, "length");
  const [loading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadSteelLengths = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSteelLengths();
        setSteelLengths(data);
      } catch (err) {
        console.error("Failed to fetch steel lengths:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSteelLengths();
  }, []);

  const addNewSteelLength = async () => {
    const newStelLength = await insertSteelLength({
      name,
      length: parseFloat(length),
      width: 200,
      price: parseFloat(price),
      weight: parseFloat(weight),
      type: ITEMTYPES.SteelLength,
    });

    setSteelLengths([...steelLengths, newStelLength]);
    setName("");
    setPrice("");
    setWeight("");
    setLength("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.length, InputFieldValues.price, InputFieldValues.weight], ComponentNames.mySteelLengths);
  };
  const clearInputs = () => {
    setName("");
    setLength("");
    setPrice("");
    setWeight("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.length, InputFieldValues.price, InputFieldValues.weight], ComponentNames.mySteelLengths);
  };

  const SaveEditedSteelLength = async () => {
    const newSteelLength = {
      name: editedName,
      width: 200,
      length: parseFloat(editedLength),
      price: parseFloat(editedPrice),
      weight: parseFloat(editedWeight),
      type: ITEMTYPES.SteelLength,
    };
    await updateSteelLength(beingEdited, newSteelLength);

    const updated = steelLengths.map((steelLength) => (steelLength.id === beingEdited ? { ...steelLength, ...newSteelLength } : steelLength));
    setSteelLengths(updated);

    setEditedName("");
    setEditedPrice("");
    setEditedWeight("");
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
          <Input
            placeholder={language === "da" ? "Stål længde navn" : "Steel length name"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(InputFieldValues.name, e.target.value, ComponentNames.mySteelLengths);
            }}
          />
          <Input
            placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
            type="number"
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              saveInputToLocalStorage(InputFieldValues.length, e.target.value, ComponentNames.mySteelLengths);
            }}
          />
          <Input
            placeholder={language === "da" ? "Kilopris" : "Price per kilo"}
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              saveInputToLocalStorage(InputFieldValues.price, e.target.value, ComponentNames.mySteelLengths);
            }}
          />
          <Input
            placeholder={language === "da" ? "Vægt (kg)" : "Weight (kg)"}
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              saveInputToLocalStorage(InputFieldValues.weight, e.target.value, ComponentNames.mySteelLengths);
            }}
          />
          <Button disabled={(name === "" && length === "") || (!name && !length)} variant="ghost" onClick={clearInputs}>
            {language === "da" ? "Ryd" : "Clear"}
          </Button>
          <Button disabled={name === "" || length === "" || !name || !length} variant="secondary" onClick={addNewSteelLength}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>

      {loading && <TableSkeleton />}
      {!loading && sortedItems.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.SteelLength} />}
      {sortedItems.length !== 0 && !loading && (
        <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow className="text-xs sm:text-base">
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead onClick={() => handleSort("length")} className="cursor-pointer">
                  {language === "da" ? "Længde (mm)" : "Length (mm)"}
                </TableHead>
                <TableHead onClick={() => handleSort("width")} className="cursor-pointer">
                  {language === "da" ? "Kilopris" : "Price per kilo"}
                </TableHead>
                <TableHead onClick={() => handleSort("width")} className="cursor-pointer">
                  {language === "da" ? "Vægt (kg)" : "Weight (kg)"}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((steelLength) => {
                const shouldEdit = steelLength.id === beingEdited;

                return (
                  <TableRow className="text-xs sm:text-base" key={steelLength.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={language === "da" ? "Stål længde navn" : "Steel length name"}
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                        />
                      ) : (
                        steelLength.name
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
                          type="number"
                          value={editedLength}
                          onChange={(e) => setEditedLength(e.target.value)}
                        />
                      ) : (
                        steelLength.length
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={language === "da" ? "Kilopris" : "Price per kilo"}
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                        />
                      ) : (
                        steelLength?.price ?? "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={language === "da" ? "Vægt (kg)" : "Weight (kg)"}
                          type="number"
                          value={editedWeight}
                          onChange={(e) => setEditedWeight(e.target.value)}
                        />
                      ) : (
                        steelLength?.weight ?? "-"
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        className="mr-2 text-xs sm:text-base"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await deleteSteelLength(steelLength.id);
                          setSteelLengths(steelLengths.filter((el) => el.id !== steelLength.id));
                        }}
                      >
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" className="text-xs sm:text-base" size="sm" onClick={() => SaveEditedSteelLength()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          className="text-xs sm:text-base"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(steelLength.id);
                            setEditedName(steelLength.name);
                            setEditedPrice(steelLength?.price?.toString() ?? "");
                            setEditedWeight(steelLength?.weight?.toString() ?? "");
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
