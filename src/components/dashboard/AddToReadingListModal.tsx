"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createReadingListItem } from "@/lib/supabase/readingListActions";
import { getCourses } from "@/lib/supabase/courseActions";
import { toast } from "sonner";
import type { Course, CreateReadingListInput } from "@/types/courses";

interface AddToReadingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToReadingListModal({
  isOpen,
  onClose,
}: AddToReadingListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [formData, setFormData] = useState<CreateReadingListInput>({
    course_id: "",
    topic: "",
    class_date: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    const data = await getCourses();
    setCourses(data);
    setIsLoadingCourses(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createReadingListItem(formData);

      if (result.success) {
        toast.success("Added to reading list!");
        setFormData({ course_id: "", topic: "", class_date: "" });
        onClose();
      } else {
        toast.error(result.error || "Failed to add to reading list");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Add to Reading List
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Course Selection */}
          <div>
            <label
              htmlFor="course_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Course <span className="text-red-500">*</span>
            </label>
            {isLoadingCourses ? (
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-500">
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-500">
                No courses available. Please add a course first.
              </div>
            ) : (
              <select
                id="course_id"
                required
                value={formData.course_id}
                onChange={(e) =>
                  setFormData({ ...formData, course_id: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Topic */}
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="topic"
              required
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              placeholder="e.g., Cell Structure and Functions"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Class Date */}
          <div>
            <label
              htmlFor="class_date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Class Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="class_date"
              required
              value={formData.class_date}
              onChange={(e) =>
                setFormData({ ...formData, class_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || courses.length === 0}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add to List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
