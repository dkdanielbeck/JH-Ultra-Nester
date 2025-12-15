import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type Sheet,
} from "@/lib/types";
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
  ensureLengthIsLargest,
} from "@/lib/utils";
import InputField from "@/components/my-components/InputField";
import type { Row } from "@/components/my-components/DataTable";
import DataTable from "@/components/my-components/DataTable";
import ClearButton from "@/components/my-components/ClearButton";
import AddButton from "@/components/my-components/AddButton";
import SaveRowButton from "@/components/my-components/SaveRowButton";
import EditRowButton from "@/components/my-components/EditRowButton";
import RemoveRowButton from "@/components/my-components/RemoveRowButton";
import PageLayout from "@/components/my-components/PageLayout";
import { usePersistedInput } from "@/hooks/usePersistedInput";
import { loadLanguage } from "@/lib/utils-local-storage";

export default function MySheets() {
  const [language] = useState<string>(() => loadLanguage());

  const [sheets, setSheets] = useState<Sheet[]>([]);

  const {
    value: name,
    setValue: setName,
    clear: clearName,
  } = usePersistedInput(InputFieldValues.name, ComponentNames.mySheets);
  const {
    value: width,
    setValue: setWidth,
    clear: clearWidth,
  } = usePersistedInput(InputFieldValues.width, ComponentNames.mySheets);
  const {
    value: price,
    setValue: setPrice,
    clear: clearPrice,
  } = usePersistedInput(InputFieldValues.price, ComponentNames.mySheets);
  const {
    value: weight,
    setValue: setWeight,
    clear: clearWeight,
  } = usePersistedInput(InputFieldValues.weight, ComponentNames.mySheets);
  const {
    value: length,
    setValue: setLength,
    clear: clearLength,
  } = usePersistedInput(InputFieldValues.length, ComponentNames.mySheets);
  const [editedName, setEditedName] = useState<string>("");
  const [loading, setIsLoading] = useState<boolean>(false);
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedPrice, setEditedPrice] = useState<string>("");
  const [editedWeight, setEditedWeight] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const canAdd =
    !!name?.trim() &&
    !!length?.trim() &&
    !!width?.trim() &&
    isValidEuropeanNumberString(length) &&
    isValidEuropeanNumberString(width) &&
    (!price?.trim() || isValidEuropeanNumberString(price)) &&
    (!weight?.trim() || isValidEuropeanNumberString(weight));

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
    const normalized = ensureLengthIsLargest({
      name,
      length: parseEuropeanFloat(length),
      width: parseEuropeanFloat(width),
      price: price?.trim() ? parseEuropeanFloat(price) : undefined,
      weight: weight?.trim() ? parseEuropeanFloat(weight) : undefined,
      type: ITEMTYPES.Sheet,
    });

    const duplicate = sheets.some(
      (s) =>
        s.name.trim() === normalized.name.trim() &&
        s.length === normalized.length &&
        s.width === normalized.width &&
        (s.price ?? undefined) === (normalized.price ?? undefined) &&
        (s.weight ?? undefined) === (normalized.weight ?? undefined)
    );
    if (duplicate) {
      setErrorMessage(
        language === "da"
          ? "En plade med de samme værdier findes allerede."
          : "A sheet with the same values already exists."
      );
      return;
    }

    const newSheet = await insertSheet(normalized);
    setSheets([...sheets, newSheet]);
    setErrorMessage("");
    setName("");
    setWidth("");
    setPrice("");
    setWeight("");
    setLength("");
  };

  const clearInputs = () => {
    clearName();
    clearWidth();
    clearPrice();
    clearWeight();
    clearLength();
  };

  const SaveEditedSheet = useCallback(async () => {
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
  }, [
    beingEdited,
    editedLength,
    editedName,
    editedPrice,
    editedWeight,
    editedWidth,
    sheets,
  ]);

  const rows: Row[] = useMemo(() => {
    return sheets.map((sheet) => {
      const shouldEdit = sheet.id === beingEdited;

      return {
        rowKey: sheet.id,
        cells: [
          {
            headerKey: "name",
            sortValue: sheet.name,
            content: shouldEdit ? (
              <InputField
                id="editName"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Plade navn" : "Sheet name"}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            ) : (
              sheet.name
            ),
          },
          {
            headerKey: "length",
            sortValue: sheet.length,
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
              formatEuropeanFloat(sheet.length)
            ),
          },
          {
            headerKey: "width",
            sortValue: sheet.width,
            content: shouldEdit ? (
              <InputField
                id="editWidth"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Bredde (mm)" : "Width (mm)"}
                number
                value={editedWidth}
                onChange={(e) => setEditedWidth(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(sheet.width)
            ),
          },
          {
            headerKey: "price",
            sortValue: sheet.price,
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
              formatEuropeanFloat(sheet?.price) ?? "-"
            ),
          },
          {
            headerKey: "weight",
            sortValue: sheet.weight,
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
              formatEuropeanFloat(sheet?.weight) ?? "-"
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
                    onClick={() => SaveEditedSheet()}
                  />
                ) : (
                  <EditRowButton
                    language={language}
                    onClick={() => {
                      setBeingEdited(sheet.id);
                      setEditedName(sheet.name);
                      setEditedPrice(formatEuropeanFloat(sheet?.price) ?? "");
                      setEditedWeight(formatEuropeanFloat(sheet?.weight) ?? "");
                      setEditedWidth(formatEuropeanFloat(sheet.width) ?? "");
                      setEditedLength(formatEuropeanFloat(sheet.length) ?? "");
                    }}
                  />
                )}
                <RemoveRowButton
                  language={language}
                  onClick={async () => {
                    await deleteSheet(sheet.id);
                    setSheets(sheets.filter((el) => el.id !== sheet.id));
                  }}
                />
              </>
            ),
          },
        ],
      };
    });
  }, [
    sheets,
    beingEdited,
    language,
    editedLength,
    editedWeight,
    editedName,
    editedPrice,
    editedWidth,
    SaveEditedSheet,
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
      text: language === "da" ? "Bredde (mm)" : "Width (mm)",
      headerKey: "width",
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
    <PageLayout
      title={language === "da" ? "Mine plader" : "My sheets"}
      description={
        language === "da"
          ? "På denne side kan du tilføje plader som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
          : "On this page you can add sheets that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canAdd) void addSheet();
        }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8 mb-8">
          <InputField
            label={language === "da" ? "Navn" : "Name"}
            id="name"
            placeholder={
              language === "da"
                ? "f.eks. Standard, Mini"
                : "e.g. Standard, Mini"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="length"
            placeholder={language === "da" ? "f.eks. 2000" : "e.g. 2000"}
            number
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />

          <InputField
            id="width"
            label={language === "da" ? "Bredde (mm)" : "Width (mm)"}
            placeholder={language === "da" ? "f.eks. 1000" : "e.g. 1000"}
            number
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />

          <InputField
            id="price"
            label={
              <>
                {language === "da" ? "Kilopris" : "Price per kilo"}{" "}
                <span className="text-muted-foreground">
                  {language === "da" ? "(valgfri)" : "(optional)"}
                </span>
              </>
            }
            placeholder={language === "da" ? "f.eks. 24,5" : "e.g. 24.5"}
            number
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <InputField
            id="weight"
            label={
              <>
                {language === "da" ? "Vægt (kg)" : "Weight (kg)"}{" "}
                <span className="text-muted-foreground">
                  {language === "da" ? "(valgfri)" : "(optional)"}
                </span>
              </>
            }
            placeholder={language === "da" ? "f.eks. 57" : "e.g. 57"}
            number
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <ClearButton
            language={language}
            disabled={
              !name?.trim() &&
              !length?.trim() &&
              !width?.trim() &&
              !weight.trim() &&
              !price.trim()
            }
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={!canAdd}
            onClick={() => {}}
            type="submit"
          />
        </div>
      </form>
      {errorMessage && (
        <p className="text-sm text-destructive mb-2">{errorMessage}</p>
      )}
      {loading && <TableSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyStateLine language={language} type={ITEMTYPES.Sheet} />
      )}
      {rows.length !== 0 && !loading && (
        <div
          style={{ borderRadius: "10px" }}
          className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]"
        >
          <DataTable rows={rows} headers={headers} />
        </div>
      )}
    </PageLayout>
  );
}
