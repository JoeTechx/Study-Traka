"use client";

import { format } from "date-fns";
import { Bell, ChevronRight } from "lucide-react";

interface UpcomingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
  event_type: string;
  course?: { code: string } | null;
}

export interface ReminderPreferences {
  email_enabled: boolean;
  web_push_enabled: boolean;
  default_minutes_before: number;
  email_override?: string | null;
}

interface RemindersPanelProps {
  upcomingEvents: UpcomingEvent[];
  reminderPrefs?: ReminderPreferences | null;
  userEmail?: string;
}

function getEventLabel(event: UpcomingEvent): string {
  const typeLabel =
    event.event_type === "exam"
      ? "Upcoming exam"
      : event.event_type === "class"
        ? "Upcoming class"
        : event.event_type === "study"
          ? "Study"
          : event.title;

  const timeStr = format(new Date(event.start_time), "h:mm a")
    .replace("AM", "A.M.")
    .replace("PM", "P.M.");

  return `${typeLabel} at ${timeStr}`;
}

export function RemindersPanel({ upcomingEvents }: RemindersPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-[1.1rem] font-bold text-gray-900 tracking-tight">
          Reminders
        </h3>
      </div>

      {upcomingEvents.length > 0 ? (
        <ul className="pb-1">
          {upcomingEvents.map((event, index) => (
            <li key={event.id}>
              {/* thin divider between rows */}
              {index > 0 && <div className="h-px bg-gray-100 mx-5" />}

              <div className="flex flex-col justify-center gap-3 px-5 py-3.5">
                {/* Filled bell — matches screenshot */}
                <div className="flex items-center gap-2 shrink-0">

                <Bell
                  className="w-[1.15rem] h-[1.15rem] text-indigo-500 shrink-0"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <span className="text-[0.73rem] text-gray-800 font-medium leading-snug">Upcoming event</span>
                </div>
                {/* Label */}
                <div className="flex item-center">
                <p className="flex-1 text-[0.83rem] text-gray-800 font-medium leading-snug">
                  {getEventLabel(event)}
                </p>

                {/* Chevron */}
                <ChevronRight
                  className="w-4 h-4 text-gray-400 shrink-0"
                  strokeWidth={2.5}
                />

                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 pb-7 pt-3 text-center">
          <Bell
            className="w-8 h-8 text-gray-200 mx-auto mb-2"
            fill="currentColor"
            strokeWidth={0}
          />
          <p className="text-[0.78rem] font-medium text-gray-400">
            No upcoming reminders
          </p>
          <p className="text-[0.7rem] text-gray-300 mt-0.5">
            Add events in Schedule to see them here
          </p>
        </div>
      )}
    </div>
  );
}
