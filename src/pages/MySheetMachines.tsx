import { useEffect, useMemo, useState } from "react";

import { loadLanguage } from "@/App";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ComponentNames,
  InputFieldValues,
  ITEMTYPES,
  type Machine,
} from "@/lib/types";
import {
  clearInputsFromLocalStorage,
  loadInputFromLocalStorage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import {
  deleteMachine,
  fetchMachines,
  insertMachine,
  updateMachine,
} from "@/lib/database calls/sheetMachines";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import TableSkeleton from "@/components/my-components/TableSkeleton";
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

export default function MySheetMachines() {
  const [language] = useState<string>(() => loadLanguage());

  const [machines, setMachines] = useState<Machine[]>([]);
  const [name, setName] = useState(
    loadInputFromLocalStorage(
      InputFieldValues.name,
      ComponentNames.myMachines
    ) || ""
  );
  const [border, setBorder] = useState(
    loadInputFromLocalStorage(
      InputFieldValues.border,
      ComponentNames.myMachines
    ) || ""
  );
  const [margin, setMargin] = useState(
    loadInputFromLocalStorage(
      InputFieldValues.margin,
      ComponentNames.myMachines
    ) || ""
  );
  const [editedName, setEditedName] = useState<string>("");
  const [editedBorder, setEditedBorder] = useState<string>("");
  const [editedMargin, setEditedMargin] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  const [loading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadMachines = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMachines();
        setMachines(data);
      } catch (err) {
        console.error("Failed to fetch machines:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMachines();
  }, []);

  const addNewMachine = async () => {
    const newMachine = await insertMachine({
      name,
      border: parseEuropeanFloat(border),
      margin: parseEuropeanFloat(margin),
      type: ITEMTYPES.Machine,
      default: false,
      straightCuts: false,
    });

    setMachines([...machines, newMachine]);

    setName("");
    setBorder("");
    setMargin("");
    clearInputsFromLocalStorage(
      [InputFieldValues.name, InputFieldValues.border, InputFieldValues.margin],
      ComponentNames.myMachines
    );
  };

  const clearInputs = () => {
    setName("");
    setBorder("");
    setMargin("");
    clearInputsFromLocalStorage(
      [InputFieldValues.name, InputFieldValues.border, InputFieldValues.margin],
      ComponentNames.myMachines
    );
  };

  const SaveEditedMachine = async () => {
    const editedMachine = machines.find(
      (machine) => machine.id === beingEdited
    );
    const newEditedMachine = {
      name: editedName,
      border: parseEuropeanFloat(editedBorder),
      margin: parseEuropeanFloat(editedMargin),
      type: ITEMTYPES.Machine,
      default: editedMachine ? editedMachine.default : false,
      straightCuts: editedMachine ? editedMachine.straightCuts : false,
    };

    await updateMachine(beingEdited, newEditedMachine);

    const updated = machines.map((machine) =>
      machine.id === beingEdited ? { ...machine, newEditedMachine } : machine
    );
    setMachines(updated);

    setEditedName("");
    setEditedMargin("");
    setEditedBorder("");
    setBeingEdited("");
  };

  const setDefault = async (machineId: string) => {
    const currentDefault = machines.find((m) => m.default);
    const targetMachine = machines.find((m) => m.id === machineId);

    if (!targetMachine || targetMachine.default) return;

    const updates: Promise<void>[] = [];

    if (currentDefault && currentDefault.id !== machineId) {
      updates.push(updateMachine(currentDefault.id, { default: false }));
    }

    updates.push(updateMachine(machineId, { default: true }));

    await Promise.all(updates);

    const updatedMachines = machines.map((machine) => {
      if (machine.id === machineId) {
        return { ...machine, default: true };
      } else if (machine.default) {
        return { ...machine, default: false };
      } else {
        return machine;
      }
    });

    setMachines(updatedMachines);
  };

  const setOnlyStraightCuts = async (machineId: string) => {
    const targetMachine = machines.find((m) => m.id === machineId);
    if (!targetMachine) return;

    const newStraightCutsValue = !targetMachine.straightCuts;

    await updateMachine(machineId, { straightCuts: newStraightCutsValue });

    const updatedMachines = machines.map((machine) =>
      machine.id === machineId
        ? { ...machine, straightCuts: newStraightCutsValue }
        : machine
    );

    setMachines(updatedMachines);
  };

  const rows: Row[] = useMemo(() => {
    return machines.map((machine) => {
      const shouldEdit = machine.id === beingEdited;

      return {
        rowKey: machine.id,
        cells: [
          {
            headerKey: "name",
            sortValue: machine.name,
            content: shouldEdit ? (
              <InputField
                id="editName"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Navn" : "Name"}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            ) : (
              machine.name
            ),
          },
          {
            headerKey: "margin",
            sortValue: machine.margin,
            content: shouldEdit ? (
              <InputField
                id="editLength"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Margen (mm)" : "Margin (mm)"}
                number
                value={editedMargin}
                onChange={(e) => setEditedMargin(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(machine.margin)
            ),
          },
          {
            headerKey: "border",
            sortValue: machine.border,
            content: shouldEdit ? (
              <InputField
                id="editBorder"
                className="max-w-40 text-xs sm:text-base"
                placeholder={language === "da" ? "Kant (mm)" : "Border (mm)"}
                number
                value={editedBorder}
                onChange={(e) => setEditedBorder(e.target.value)}
              />
            ) : (
              formatEuropeanFloat(machine.border)
            ),
          },
          {
            headerKey: "default",
            sortValue: machine.default ? machine.default : false,
            content: (
              <Checkbox
                className="checkbox"
                checked={machine?.default === true}
                onCheckedChange={() => setDefault(machine.id)}
              />
            ),
          },
          {
            headerKey: "straight",
            sortValue: machine.straightCuts ? machine.straightCuts : false,
            content: (
              <Checkbox
                className="checkbox"
                checked={machine?.straightCuts === true}
                onCheckedChange={() => setOnlyStraightCuts(machine.id)}
              />
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
                    onClick={() => SaveEditedMachine()}
                  />
                ) : (
                  <EditRowButton
                    language={language}
                    onClick={() => {
                      setBeingEdited(machine.id);
                      setEditedName(machine.name);
                      setEditedBorder(
                        formatEuropeanFloat(machine.border) ?? ""
                      );
                      setEditedMargin(
                        formatEuropeanFloat(machine.margin) ?? ""
                      );
                    }}
                  />
                )}
                <RemoveRowButton
                  language={language}
                  onClick={async () => {
                    await deleteMachine(machine.id);
                    setMachines(machines.filter((el) => el.id !== machine.id));
                  }}
                />
              </>
            ),
          },
        ],
      };
    });
  }, [machines, beingEdited, language, editedName, editedBorder, editedMargin]);

  const headers = [
    {
      text: language === "da" ? "Navn" : "Name",
      headerKey: "name",
      canSort: true,
    },
    {
      text: language === "da" ? "Margen (mm)" : "Margin (mm)",
      headerKey: "margin",
      canSort: true,
    },
    {
      text: language === "da" ? "Kant (mm)" : "Border (mm)",
      headerKey: "border",
      canSort: true,
    },
    {
      text: language === "da" ? "Sæt som standard" : "Set as default",
      headerKey: "default",
      canSort: true,
    },
    {
      text: language === "da" ? "Tving lige snit" : "Force straight cuts",
      headerKey: "straight",
      canSort: true,
    },
    { text: "", headerKey: "action", canSort: false },
  ];

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === "da" ? "Mine plade maskiner" : "My machine machines"}
        </h1>
        <p className="mb-4">
          {language === "da"
            ? "På denne side kan du tilføje maskiner med tilhørende margen og kant som du kontinuerligt kan genbruge når du udregner nesting"
            : "On this page you can add machines with defined margin and border that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-8">
          <InputField
            label={language === "da" ? "Maskine navn" : "Machine name"}
            id="machineName"
            placeholder={
              language === "da" ? "f.eks. Laser cutter" : "e.g. Laserskærer"
            }
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.name,
                event.target.value,
                ComponentNames.myMachines
              );
            }}
          />

          <InputField
            label={language === "da" ? "Margen (mm)" : "Margin (mm)"}
            id="machineMargin"
            placeholder={language === "da" ? "f.eks. 10" : "e.g. 10"}
            number
            value={margin}
            onChange={(event) => {
              setMargin(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.margin,
                event.target.value,
                ComponentNames.myMachines
              );
            }}
          />

          <InputField
            label={language === "da" ? "Kant (mm)" : "Border (mm)"}
            id="machineBorder"
            placeholder={language === "da" ? "f.eks. 5" : "e.g. 5"}
            number
            value={border}
            onChange={(event) => {
              setBorder(event.target.value);
              saveInputToLocalStorage(
                InputFieldValues.border,
                event.target.value,
                ComponentNames.myMachines
              );
            }}
          />

          <ClearButton
            language={language}
            disabled={!name?.trim() && !margin?.trim() && !border?.trim()}
            onClick={clearInputs}
          />

          <AddButton
            language={language}
            disabled={
              !name?.trim() ||
              !isValidEuropeanNumberString(margin) ||
              !isValidEuropeanNumberString(border)
            }
            onClick={addNewMachine}
          />
        </div>
      </div>
      {loading && <TableSkeleton />}
      {!loading && rows.length === 0 && (
        <EmptyStateLine language={language} type={ITEMTYPES.Machine} />
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
