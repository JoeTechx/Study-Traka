"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Tag,
  CheckCircle,
} from "lucide-react";
import type {
  ScheduleEvent,
  CreateScheduleEventInput,
  EventType,
  EventColor,
} from "@/types/schedule";
import type { Course } from "@/types/courses";
import {
  createScheduleEvent,
  updateScheduleEvent,
} from "@/lib/supabase/scheduleActions";
import { toast } from "sonner";
import { format } from "date-fns";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialDate?: Date;
  editEvent?: ScheduleEvent | null;
}

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: "exam", label: "Exam", icon: "📝" },
  { value: "class", label: "Class / Lecture", icon: "🎓" },
  { value: "study", label: "Study Session", icon: "📚" },
  { value: "custom", label: "Custom Event", icon: "📌" },
];

const COLOR_OPTIONS: { value: EventColor; hex: string; bg: string }[] = [
  { value: "purple", hex: "#8B5CF6", bg: "#EDE9FE" },
  { value: "blue", hex: "#3B82F6", bg: "#DBEAFE" },
  { value: "green", hex: "#10B981", bg: "#D1FAE5" },
  { value: "yellow", hex: "#F59E0B", bg: "#FEF3C7" },
  { value: "red", hex: "#EF4444", bg: "#FEE2E2" },
  { value: "pink", hex: "#EC4899", bg: "#FCE7F3" },
  { value: "orange", hex: "#F97316", bg: "#FFEDD5" },
];

function toLocalDatetimeValue(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeToISO(localStr: string): string {
  return new Date(localStr).toISOString();
}

export function AddEventModal({
  isOpen,
  onClose,
  courses,
  initialDate,
  editEvent,
}: AddEventModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const defaultStart = initialDate
    ? (() => {
        const d = new Date(initialDate);
        d.setHours(9, 0, 0, 0);
        return toLocalDatetimeValue(d.toISOString());
      })()
    : toLocalDatetimeValue(new Date().toISOString());

  const defaultEnd = initialDate
    ? (() => {
        const d = new Date(initialDate);
        d.setHours(10, 0, 0, 0);
        return toLocalDatetimeValue(d.toISOString());
      })()
    : toLocalDatetimeValue(new Date(Date.now() + 3600000).toISOString());

  const [form, setForm] = useState({
    title: "",
    event_type: "class" as EventType,
    course_id: "",
    start_time: defaultStart,
    end_time: defaultEnd,
    color: "blue" as EventColor,
    confirmed: false,
    description: "",
    location: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (editEvent) {
      setForm({
        title: editEvent.title,
        event_type: editEvent.event_type,
        course_id: editEvent.course_id ?? "",
        start_time: toLocalDatetimeValue(editEvent.start_time),
        end_time: toLocalDatetimeValue(editEvent.end_time),
        color: editEvent.color,
        confirmed: editEvent.confirmed,
        description: editEvent.description ?? "",
        location: editEvent.location ?? "",
      });
    } else {
      setForm((f) => ({
        ...f,
        start_time: defaultStart,
        end_time: defaultEnd,
      }));
    }
  }, [editEvent, isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.start_time || !form.end_time) {
      toast.error("Start and end time required");
      return;
    }
    if (new Date(form.start_time) >= new Date(form.end_time)) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);

    const payload: CreateScheduleEventInput = {
      title: form.title.trim(),
      event_type: form.event_type,
      course_id: form.course_id || null,
      start_time: localDatetimeToISO(form.start_time),
      end_time: localDatetimeToISO(form.end_time),
      color: form.color,
      confirmed: form.confirmed,
      description: form.description || null,
      location: form.location || null,
    };

    const result = editEvent
      ? await updateScheduleEvent(editEvent.id, payload)
      : await createScheduleEvent(payload);

    if (result.success) {
      toast.success(editEvent ? "Event updated" : "Event created");
      onClose();
    } else {
      toast.error(result.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[0.95rem] font-semibold text-gray-900">
            {editEvent ? "Edit Event" : "Add Event"}
          </h2>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Title */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
              Event title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Math Exam"
              className="w-full px-3.5 py-2.5 text-[0.85rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-2">
              <Tag className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Event type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("event_type", t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[0.78rem] font-medium transition-all ${
                    form.event_type === t.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Course (optional)
            </label>
            <select
              value={form.course_id}
              onChange={(e) => set("course_id", e.target.value)}
              className="w-full px-3.5 py-2.5 text-[0.85rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Start
              </label>
              <input
                title="Start Time"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                className="w-full px-3 py-2.5 text-[0.78rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                End
              </label>
              <input
                title="End Time"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
                className="w-full px-3 py-2.5 text-[0.78rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Location (optional)
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Room 204 / Zoom"
              className="w-full px-3.5 py-2.5 text-[0.85rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Any notes about this event..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-[0.85rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-2">
              Event colour
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("color", c.value)}
                  title={c.value}
                  className="w-6 h-6 rounded-full border-2 border-white shadow transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    outline:
                      form.color === c.value ? `2.5px solid ${c.hex}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>

            {/* Preview pill */}
            <div
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.73rem] font-medium"
              style={{
                backgroundColor: COLOR_OPTIONS.find(
                  (c) => c.value === form.color,
                )?.bg,
                color: COLOR_OPTIONS.find((c) => c.value === form.color)?.hex,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: COLOR_OPTIONS.find(
                    (c) => c.value === form.color,
                  )?.hex,
                }}
              />
              {form.title || "Event preview"}
            </div>
          </div>

          {/* Confirmed toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-[0.82rem] font-medium text-gray-700">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              Mark as confirmed
            </span>
            <button
              title="Confirmed"
              type="button"
              onClick={() => set("confirmed", !form.confirmed)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${form.confirmed ? "bg-green-500" : "bg-gray-200"}`}
              style={{ width: "2.5rem", height: "1.375rem" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{
                  transform: form.confirmed
                    ? "translateX(1.125rem)"
                    : "translateX(0)",
                }}
              />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-[0.82rem] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-[0.82rem] font-medium bg-[#3946F0] text-white rounded-lg hover:bg-[#2a38c8] cursor-pointer transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : editEvent ? "Save changes" : "Add Event"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
