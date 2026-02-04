"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { upsertCountdown } from "@/lib/supabase/countdownActions";
import { toast } from "sonner";

interface SetCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSet: (date: Date, title: string) => void;
  currentTitle?: string;
  currentDate?: Date | null;
}

export function SetCountdownModal({
  isOpen,
  onClose,
  onSet,
  currentTitle = "Countdown to Exam",
  currentDate,
}: SetCountdownModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      if (currentDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const timeStr = currentDate.toTimeString().slice(0, 5);
        setDate(dateStr);
        setTime(timeStr);
      } else {
        // Set default to 3 months from now
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        setDate(futureDate.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, currentTitle, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSubmitting(true);

    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    const examDate = new Date(year, month - 1, day, hours, minutes);

    // Save to Supabase
    const result = await upsertCountdown(title, examDate);

    if (result.success) {
      toast.success("Countdown saved successfully!");
      onSet(examDate, title);
    } else {
      toast.error(result.error || "Failed to save countdown");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#3946F0] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Set Exam Countdown</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Exam Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g., Final Mathematics Exam"
              required
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Exam Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label
              htmlFor="time"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Exam Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Preview */}
          {date && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">
                Preview
              </p>
              <p className="text-sm text-indigo-900">
                {title} on{" "}
                {new Date(date + "T" + time).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {time}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[#3946F0] text-white rounded-lg font-semibold hover:bg-[#2a35c0] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Set Countdown"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
