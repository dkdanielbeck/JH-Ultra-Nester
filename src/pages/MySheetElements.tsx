import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type SheetElement,
} from "@/lib/types";
import {
  deleteSheetElement,
  fetchSheetElements,
  insertSheetElement,
  updateSheetElement,
} from "@/lib/database calls/sheetElements";
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
import PageLayout from "@/components/my-components/PageLayout";
import { usePersistedInput } from "@/hooks/usePersistedInput";
import { loadLanguage } from "@/lib/utils-local-storage";

export default function MySheetElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [sheetElements, setSheetElements] = useState<SheetElement[]>([]);
  const {
    value: name,
    setValue: setName,
    clear: clearName,
  } = usePersistedInput(InputFieldValues.name, ComponentNames.mySheetElements);
  const {
    value: width,
    setValue: setWidth,
    clear: clearWidth,
  } = usePersistedInput(InputFieldValues.width, ComponentNames.mySheetElements);
  const {
    value: length,
    setValue: setLength,
    clear: clearLength,
  } = usePersistedInput(
    InputFieldValues.length,
    ComponentNames.mySheetElements
  );

  const [editedName, setEditedName] = useState<string>("");
  const [editedWidth, setEditedWidth] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  const [loading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadSheetElements = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSheetElements();
        setSheetElements(data);
      } catch (err) {
        console.error("Failed to fetch sheetElement elements:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSheetElements();
  }, []);

  const addSheetElement = async () => {
    const newSheetElement = await insertSheetElement({
      name,
      length: parseEuropeanFloat(length),
      width: parseEuropeanFloat(width),
      type: ITEMTYPES.SheetElement,
    });
    setSheetElements([...sheetElements, newSheetElement]);

    setName("");
    setWidth("");
    setLength("");
  };
  const clearInputs = () => {
    clearName();
    clearWidth();
    clearLength();
  };

  const SaveEditedSheetElement = useCallback(async () => {
    const newSheetElement = {
      name: editedName,
      width: parseEuropeanFloat(editedWidth),
      length: parseEuropeanFloat(editedLength),
      type: ITEMTYPES.SheetElement,
    };

    await updateSheetElement(beingEdited, newSheetElement);

    const updated = sheetElements.map((sheetElement) =>
      sheetElement.id === beingEdited
        ? { ...sheetElement, ...newSheetElement }
        : sheetElement
    );
    setSheetElements(updated);

    setEditedName("");
    setEditedWidth("");
    setEditedLength("");
    setBeingEdited("");
  }, [beingEdited, editedLength, editedName, editedWidth, sheetElements]);

  const rows: Row[] = useMemo(() => {
    return sheetElements.map((sheetElement) => {
      const shouldEdit = sheetElement.id === beingEdited;

      return {
        rowKey: sheetElement.id,
        cells: [
          {
            headerKey: "name",
            sortValue: sheetElement.name,
            content: shouldEdit ? (
              <InputField
                id="editName"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Plade navn" : "Sheet name"}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            ) : (
              sheetElement.name
            ),
          },
          {
            headerKey: "length",
            sortValue: sheetElement.length,
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
              formatEuropeanFloat(sheetElement.length)
            ),
          },
          {
            headerKey: "width",
            sortValue: sheetElement.width,
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
              formatEuropeanFloat(sheetElement.width)
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
                    onClick={() => SaveEditedSheetElement()}
                  />
                ) : (
                  <EditRowButton
                    language={language}
                    onClick={() => {
                      setBeingEdited(sheetElement.id);
                      setEditedName(sheetElement.name);

                      setEditedWidth(
                        formatEuropeanFloat(sheetElement.width) ?? ""
                      );
                      setEditedLength(
                        formatEuropeanFloat(sheetElement.length) ?? ""
                      );
                    }}
                  />
                )}
                <RemoveRowButton
                  language={language}
                  onClick={async () => {
                    await deleteSheetElement(sheetElement.id);
                    setSheetElements(
                      sheetElements.filter((el) => el.id !== sheetElement.id)
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
    sheetElements,
    beingEdited,
    language,
    editedLength,
    editedName,
    editedWidth,
    SaveEditedSheetElement,
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

    { text: "", headerKey: "action", canSort: false },
  ];

  return (
    <PageLayout
      title={
        language === "da" ? "Mine plade emner" : "My sheetElement elements"
      }
      description={
        language === "da"
          ? "På denne side kan du tilføje plade emner som du kontinuerligt kan genbruge når du udregner nesting. Vær opmærksom på at Længde altid vil ende med at være det største tal"
          : "On this page you can add sheetElement elements that you can continuously reuse when calculating nestings. Take note that Length will always end up the bigger number"
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            name?.trim() &&
            isValidEuropeanNumberString(length) &&
            isValidEuropeanNumberString(width)
          ) {
            void addSheetElement();
          }
        }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8 mb-8">
          <InputField
            label={language === "da" ? "Plade emne navn" : "Sheet element name"}
            id="sheetElementName"
            placeholder={language === "da" ? "f.eks. Emne A" : "e.g. Part A"}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="sheetElementLength"
            placeholder={language === "da" ? "f.eks. 200" : "e.g. 200"}
            number
            value={length}
            onChange={(event) => setLength(event.target.value)}
          />

          <InputField
            label={language === "da" ? "Bredde (mm)" : "Width (mm)"}
            id="sheetElementWidth"
            placeholder={language === "da" ? "f.eks. 100" : "e.g. 100"}
            number
            value={width}
            onChange={(event) => setWidth(event.target.value)}
          />

          <ClearButton
            language={language}
            disabled={!name?.trim() && !length?.trim() && !width?.trim()}
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={
              !name?.trim() ||
              !isValidEuropeanNumberString(length) ||
              !isValidEuropeanNumberString(width)
            }
            onClick={addSheetElement}
            type="submit"
          />
        </div>
      </form>
      {loading && <TableSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyStateLine language={language} type={ITEMTYPES.SheetElement} />
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
