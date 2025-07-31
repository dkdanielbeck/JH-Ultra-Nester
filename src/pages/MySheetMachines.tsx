import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { Checkbox } from "@/components/ui/checkbox";
import { ComponentNames, InputFieldValues, ITEMTYPES, type Machine } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { clearInputsFromLocalStorage, loadInputFromLocalStorage, saveInputToLocalStorage } from "@/lib/utils-local-storage";
import { deleteMachine, fetchMachines, insertMachine, updateMachine } from "@/lib/database calls/sheetMachines";
import EmptyStateLine from "@/components/my-components/EmptyStateLine";
import TableSkeleton from "@/components/my-components/TableSkeleton";

export default function MySheetMachines() {
  const [language] = useState<string>(() => loadLanguage());

  const [machines, setMachines] = useState<Machine[]>([]);
  const [name, setName] = useState(loadInputFromLocalStorage(InputFieldValues.name, ComponentNames.myMachines) || "");
  const [border, setBorder] = useState(loadInputFromLocalStorage(InputFieldValues.border, ComponentNames.myMachines) || "");
  const [margin, setMargin] = useState(loadInputFromLocalStorage(InputFieldValues.margin, ComponentNames.myMachines) || "");
  const [editedName, setEditedName] = useState<string>("");
  const [editedBorder, setEditedBorder] = useState<string>("");
  const [editedMargin, setEditedMargin] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");
  const { sortedItems, handleSort } = useSort<Machine>(machines, "name");
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
      border: parseFloat(border),
      margin: parseFloat(margin),
      type: ITEMTYPES.Machine,
      default: false,
      straightCuts: false,
    });

    setMachines([...machines, newMachine]);

    setName("");
    setBorder("");
    setMargin("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.border, InputFieldValues.margin], ComponentNames.myMachines);
  };

  const clearInputs = () => {
    setName("");
    setBorder("");
    setMargin("");
    clearInputsFromLocalStorage([InputFieldValues.name, InputFieldValues.border, InputFieldValues.margin], ComponentNames.myMachines);
  };

  const SaveEditedMachine = async () => {
    const editedMachine = machines.find((machine) => machine.id === beingEdited);
    const newEditedMachine = {
      name: editedName,
      border: parseFloat(editedBorder),
      margin: parseFloat(editedMargin),
      type: ITEMTYPES.Machine,
      default: editedMachine ? editedMachine.default : false,
      straightCuts: editedMachine ? editedMachine.straightCuts : false,
    };

    await updateMachine(beingEdited, newEditedMachine);

    const updated = machines.map((machine) => (machine.id === beingEdited ? { ...machine, newEditedMachine } : machine));
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

    const updatedMachines = machines.map((machine) => (machine.id === machineId ? { ...machine, straightCuts: newStraightCutsValue } : machine));

    setMachines(updatedMachines);
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine plade maskiner" : "My sheet machines"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje maskiner med tilhørende margen og kant som du kontinuerligt kan genbruge når du udregner nesting"
            : "On this page you can add machines with defined margin and border that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={language === "da" ? "Maskine navn" : "Machine name"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveInputToLocalStorage(InputFieldValues.name, e.target.value, ComponentNames.myMachines);
            }}
          />
          <Input
            placeholder={language === "da" ? "Margen (mm)" : "Margin (mm)"}
            type="number"
            value={margin}
            onChange={(e) => {
              setMargin(e.target.value);
              saveInputToLocalStorage(InputFieldValues.margin, e.target.value, ComponentNames.myMachines);
            }}
          />
          <Input
            placeholder={language === "da" ? "Kant (mm)" : "Border (mm)"}
            type="number"
            value={border}
            onChange={(e) => {
              setBorder(e.target.value);
              saveInputToLocalStorage(InputFieldValues.border, e.target.value, ComponentNames.myMachines);
            }}
          />
          <Button disabled={(name === "" && margin === "" && border === "") || (!name && !border && !margin)} variant="ghost" onClick={clearInputs}>
            {language === "da" ? "Ryd" : "Clear"}
          </Button>
          <Button disabled={name === "" || margin === "" || border === "" || !name || !border || !margin} variant="secondary" onClick={addNewMachine}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>
      {loading && <TableSkeleton />}
      {!loading && sortedItems.length === 0 && <EmptyStateLine language={language} type={ITEMTYPES.Machine} />}
      {sortedItems.length !== 0 && !loading && (
        <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead onClick={() => handleSort("margin")} className="cursor-pointer">
                  {language === "da" ? "Margen (mm)" : "Margin (mm)"}
                </TableHead>
                <TableHead onClick={() => handleSort("border")} className="cursor-pointer">
                  {language === "da" ? "Kant (mm)" : "Border (mm)"}
                </TableHead>
                <TableHead>{language === "da" ? "Sæt som standard" : "Set as default"}</TableHead>
                <TableHead>{language === "da" ? "Tving lige snit" : "Force straight cuts"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((machine) => {
                const shouldEdit = machine.id === beingEdited;

                return (
                  <TableRow key={machine.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Maskine navn" : "Machine name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        machine.name
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40"
                          placeholder={language === "da" ? "Margen (mm)" : "Margin (mm)"}
                          type="number"
                          value={editedMargin}
                          onChange={(e) => setEditedMargin(e.target.value)}
                        />
                      ) : (
                        machine.margin
                      )}
                    </TableCell>
                    <TableCell>
                      {shouldEdit ? (
                        <Input
                          className="max-w-40"
                          placeholder={language === "da" ? "Kant (mm)" : "Border (mm)"}
                          type="number"
                          value={editedBorder}
                          onChange={(e) => setEditedBorder(e.target.value)}
                        />
                      ) : (
                        machine.border
                      )}
                    </TableCell>
                    <TableCell>
                      <Checkbox className="checkbox" checked={machine?.default === true} onCheckedChange={() => setDefault(machine.id)} />
                    </TableCell>
                    <TableCell>
                      <Checkbox className="checkbox" checked={machine?.straightCuts === true} onCheckedChange={() => setOnlyStraightCuts(machine.id)} />
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        className="mr-2"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await deleteMachine(machine.id);
                          setMachines(machines.filter((el) => el.id !== machine.id));
                        }}
                      >
                        {language === "da" ? "Slet" : "Remove"}
                      </Button>
                      {shouldEdit ? (
                        <Button style={{ backgroundColor: "green", color: "white" }} variant="outline" size="sm" onClick={() => SaveEditedMachine()}>
                          {language === "da" ? "Gem" : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBeingEdited(machine.id);
                            setEditedName(machine.name);
                            setEditedBorder(machine.border.toString());
                            setEditedMargin(machine.margin.toString());
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
