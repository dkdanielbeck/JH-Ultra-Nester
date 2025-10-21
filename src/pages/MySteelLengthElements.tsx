import { useEffect, useMemo, useState } from "react";

import { loadLanguage } from "@/App";
import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type SteelLengthElement,
} from "@/lib/types";
import {
  clearInputsFromLocalStorage,
  loadInputFromLocalStorage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import {
  deleteSteelLengthElement,
  fetchSteelLengthElements,
  insertSteelLengthElement,
  updateSteelLengthElement,
} from "@/lib/database calls/steelLengthElements";
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
import AddButton from "@/components/my-components/AddButton";
import ClearButton from "@/components/my-components/ClearButton";
import SaveRowButton from "@/components/my-components/SaveRowButton";
import EditRowButton from "@/components/my-components/EditRowButton";
import RemoveRowButton from "@/components/my-components/RemoveRowButton";

export default function MySteelLengthElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengthElements, setSteelLengthElements] = useState<
    SteelLengthElement[]
  >([]);
  const [name, setName] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.name,
        ComponentNames.mySteelLengthElements
      ) || ""
  );
  const [length, setLength] = useState<string>(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.length,
        ComponentNames.mySteelLengthElements
      ) || ""
  );
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

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
      length: parseEuropeanFloat(length),
      width: 200,
      type: ITEMTYPES.SteelLengthElement,
    });

    setSteelLengthElements([...steelLengthElements, newStelLengthElement]);
    setName("");
    setLength("");
    clearInputsFromLocalStorage(
      [InputFieldValues.name, InputFieldValues.length],
      ComponentNames.mySteelLengthElements
    );
  };

  const clearInputs = () => {
    setName("");
    setLength("");
    clearInputsFromLocalStorage(
      [InputFieldValues.name, InputFieldValues.length],
      ComponentNames.mySteelLengthElements
    );
  };

  const SaveEditedSteelLengthElement = async () => {
    const newSteelLengthElement = {
      name: editedName,
      width: 200,
      length: parseEuropeanFloat(editedLength),
      type: ITEMTYPES.SteelLengthElement,
    };
    await updateSteelLengthElement(beingEdited, newSteelLengthElement);

    const updated = steelLengthElements.map((steelLengthElement) =>
      steelLengthElement.id === beingEdited
        ? { ...steelLengthElement, ...newSteelLengthElement }
        : steelLengthElement
    );
    setSteelLengthElements(updated);
    setEditedName("");
    setEditedLength("");
    setBeingEdited("");
  };

  const rows: Row[] = useMemo(() => {
    return steelLengthElements.map((steelLengthElement) => {
      const shouldEdit = steelLengthElement.id === beingEdited;

      return {
        rowKey: steelLengthElement.id,
        cells: [
          {
            headerKey: "name",
            sortValue: steelLengthElement.name,
            content: shouldEdit ? (
              <InputField
                id="editName"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Navn" : "Name"}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            ) : (
              steelLengthElement.name
            ),
          },
          {
            headerKey: "length",
            sortValue: steelLengthElement.length,
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
              formatEuropeanFloat(steelLengthElement.length)
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
                    onClick={() => SaveEditedSteelLengthElement()}
                  />
                ) : (
                  <EditRowButton
                    language={language}
                    onClick={() => {
                      setBeingEdited(steelLengthElement.id);
                      setEditedName(steelLengthElement.name);

                      setEditedLength(
                        formatEuropeanFloat(steelLengthElement.length) ?? ""
                      );
                    }}
                  />
                )}
                <RemoveRowButton
                  language={language}
                  onClick={async () => {
                    await deleteSteelLengthElement(steelLengthElement.id);
                    setSteelLengthElements(
                      steelLengthElements.filter(
                        (el) => el.id !== steelLengthElement.id
                      )
                    );
                  }}
                />
              </>
            ),
          },
        ],
      };
    });
  }, [steelLengthElements, beingEdited, language, editedLength, editedName]);

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

    { text: "", headerKey: "action", canSort: false },
  ];

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === "da"
            ? "Mine stål længde emner"
            : "My steel Length elements"}
        </h1>
        <p className="mb-4">
          {language === "da"
            ? "På denne side kan du tilføje stål længde emner som du kontinuerligt kan genbruge når du udregner nesting."
            : "On this page you can add steel length elements that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8">
          <InputField
            label={
              language === "da"
                ? "Stål længde emne navn"
                : "Steel length element name"
            }
            id="steelLengthElementName"
            placeholder={
              language === "da" ? "f.eks. Fladstål 40x5" : "e.g. Flat bar 40x5"
            }
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.name,
                e.target.value,
                ComponentNames.mySteelLengthElements
              );
            }}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="steelLengthElementLength"
            placeholder={language === "da" ? "f.eks. 600" : "e.g. 600"}
            number
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              saveInputToLocalStorage(
                InputFieldValues.length,
                e.target.value,
                ComponentNames.mySteelLengthElements
              );
            }}
          />

          <ClearButton
            language={language}
            disabled={!name?.trim() && !length?.trim()}
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={!name?.trim() || !isValidEuropeanNumberString(length)}
            onClick={addNewSteelLengthElement}
          />
        </div>
      </div>

      {loading && <TableSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyStateLine
          language={language}
          type={ITEMTYPES.SteelLengthElement}
        />
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
