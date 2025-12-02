import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type SteelLengthElement,
} from "@/lib/types";
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
import PageLayout from "@/components/my-components/PageLayout";
import SaveRowButton from "@/components/my-components/SaveRowButton";
import EditRowButton from "@/components/my-components/EditRowButton";
import RemoveRowButton from "@/components/my-components/RemoveRowButton";
import { usePersistedInput } from "@/hooks/usePersistedInput";
import { loadLanguage } from "@/lib/utils-local-storage";

export default function MySteelLengthElements() {
  const [language] = useState<string>(() => loadLanguage());

  const [steelLengthElements, setSteelLengthElements] = useState<
    SteelLengthElement[]
  >([]);
  const {
    value: name,
    setValue: setName,
    clear: clearName,
  } = usePersistedInput(
    InputFieldValues.name,
    ComponentNames.mySteelLengthElements
  );
  const {
    value: length,
    setValue: setLength,
    clear: clearLength,
  } = usePersistedInput(
    InputFieldValues.length,
    ComponentNames.mySteelLengthElements
  );
  const [editedName, setEditedName] = useState<string>("");
  const [editedLength, setEditedLength] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  const [loading, setIsLoading] = useState<boolean>(false);
  const canAdd =
    !!name?.trim() && !!length?.trim() && isValidEuropeanNumberString(length);

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
  };

  const clearInputs = () => {
    clearName();
    clearLength();
  };

  const SaveEditedSteelLengthElement = useCallback(async () => {
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
  }, [beingEdited, editedLength, editedName, steelLengthElements]);

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
  }, [
    steelLengthElements,
    beingEdited,
    language,
    editedLength,
    editedName,
    SaveEditedSteelLengthElement,
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

    { text: "", headerKey: "action", canSort: false },
  ];

  return (
    <PageLayout
      title={
        language === "da"
          ? "Mine stål længde emner"
          : "My steel Length elements"
      }
      description={
        language === "da"
          ? "På denne side kan du tilføje stål længde emner som du kontinuerligt kan genbruge når du udregner nesting."
          : "On this page you can add steel length elements that you can continuously reuse when calculating nestings."
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canAdd) void addNewSteelLengthElement();
        }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8 mb-8">
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
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            label={language === "da" ? "Længde (mm)" : "Length (mm)"}
            id="steelLengthElementLength"
            placeholder={language === "da" ? "f.eks. 600" : "e.g. 600"}
            number
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />

          <ClearButton
            language={language}
            disabled={!name?.trim() && !length?.trim()}
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={!canAdd}
            onClick={addNewSteelLengthElement}
            type="submit"
          />
        </div>
      </form>
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
    </PageLayout>
  );
}
