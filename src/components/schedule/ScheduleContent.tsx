"use client";

import { useState, useMemo } from "react";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  LayoutGrid,
  List,
  Calendar,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { ScheduleEvent, ViewMode } from "@/types/schedule";
import type { Course } from "@/types/courses";
import { WeekView } from "@/components/schedule/WeekView";
import { MonthView } from "@/components/schedule/MonthView";
import { DayView } from "@/components/schedule/DayView";
import { AgendaView } from "@/components/schedule/AgendaView";
import { AddEventModal } from "@/components/schedule/AddEventModal";
import { ReminderPreferences } from "@/lib/supabase/reminderActions";

interface ScheduleContentProps {
  events: ScheduleEvent[];
  courses: Course[];
  preferences: ReminderPreferences | null;
  userEmail: string;
}

const VIEW_OPTIONS: {
  value: ViewMode;
  label: string;
  shortLabel: string;
  Icon: React.ElementType;
}[] = [
  { value: "week", label: "Week", shortLabel: "W", Icon: CalendarDays },
  { value: "month", label: "Month", shortLabel: "M", Icon: LayoutGrid },
  { value: "day", label: "Day", shortLabel: "D", Icon: Calendar },
  { value: "agenda", label: "Agenda", shortLabel: "A", Icon: List },
];

function getHeaderTitle(view: ViewMode, date: Date): string {
  switch (view) {
    case "week": {
      const s = startOfWeek(date, { weekStartsOn: 1 });
      const e = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(s, "dd MMM")} – ${format(e, "dd MMM yyyy")}`;
    }
    case "month":
      return format(date, "MMMM yyyy");
    case "day":
      return format(date, "EEE, dd MMM yyyy");
    case "agenda":
      return "Upcoming Events";
  }
}

function getHeaderTitleShort(view: ViewMode, date: Date): string {
  switch (view) {
    case "week": {
      const s = startOfWeek(date, { weekStartsOn: 1 });
      const e = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(s, "d MMM")} – ${format(e, "d MMM")}`;
    }
    case "month":
      return format(date, "MMM yyyy");
    case "day":
      return format(date, "d MMM");
    case "agenda":
      return "Upcoming";
  }
}

function navigate(view: ViewMode, date: Date, dir: 1 | -1): Date {
  switch (view) {
    case "week":
      return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month":
      return dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case "day":
      return dir === 1 ? addDays(date, 1) : subDays(date, 1);
    default:
      return date;
  }
}

const COLLAPSIBLE_VIEWS: ViewMode[] = ["week", "day"];

export function ScheduleContent({
  events,
  courses,
  preferences,
  userEmail,
}: ScheduleContentProps) {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<ScheduleEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);

  const filteredEvents = useMemo(() => {
    if (selectedCourses.length === 0) return events;
    return events.filter(
      (e) => e.course_id && selectedCourses.includes(e.course_id),
    );
  }, [events, selectedCourses]);

  const toggleCourse = (id: string) =>
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const openAdd = (date?: Date) => {
    setEditEvent(null);
    setInitialDate(date ?? new Date());
    setIsModalOpen(true);
  };

  const openEdit = (event: ScheduleEvent) => {
    setEditEvent(event);
    setInitialDate(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditEvent(null);
    setInitialDate(undefined);
  };

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    setHeaderCollapsed(false);
  };

  const showCollapseBtn = COLLAPSIBLE_VIEWS.includes(view);

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 shrink-0">
        {/* Row 1: nav + title + view switcher + add button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            {view !== "agenda" && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  title="Previous"
                  type="button"
                  onClick={() => setCurrentDate((d) => navigate(view, d, -1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-[0.68rem] sm:text-[0.75rem] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  title="Next"
                  type="button"
                  onClick={() => setCurrentDate((d) => navigate(view, d, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
              </div>
            )}

            <h1 className="font-bold text-gray-900 tracking-tight truncate min-w-0">
              <span className="hidden sm:inline text-[0.9rem] sm:text-[1.05rem]">
                {getHeaderTitle(view, currentDate)}
              </span>
              <span className="sm:hidden text-[0.82rem]">
                {getHeaderTitleShort(view, currentDate)}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {VIEW_OPTIONS.map(({ value: v, label, shortLabel, Icon }) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  title={label}
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md font-medium transition-all ${
                    view === v
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden lg:inline text-[0.72rem]">
                    {label}
                  </span>
                  <span className="hidden sm:inline lg:hidden text-[0.68rem]">
                    {shortLabel}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => openAdd()}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 bg-gray-900 text-white rounded-lg text-[0.72rem] sm:text-[0.8rem] font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Add Event</span>
            </button>
          </div>
        </div>

        {/* Row 2: filter pills ← space-between → collapse button */}
        <div className="flex items-center justify-between gap-2 mt-2.5 sm:mt-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 flex-1 min-w-0">
            <span className="flex items-center gap-1 text-[0.62rem] sm:text-[0.68rem] text-gray-400 font-medium shrink-0">
              <SlidersHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Filter:</span>
            </span>

            <button
              onClick={() => setSelectedCourses([])}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[0.65rem] sm:text-[0.72rem] font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedCourses.length === 0
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>

            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[0.65rem] sm:text-[0.72rem] font-medium transition-all whitespace-nowrap shrink-0 ${
                  selectedCourses.includes(course.id)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {course.code}
              </button>
            ))}
          </div>

          {/* Collapse button — week/day only */}
          {showCollapseBtn && (
            <button
              onClick={() => setHeaderCollapsed((v) => !v)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 ml-2"
              title={headerCollapsed ? "Show header" : "Collapse header"}
            >
              <span className="text-[0.6rem] sm:text-[0.65rem] text-gray-500 font-medium hidden sm:inline">
                {headerCollapsed ? "Expand" : "Collapse"}
              </span>
              {headerCollapsed ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Calendar body ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEditEvent={openEdit}
            onAddAtDate={openAdd}
            headerCollapsed={headerCollapsed}
          />
        )}
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEditEvent={openEdit}
            onAddAtDate={openAdd}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEditEvent={openEdit}
            headerCollapsed={headerCollapsed}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            events={filteredEvents}
            onEditEvent={openEdit}
            preferences={preferences}
            userEmail={userEmail}
          />
        )}
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────── */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={closeModal}
        courses={courses}
        initialDate={initialDate}
        editEvent={editEvent}
      />
    </div>
  );
}
