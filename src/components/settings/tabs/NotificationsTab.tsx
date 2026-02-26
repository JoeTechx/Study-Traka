"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MonitorSmartphone,
  BellOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sun,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { upsertReminderPreferences } from "@/lib/supabase/reminderActions";
import { upsertNotificationExtras } from "@/lib/supabase/settingsActions";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { ReminderPreferences } from "@/lib/supabase/reminderActions";
import type { NotificationExtras } from "@/lib/supabase/settingsActions";
import {
  SettingCard,
  CardHeader,
  CardBody,
  CardFooter,
  SectionLabel,
  ToggleRow,
  SaveButton,
} from "@/components/settings/SettingsPrimitives";

interface NotificationsTabProps {
  reminderPrefs: ReminderPreferences | null;
  notifExtras: NotificationExtras | null;
  userEmail: string;
}

const LEAD_TIMES = [
  { label: "5m", value: 5 },
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
  { label: "1 day", value: 1440 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: String(i), label: `${h}:00 ${ampm}` };
});

// Simple Toggle component
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      title="Toggle"
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? "bg-indigo-500" : "bg-gray-200"}`}
      style={{ width: "2.25rem", height: "1.25rem" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(1rem)" : "translateX(0)" }}
      />
    </button>
  );
}

// Simple divider
function Divider() {
  return <div className="h-px bg-gray-100" />;
}

export function NotificationsTab({
  reminderPrefs,
  notifExtras,
  userEmail,
}: NotificationsTabProps) {
  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications();

  // ── Channel + timing state (from reminderPrefs) ───────────────────────────
  const [emailEnabled, setEmailEnabled] = useState(
    reminderPrefs?.email_enabled ?? true,
  );
  const [pushEnabled, setPushEnabled] = useState(
    reminderPrefs?.web_push_enabled ?? false,
  );
  const [leadTime, setLeadTime] = useState(
    reminderPrefs?.default_minutes_before ?? 30,
  );
  const [savingChannels, setSavingChannels] = useState(false);

  // ── Extras state (from notifExtras) ──────────────────────────────────────
  const [dailyDigest, setDailyDigest] = useState(
    notifExtras?.daily_digest ?? false,
  );
  const [weeklySummary, setWeeklySummary] = useState(
    notifExtras?.weekly_summary ?? false,
  );
  const [quietHours, setQuietHours] = useState(
    notifExtras?.quiet_hours ?? false,
  );
  const [quietStart, setQuietStart] = useState(
    String(notifExtras?.quiet_start ?? 22),
  );
  const [quietEnd, setQuietEnd] = useState(String(notifExtras?.quiet_end ?? 7));
  const [savingExtras, setSavingExtras] = useState(false);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (reminderPrefs) {
      setEmailEnabled(reminderPrefs.email_enabled);
      setPushEnabled(reminderPrefs.web_push_enabled);
      setLeadTime(reminderPrefs.default_minutes_before);
    }
  }, [reminderPrefs]);

  useEffect(() => {
    if (notifExtras) {
      setDailyDigest(notifExtras.daily_digest);
      setWeeklySummary(notifExtras.weekly_summary);
      setQuietHours(notifExtras.quiet_hours);
      setQuietStart(String(notifExtras.quiet_start));
      setQuietEnd(String(notifExtras.quiet_end));
    }
  }, [notifExtras]);

  useEffect(() => {
    if (pushStatus === "granted" && reminderPrefs?.web_push_enabled) {
      setPushEnabled(true);
    }
  }, [pushStatus, reminderPrefs]);

  // ── Push toggle ───────────────────────────────────────────────────────────
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (pushStatus === "denied") {
        toast.error(
          "Notifications are blocked — allow them in browser settings",
        );
        return;
      }
      const ok = await subscribe();
      if (ok) setPushEnabled(true);
    } else {
      const ok = await unsubscribe();
      if (ok) setPushEnabled(false);
    }
  };

  // ── Save channels + timing ────────────────────────────────────────────────
  const saveChannels = async () => {
    setSavingChannels(true);
    const res = await upsertReminderPreferences({
      email_enabled: emailEnabled,
      web_push_enabled: pushEnabled,
      default_minutes_before: leadTime,
    });
    setSavingChannels(false);
    if (res.success) toast.success("Notification settings saved");
    else toast.error(res.error ?? "Failed to save");
  };

  // ── Save extras ───────────────────────────────────────────────────────────
  const saveExtras = async () => {
    setSavingExtras(true);
    const res = await upsertNotificationExtras({
      daily_digest: dailyDigest,
      weekly_summary: weeklySummary,
      quiet_hours: quietHours,
      quiet_start: parseInt(quietStart),
      quiet_end: parseInt(quietEnd),
    });
    setSavingExtras(false);
    if (res.success) toast.success("Quiet hours saved");
    else toast.error(res.error ?? "Failed to save");
  };

  // ── Push banner ───────────────────────────────────────────────────────────
  const bannerConfig = {
    granted: {
      bg: "bg-green-50 border-green-100",
      dot: "bg-green-500 animate-pulse",
      text: "text-green-700",
      msg: "Browser notifications are active on this device.",
      Icon: CheckCircle2,
      ic: "text-green-500",
    },
    default: {
      bg: "bg-amber-50 border-amber-100",
      dot: "bg-amber-400 animate-pulse",
      text: "text-amber-700",
      msg: "Enable browser notifications to get push alerts.",
      Icon: AlertCircle,
      ic: "text-amber-500",
    },
    denied: {
      bg: "bg-red-50 border-red-100",
      dot: "bg-red-500",
      text: "text-red-700",
      msg: "Notifications are blocked. Go to browser Settings → Notifications → Allow.",
      Icon: BellOff,
      ic: "text-red-500",
    },
    unsupported: {
      bg: "bg-gray-50 border-gray-100",
      dot: "bg-gray-400",
      text: "text-gray-600",
      msg: "Push notifications aren't supported in this browser.",
      Icon: BellOff,
      ic: "text-gray-400",
    },
    loading: {
      bg: "bg-gray-50 border-gray-100",
      dot: "bg-gray-300",
      text: "text-gray-500",
      msg: "Checking notification status…",
      Icon: Bell,
      ic: "text-gray-400",
    },
  };
  const bc =
    bannerConfig[pushStatus as keyof typeof bannerConfig] ??
    bannerConfig.default;

  return (
    <div className="space-y-6">
      {/* Push permission banner */}
      {!bannerDismissed && pushStatus !== "granted" && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border ${bc.bg}`}
        >
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${bc.dot}`} />
          <bc.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${bc.ic}`} />
          <p className={`text-[0.78rem] flex-1 ${bc.text}`}>{bc.msg}</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-[0.65rem] text-gray-400 hover:text-gray-600 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channels */}
      <SectionLabel>Notification channels</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Bell className="w-4 h-4 text-indigo-500" />}
          title="Alert channels"
          description="How you receive reminders for upcoming events"
        />
        <CardBody className="space-y-0 px-0">
          {/* Email row */}
          <div
            className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors ${emailEnabled ? "bg-indigo-50/40" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[0.83rem] font-medium text-gray-800">
                    Email
                  </p>
                  <span className="px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-600 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-[0.7rem] text-gray-400 mt-0.5">
                  Sends to {userEmail}
                </p>
              </div>
            </div>
            <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
          </div>

          <Divider />

          {/* Push row */}
          <div
            className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors ${pushEnabled ? "bg-violet-50/40" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                {pushStatus === "denied" ? (
                  <BellOff className="w-4 h-4 text-red-400" />
                ) : (
                  <MonitorSmartphone className="w-4 h-4 text-violet-500" />
                )}
              </div>
              <div>
                <p className="text-[0.83rem] font-medium text-gray-800">
                  Browser push
                </p>
                <p
                  className={`text-[0.7rem] mt-0.5 ${pushStatus === "denied" ? "text-red-400" : "text-gray-400"}`}
                >
                  {pushStatus === "granted" && "Active on this device"}
                  {pushStatus === "denied" && "Blocked in browser settings"}
                  {pushStatus === "default" && "Click toggle to enable"}
                  {pushStatus === "unsupported" &&
                    "Not supported in this browser"}
                  {pushStatus === "loading" && "Checking…"}
                </p>
              </div>
            </div>
            <Toggle
              checked={pushEnabled && pushStatus === "granted"}
              onChange={handlePushToggle}
              disabled={
                pushStatus === "loading" || pushStatus === "unsupported"
              }
            />
          </div>
        </CardBody>
      </SettingCard>

      {/* Lead time */}
      <SectionLabel>Reminder timing</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Clock className="w-4 h-4 text-indigo-500" />}
          title="Lead time"
          description="How early to send the reminder before an event starts"
        />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {LEAD_TIMES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setLeadTime(lt.value)}
                className={`px-4 py-2 rounded-xl border text-[0.78rem] font-semibold transition-all ${
                  leadTime === lt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </CardBody>
        <CardFooter>
          <SaveButton saving={savingChannels} onClick={saveChannels} />
        </CardFooter>
      </SettingCard>

      {/* Digests */}
      <SectionLabel>Summaries</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Sun className="w-4 h-4 text-indigo-500" />}
          title="Digests"
          description="Periodic summaries of your schedule"
        />
        <CardBody className="divide-y divide-gray-50">
          <ToggleRow
            label="Daily digest"
            description="Morning email with today's events at 7:00 AM"
            checked={dailyDigest}
            onChange={setDailyDigest}
          />
          <ToggleRow
            label="Weekly summary"
            description="Monday morning overview of your week ahead"
            checked={weeklySummary}
            onChange={setWeeklySummary}
          />
        </CardBody>
      </SettingCard>

      {/* Quiet hours */}
      <SectionLabel>Quiet hours</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Calendar className="w-4 h-4 text-indigo-500" />}
          title="Do not disturb"
          description="Pause non-critical notifications during set hours"
        />
        <CardBody className="space-y-4">
          <ToggleRow
            label="Enable quiet hours"
            description="Silence digest and summary notifications"
            checked={quietHours}
            onChange={setQuietHours}
          />
          {quietHours && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">
                    From
                  </label>
                  <select
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-3 py-2.5 text-[0.82rem] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">
                    Until
                  </label>
                  <select
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-3 py-2.5 text-[0.82rem] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[0.7rem] text-amber-700">
                  Event-start alerts will still fire during quiet hours so you
                  never miss a class or exam.
                </p>
              </div>
            </>
          )}
        </CardBody>
        <CardFooter>
          <SaveButton saving={savingExtras} onClick={saveExtras} />
        </CardFooter>
      </SettingCard>
    </div>
  );
}
