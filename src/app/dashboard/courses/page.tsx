"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getCourses } from "@/lib/supabase/courseActions";
import { AddCourseModal } from "@/components/courses/AddCourseModal";
import { CourseCard } from "@/components/courses/CourseCard";
import type { Course } from "@/types/courses";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);


   useEffect(() => {
    document.title = 'Courses | StudyTraka'
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View your Courses.')
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute("content", "Courses | StudyTraka");
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', 'View your Courses.')
    }
  }, [])

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    const data = await getCourses();
    setCourses(data);
    setIsLoading(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    loadCourses(); // Reload courses after adding
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Course
            </button>
          </div>
          <p className="text-gray-600">Manage all your courses in one place</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No courses yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first course
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Course
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {courses.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Units</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.unit, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lecturers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Set(courses.map((c) => c.lecturer_name)).size}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add Course Modal */}
        <AddCourseModal isOpen={isModalOpen} onClose={handleModalClose} />
      </div>
    </div>
  );
}
