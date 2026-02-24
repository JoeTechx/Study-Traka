"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ReminderPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  web_push_enabled: boolean;
  email_override: string | null;
  default_minutes_before: number;
  created_at: string;
  updated_at: string;
}

export interface EventReminderOverride {
  id: string;
  user_id: string;
  event_id: string;
  minutes_before: number;
  email_enabled: boolean | null;
  web_push_enabled: boolean | null;
}

// ── Get or create reminder preferences ───────────────────────────────────────
export async function getReminderPreferences(): Promise<ReminderPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reminder_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    // No row yet — create defaults
    const { data: created } = await supabase
      .from("reminder_preferences")
      .insert({
        user_id: user.id,
        email_enabled: true,
        web_push_enabled: false,
        default_minutes_before: 30,
      })
      .select("*")
      .single();
    return created;
  }

  return data;
}

// ── Save reminder preferences ─────────────────────────────────────────────────
export async function upsertReminderPreferences(
  input: Partial<
    Omit<ReminderPreferences, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("reminder_preferences")
    .upsert(
      { user_id: user.id, ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  return { success: true };
}

// ── Save web push subscription to DB ─────────────────────────────────────────
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, ...sub }, { onConflict: "user_id,endpoint" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Delete push subscription (when user disables web push) ───────────────────
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return { success: true };
}

// ── Upsert per-event override ─────────────────────────────────────────────────
export async function upsertEventReminderOverride(
  eventId: string,
  input: {
    minutes_before: number;
    email_enabled?: boolean | null;
    web_push_enabled?: boolean | null;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("event_reminder_overrides").upsert(
    {
      user_id: user.id,
      event_id: eventId,
      ...input,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,event_id" },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Get per-event reminder override ──────────────────────────────────────────
export async function getEventReminderOverride(
  eventId: string,
): Promise<EventReminderOverride | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("event_reminder_overrides")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .single();

  return data ?? null;
}

// ── Get upcoming events for dashboard reminders panel (next 7 days) ───────────
// Also joins event_reminder_overrides so reminder_minutes_before is available
// on each event for the ReminderBadge in AgendaView.
export async function getUpcomingEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch events and their overrides in parallel
  const [eventsRes, overridesRes] = await Promise.all([
    supabase
      .from("schedule_events")
      .select("*, course:courses(id, code, title)")
      .eq("user_id", user.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", in7d.toISOString())
      .order("start_time", { ascending: true })
      .limit(10),

    supabase
      .from("event_reminder_overrides")
      .select("event_id, minutes_before")
      .eq("user_id", user.id),
  ]);

  const events = eventsRes.data ?? [];
  const overrides = overridesRes.data ?? [];

  // Build a lookup map: event_id → minutes_before
  const overrideMap = new Map<string, number>(
    overrides.map((o) => [o.event_id, o.minutes_before]),
  );

  // Attach reminder_minutes_before to each event
  return events.map((event) => ({
    ...event,
    reminder_minutes_before: overrideMap.get(event.id) ?? null,
  }));
}
