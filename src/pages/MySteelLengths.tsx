import { useEffect, useMemo, useState } from "react";

import { loadLanguage } from "@/App";
import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type SteelLength,
} from "@/lib/types";
import {
  clearInputsFromLocalStorage,
  loadInputFromLocalStorage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import {
  deleteSteelLength,
  fetchSteelLengths,
  insertSteelLength,
  updateSteelLength,
} from "@/lib/database calls/steelLengths";
import TableSkeleton from "@/components/my-components/TableSkeleton";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import {
  formatEuropeanFloat,
  isValidEuropeanNumberString,
  parseEuropeanFloat,
} from "@/lib/utils";
import InputField from "@/components/my-components/InputField";

import type { Row } from "@/components/my-components/DataTable";
import DataTable from "@/components/my-components/DataTable";
import ClearButton from "@/components/my-components/ClearButton";
import AddButton from "@/components/my-components/AddButton";
import SaveRowButton from "@/components/my-components/SaveRowButton";
import EditRowButton from "@/components/my-components/EditRowButton";
import RemoveRowButton from "@/components/my-components/RemoveRowButton";

export default function MySteelLengths() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengths, setSteelLengths] = useState<SteelLength[]>([]);
  const [name, setName] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.name,
        ComponentNames.mySteelLengths
      ) || ""
  );
  const [length, setLength] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.length,
        ComponentNames.mySteelLengths
      ) || ""
  );
  const [price, setPrice] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.price,
        ComponentNames.mySteelLengths
      ) || ""
  );
  const [weight, setWeight] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.weight,
        ComponentNames.mySteelLengths
      ) || ""
  );
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [editedPrice, setEditedPrice] = useState<string>("");
  const [editedWeight, setEditedWeight] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

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
      length: parseEuropeanFloat(length),
      width: 200,
      price: parseEuropeanFloat(price),
      weight: parseEuropeanFloat(weight),
      type: ITEMTYPES.SteelLength,
    });

    setSteelLengths([...steelLengths, newStelLength]);
    setName("");
    setPrice("");
    setWeight("");
    setLength("");
    clearInputsFromLocalStorage(
      [
        InputFieldValues.name,
        InputFieldValues.length,
        InputFieldValues.price,
        InputFieldValues.weight,
      ],
      ComponentNames.mySteelLengths
    );
  };
  const clearInputs = () => {
    setName("");
    setLength("");
    setPrice("");
    setWeight("");
    clearInputsFromLocalStorage(
      [
        InputFieldValues.name,
        InputFieldValues.length,
        InputFieldValues.price,
        InputFieldValues.weight,
      ],
      ComponentNames.mySteelLengths
    );
  };

  const SaveEditedSteelLength = async () => {
    const newSteelLength = {
      name: editedName,
      width: 200,
      length: parseEuropeanFloat(editedLength),
      price: parseEuropeanFloat(editedPrice),
      weight: parseEuropeanFloat(editedWeight),
      type: ITEMTYPES.SteelLength,
    };
    await updateSteelLength(beingEdited, newSteelLength);

    const updated = steelLengths.map((steelLength) =>
      steelLength.id === beingEdited
        ? { ...steelLength, ...newSteelLength }
        : steelLength
    );
    setSteelLengths(updated);

    setEditedName("");
    setEditedPrice("");
    setEditedWeight("");
    setEditedLength("");
    setBeingEdited("");
  };

  const rows: Row[] = useMemo(() => {
    return steelLengths.map((steelLength) => {
      const shouldEdit = steelLength.id === beingEdited;

      return {
        rowKey: steelLength.id,
        cells: [
          {
            headerKey: "name",
            sortValue: steelLength.name,
            content: shouldEdit ? (
              <InputField
                id="editName"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Navn" : "Name"}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            ) : (
              steelLength.name
            ),
          },
          {
            headerKey: "length",
            sortValue: steelLength.length,
            content: shouldEdit ? (
              <InputField
                id="editLength"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Længde (mm)" : "Length (mm)"}
                number
                value={editedLength}
                onChange={(e) => setEditedLength(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(steelLength.length)
            ),
          },
          {
            headerKey: "price",
            sortValue: steelLength.price,
            content: shouldEdit ? (
              <InputField
                id="editPrice"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Kilopris" : "Price per kilo"}
                number
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(steelLength?.price) ?? "-"
            ),
          },
          {
            headerKey: "weight",
            sortValue: steelLength.weight,
            content: shouldEdit ? (
              <InputField
                id="editWeight"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Vægt (kg)" : "Weight (kg)"}
                number
                value={editedWeight}
                onChange={(e) => setEditedWeight(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(steelLength?.weight) ?? "-"
            ),
          },
          {
            headerKey: "action",
            className: "flex justify-end space-x-2",
            content: (
              <>
                {shouldEdit ? (
                  <SaveRowButton
                    language={language}
                    onClick={() => SaveEditedSteelLength()}
                  />
                ) : (
                  <EditRowButton
                    language={language}
                    onClick={() => {
                      setBeingEdited(steelLength.id);
                      setEditedName(steelLength.name);
                      setEditedPrice(
                        formatEuropeanFloat(steelLength?.price) ?? ""
                      );
                      setEditedWeight(
                        formatEuropeanFloat(steelLength?.weight) ?? ""
                      );
                      setEditedLength(
                        formatEuropeanFloat(steelLength.length) ?? ""
                      );
                    }}
                  />
                )}
                <RemoveRowButton
                  language={language}
                  onClick={async () => {
                    await deleteSteelLength(steelLength.id);
                    setSteelLengths(
                      steelLengths.filter((el) => el.id !== steelLength.id)
                    );
                  }}
                />
              </>
            ),
          },
        ],
      };
    });
  }, [
    steelLengths,
    beingEdited,
    language,
    editedLength,
    editedWeight,
    editedName,
    editedPrice,
  ]);

  const headers = [
    {
      text: language === "da" ? "Navn" : "Name",
      headerKey: "name",
      canSort: true,
    },
    {
      text: language === "da" ? "Længde (mm)" : "Length (mm)",
      headerKey: "length",
      canSort: true,
    },

    {
      text: language === "da" ? "Kilopris (kr.)" : "Price per kilo",
      headerKey: "price",
      canSort: true,
    },
    {
      text: language === "da" ? "Vægt (kg)" : "Weight (kg)",
      headerKey: "weight",
      canSort: true,
    },
    { text: "", headerKey: "action", canSort: false },
  ];

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === "da" ? "Mine stål længder" : "My steel Lengths"}
        </h1>
        <p className="mb-4">
          {language === "da"
            ? "På denne side kan du tilføje stål længder som du kontinuerligt kan genbruge når du udregner nesting."
            : "On this page you can add steel lengths that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8">
          <InputField
            label={language === "da" ? "Stål længde navn" : "Steel length name"}
            id="steelLengthName"
            placeholder={
              language === "da" ? "f.eks. Fladstål 40x5" : "e.g. Flat bar 40x5"
            }
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.name,
                event.target.value,
                ComponentNames.mySteelLengths
              );
            }}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="steelLengthLength"
            placeholder={language === "da" ? "f.eks. 6000" : "e.g. 6000"}
            number
            value={length}
            onChange={(event) => {
              setLength(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.length,
                event.target.value,
                ComponentNames.mySteelLengths
              );
            }}
          />

          <InputField
            label={language === "da" ? "Kilopris" : "Price per kilo"}
            id="steelLengthPrice"
            placeholder={language === "da" ? "f.eks. 24,5" : "e.g. 24.5"}
            number
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.price,
                event.target.value,
                ComponentNames.mySteelLengths
              );
            }}
          />

          <InputField
            label={language === "da" ? "Vægt (kg)" : "Weight (kg)"}
            id="steelLengthWeight"
            placeholder={language === "da" ? "f.eks. 57" : "e.g. 57"}
            number
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.weight,
                event.target.value,
                ComponentNames.mySteelLengths
              );
            }}
          />

          <ClearButton
            language={language}
            disabled={
              !name?.trim() &&
              !length?.trim() &&
              !price?.trim() &&
              !weight?.trim()
            }
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={
              !name?.trim() ||
              !length?.trim() ||
              !isValidEuropeanNumberString(length) ||
              (!!price?.trim() && !isValidEuropeanNumberString(price)) ||
              (!!weight?.trim() && !isValidEuropeanNumberString(weight))
            }
            onClick={addNewSteelLength}
          />
        </div>
      </div>

      {loading && <TableSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyStateLine language={language} type={ITEMTYPES.SteelLength} />
      )}
      {rows.length !== 0 && !loading && (
        <div
          style={{ borderRadius: "10px" }}
          className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]"
        >
          <DataTable rows={rows} headers={headers} />
        </div>
      )}
    </div>
  );
}
