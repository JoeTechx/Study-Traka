"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetCountdownModal } from "./setCountdownModal";
import { getCountdown, type Countdown } from "@/lib/supabase/countdownActions";

interface CountdownTimerProps {
  initialCountdown: Countdown | null;
  isCollapsed: boolean;
}

interface TimeRemaining {
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({
  initialCountdown,
  isCollapsed,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null,
  );
  const [examDate, setExamDate] = useState<Date | null>(
    initialCountdown ? new Date(initialCountdown.target_date) : null,
  );
  const [examTitle, setExamTitle] = useState<string>(
    initialCountdown?.title || "Countdown to Exam",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh countdown data from server
  const refreshCountdown = async () => {
    setIsLoading(true);
    const countdown = await getCountdown();
    if (countdown) {
      setExamDate(new Date(countdown.target_date));
      setExamTitle(countdown.title);
    } else {
      setExamDate(null);
      setExamTitle("Countdown to Exam");
    }
    setIsLoading(false);
  };

  // Calculate time remaining
  useEffect(() => {
    if (!examDate) {
      setTimeRemaining(null);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = examDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          months: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        return;
      }

      const seconds = Math.floor((difference / 1000) % 60);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      const months = Math.floor(totalDays / 30);

      setTimeRemaining({
        months,
        weeks: totalWeeks,
        days: totalDays,
        hours,
        minutes,
        seconds,
        total: difference,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [examDate]);

  const handleSetCountdown = async (date: Date, title: string) => {
    setExamDate(date);
    setExamTitle(title);
    setIsModalOpen(false);
    // The modal component will handle the server action
    // Refresh data after modal closes
    await refreshCountdown();
  };

  if (isLoading) {
    return (
      <div className={cn("bg-indigo-50 rounded-lg p-4", isCollapsed && "p-2")}>
        <div className="animate-pulse">
          <div className="h-4 bg-indigo-200 rounded w-3/4 mb-2" />
          <div className="h-8 bg-indigo-200 rounded" />
        </div>
      </div>
    );
  }

  if (!timeRemaining) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "w-full bg-[#3946F0] text-white rounded-lg p-4 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg",
            isCollapsed && "p-3",
          )}
        >
          {isCollapsed ? (
            <AlertTriangle className="w-5 h-5 mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-semibold">Set Exam Date</span>
            </div>
          )}
        </button>
        <SetCountdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSet={handleSetCountdown}
          currentTitle={examTitle}
        />
      </>
    );
  }

  if (isCollapsed) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 hover:bg-indigo-100 transition-colors"
        >
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-5 h-5 text-indigo-600 mb-1" />
            <div className="text-2xl font-bold text-indigo-900">
              {timeRemaining.days}
            </div>
            <div className="text-xs text-indigo-600">days</div>
          </div>
        </button>
        <SetCountdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSet={handleSetCountdown}
          currentTitle={examTitle}
          currentDate={examDate}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-indigo-900 truncate">
            {examTitle}
          </h3>
        </div>

        {/* Main countdown display */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-900">
              {timeRemaining.months}
            </div>
            <div className="text-xs text-indigo-600 uppercase font-medium">
              Months
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-900">
              {timeRemaining.weeks}
            </div>
            <div className="text-xs text-indigo-600 uppercase font-medium">
              Weeks
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-900">
              {timeRemaining.days}
            </div>
            <div className="text-xs text-indigo-600 uppercase font-medium">
              Days
            </div>
          </div>
        </div>

        {/* Time display */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-indigo-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-800">
              {timeRemaining.hours}
            </div>
            <div className="text-xs text-indigo-500 font-medium">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-800">
              {timeRemaining.minutes}
            </div>
            <div className="text-xs text-indigo-500 font-medium">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-800">
              {timeRemaining.seconds}
            </div>
            <div className="text-xs text-indigo-500 font-medium">Seconds</div>
          </div>
        </div>
      </button>

      <SetCountdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSet={handleSetCountdown}
        currentTitle={examTitle}
        currentDate={examDate}
      />
    </>
  );
}
