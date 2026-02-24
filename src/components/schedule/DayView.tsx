"use client";

import { useRef, useEffect, useState } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import type { ScheduleEvent } from "@/types/schedule";
import { deleteScheduleEvent, toggleEventConfirmed } from "@/lib/supabase/scheduleActions";
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

const HOUR_HEIGHT = 72;
const ALL_HOURS   = Array.from({ length: 24 }, (_, i) => i); // 0–23

function formatHour(h: number): string {
  if (h === 0)  return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

interface DayViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  onEditEvent: (e: ScheduleEvent) => void;
  headerCollapsed: boolean;
}

export function DayView({ currentDate, events, onEditEvent, headerCollapsed }: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), currentDate));
  const today     = isToday(currentDate);
  const totalH    = ALL_HOURS.length * HOUR_HEIGHT; // 1728px

  // Auto-scroll to current time or 5am
  useEffect(() => {
    if (!scrollRef.current) return;
    const now        = new Date();
    const targetHour = today ? Math.max(now.getHours() - 1, 0) : 5;
    scrollRef.current.scrollTop = targetHour * HOUR_HEIGHT;
  }, [currentDate, today]);

  const getEventStyle = (event: ScheduleEvent): React.CSSProperties => {
    const s  = new Date(event.start_time);
    const e  = new Date(event.end_time);
    const sH = s.getHours() + s.getMinutes() / 60;
    const eH = e.getHours() + e.getMinutes() / 60;
    return {
      position: "absolute",
      top:    sH * HOUR_HEIGHT,
      height: Math.max((eH - sH) * HOUR_HEIGHT, 28),
      left:   "0.75rem",
      right:  "0.75rem",
    };
  };

  const now    = new Date();
  const nowTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* ── Day info header (controlled by parent collapse state) ── */}
      <div
        className="shrink-0 bg-white border-b border-gray-100 overflow-hidden transition-all duration-200"
        style={{ maxHeight: headerCollapsed ? "0px" : "90px" }}
      >
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4">
          {/* Date box */}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 ${
              today
                ? "bg-[#3946F0] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {format(currentDate, "d")}
          </div>

          {/* Day name + date */}
          <div className="min-w-0">
            <p
              className={`text-sm sm:text-base font-bold leading-tight truncate ${today ? "text-gray-900" : "text-gray-700"}`}
            >
              {today ? "Today" : format(currentDate, "EEEE")}
            </p>
            <p className="text-[0.7rem] sm:text-[0.75rem] text-gray-400 mt-0.5">
              {format(currentDate, "MMMM d, yyyy")}
            </p>
          </div>

          {/* Event count badge */}
          {dayEvents.length > 0 && (
            <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 sm:px-3 py-1">
              <span className="text-[0.68rem] sm:text-[0.72rem] font-semibold text-gray-600">
                {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable 24h grid ────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex flex-1 overflow-y-auto overflow-x-hidden"
      >
        {/* Hour labels */}
        <div
          className="w-12 sm:w-16 shrink-0 relative select-none bg-white"
          style={{ height: totalH }}
        >
          {ALL_HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full flex items-start justify-end pr-1.5 sm:pr-3"
              style={{
                // 12am: nudge down so it's not clipped at the scroll top
                top: h === 0 ? 3 : h * HOUR_HEIGHT - 9,
              }}
            >
              <span
                className={`tabular-nums whitespace-nowrap font-medium
                  ${
                    h === 0 || h === 12
                      ? "text-[0.6rem] sm:text-[0.65rem] text-gray-600"
                      : "text-[0.55rem] sm:text-[0.62rem] text-gray-400"
                  }`}
              >
                {formatHour(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div
          className="flex-1 relative border-l border-gray-100"
          style={{ height: totalH }}
        >
          {/* Hour lines */}
          {ALL_HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0"
              style={{
                top: h * HOUR_HEIGHT,
                borderTop:
                  h % 6 === 0 ? "1px solid #E5E7EB" : "1px solid #F3F4F6",
              }}
            />
          ))}

          {/* Half-hour lines */}
          {ALL_HOURS.map((h) => (
            <div
              key={`half-${h}`}
              className="absolute left-0 right-0 border-t border-dashed border-gray-100"
              style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
            />
          ))}

          {/* Current time indicator */}
          {today && (
            <div
              className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 -ml-1.5" />
              <div className="flex-1 h-[1.5px] bg-rose-500" />
            </div>
          )}

          {/* Empty state */}
          {dayEvents.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-[0.8rem] text-gray-300 font-medium">
                No events
              </p>
              <p className="text-[0.7rem] text-gray-300 mt-0.5">
                Tap "+ Add Event" to schedule
              </p>
            </div>
          )}

          {/* Event cards */}
          {dayEvents.map((event) => {
            const colors = EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;
            const startFmt = format(
              new Date(event.start_time),
              "h:mma",
            ).toLowerCase();
            const endFmt = format(
              new Date(event.end_time),
              "h:mma",
            ).toLowerCase();
            const durationM =
              (new Date(event.end_time).getTime() -
                new Date(event.start_time).getTime()) /
              60000;

            return (
              <div
                key={event.id}
                className="absolute rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer hover:brightness-95 transition-all shadow-sm"
                style={{
                  ...getEventStyle(event),
                  backgroundColor: colors.bg,
                  borderLeft: `4px solid ${colors.border}`,
                }}
                onClick={() => onEditEvent(event)}
              >
                <p
                  className="text-[0.8rem] sm:text-[0.85rem] font-semibold leading-tight"
                  style={{ color: colors.text }}
                >
                  {event.title}
                </p>
                <p
                  className="text-[0.68rem] sm:text-[0.72rem] mt-0.5 opacity-70 tabular-nums"
                  style={{ color: colors.text }}
                >
                  {startFmt} – {endFmt}
                </p>

                {durationM >= 45 && (
                  <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                    {event.course && (
                      <p
                        className="text-[0.65rem] opacity-60"
                        style={{ color: colors.text }}
                      >
                        📚 {event.course.code}
                      </p>
                    )}
                    {event.location && (
                      <p
                        className="text-[0.65rem] opacity-55"
                        style={{ color: colors.text }}
                      >
                        📍 {event.location}
                      </p>
                    )}
                    {event.confirmed && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-[0.62rem] text-green-600 font-medium">
                          Confirmed
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}