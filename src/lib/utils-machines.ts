import type { MachineProfile } from "./types";

export function saveMachine(border: string, margin: string, name: string, machines: MachineProfile[], itemId: string): MachineProfile[] {
  const editedMachine = machines.find((machine) => machine.id === itemId);

  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some(
    (machine) => machine.machineName.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin && machine.id !== itemId
  );

  if (exists) {
    alert("A machine with this name and size already exists.");
    return machines;
  }

  const newMachine: MachineProfile = {
    id: itemId,
    machineName: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: editedMachine?.default ?? false,
    straightCuts: editedMachine?.straightCuts ?? false,
  };

  const updatedMachines = machines.map((machine) => {
    return machine.id === itemId ? newMachine : machine;
  });

  return updatedMachines;
}

export function addMachine(border: string, margin: string, name: string, machines: MachineProfile[]): MachineProfile[] {
  const parsedBorder = parseInt(border);
  const parsedMargin = parseInt(margin);

  if (!name.trim() || isNaN(parsedBorder) || isNaN(parsedMargin)) return machines;

  const exists = machines.some((machine) => machine.machineName.toLowerCase() === name.trim().toLowerCase() && machine.border === parsedBorder && machine.margin === parsedMargin);

  if (exists) {
    alert("A machine with this name and configurations already exist.");
    return machines;
  }

  const newMachine: MachineProfile = {
    id: crypto.randomUUID(),
    machineName: name.trim(),
    border: parsedBorder,
    margin: parsedMargin,
    default: machines.length === 0 ? true : false,
    straightCuts: false,
  };

  const updatedMachines = [...machines, newMachine];
  return updatedMachines;
}
