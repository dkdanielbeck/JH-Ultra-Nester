import { supabase } from "../supabaseClient";
import type { SheetElement } from "../types";
import { ensureLengthIsLargest } from "../utils";
import { getCurrentUserId } from "./auth";

export async function fetchSheetElements(): Promise<SheetElement[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase.from("sheetElements").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function insertSheetElement(sheetElement: Omit<SheetElement, "id">): Promise<SheetElement> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const newSheetElement = ensureLengthIsLargest(sheetElement);

  const { data, error } = await supabase
    .from("sheetElements")
    .insert([{ ...newSheetElement, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSheetElement(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("sheetElements").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function updateSheetElement(id: string, updates: Partial<SheetElement>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const newSheetElement = ensureLengthIsLargest(updates);

  const { error } = await supabase.from("sheetElements").update(newSheetElement).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
