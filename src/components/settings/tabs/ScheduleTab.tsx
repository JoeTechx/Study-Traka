"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  LayoutGrid,
  Calendar,
  List,
  Clock,
  Eye,
  Bell,
  Mail,
  MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  upsertSchedulePreferences,
  type SchedulePreferences,
} from "@/lib/supabase/settingsActions";
import {
  getReminderPreferences,
  upsertReminderPreferences,
  type ReminderPreferences,
} from "@/lib/supabase/reminderActions";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  SettingCard,
  CardHeader,
  CardBody,
  CardFooter,
  SectionLabel,
  ToggleRow,
  SaveButton,
  SelectField,
} from "@/components/settings/SettingsPrimitives";

interface ScheduleTabProps {
  schedulePrefs: SchedulePreferences | null;
  userEmail: string;
}

const VIEW_OPTIONS = [
  { value: "week", label: "Week", Icon: CalendarDays, desc: "7-day grid" },
  { value: "month", label: "Month", Icon: LayoutGrid, desc: "Month grid" },
  { value: "day", label: "Day", Icon: Calendar, desc: "Single day" },
  { value: "agenda", label: "Agenda", Icon: List, desc: "Event list" },
];

const TIMEZONES = [
  { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)" },
  { value: "Africa/Accra", label: "Accra (GMT, UTC+0)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET, UTC+1)" },
  { value: "America/New_York", label: "New York (EST, UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST, UTC-8)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST, UTC+5:30)" },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return {
    value: String(i),
    label: `${String(h).padStart(2, "0")}:00 ${ampm}`,
  };
});

const TIMING_OPTIONS = [
  { label: "5 min before", value: 5 },
  { label: "10 min before", value: 10 },
  { label: "15 min before", value: 15 },
  { label: "30 min before", value: 30 },
  { label: "1 hr before", value: 60 },
  { label: "2 hrs before", value: 120 },
  { label: "1 day before", value: 1440 },
  { label: "Custom", value: -1 },
];

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

