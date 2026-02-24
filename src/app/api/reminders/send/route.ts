// app/api/reminders/send/route.ts

import { NextResponse } from "next/server";
import { Resend } from "resend";

// ── Config ────────────────────────────────────────────────────────────────────
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:you@example.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Auth guard ────────────────────────────────────────────────────────────────
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${CRON_SECRET}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Import web-push dynamically to avoid Next.js module issues
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date();
  const results = { sent: 0, failed: 0, skipped: 0 };

  try {
    // 1. Fetch all users with reminder preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from("reminder_preferences")
      .select("*");

    if (prefsErr) throw prefsErr;
    if (!prefs?.length) {
      return NextResponse.json({ ...results, message: "No preferences found" });
    }

    for (const pref of prefs) {
      const minutesBefore = pref.default_minutes_before ?? 30;
      const windowMs = 60 * 1000; // 1-minute window
      const reminderTarget = new Date(
        now.getTime() + minutesBefore * 60 * 1000,
      );
      const windowStart = new Date(reminderTarget.getTime() - windowMs / 2);
      const windowEnd = new Date(reminderTarget.getTime() + windowMs / 2);

      // 2. Find events due for a reminder right now
      const { data: events } = await supabase
        .from("schedule_events")
        .select("*, course:courses(code, title)")
        .eq("user_id", pref.user_id)
        .gte("start_time", windowStart.toISOString())
        .lte("start_time", windowEnd.toISOString());

      if (!events?.length) continue;

      // 3. Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        pref.user_id,
      );
      const userEmail = pref.email_override || userData?.user?.email;

      for (const event of events) {
        const channels: string[] = [];
        if (pref.email_enabled) channels.push("email");
        if (pref.web_push_enabled) channels.push("web_push");

        for (const channel of channels) {
          // 4. Check if already sent (dedup)
          const { data: existing } = await supabase
            .from("reminder_notifications_log")
            .select("id")
            .eq("user_id", pref.user_id)
            .eq("event_id", event.id)
            .eq("channel", channel)
            .maybeSingle();

          if (existing) {
            results.skipped++;
            continue;
          }

          // 5. Send
          let success = false;
          let errorMsg: string | undefined;

          try {
            if (channel === "email" && userEmail) {
              await sendEmail({ event, userEmail, minutesBefore });
              success = true;
            } else if (channel === "web_push") {
              await sendPush({
                webpush,
                supabase,
                userId: pref.user_id,
                event,
                minutesBefore,
              });
              success = true;
            }
          } catch (err: any) {
            errorMsg = err?.message ?? String(err);
            console.error(
              `Failed to send ${channel} for event ${event.id}:`,
              errorMsg,
            );
          }

          // 6. Log the attempt
          await supabase.from("reminder_notifications_log").insert({
            user_id: pref.user_id,
            event_id: event.id,
            channel,
            status: success ? "sent" : "failed",
            error_msg: errorMsg ?? null,
          });

          success ? results.sent++ : results.failed++;
        }
      }
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err: any) {
    console.error("Reminder cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendEmail({
  event,
  userEmail,
  minutesBefore,
}: {
  event: any;
  userEmail: string;
  minutesBefore: number;
}) {
  const startTime = new Date(event.start_time);
  const timeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const label =
    minutesBefore >= 60
      ? `${minutesBefore / 60} hour${minutesBefore / 60 > 1 ? "s" : ""}`
      : `${minutesBefore} minute${minutesBefore > 1 ? "s" : ""}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `⏰ Reminder: ${event.title} in ${label}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <div style="background:#6366f1;border-radius:12px;padding:20px;color:white;margin-bottom:20px;">
          <p style="margin:0;font-size:13px;opacity:0.85;">Starting in ${label}</p>
          <h2 style="margin:8px 0 0;font-size:22px;">${event.title}</h2>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;font-size:14px;color:#374151;">
          <p style="margin:0 0 8px;">📅 <strong>${dateStr}</strong></p>
          <p style="margin:0 0 8px;">🕐 <strong>${timeStr}</strong></p>
          ${event.course ? `<p style="margin:0 0 8px;">📚 <strong>${event.course.code}</strong> — ${event.course.title ?? ""}</p>` : ""}
          ${event.location ? `<p style="margin:0;">📍 <strong>${event.location}</strong></p>` : ""}
        </div>
        <p style="font-size:11px;color:#9ca3af;margin-top:20px;text-align:center;">
          You're receiving this because you enabled email reminders.
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/schedule" style="color:#6366f1;">Manage reminders</a>
        </p>
      </div>
    `,
  });
}

// ── Push sender ───────────────────────────────────────────────────────────────
async function sendPush({
  webpush,
  supabase,
  userId,
  event,
  minutesBefore,
}: {
  webpush: any;
  supabase: any;
  userId: string;
  event: any;
  minutesBefore: number;
}) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const label =
    minutesBefore >= 60 ? `${minutesBefore / 60}h` : `${minutesBefore}m`;

  const payload = JSON.stringify({
    title: `⏰ ${event.title}`,
    body: `Starting in ${label}${event.location ? ` · ${event.location}` : ""}`,
    url: "/dashboard/schedule",
  });

  const sendResults = await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  // Clean up expired subscriptions
  for (let i = 0; i < sendResults.length; i++) {
    const result = sendResults[i];
    if (result.status === "rejected") {
      const err = result.reason as any;
      if (err?.statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subs[i].endpoint);
      }
    }
  }
}
