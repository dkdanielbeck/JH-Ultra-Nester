import { supabase } from "../supabaseClient";
import { type SteelLengthElement } from "../types";
import { getCurrentUserId } from "./auth";

export async function fetchSteelLengthElements(): Promise<SteelLengthElement[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase.from("steelLengthElements").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function insertSteelLengthElement(steelLengthElement: Omit<SteelLengthElement, "id">): Promise<SteelLengthElement> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase
    .from("steelLengthElements")
    .insert([{ ...steelLengthElement, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSteelLengthElement(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("steelLengthElements").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function updateSteelLengthElement(id: string, updates: Partial<SteelLengthElement>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("steelLengthElements").update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
