"use client";

import { useState, useRef, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { MoreHorizontal, CheckCircle } from "lucide-react";
import type { ScheduleEvent } from "@/types/schedule";
import { toggleEventConfirmed, deleteScheduleEvent } from "@/lib/supabase/scheduleActions";
import { toast } from "sonner";

const EVENT_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" },
  blue:   { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" },
  green:  { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  yellow: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  red:    { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  pink:   { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  orange: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
};

const HOUR_HEIGHT = 64;
const ALL_HOURS   = Array.from({ length: 24 }, (_, i) => i); // 0–23

function formatHour(h: number): string {
  if (h === 0)  return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// ─── Event Chip ────────────────────────────────────────────────────────────────
interface EventChipProps {
  event: ScheduleEvent;
  style: React.CSSProperties;
  onEdit: (e: ScheduleEvent) => void;
}

function EventChip({ event, style, onEdit }: EventChipProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const colors  = EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;

  const durationMins =
    (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
  const isShort = durationMins < 45;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    await toggleEventConfirmed(event.id, !event.confirmed);
    setLoading(false);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setLoading(true);
    const res = await deleteScheduleEvent(event.id);
    if (!res.success) toast.error("Failed to delete");
    else toast.success("Event deleted");
    setLoading(false);
    setMenuOpen(false);
  };

  const startFmt = format(new Date(event.start_time), "h:mma").toLowerCase();
  const endFmt   = format(new Date(event.end_time),   "h:mma").toLowerCase();

  return (
    <div
      className="absolute rounded-lg px-1.5 pt-1 pb-0.5 group cursor-pointer select-none z-10 hover:shadow-md transition-shadow"
      style={{
        ...style,
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        right: "2px",
        left: "2px",
      }}
      onClick={() => onEdit(event)}
    >
      {/* ── Desktop / tablet (md+): show title + time ── */}
      <div className="hidden md:flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p
            className="text-[0.7rem] font-semibold leading-tight truncate"
            style={{ color: colors.text }}
          >
            {event.title}
          </p>
          {!isShort && (
            <p
              className="text-[0.6rem] mt-0.5 opacity-70 tabular-nums"
              style={{ color: colors.text }}
            >
              {startFmt} – {endFmt}
            </p>
          )}
          {event.confirmed && !isShort && (
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-2.5 h-2.5 text-green-500" />
              <span className="text-[0.55rem] text-green-600 font-medium">Confirmed</span>
            </div>
          )}
        </div>

        {/* Three-dot menu — desktop */}
        <div className="relative shrink-0">
          <button
            type="button"
            title="Actions"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          >
            <MoreHorizontal className="w-3 h-3" style={{ color: colors.text }} />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-0 right-5 z-50 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onEdit(event); setMenuOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-[0.78rem] text-gray-700 hover:bg-gray-50 font-medium"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full px-3 py-1.5 text-left text-[0.78rem] text-gray-700 hover:bg-gray-50 font-medium"
              >
                {event.confirmed ? "✗ Unconfirm" : "✓ Confirm"}
              </button>
              <div className="mx-3 my-1 h-px bg-gray-100" />
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full px-3 py-1.5 text-left text-[0.78rem] text-red-500 hover:bg-red-50 font-medium"
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile / small tablet (< md): show course code + action menu only ── */}
      <div className="flex md:hidden items-center justify-between gap-0.5 h-full">
        <p
          className="text-[0.55rem] font-bold leading-none truncate"
          style={{ color: colors.text }}
        >
          {event.course?.code ?? event.title}
        </p>

        {/* Three-dot menu — mobile */}
        <div className="relative shrink-0">
          <button
            type="button"
            title="Actions"
            className="p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          >
            <MoreHorizontal className="w-2.5 h-2.5" style={{ color: colors.text }} />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-0 right-4 z-50 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onEdit(event); setMenuOpen(false); }}
                className="cursor-pointer w-full px-3 py-1.5 text-left text-[0.75rem] text-gray-700 hover:bg-gray-50 font-medium"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="cursor-pointer w-full px-3 py-1.5 text-left text-[0.75rem] text-gray-700 hover:bg-gray-50 font-medium"
              >
                {event.confirmed ? "✗ Unconfirm" : "✓ Confirm"}
              </button>
              <div className="mx-3 my-1 h-px bg-gray-100" />
              <button
                onClick={handleDelete}
                disabled={loading}
                className="cursor-pointerw-full px-3 py-1.5 text-left text-[0.75rem] text-red-500 hover:bg-red-50 font-medium"
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────────
export interface WeekViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  onEditEvent: (e: ScheduleEvent) => void;
  onAddAtDate: (d: Date) => void;
  headerCollapsed: boolean;
}

export function WeekView({
  currentDate,
  events,
  onEditEvent,
  onAddAtDate,
  headerCollapsed,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalH    = ALL_HOURS.length * HOUR_HEIGHT; // 1536px

  // Auto-scroll to current time (or 5am)
  useEffect(() => {
    if (!scrollRef.current) return;
    const now          = new Date();
    const weekHasToday = days.some(d => isToday(d));
    const targetHour   = weekHasToday ? Math.max(now.getHours() - 1, 0) : 5;
    scrollRef.current.scrollTop = targetHour * HOUR_HEIGHT;
  }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_time), day));

  const getEventStyle = (event: ScheduleEvent): React.CSSProperties => {
    const s  = new Date(event.start_time);
    const e  = new Date(event.end_time);
    const sH = s.getHours() + s.getMinutes() / 60;
    const eH = e.getHours() + e.getMinutes() / 60;
    return {
      position: "absolute",
      top:    sH * HOUR_HEIGHT,
      height: Math.max((eH - sH) * HOUR_HEIGHT, 22),
    };
  };

  const now    = new Date();
  const nowTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col flex-1 bg-white">

      {/* ── Day header row ────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-100">
        <div className="flex">
          {/* Gutter spacer — matches hour-label width */}
          <div className="w-10 sm:w-14 shrink-0" />

          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 min-w-0 flex flex-col items-center cursor-pointer group py-2"
              onClick={() => onAddAtDate(day)}
            >
              {/* Day name — hidden when collapsed */}
              {!headerCollapsed && (
                <p className="text-[0.55rem] sm:text-[0.6rem] uppercase tracking-widest text-gray-400 font-medium leading-none mb-1.5">
                  <span className="hidden lg:inline">{format(day, "EEE")}</span>
                  <span className="hidden sm:inline lg:hidden">{format(day, "EE")}</span>
                  <span className="sm:hidden">{format(day, "EEEEE")}</span>
                </p>
              )}

              {/* Date circle */}
              <div
                className={`flex items-center justify-center rounded-full font-semibold transition-colors
                  ${headerCollapsed
                    ? "w-5 h-5 sm:w-6 sm:h-6 text-[0.6rem]"
                    : "w-6 h-6 sm:w-7 sm:h-7 text-[0.72rem] sm:text-[0.78rem]"}
                  ${isToday(day)
                    ? "bg-[#3946F0] text-white"
                    : "text-gray-700 group-hover:bg-gray-100"}`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable 24h grid ────────────────────────────────────── */}
      <div ref={scrollRef} className="flex flex-1 overflow-y-auto overflow-x-hidden">

        {/* Hour labels — always visible, 12am padded so it shows fully */}
        <div
          className="w-10 sm:w-14 shrink-0 relative select-none bg-white"
          style={{ height: totalH }}
        >
          {ALL_HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full flex items-start justify-end pr-1 sm:pr-2"
              style={{
                // For 12am (h=0) push it down slightly so it's not clipped at the very top
                top: h === 0 ? 2 : h * HOUR_HEIGHT - 8,
              }}
            >
              <span
                className={`tabular-nums whitespace-nowrap font-medium
                  ${h === 0 || h === 12
                    ? "text-[0.58rem] sm:text-[0.65rem] text-gray-600"   // midnight & noon — slightly bolder
                    : "text-[0.55rem] sm:text-[0.6rem] text-gray-400"
                  }`}
              >
                {formatHour(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1 relative" style={{ height: totalH }}>
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l border-gray-100"
              >
                {/* Hour lines */}
                {ALL_HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0"
                    style={{
                      top: h * HOUR_HEIGHT,
                      borderTop: h % 6 === 0
                        ? "1px solid #E5E7EB"
                        : "1px solid #F3F4F6",
                    }}
                  />
                ))}

                {/* Half-hour lines */}
                {ALL_HOURS.map((h) => (
                  <div
                    key={`hh-${h}`}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100/70"
                    style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 -ml-1" />
                    <div className="flex-1 h-[1.5px] bg-rose-500" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    style={getEventStyle(event)}
                    onEdit={onEditEvent}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}