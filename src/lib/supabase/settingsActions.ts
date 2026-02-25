"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  full_name: string;
  username: string;
  phone: string;
  bio: string;
  avatar_url: string;
}

export interface SchedulePreferences {
  default_view: string;
  date_format: string;
  time_format: string;
  week_start: string;
  timezone: string;
  work_start: number;
  work_end: number;
  show_week_numbers: boolean;
  show_declined: boolean;
  highlight_today: boolean;
}

export interface AppearancePreferences {
  theme: string;
  density: string;
  language: string;
  font_size: string;
  reduce_motion: boolean;
}

export interface NotificationExtras {
  daily_digest: boolean;
  weekly_summary: boolean;
  quiet_hours: boolean;
  quiet_start: number;
  quiet_end: number;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  input: Partial<UserProfile>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (input.username) {
    input.username = input.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  const { error } = await supabase.auth.updateUser({ data: { ...input } });
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Avatar URL ───────────────────────────────────────────────────────────────

export async function updateAvatarUrl(
  url: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: url },
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function updatePassword(
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Schedule preferences ─────────────────────────────────────────────────────

export async function getSchedulePreferences(): Promise<SchedulePreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("schedule_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    const defaults = {
      user_id: user.id,
      default_view: "week",
      date_format: "DD/MM/YYYY",
      time_format: "12h",
      week_start: "monday",
      timezone: "Africa/Lagos",
      work_start: 8,
      work_end: 18,
      show_week_numbers: false,
      show_declined: false,
      highlight_today: true,
    };
    const { data: created } = await supabase
      .from("schedule_preferences")
      .insert(defaults)
      .select("*")
      .single();
    return created;
  }

  return data;
}

export async function upsertSchedulePreferences(
  input: Partial<SchedulePreferences>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("schedule_preferences")
    .upsert(
      { user_id: user.id, ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/schedule");
  return { success: true };
}

// ─── Appearance preferences ───────────────────────────────────────────────────

export async function getAppearancePreferences(): Promise<AppearancePreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("appearance_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    const defaults = {
      user_id: user.id,
      theme: "light",
      density: "comfortable",
      language: "en",
      font_size: "medium",
      reduce_motion: false,
    };
    const { data: created } = await supabase
      .from("appearance_preferences")
      .insert(defaults)
      .select("*")
      .single();
    return created;
  }

  return data;
}

export async function upsertAppearancePreferences(
  input: Partial<AppearancePreferences>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("appearance_preferences")
    .upsert(
      { user_id: user.id, ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Notification extras ──────────────────────────────────────────────────────

export async function getNotificationExtras(): Promise<NotificationExtras | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_extras")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    const defaults = {
      user_id: user.id,
      daily_digest: false,
      weekly_summary: false,
      quiet_hours: false,
      quiet_start: 22,
      quiet_end: 7,
    };
    const { data: created } = await supabase
      .from("notification_extras")
      .insert(defaults)
      .select("*")
      .single();
    return created;
  }

  return data;
}

export async function upsertNotificationExtras(
  input: Partial<NotificationExtras>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notification_extras")
    .upsert(
      { user_id: user.id, ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}
