import { ITEMTYPES, type Machine } from "./types";

export function saveMachine(border: string, margin: string, name: string, machines: Machine[], itemId: string): Machine[] {
  const editedMachine = machines.find((machine) => machine.id === itemId);

  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some((machine) => machine.name.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin && machine.id !== itemId);

  if (exists) {
    alert("A machine with this name and size already exists.");
    return machines;
  }

  const newMachine: Machine = {
    id: itemId,
    name: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: editedMachine?.default ?? false,
    straightCuts: editedMachine?.straightCuts ?? false,
    type: ITEMTYPES.Machine,
  };

  const updatedMachines = machines.map((machine) => {
    return machine.id === itemId ? newMachine : machine;
  });

  return updatedMachines;
}

export function addMachine(border: string, margin: string, name: string, machines: Machine[]): Machine[] {
  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some((machine) => machine.name.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin);

  if (exists) {
    alert("A machine with this name and configurations already exist.");
    return machines;
  }

  const newMachine: Machine = {
    id: crypto.randomUUID(),
    name: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: machines.length === 0 ? true : false,
    straightCuts: false,
    type: ITEMTYPES.Machine,
  };

  const updatedMachines = [...machines, newMachine];
  return updatedMachines;
}
