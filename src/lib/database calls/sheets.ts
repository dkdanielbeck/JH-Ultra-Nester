import { supabase } from "../supabaseClient";
import { type Sheet } from "../types";
import { ensureLengthIsLargest } from "../utils";
import { getCurrentUserId } from "./auth";

export async function fetchSheets(): Promise<Sheet[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const { data, error } = await supabase.from("sheets").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function insertSheet(sheet: Omit<Sheet, "id">): Promise<Sheet> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const newSheet = ensureLengthIsLargest(sheet);

  const { data, error } = await supabase
    .from("sheets")
    .insert([{ ...newSheet, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSheet(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("sheets").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function updateSheet(id: string, updates: Partial<Sheet>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const newSheet = ensureLengthIsLargest(updates);

  const { error } = await supabase.from("sheets").update(newSheet).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
