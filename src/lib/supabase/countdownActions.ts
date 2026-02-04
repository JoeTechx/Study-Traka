"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Countdown {
  id: string;
  user_id: string;
  title: string;
  target_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the user's countdown
 */
export async function getCountdown(): Promise<Countdown | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("countdowns")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // No countdown exists yet
    if (error.code === "PGRST116") return null;
    console.error("Error fetching countdown:", error);
    return null;
  }

  return data;
}

/**
 * Create or update the user's countdown
 */
export async function upsertCountdown(
  title: string,
  targetDate: Date,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase.from("countdowns").upsert(
    {
      user_id: user.id,
      title,
      target_date: targetDate.toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Error upserting countdown:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Delete the user's countdown
 */
export async function deleteCountdown(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("countdowns")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting countdown:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
