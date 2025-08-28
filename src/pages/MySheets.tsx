import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { loadLanguage } from "@/App";
import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type Sheet,
} from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import {
  clearInputsFromLocalStorage,
  loadInputFromLocalStorage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import {
  deleteSheet,
  fetchSheets,
  insertSheet,
  updateSheet,
} from "@/lib/database calls/sheets";
import TableSkeleton from "@/components/my-components/TableSkeleton";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import {
  formatEuropeanFloat,
  isValidEuropeanNumberString,
  parseEuropeanFloat,
} from "@/lib/utils";
import InputField from "@/components/my-components/InputField";

export default function MySheets() {
  const [language] = useState<string>(() => loadLanguage());

  const [sheets, setSheets] = useState<Sheet[]>([]);

  const [name, setName] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.name,
        ComponentNames.mySheets
      ) || ""
  );
  const [width, setWidth] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.width,
        ComponentNames.mySheets
      ) || ""
  );
  const [price, setPrice] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.price,
        ComponentNames.mySheets
      ) || ""
  );
  const [weight, setWeight] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.weight,
        ComponentNames.mySheets
      ) || ""
  );
  const [length, setLength] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.length,
        ComponentNames.mySheets
      ) || ""
  );
  const [editedName, setEditedName] = useState<string>("");
  const [loading, setIsLoading] = useState<boolean>(false);
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedPrice, setEditedPrice] = useState<string>("");
  const [editedWeight, setEditedWeight] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  const { sortedItems, handleSort } = useSort<Sheet>(sheets, "length");

  useEffect(() => {
    const loadSheets = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSheets();
        setSheets(data);
      } catch (err) {
        console.error("Failed to fetch sheets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSheets();
  }, []);

  const addSheet = async () => {
    const newSheet = await insertSheet({
      name,
      length: parseEuropeanFloat(length),
      width: parseEuropeanFloat(width),
      price: parseEuropeanFloat(price),
      weight: parseEuropeanFloat(weight),
      type: ITEMTYPES.Sheet,
    });
    setSheets([...sheets, newSheet]);
    setName("");
    setWidth("");
    setPrice("");
    setWeight("");
    setLength("");
    clearInputsFromLocalStorage(
      [
        InputFieldValues.name,
        InputFieldValues.width,
        InputFieldValues.length,
        InputFieldValues.weight,
        InputFieldValues.price,
      ],
      ComponentNames.mySheets
    );
  };

  const clearInputs = () => {
    setName("");
    setWidth("");
    setPrice("");
    setWeight("");
    setLength("");
    clearInputsFromLocalStorage(
      [
        InputFieldValues.name,
        InputFieldValues.width,
        InputFieldValues.length,
        InputFieldValues.weight,
        InputFieldValues.price,
      ],
      ComponentNames.mySheets
    );
  };

  const SaveEditedSheet = async () => {
    const newSheet = {
      name: editedName,
      width: parseEuropeanFloat(editedWidth),
      length: parseEuropeanFloat(editedLength),
      price: parseEuropeanFloat(editedPrice),
      weight: parseEuropeanFloat(editedWeight),
      type: ITEMTYPES.Sheet,
    };

    await updateSheet(beingEdited, newSheet);

    const updated = sheets.map((sheet) =>
      sheet.id === beingEdited ? { ...sheet, ...newSheet } : sheet
    );
    setSheets(updated);

    setEditedName("");
    setEditedWidth("");
    setEditedPrice("");
    setEditedWeight("");
    setEditedLength("");
    setBeingEdited("");
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">
          {language === "da" ? "Mine plader" : "My sheets"}
        </h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje plader som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
            : "On this page you can add sheets that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <InputField
            label={language === "da" ? "Plade navn" : "Sheet name"}
            id="sheetName"
            placeholder={
              language === "da"
                ? "f.eks. Standard, Mini"
                : "e.g. Standard, Mini"
            }
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.name,
                e.target.value,
                ComponentNames.mySheets
              );
            }}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="length"
            placeholder={language === "da" ? "f.eks. 2000" : "e.g. 2000"}
            number
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.length,
                e.target.value,
                ComponentNames.mySheets
              );
            }}
          />

          <InputField
            id="width"
            label={language === "da" ? "Bredde (mm)" : "Width (mm)"}
            placeholder={language === "da" ? "f.eks. 1000" : "e.g. 1000"}
            number
            value={width}
            onChange={(e) => {
              setWidth(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.width,
                e.target.value,
                ComponentNames.mySheets
              );
            }}
          />

          <InputField
            id="price"
            label={language === "da" ? "Kilopris" : "Price per kilo"}
            placeholder={language === "da" ? "f.eks. 24,5" : "e.g. 24.5"}
            number
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.price,
                e.target.value,
                ComponentNames.mySheets
              );
            }}
          />

          <InputField
            id="weight"
            label={language === "da" ? "Vægt (kg)" : "Weight (kg)"}
            placeholder={language === "da" ? "f.eks. 57" : "e.g. 57"}
            number
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.weight,
                e.target.value,
                ComponentNames.mySheets
              );
            }}
          />

          <Button
            disabled={
              !name?.trim() &&
              !length?.trim() &&
              !width?.trim() &&
              !weight.trim() &&
              !price.trim()
            }
            variant="ghost"
            onClick={clearInputs}
          >
            {language === "da" ? "Ryd" : "Clear"}
          </Button>
          <Button
            disabled={
              !name?.trim() ||
              !length?.trim() ||
              !width?.trim() ||
              !isValidEuropeanNumberString(length) ||
              !isValidEuropeanNumberString(width) ||
              (!!price?.trim() && !isValidEuropeanNumberString(price)) ||
              (!!weight?.trim() && !isValidEuropeanNumberString(weight))
            }
            variant="secondary"
            onClick={addSheet}
          >
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>
      {loading && <TableSkeleton />}
      {!loading && sortedItems.length === 0 && (
        <EmptyStateLine language={language} type={ITEMTYPES.Sheet} />
      )}
      {sortedItems.length !== 0 && !loading && (
        <div
          style={{ borderRadius: "10px" }}
          className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]"
        >
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow className="text-xs sm:text-base">
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer"
                >
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("length")}
                  className="cursor-pointer"
                >
                  {language === "da" ? "Længde (mm)" : "Length (mm)"}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("width")}
                  className="cursor-pointer"
                >
                  {language === "da" ? "Bredde (mm)" : "Width (mm)"}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("width")}
                  className="cursor-pointer"
                >
                  {language === "da" ? "Kilopris (kr.)" : "Price per kilo"}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("width")}
                  className="cursor-pointer"
                >
                  {language === "da" ? "Vægt (kg)" : "Weight (kg)"}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((sheet) => {
                const shouldEdit = sheet.id === beingEdited;
                return (
                  <TableRow className="text-xs sm:text-base" key={sheet.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <InputField
                          id="editName"
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={
                            language === "da" ? "Plade navn" : "Sheet name"
                          }
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                        />
                      ) : (
                        sheet.name
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <InputField
                          id="editLength"
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={
                            language === "da" ? "Længde (mm)" : "Length (mm)"
                          }
                          number
                          value={editedLength}
                          onChange={(e) => setEditedLength(e.target.value)}
                        />
                      ) : (
                        formatEuropeanFloat(sheet.length)
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <InputField
                          id="editWidth"
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={
                            language === "da" ? "Bredde (mm)" : "Width (mm)"
                          }
                          number
                          value={editedWidth}
                          onChange={(e) => setEditedWidth(e.target.value)}
                        />
                      ) : (
                        formatEuropeanFloat(sheet.width)
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <InputField
                          id="editPrice"
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={
                            language === "da" ? "Kilopris" : "Price per kilo"
                          }
                          number
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                        />
                      ) : (
                        formatEuropeanFloat(sheet?.price) ?? "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <InputField
                          id="editWeight"
                          className="max-w-40 text-xs sm:text-base"
                          placeholder={
                            language === "da" ? "Vægt (kg)" : "Weight (kg)"
                          }
                          number
                          value={editedWeight}
                          onChange={(e) => setEditedWeight(e.target.value)}
                        />
                      ) : (
                        formatEuropeanFloat(sheet?.weight) ?? "-"
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        className="mr-2 text-xs sm:text-base"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await deleteSheet(sheet.id);
                          setSheets(sheets.filter((el) => el.id !== sheet.id));
                        }}
                      >
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button
                          className="text-xs sm:text-base"
                          style={{ backgroundColor: "green", color: "white" }}
                          variant="outline"
                          size="sm"
                          onClick={() => SaveEditedSheet()}
                        >
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          className="text-xs sm:text-base"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(sheet.id);
                            setEditedName(sheet.name);
                            setEditedPrice(
                              formatEuropeanFloat(sheet?.price) ?? ""
                            );
                            setEditedWeight(
                              formatEuropeanFloat(sheet?.weight) ?? ""
                            );
                            setEditedWidth(
                              formatEuropeanFloat(sheet.width) ?? ""
                            );
                            setEditedLength(
                              formatEuropeanFloat(sheet.length) ?? ""
                            );
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
