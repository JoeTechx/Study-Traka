"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createCourse } from "@/lib/supabase/courseActions";
import { toast } from "sonner";
import type { CreateCourseInput } from "@/types/courses";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: "",
    code: "",
    unit: 2,
    lecturer_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createCourse(formData);

      if (result.success) {
        toast.success("Course created successfully!");
        setFormData({ title: "", code: "", unit: 2, lecturer_name: "" });
        onClose();
      } else {
        toast.error(result.error || "Failed to create course");
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
            Add New Course
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
          {/* Course Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Introduction to Biology"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Course Code */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., BIO101"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
            />
          </div>

          {/* Course Unit */}
          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Unit <span className="text-red-500">*</span>
            </label>
            <select
              id="unit"
              required
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value={1}>1 Unit</option>
              <option value={2}>2 Units</option>
              <option value={3}>3 Units</option>
              <option value={4}>4 Units</option>
              <option value={5}>5 Units</option>
              <option value={6}>6 Units</option>
            </select>
          </div>

          {/* Lecturer Name */}
          <div>
            <label
              htmlFor="lecturer_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Lecturer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lecturer_name"
              required
              value={formData.lecturer_name}
              onChange={(e) =>
                setFormData({ ...formData, lecturer_name: e.target.value })
              }
              placeholder="e.g., Dr. John Smith"
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
