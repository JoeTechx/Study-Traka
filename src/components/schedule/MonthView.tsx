"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { ScheduleEvent } from "@/types/schedule";

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

interface MonthViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  onEditEvent: (e: ScheduleEvent) => void;
  onAddAtDate: (d: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onEditEvent,
  onAddAtDate,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_time), day));

  // Responsive day name labels
  const DAY_NAMES_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-white shrink-0 sticky top-0 z-10">
        {DAY_NAMES_FULL.map((name, i) => (
          <div key={name + i} className="py-2 sm:py-3 text-center">
            <span className="hidden sm:inline text-[0.62rem] uppercase tracking-widest text-gray-400 font-medium">
              {name}
            </span>
            <span className="sm:hidden text-[0.6rem] uppercase tracking-widest text-gray-400 font-medium">
              {DAY_NAMES_SHORT[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7 flex-1 overflow-y-auto"
        style={{ gridAutoRows: "minmax(80px, 1fr)" }}
      >
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b border-gray-100 p-1 sm:p-1.5 cursor-pointer transition-colors hover:bg-gray-50/70 ${
                !inMonth ? "bg-gray-50/50" : "bg-white"
              }`}
              onClick={() => onAddAtDate(day)}
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-semibold transition-colors
                    text-[0.65rem] sm:text-[0.72rem]
                    ${
                      today
                        ? "bg-[#3946F0] text-white"
                        : inMonth
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {/* On mobile: show colored dots only */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 4).map((event) => {
                    const colors =
                      EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;
                    return (
                      <span
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: colors.border }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                      />
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span className="text-[0.5rem] text-gray-400">
                      +{dayEvents.length - 4}
                    </span>
                  )}
                </div>

                {/* On sm+: show event pills */}
                <div className="hidden sm:block space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors =
                      EVENT_COLOR_MAP[event.color] ?? EVENT_COLOR_MAP.blue;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[0.58rem] sm:text-[0.63rem] font-medium truncate cursor-pointer hover:brightness-95 transition-all"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: colors.border }}
                        />
                        <span className="truncate">
                          {format(new Date(event.start_time), "h:mm")}{" "}
                          {event.title}
                        </span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-[0.58rem] text-gray-400 pl-1 font-medium">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
