"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ScheduleEvent, CreateScheduleEventInput } from "@/types/schedule";

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("schedule_events")
    .select(`*, course:courses(id, code, title)`)
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedule events:", error);
    return [];
  }

  return data || [];
}

export async function createScheduleEvent(
  input: CreateScheduleEventInput,
): Promise<{ success: boolean; error?: string; data?: ScheduleEvent }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("schedule_events")
    .insert({ user_id: user.id, ...input, confirmed: input.confirmed ?? false })
    .select(`*, course:courses(id, code, title)`)
    .single();

  if (error) {
    console.error("Error creating schedule event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true, data };
}

export async function updateScheduleEvent(
  id: string,
  input: Partial<CreateScheduleEventInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("schedule_events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating schedule event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

export async function toggleEventConfirmed(
  id: string,
  confirmed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("schedule_events")
    .update({ confirmed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

export async function deleteScheduleEvent(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("schedule_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting schedule event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}
