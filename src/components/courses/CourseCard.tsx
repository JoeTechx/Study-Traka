"use client";

import { useState } from "react";
import { MoreVertical, Trash2, BookOpen } from "lucide-react";
import { deleteCourse } from "@/lib/supabase/courseActions";
import { toast } from "sonner";
import type { Course } from "@/types/courses";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This will also delete all reading list items for this course.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteCourse(course.id);

    if (result.success) {
      toast.success("Course deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete course");
    }
    setIsDeleting(false);
    setShowMenu(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative">
      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Course Icon */}
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
        <BookOpen className="w-6 h-6 text-indigo-600" />
      </div>

      {/* Course Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
        <p className="text-sm font-medium text-indigo-600">{course.code}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-2">
          <span className="flex items-center gap-1">
            <span className="font-medium">{course.unit}</span> {course.unit === 1 ? "Unit" : "Units"}
          </span>
        </div>

        <p className="text-sm text-gray-500 pt-1">
          <span className="font-medium">Lecturer:</span> {course.lecturer_name}
        </p>
      </div>
    </div>
  );
}