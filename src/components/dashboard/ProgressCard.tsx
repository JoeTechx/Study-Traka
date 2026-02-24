"use client";

import { useMemo, useState } from "react";
import type { ReadingListItem,Course } from "@/types/courses";

interface ProgressCardProps {
    readingList: ReadingListItem[];
    courses: Course[]
}

export function ProgressCard({ readingList, courses }: ProgressCardProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  const stats = useMemo(() => {
    // Filter reading list by selected course
    const filteredList = selectedCourseId === "all" 
      ? readingList 
      : readingList.filter(item => item.course_id === selectedCourseId);

    const total = filteredList.length;
    const completed = filteredList.filter((item) => item.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Get unique courses
    const uniqueCourses = new Set(filteredList.map((item) => item.course_id));
    const coursesCount = uniqueCourses.size;

    return {
      total,
      completed,
      percentage,
      coursesCount,
    };
  }, [readingList, selectedCourseId]);

  // Dynamic progress color based on percentage
  const progressColor = useMemo(() => {
    if (stats.percentage >= 70)
      return {
        color: "#10B981", // Green
        bg: "#D1FAE5",
        label: "Green",
        textColor: "#10B981",
      };
    if (stats.percentage >= 50)
      return {
        color: "#F59E0B", // Amber/Yellow
        bg: "#FEF3C7",
        label: "Yellow",
        textColor: "#F59E0B",
      };
    if (stats.percentage >= 30)
      return {
        color: "#F97316", // Orange
        bg: "#FFEDD5",
        label: "Orange",
        textColor: "#F97316",
      };
    return {
      color: "#EF4444", // Red
      bg: "#FEE2E2",
      label: "Red",
      textColor: "#EF4444",
    };
  }, [stats.percentage]);

  // Dynamic motivational message
  const motivationalMessage = useMemo(() => {
    const percentage = stats.percentage;

    if (percentage >= 70) {
      return {
        text: "Excellent! You're in the",
        highlight: "Green!",
        highlightColor: "text-green-600",
      };
    }

    if (percentage >= 50) {
      const remaining = 70 - percentage;
      return {
        text: `Just ${remaining}% more to hit the`,
        highlight: "Green zone!",
        highlightColor: "text-green-600",
      };
    }

    if (percentage >= 30) {
      const toYellow = 50 - percentage;
      const toGreen = 70 - percentage;
      return {
        text: `${toYellow}% to`,
        highlight: "Yellow",
        highlightColor: "text-amber-600",
        subText: `, ${toGreen}% to Green`,
      };
    }

    if (percentage > 0) {
      const toOrange = 30 - percentage;
      return {
        text: `Keep going! ${toOrange}% more to reach`,
        highlight: "Orange",
        highlightColor: "text-orange-600",
      };
    }

    return {
      text: "Start studying to see your progress grow!",
      highlight: "",
      highlightColor: "",
    };
  }, [stats.percentage]);

  return (
    <div className="bg-[#ffffff] rounded-2xl p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Your Progress
        </h2>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer w-full sm:w-auto transition-all"
        >
          <option value="all">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Circular Progress */}
        <div className="relative w-35 h-35 sm:w-40 sm:h-40 lg:w-45 lg:h-45 shrink-0">
          {/* Main progress circle */}
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track */}
            <circle
              cx="50%"
              cy="50%"
              r="35%"
              stroke={progressColor.bg}
              strokeWidth="14"
              className="stroke-[10px] transition-colors duration-500"
              fill="none"
            />
            {/* Progress arc */}
            <circle
              cx="50%"
              cy="50%"
              r="35%"
              stroke={progressColor.color}
              strokeWidth="14"
              className="stroke-[10px] transition-all duration-1000 ease-out"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - stats.percentage / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="hidden sm:block absolute top-2 lg:top-3 left-6 lg:left-8 w-6 h-6 lg:w-8 lg:h-8 rounded-full transition-colors duration-500"></div>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`rounded-[3rem] px-2 py-3 lg:text-[1rem] font-bold transition-colors duration-500`}
              style={{
                color: progressColor.textColor,
                backgroundColor: progressColor.bg,
              }}
            >
              {stats.percentage}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full space-y-4 sm:space-y-5 lg:space-y-6">
          <div className=" flex gap-5 w-full">
            {/* Topics covered in class */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-col gap-2">
                <div
                  className="w-5 h-5 rounded-full mt-1.5 sm:mt-2 shrink-0 transition-colors duration-500"
                  style={{ backgroundColor: progressColor.bg }}
                ></div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Topics covered in class
                </p>
              </div>
              <p className="text-[1.89rem] font-bold text-gray-900">
                {stats.total}
              </p>
            </div>

            {/* Topics you've studied */}
            <div className="flex items-start flex-col gap-2">
              <div className="flex flex-col gap-2 min-w-0">
                <div
                  className="w-5 h-5 rounded-full mt-1.5 sm:mt-2 shrink-0 transition-colors duration-500"
                  style={{ backgroundColor: progressColor.color }}
                ></div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Topics you've studied
                </p>
              </div>
              <p className="text-[1.89rem] font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>

          {/* Dynamic motivational message */}
          <div className="text-xs sm:text-sm text-gray-700 pt-1 sm:pt-2">
            {motivationalMessage.text}{" "}
            {motivationalMessage.highlight && (
              <span
                className={`font-semibold ${motivationalMessage.highlightColor}`}
              >
                {motivationalMessage.highlight}
              </span>
            )}
            {motivationalMessage.subText && (
              <span className="text-gray-600">
                {motivationalMessage.subText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
