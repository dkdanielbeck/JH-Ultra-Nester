import { supabase } from "../supabaseClient";
import { type SteelLength } from "../types";
import { getCurrentUserId } from "./auth";

export async function fetchSteelLengths(): Promise<SteelLength[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase.from("steelLengths").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function insertSteelLength(steelLength: Omit<SteelLength, "id">): Promise<SteelLength> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { data, error } = await supabase
    .from("steelLengths")
    .insert([{ ...steelLength, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSteelLength(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("steelLengths").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function updateSteelLength(id: string, updates: Partial<SteelLength>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const { error } = await supabase.from("steelLengths").update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
