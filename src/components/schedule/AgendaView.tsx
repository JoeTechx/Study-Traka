"use client";

import { format, isToday, isTomorrow, isPast } from "date-fns";
import {
  CheckCircle,
  MapPin,
  BookOpen,
  Trash2,
  LayoutGrid,
  List,
  Bell,
  Clock,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { ScheduleEvent } from "@/types/schedule";
import {
  deleteScheduleEvent,
  toggleEventConfirmed,
} from "@/lib/supabase/scheduleActions";
import { ReminderPreferences } from "@/lib/supabase/reminderActions";
import { ReminderSettingsModal } from "@/components/schedule/ReminderSettingsModal";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  purple: { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" },
  blue: { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" },
  green: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  yellow: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  red: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  pink: { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  orange: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: "Exam",
  class: "Class",
  study: "Study",
  custom: "Event",
};

function getDayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

type DisplayMode = "list" | "grid";

interface AgendaViewProps {
  events: ScheduleEvent[];
  onEditEvent: (e: ScheduleEvent) => void;
  preferences: ReminderPreferences | null;
  userEmail: string;
}

// ─── Reminder badge ───────────────────────────────────────────────────────────
// Shows whenever preferences exist with a timing set — regardless of channels

function ReminderBadge({
  preferences,
}: {
  preferences: ReminderPreferences | null;
}) {
  // Debug log so we can see what preferences looks like
  useEffect(() => {
    console.log("[ReminderBadge] preferences:", preferences);
  }, [preferences]);

  // Show badge as long as preferences exist and has a timing value
  if (!preferences) return null;
  if (!preferences.email_enabled && !preferences.web_push_enabled) return null;

  const mins = preferences.default_minutes_before ?? 30;
  const label = mins >= 60 ? `${mins / 60}h before` : `${mins}m before`;

  return (
    <span className="inline-flex items-center gap-0.5 text-[0.58rem] text-indigo-500 font-semibold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full shrink-0">
      <Bell className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ─── AgendaView ───────────────────────────────────────────────────────────────

export function AgendaView({
  events,
  onEditEvent,
  preferences,
  userEmail,
}: AgendaViewProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);

  // Debug — tells us exactly what preferences the component received
  useEffect(() => {
    console.log("[AgendaView] preferences prop:", preferences);
  }, [preferences]);

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  const grouped: Record<string, ScheduleEvent[]> = {};
  sorted.forEach((e) => {
    const key = format(new Date(e.start_time), "yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const handleDelete = async (event: ScheduleEvent, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!confirm(`Delete "${event.title}"?`)) return;
    setProcessingId(event.id);
    const res = await deleteScheduleEvent(event.id);
    if (!res.success) toast.error("Failed to delete");
    else toast.success("Event deleted");
    setProcessingId(null);
  };

  const handleConfirm = async (event: ScheduleEvent, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setProcessingId(event.id);
    const res = await toggleEventConfirmed(event.id, !event.confirmed);
    if (!res.success) toast.error("Failed to update");
    setProcessingId(null);
  };

  const remindersActive =
    preferences?.email_enabled || preferences?.web_push_enabled;

  /* ── Empty state ──────────────────────────────────────────────── */
  if (sorted.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center flex-1 py-16 sm:py-24 text-center px-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <span className="text-xl sm:text-2xl">📅</span>
          </div>
          <p className="text-[0.82rem] sm:text-[0.85rem] text-gray-400 font-medium">
            No upcoming events
          </p>
          <p className="text-[0.72rem] sm:text-[0.75rem] text-gray-300 mt-1">
            Tap "+ Add Event" to schedule something
          </p>
          <button
            onClick={() => setReminderSettingsOpen(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[0.72rem] text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            Reminder settings
          </button>
        </div>
        <ReminderSettingsModal
          isOpen={reminderSettingsOpen}
          onClose={() => setReminderSettingsOpen(false)}
          preferences={preferences}
          userEmail={userEmail}
        />
      </>
    );
  }

  /* ── Grid card ────────────────────────────────────────────────── */
  function GridCard({ event }: { event: ScheduleEvent }) {
    const colors = EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;
    const startFmt = format(new Date(event.start_time), "h:mma").toLowerCase();
    const endFmt = format(new Date(event.end_time), "h:mma").toLowerCase();
    const past =
      isPast(new Date(event.end_time)) && !isToday(new Date(event.start_time));

    return (
      <div
        onClick={() => onEditEvent(event)}
        className={`relative rounded-xl sm:rounded-2xl overflow-visible cursor-pointer group
          hover:shadow-md transition-all border border-gray-100 bg-white ${past ? "opacity-60" : ""}`}
      >
        <div
          className="h-1 sm:h-1.5 w-full rounded-t-xl"
          style={{ backgroundColor: colors.border }}
        />
        <div className="p-2.5 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="px-1.5 py-0.5 rounded-full text-[0.58rem] font-bold uppercase tracking-wide"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {EVENT_TYPE_LABELS[event.event_type]}
            </span>
            {event.confirmed && (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
          </div>
          <p className="text-[0.78rem] sm:text-[0.85rem] font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
            {event.title}
          </p>
          <p
            className="text-[0.65rem] tabular-nums font-medium mb-1.5"
            style={{ color: colors.text }}
          >
            {startFmt} – {endFmt}
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
            {event.course && (
              <span className="flex items-center gap-0.5 text-[0.62rem] text-gray-400">
                <BookOpen className="w-2.5 h-2.5" />
                {event.course.code}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-0.5 text-[0.62rem] text-gray-400">
                <MapPin className="w-2.5 h-2.5" />
                {event.location}
              </span>
            )}
            <ReminderBadge preferences={preferences} />
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            title={event.confirmed ? "Unconfirm" : "Confirm"}
            type="button"
            onClick={(e) => handleConfirm(event, e)}
            disabled={processingId === event.id}
            className={`p-1 rounded-lg transition-colors ${
              event.confirmed
                ? "bg-green-100 text-green-600"
                : "bg-white/90 border border-gray-100 text-gray-400 hover:text-gray-700 shadow-sm"
            }`}
          >
            <CheckCircle className="w-3 h-3" />
          </button>
          <button
            title="Delete"
            type="button"
            onClick={(e) => handleDelete(event, e)}
            disabled={processingId === event.id}
            className="p-1 rounded-lg bg-white/90 border border-gray-100 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  /* ── List row ─────────────────────────────────────────────────── */
  function ListRow({ event }: { event: ScheduleEvent }) {
    const colors = EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;
    const startFmt = format(new Date(event.start_time), "h:mma").toLowerCase();
    const endFmt = format(new Date(event.end_time), "h:mma").toLowerCase();
    const past =
      isPast(new Date(event.end_time)) && !isToday(new Date(event.start_time));

    return (
      <div
        onClick={() => onEditEvent(event)}
        className={`relative flex items-stretch rounded-lg sm:rounded-xl overflow-visible border border-gray-100
          hover:shadow-sm transition-all group cursor-pointer bg-white ${past ? "opacity-60" : ""}`}
      >
        <div
          className="w-1 sm:w-1.5 shrink-0 rounded-l-lg"
          style={{ backgroundColor: colors.border }}
        />

        <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="text-center shrink-0 w-12 sm:w-16">
              <p className="text-[0.68rem] sm:text-[0.75rem] font-semibold text-gray-800 tabular-nums leading-tight">
                {startFmt}
              </p>
              <p className="text-[0.6rem] sm:text-[0.65rem] text-gray-400 tabular-nums">
                {endFmt}
              </p>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-100 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[0.78rem] sm:text-[0.85rem] font-semibold text-gray-800 truncate">
                  {event.title}
                </p>
                <span
                  className="hidden xs:inline px-1.5 py-0.5 rounded text-[0.55rem] font-bold uppercase tracking-wide shrink-0"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {EVENT_TYPE_LABELS[event.event_type]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-0.5">
                {event.course && (
                  <span className="flex items-center gap-0.5 sm:gap-1 text-[0.62rem] text-gray-400">
                    <BookOpen className="w-2.5 h-2.5" />
                    {event.course.code}
                  </span>
                )}
                {event.location && (
                  <span className="hidden sm:flex items-center gap-1 text-[0.65rem] text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                )}
                {event.confirmed && (
                  <span className="flex items-center gap-0.5 text-[0.62rem] text-green-500">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Confirmed
                  </span>
                )}
                <ReminderBadge preferences={preferences} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title={event.confirmed ? "Unconfirm" : "Confirm"}
              type="button"
              onClick={(e) => handleConfirm(event, e)}
              disabled={processingId === event.id}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                event.confirmed
                  ? "bg-green-100 text-green-600"
                  : "hover:bg-gray-100 text-gray-400"
              }`}
            >
              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              title="Delete"
              type="button"
              onClick={(e) => handleDelete(event, e)}
              disabled={processingId === event.id}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-gray-100 bg-white shrink-0">
          <p className="text-[0.72rem] sm:text-[0.75rem] text-gray-500 font-medium">
            {sorted.length} event{sorted.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReminderSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-medium transition-colors ${
                remindersActive
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {remindersActive ? "Reminders on" : "Set reminders"}
              </span>
            </button>

            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setDisplayMode("list")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium transition-all ${
                  displayMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">List</span>
              </button>
              <button
                onClick={() => setDisplayMode("grid")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium transition-all ${
                  displayMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active reminder summary strip */}
        {remindersActive && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-indigo-50/60 border-b border-indigo-100/60 shrink-0 flex-wrap">
            <Bell className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-[0.65rem] text-indigo-600 font-medium">
              Reminders active —
            </span>
            <span className="flex items-center gap-1 text-[0.63rem] text-indigo-500">
              <Clock className="w-2.5 h-2.5" />
              {(preferences!.default_minutes_before ?? 30) >= 60
                ? `${(preferences!.default_minutes_before ?? 30) / 60}h before`
                : `${preferences!.default_minutes_before ?? 30}m before`}
            </span>
            {preferences?.email_enabled && (
              <span className="flex items-center gap-1 text-[0.63rem] text-indigo-500">
                <Mail className="w-2.5 h-2.5" /> Email
              </span>
            )}
            {preferences?.web_push_enabled && (
              <span className="flex items-center gap-1 text-[0.63rem] text-indigo-500">
                <Bell className="w-2.5 h-2.5" /> Browser
              </span>
            )}
            <button
              onClick={() => setReminderSettingsOpen(true)}
              className="ml-auto text-[0.6rem] text-indigo-500 hover:text-indigo-700 underline underline-offset-2 font-medium"
            >
              Edit
            </button>
          </div>
        )}

        {/* Scrollable event list */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-5 sm:space-y-6">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey + "T00:00:00");
            const past = isPast(date) && !isToday(date);

            return (
              <div key={dateKey}>
                <div
                  className={`flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-3 ${past ? "opacity-40" : ""}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${isToday(date) ? "bg-gray-900" : "bg-gray-300"}`}
                  />
                  <span
                    className={`text-[0.75rem] sm:text-[0.78rem] font-semibold ${isToday(date) ? "text-gray-900" : "text-gray-500"}`}
                  >
                    {getDayLabel(date)}
                  </span>
                  <span className="hidden sm:inline text-[0.68rem] text-gray-400">
                    {format(date, "MMMM d, yyyy")}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[0.62rem] sm:text-[0.65rem] text-gray-400 shrink-0">
                    {dayEvents.length}
                  </span>
                </div>

                {displayMode === "list" ? (
                  <div className="space-y-1.5 sm:space-y-2 ml-3 sm:ml-5">
                    {dayEvents.map((event) => (
                      <ListRow key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 ml-3 sm:ml-5">
                    {dayEvents.map((event) => (
                      <GridCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ReminderSettingsModal
        isOpen={reminderSettingsOpen}
        onClose={() => setReminderSettingsOpen(false)}
        preferences={preferences}
        userEmail={userEmail}
      />
    </>
  );
}