export function ScheduleTab({ schedulePrefs, userEmail }: ScheduleTabProps) {
  // ── Schedule preferences (calendar display) ──────────────────────────────
  const [defaultView, setDefaultView] = useState(
    schedulePrefs?.default_view ?? "week",
  );
  const [dateFormat, setDateFormat] = useState(
    schedulePrefs?.date_format ?? "DD/MM/YYYY",
  );
  const [timeFormat, setTimeFormat] = useState(
    schedulePrefs?.time_format ?? "12h",
  );
  const [weekStart, setWeekStart] = useState(
    schedulePrefs?.week_start ?? "monday",
  );
  const [timezone, setTimezone] = useState(
    schedulePrefs?.timezone ?? "Africa/Lagos",
  );
  const [workStart, setWorkStart] = useState(
    String(schedulePrefs?.work_start ?? 8),
  );
  const [workEnd, setWorkEnd] = useState(String(schedulePrefs?.work_end ?? 18));
  const [weekNumbers, setWeekNumbers] = useState(
    schedulePrefs?.show_week_numbers ?? false,
  );
  const [showDeclined, setShowDeclined] = useState(
    schedulePrefs?.show_declined ?? false,
  );
  const [highlightToday, setHighlightToday] = useState(
    schedulePrefs?.highlight_today ?? true,
  );

  // ── Reminder preferences (notifications) ─────────────────────────────────
  const [reminderPrefs, setReminderPrefs] =
    useState<ReminderPreferences | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [emailOverride, setEmailOverride] = useState("");
  const [defaultMinutesBefore, setDefaultMinutesBefore] = useState(30);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications();
  const [saving, setSaving] = useState(false);

  // ── Fetch reminder preferences on mount ──────────────────────────────────
  useEffect(() => {
    async function fetchReminders() {
      const prefs = await getReminderPreferences();
      setReminderPrefs(prefs);
      if (prefs) {
        setEmailEnabled(prefs.email_enabled);
        setWebPushEnabled(prefs.web_push_enabled);
        setEmailOverride(prefs.email_override ?? "");
        setDefaultMinutesBefore(prefs.default_minutes_before);

        const isPreset = TIMING_OPTIONS.some(
          (o) => o.value === prefs.default_minutes_before && o.value !== -1,
        );
        setShowCustom(!isPreset);
        setCustomMinutes(!isPreset ? String(prefs.default_minutes_before) : "");
      }
    }
    fetchReminders();
  }, []);

  // ── Update schedule prefs when prop changes ──────────────────────────────
  useEffect(() => {
    if (!schedulePrefs) return;
    setDefaultView(schedulePrefs.default_view);
    setDateFormat(schedulePrefs.date_format);
    setTimeFormat(schedulePrefs.time_format);
    setWeekStart(schedulePrefs.week_start);
    setTimezone(schedulePrefs.timezone);
    setWorkStart(String(schedulePrefs.work_start));
    setWorkEnd(String(schedulePrefs.work_end));
    setWeekNumbers(schedulePrefs.show_week_numbers);
    setShowDeclined(schedulePrefs.show_declined);
    setHighlightToday(schedulePrefs.highlight_today);
  }, [schedulePrefs]);

  const handleTimingSelect = (val: number) => {
    if (val === -1) {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setDefaultMinutesBefore(val);
      setCustomMinutes("");
    }
  };

  const handleWebPushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (pushStatus === "denied") {
        toast.error(
          "Notifications are blocked. Go to browser Settings → Notifications → Allow for this site.",
        );
        return;
      }
      if (pushStatus === "unsupported") {
        toast.error(
          "Your browser does not support push notifications. Try Chrome or Edge.",
        );
        return;
      }
      const ok = await subscribe();
      if (ok) setWebPushEnabled(true);
    } else {
      const ok = await unsubscribe();
      if (ok) setWebPushEnabled(false);
    }
  };

  const save = async () => {
    // Validate reminders
    if (!emailEnabled && !webPushEnabled) {
      toast.error("Please enable at least one reminder channel");
      return;
    }

    const minutesBefore = showCustom
      ? parseInt(customMinutes, 10)
      : defaultMinutesBefore;

    if (isNaN(minutesBefore) || minutesBefore < 1) {
      toast.error("Please enter a valid reminder time");
      return;
    }

    setSaving(true);

    // Save both schedule preferences AND reminder preferences
    const [scheduleRes, reminderRes] = await Promise.all([
      upsertSchedulePreferences({
        default_view: defaultView,
        date_format: dateFormat,
        time_format: timeFormat,
        week_start: weekStart,
        timezone,
        work_start: parseInt(workStart),
        work_end: parseInt(workEnd),
        show_week_numbers: weekNumbers,
        show_declined: showDeclined,
        highlight_today: highlightToday,
      }),
      upsertReminderPreferences({
        email_enabled: emailEnabled,
        web_push_enabled: webPushEnabled,
        email_override: emailOverride.trim() || null,
        default_minutes_before: minutesBefore,
      }),
    ]);

    setSaving(false);

    if (scheduleRes.success && reminderRes.success) {
      toast.success("Schedule & reminder preferences saved");
    } else {
      toast.error(
        scheduleRes.error || reminderRes.error || "Failed to save preferences",
      );
    }
  };

  const ws = parseInt(workStart);
  const we = parseInt(workEnd);
  const currentTiming = showCustom ? -1 : defaultMinutesBefore;
  const pushIsGranted = pushStatus === "granted";
  const pushIsLoading = pushStatus === "loading";

  const pushStatusLabel: Record<string, string> = {
    unsupported: "Not supported in this browser",
    denied: "Blocked — allow in browser settings",
    granted: "Active on this device",
    default: "Click to enable",
    loading: "Checking…",
  };

  return (
    <div className="space-y-6">
      <SectionLabel>Default view</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<CalendarDays className="w-4 h-4 text-indigo-500" />}
          title="Calendar view"
          description="Which view opens when you navigate to Schedule"
        />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VIEW_OPTIONS.map(({ value, label, Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDefaultView(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  defaultView === value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[0.78rem] font-semibold">{label}</span>
                <span className="text-[0.65rem] opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </SettingCard>

      <SectionLabel>Date & time</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Clock className="w-4 h-4 text-indigo-500" />}
          title="Formats"
          description="How dates and times appear throughout the app"
        />
        <CardBody className="space-y-4">
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-2">
              Date format
            </label>
            <div className="flex gap-2 flex-wrap">
              {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDateFormat(f)}
                  className={`px-3.5 py-2 rounded-xl border text-[0.75rem] font-mono font-medium transition-all ${
                    dateFormat === f
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-2">
              Time format
            </label>
            <div className="flex gap-2">
              {[
                { value: "12h", label: "12-hour (2:30 PM)" },
                { value: "24h", label: "24-hour (14:30)" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTimeFormat(t.value)}
                  className={`px-3.5 py-2 rounded-xl border text-[0.75rem] font-medium transition-all ${
                    timeFormat === t.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <SelectField
            label="Week starts on"
            value={weekStart}
            onChange={setWeekStart}
            options={[
              { value: "monday", label: "Monday" },
              { value: "sunday", label: "Sunday" },
              { value: "saturday", label: "Saturday" },
            ]}
          />
          <SelectField
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONES}
          />
        </CardBody>
      </SettingCard>

      <SectionLabel>Working hours</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Clock className="w-4 h-4 text-indigo-500" />}
          title="Active hours"
          description="Your typical study/work window"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Start time"
              value={workStart}
              onChange={setWorkStart}
              options={HOURS_24}
            />
            <SelectField
              label="End time"
              value={workEnd}
              onChange={setWorkEnd}
              options={HOURS_24}
            />
          </div>
          <div>
            <p className="text-[0.7rem] text-gray-400 mb-2">Preview</p>
            <div className="flex h-4 rounded-lg overflow-hidden gap-px bg-gray-50">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors ${i >= ws && i < we ? "bg-indigo-500" : "bg-gray-100"}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[0.6rem] text-gray-300">12 AM</span>
              <span className="text-[0.6rem] text-gray-300">12 PM</span>
              <span className="text-[0.6rem] text-gray-300">11 PM</span>
            </div>
          </div>
        </CardBody>
      </SettingCard>

      <SectionLabel>Display</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Eye className="w-4 h-4 text-indigo-500" />}
          title="Calendar display"
          description="Fine-tune what appears in the calendar views"
        />
        <CardBody className="divide-y divide-gray-50">
          <ToggleRow
            label="Show week numbers"
            description="Display ISO week number on each row"
            checked={weekNumbers}
            onChange={setWeekNumbers}
          />
          <ToggleRow
            label="Show declined events"
            description="Keep declined events visible but dimmed"
            checked={showDeclined}
            onChange={setShowDeclined}
          />
          <ToggleRow
            label="Highlight today"
            description="Add a coloured dot and bold text to today's date"
            checked={highlightToday}
            onChange={setHighlightToday}
          />
        </CardBody>
      </SettingCard>

      {/* ── REMINDER SETTINGS ────────────────────────────────────────── */}
      <SectionLabel>Reminders & notifications</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Bell className="w-4 h-4 text-indigo-500" />}
          title="Notification channels"
          description="How you'll be notified about upcoming events"
        />
        <CardBody className="space-y-2.5">
          {/* Email */}
          <div
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
              emailEnabled
                ? "border-indigo-200 bg-indigo-50/50"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.82rem] font-semibold text-gray-800">
                  Email
                </p>
                <Toggle
                  checked={emailEnabled}
                  onChange={(v) => setEmailEnabled(v)}
                />
              </div>
              <p className="text-[0.68rem] text-gray-400 mt-0.5 truncate">
                Sends to{" "}
                <span className="font-medium text-gray-600">
                  {emailOverride || userEmail}
                </span>
              </p>
              {emailEnabled && (
                <input
                  type="email"
                  value={emailOverride}
                  onChange={(e) => setEmailOverride(e.target.value)}
                  placeholder="Use a different email (optional)"
                  className="mt-2 w-full px-2.5 py-1.5 text-[0.75rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-gray-300"
                />
              )}
            </div>
          </div>

          {/* Browser push */}
          <div
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
              pushStatus === "denied"
                ? "border-red-100 bg-red-50/40"
                : pushIsGranted && webPushEnabled
                  ? "border-violet-200 bg-violet-50/50"
                  : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <MonitorSmartphone className="w-4 h-4 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.82rem] font-semibold text-gray-800">
                  Browser notification
                </p>
                <Toggle
                  checked={pushIsGranted && webPushEnabled}
                  onChange={handleWebPushToggle}
                  disabled={pushIsLoading || pushStatus === "unsupported"}
                />
              </div>
              <p
                className={`text-[0.68rem] mt-0.5 ${pushStatus === "denied" ? "text-red-400" : "text-gray-400"}`}
              >
                {pushStatusLabel[pushStatus] ?? "Click to enable"}
              </p>
            </div>
          </div>
        </CardBody>
      </SettingCard>

      {/* Timing */}
      <SettingCard>
        <CardHeader
          icon={<Clock className="w-4 h-4 text-indigo-500" />}
          title="Default reminder time"
          description="When you'll be notified before events start"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {TIMING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTimingSelect(opt.value)}
                className={`px-3 py-2.5 rounded-xl border text-[0.75rem] font-medium text-left transition-all ${
                  currentTiming === opt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10080"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="e.g. 45"
                className="flex-1 px-3 py-2 text-[0.8rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-[0.75rem] text-gray-500 shrink-0">
                minutes before
              </span>
            </div>
          )}
          <p className="mt-2 text-[0.67rem] text-gray-400">
            All your events will be reminded at this time before they start.
          </p>
        </CardBody>
        <CardFooter>
          <SaveButton saving={saving} onClick={save} />
        </CardFooter>
      </SettingCard>
    </div>
  );
}
