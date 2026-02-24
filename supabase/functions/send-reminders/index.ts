// @ts-nocheck
// This runs on Deno (Supabase Edge Functions) — URL imports are correct here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  try {
    const now     = new Date();
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);

    // 1. Fetch events starting in the next 60 minutes
    const { data: events, error: eventsErr } = await supabase
      .from("schedule_events")
      .select("id, user_id, title, start_time, end_time, event_type, location, course:courses(code)")
      .gte("start_time", now.toISOString())
      .lte("start_time", in60min.toISOString());

    if (eventsErr) throw eventsErr;
    if (!events?.length) return new Response("No events", { status: 200 });

    for (const event of events) {
      // 2. Get user reminder preferences
      const { data: prefs } = await supabase
        .from("reminder_preferences")
        .select("*")
        .eq("user_id", event.user_id)
        .maybeSingle();

      if (!prefs) continue;

      // 3. Get per-event override
      const { data: override } = await supabase
        .from("event_reminder_overrides")
        .select("*")
        .eq("user_id", event.user_id)
        .eq("event_id", event.id)
        .maybeSingle();

      const minutesBefore = override?.minutes_before ?? prefs.default_minutes_before;
      const reminderTime  = new Date(new Date(event.start_time).getTime() - minutesBefore * 60 * 1000);
      const diffMs        = Math.abs(now.getTime() - reminderTime.getTime());
      if (diffMs > 60 * 1000) continue; // not in the 1-minute firing window

      // 4. Resolve channels
      const emailOn   = override?.email_enabled    ?? prefs.email_enabled;
      const pushOn    = override?.web_push_enabled ?? prefs.web_push_enabled;

      // 5. Build message content
      const { data: authData } = await supabase.auth.admin.getUserById(event.user_id);
      const toEmail = prefs.email_override || authData?.user?.email;

      const startStr = new Date(event.start_time).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
      });

      const title   = `⏰ ${event.title} starts in ${minutesBefore} min`;
      const bodyTxt = [
        `Your event "${event.title}"${event.course?.code ? ` (${event.course.code})` : ""} starts at ${startStr}.`,
        event.location ? `Location: ${event.location}` : "",
      ].filter(Boolean).join("\n");

      // 6. Send email
      if (emailOn && toEmail) {
        await sendWithLog(event, "email", () => sendEmail(toEmail, title, bodyTxt));
      }

      // 7. Send web push to all subscribed devices
      if (pushOn) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", event.user_id);

        if (subs?.length) {
          // Send push to all devices, log once per event
          const pushPayload = JSON.stringify({
            title,
            body:  bodyTxt,
            url:   "/dashboard/schedule",
            tag:   `event-${event.id}`,
          });
          await sendWithLog(event, "web_push", async () => {
            for (const sub of subs) {
              await sendWebPush(sub, pushPayload);
            }
          });
        }
      }
    }

    return new Response("Reminders processed", { status: 200 });
  } catch (err) {
    console.error("[send-reminders] Fatal:", err);
    return new Response("Error", { status: 500 });
  }
});

// ── Helper: send + log with deduplication ────────────────────────────────────
async function sendWithLog(
  event: { id: string; user_id: string },
  channel: "email" | "web_push",
  fn: () => Promise<void>
) {
  // Deduplication check
  const { data: existing } = await supabase
    .from("reminder_notifications_log")
    .select("id")
    .eq("event_id", event.id)
    .eq("channel",  channel)
    .eq("status",   "sent")
    .maybeSingle();

  if (existing) return; // already sent

  let status: "sent" | "failed" = "failed";
  let errorMsg: string | undefined;

  try {
    await fn();
    status = "sent";
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`[send-reminders] ${channel} failed for event ${event.id}:`, errorMsg);
  }

  await supabase.from("reminder_notifications_log").insert({
    user_id:   event.user_id,
    event_id:  event.id,
    channel,
    status,
    error_msg: errorMsg ?? null,
  });
}

// ── Email via Resend ──────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  // Free Resend accounts must use onboarding@resend.dev as from address.
  // Once you verify a domain in Resend, set RESEND_FROM_EMAIL secret to
  // "StudyTraka <reminders@yourdomain.com>"
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "StudyTraka <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], subject,
      text: body,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="font-size:18px;color:#111;margin:0 0 12px">${subject}</h2>
          <p style="color:#555;line-height:1.7;white-space:pre-line;margin:0 0 20px">${body}</p>
          <a href="${Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "#"}/dashboard/schedule"
             style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
            View Schedule →
          </a>
          <p style="color:#aaa;font-size:11px;margin-top:24px">
            Manage reminders in Schedule → Agenda view · Sent by StudyTraka
          </p>
        </div>
      `,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

// ── Web Push via VAPID ────────────────────────────────────────────────────────
async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string
) {
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidPublicKey  = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const vapidEmail      = Deno.env.get("VAPID_EMAIL") ?? "mailto:admin@studytraka.com";

  if (!vapidPrivateKey || !vapidPublicKey) throw new Error("VAPID keys not set");

  // Build VAPID JWT
  const origin  = new URL(sub.endpoint).origin;
  const now_sec = Math.floor(Date.now() / 1000);

  const header  = { alg: "ES256", typ: "JWT" };
  const claims  = { aud: origin, exp: now_sec + 3600, sub: vapidEmail };

  const b64u = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedJwt = `${b64u(header)}.${b64u(claims)}`;

  // Import private key
  const privKeyBytes = Uint8Array.from(atob(vapidPrivateKey), (c) => c.charCodeAt(0));
  const cryptoKey    = await crypto.subtle.importKey(
    "pkcs8", privKeyBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const jwt = `${unsignedJwt}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

  const vapidHeader = `vapid t=${jwt},k=${vapidPublicKey}`;

  // Encrypt payload
  const p256dh = Uint8Array.from(atob(sub.p256dh), (c) => c.charCodeAt(0));
  const auth   = Uint8Array.from(atob(sub.auth),   (c) => c.charCodeAt(0));

  const encoded = new TextEncoder().encode(payload);

  const res = await fetch(sub.endpoint, {
    method:  "POST",
    headers: {
      Authorization:    vapidHeader,
      "Content-Type":   "application/octet-stream",
      "Content-Length": String(encoded.length),
      TTL:              "86400",
    },
    body: encoded,
  });

  // 410 Gone = subscription expired, ignore
  if (res.status === 410 || res.status === 404) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    return;
  }
  if (!res.ok) throw new Error(`Push endpoint ${res.status}: ${await res.text()}`);
}