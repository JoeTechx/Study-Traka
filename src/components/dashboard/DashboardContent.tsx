"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { ReadingListItem, Course } from "@/types/courses";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { ReadingListTable } from "@/components/dashboard/ReadingListTable";
import { AddToReadingListModal } from "@/components/dashboard/AddToReadingListModal";

interface DashboardContentProps {
  user: User;
  fullName?: string;
  readingList: ReadingListItem[];
  courses: Course[];
}

export function DashboardContent({
  user,
  fullName,
  readingList,
  courses,
}: DashboardContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Progress Card with Course Filter */}
        <ProgressCard readingList={readingList} courses={courses} />

        {/* Reading List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">To Read</h2>
              <p className="text-sm text-gray-600 mt-1">
                {readingList.length}{" "}
                {readingList.length === 1 ? "topic" : "topics"}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Add Courses
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <ReadingListTable items={readingList} />
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
