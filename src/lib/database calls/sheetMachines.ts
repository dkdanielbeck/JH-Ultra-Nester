import { supabase } from "../supabaseClient";
import type { Machine } from "../types";
import { getCurrentUserId } from "./auth";

export async function fetchMachines(): Promise<Machine[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase.from("sheetMachines").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function insertMachine(machine: Omit<Machine, "id">): Promise<Machine> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase
    .from("sheetMachines")
    .insert([{ ...machine, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMachine(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("sheetMachines").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function updateMachine(id: string, updates: Partial<Machine>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("sheetMachines").update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
