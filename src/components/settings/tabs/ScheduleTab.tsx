"use client";

import { useState } from "react";
import {
  CalendarDays,
  LayoutGrid,
  Calendar,
  List,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  upsertSchedulePreferences,
  type SchedulePreferences,
} from "@/lib/supabase/settingsActions";
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

export function ScheduleTab({ schedulePrefs }: ScheduleTabProps) {
  // Initialise from real saved data
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
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await upsertSchedulePreferences({
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
    });
    setSaving(false);
    if (res.success) toast.success("Schedule preferences saved");
    else toast.error(res.error ?? "Failed to save");
  };

  const ws = parseInt(workStart);
  const we = parseInt(workEnd);

  return (
    <div className="space-y-6">
      {/* Default view */}
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

      {/* Date & time formats */}
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

      {/* Working hours */}
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

      {/* Display toggles */}
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
        <CardFooter>
          <SaveButton saving={saving} onClick={save} />
        </CardFooter>
      </SettingCard>
    </div>
  );
}
