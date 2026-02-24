"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import type { ReadingListItem, Course } from "@/types/courses";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { ReadingListTable } from "@/components/dashboard/ReadingListTable";
import { AddToReadingListModal } from "@/components/dashboard/AddToReadingListModal";

interface DashboardContentProps {
  readingList: ReadingListItem[];
  courses: Course[];
}

export function DashboardContent({
  readingList,
  courses,
}: DashboardContentProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter reading list by selected course
  const filteredReadingList = useMemo(() => {
    if (selectedCourseId === "all") {
      return readingList;
    }
    return readingList.filter((item) => item.course_id === selectedCourseId);
  }, [readingList, selectedCourseId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Progress Card */}
        <ProgressCard readingList={readingList} courses={courses} />

        {/* Reading List Section */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-6 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">To read</h2>
            </div>

          
              <button
              type="button"
              title="Add course"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-normal"
              >
                Add course
                <Plus className="w-4 h-4" />
              </button>

              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all min-w-[150px]"
              >
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code}
                  </option>
                ))}
              </select>
          </div>

          <ReadingListTable items={filteredReadingList} />
        </div>

        {/* Add to Reading List Modal */}
        <AddToReadingListModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
