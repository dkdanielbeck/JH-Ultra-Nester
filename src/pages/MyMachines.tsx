import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { loadLanguage } from "@/App";
import { Checkbox } from "@/components/ui/checkbox";

export type MachineProfile = {
  machineName: string;
  margin: number;
  border: number;
  id: string;
  default: boolean;
};

const STORAGE_KEY = "my-machines";

export function loadMachines(): MachineProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load machines:", e);
    return [];
  }
}

function saveMachines(machines: MachineProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
  } catch (e) {
    console.error("Failed to save machines:", e);
  }
}

export default function MyMachines() {
  type SortKey = "machineName" | "border" | "margin";
  type SortOrder = "asc" | "desc";
  const [language] = useState<string>(() => loadLanguage());

  const [machines, setMachines] = useState<MachineProfile[]>(() => loadMachines());
  const [sortKey, setSortKey] = useState<SortKey>("machineName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [name, setName] = useState("");
  const [border, setBorder] = useState("");
  const [margin, setMargin] = useState("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedBorder, setEditedBorder] = useState<string>("");
  const [editedMargin, setEditedMargin] = useState<string>("");
  const [beingEdited, setBeingEdited] = useState<string>("");

  useEffect(() => {
    saveMachines(machines);
  }, [machines]);

  const addMachine = () => {
    const parsedBorder = parseInt(border);
    const parsedMargin = parseInt(margin);

    if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return;

    // Check for duplicate name *with same dimensions*
    const exists = machines.some((machine) => machine.machineName.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin);

    if (exists) {
      alert("A machine with this name and configurations already exist.");
      return;
    }

    const newMachine: MachineProfile = {
      id: crypto.randomUUID(),
      machineName: name.trim(),
      border: parsedBorder,
      margin: parsedMargin,
      default: machines.length === 0 ? true : false,
    };

    const updatedMachines = [...machines, newMachine];
    setMachines(updatedMachines);

    setName("");
    setBorder("");
    setMargin("");
  };

  const SaveEditedMachine = () => {
    const editedMachine = machines.find((machine) => machine.id === beingEdited);

    const parsedBorder = parseInt(editedBorder);
    const parsedMargin = parseInt(editedMargin);

    if (!editedName.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return;

    const exists = machines.some(
      (machine) => machine.machineName.toLowerCase() === editedName.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin && machine.id !== beingEdited
    );

    if (exists) {
      alert("A machine with this name and size already exists.");
      return;
    }

    const newMachine: MachineProfile = {
      id: beingEdited,
      machineName: editedName.trim(),
      border: parsedBorder,
      margin: parsedMargin,
      default: editedMachine?.default ?? false,
    };

    const updatedMachines = machines.map((machine) => {
      return machine.id === beingEdited ? newMachine : machine;
    });

    setMachines(updatedMachines);

    setEditedName("");
    setEditedMargin("");
    setEditedBorder("");
    setBeingEdited("");
  };

  const setDefault = (machineId: string) => {
    const updatedMachines = machines.map((machine) => {
      if (machine.id === machineId) {
        return { ...machine, default: true };
      } else if (machine?.default === true) {
        return { ...machine, default: false };
      } else {
        return machine;
      }
    });

    setMachines(updatedMachines);
  };

  const removeMachine = (id: string) => {
    setMachines(machines.filter((emachine) => emachine.id !== id));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedMachines = [...machines].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return (
    <div className="flex flex-col max-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold p-4">{language === "da" ? "Mine maskiner" : "My machines"}</h1>
        <p className="pl-4 pr-4 mb-8">
          {language === "da"
            ? "På denne side kan du tilføje maskiner med tilhørende margen og kant som du kontinuerligt kan genbruge når du udregner nesting"
            : "On this page you can add machines with defined margin and border that you can continuously reuse when calculating nestings."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder={language === "da" ? "Maskine navn" : "Machine name"} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={language === "da" ? "Margen (mm)" : "Margin (mm)"} type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
          <Input placeholder={language === "da" ? "Kant (mm)" : "Border (mm)"} type="number" value={border} onChange={(e) => setBorder(e.target.value)} />
          <Button disabled={name === "" || margin === "" || border === "" || !name || !border || !margin} variant="secondary" onClick={addMachine}>
            {language === "da" ? "Tilføj" : "Add"}
          </Button>
        </div>
      </div>

      {sortedMachines.length !== 0 && (
        <div style={{ borderRadius: "10px" }} className="flex-grow overflow-auto p-4 bg-muted max-h-[calc(70vh)]">
          <Table>
            <TableHeader className="top-0 bg-muted z-10">
              <TableRow>
                <TableHead onClick={() => handleSort("machineName")} className="cursor-pointer">
                  {language === "da" ? "Navn" : "Name"}
                </TableHead>
                <TableHead onClick={() => handleSort("margin")} className="cursor-pointer">
                  {language === "da" ? "Margen (mm)" : "Margin (mm)"}
                </TableHead>
                <TableHead onClick={() => handleSort("border")} className="cursor-pointer">
                  {language === "da" ? "Kant (mm)" : "Border (mm)"}
                </TableHead>
                <TableHead>{language === "da" ? "Sæt som standard" : "Set as default"}</TableHead> <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMachines.map((machine) => {
                const shouldEdit = machine.id === beingEdited;

                return (
                  <TableRow key={machine.id}>
                    <TableCell>
                      {shouldEdit ? (
                        <Input className="max-w-40" placeholder={language === "da" ? "Maskine navn" : "Machine name"} value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                      ) : (
                        machine.machineName
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
                      <Checkbox checked={machine?.default === true} onCheckedChange={() => setDefault(machine.id)} />
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button className="mr-2" variant="destructive" size="sm" onClick={() => removeMachine(machine.id)}>
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
                            setEditedName(machine.machineName);
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
