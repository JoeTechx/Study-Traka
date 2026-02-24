"use client";

import { useState } from "react";
import {
  MoreVertical,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  toggleReadingListItem,
  deleteReadingListItem,
  toggleStarredItem,
  updateBorderColor,
} from "@/lib/supabase/readingListActions";
import { toast } from "sonner";
import type { ReadingListItem, BorderColor } from "@/types/courses";
import { format } from "date-fns";
import Image from "next/image";

interface ReadingListTableProps {
  items: ReadingListItem[];
}

const ITEMS_PER_PAGE = 8;

const borderColors: { value: BorderColor; class: string; label: string }[] = [
  { value: "gray", class: "border-l-gray-300", label: "Gray" },
  { value: "red", class: "border-l-red-500", label: "Red" },
  { value: "blue", class: "border-l-blue-500", label: "Blue" },
  { value: "green", class: "border-l-green-500", label: "Green" },
  { value: "yellow", class: "border-l-yellow-500", label: "Yellow" },
  { value: "purple", class: "border-l-purple-500", label: "Purple" },
  { value: "orange", class: "border-l-orange-500", label: "Orange" },
];

export function ReadingListTable({ items }: ReadingListTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  const handleToggleDone = async (id: string, currentDone: boolean) => {
    setProcessingId(id);
    const result = await toggleReadingListItem(id, !currentDone);

    if (result.success) {
      toast.success(currentDone ? "Marked as not done" : "Marked as done");
    } else {
      toast.error(result.error || "Failed to update");
    }
    setProcessingId(null);
  };

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    setProcessingId(id);
    const result = await toggleStarredItem(id, !currentStarred);

    if (result.success) {
      toast.success(currentStarred ? "Removed star" : "Starred");
    } else {
      toast.error(result.error || "Failed to update");
    }
    setProcessingId(null);
    setOpenMenuId(null);
  };

  const handleColorChange = async (id: string, color: BorderColor) => {
    setProcessingId(id);
    const result = await updateBorderColor(id, color);

    if (result.success) {
      toast.success("Color updated");
    } else {
      toast.error(result.error || "Failed to update color");
    }
    setProcessingId(null);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string, topic: string) => {
    if (!confirm(`Are you sure you want to delete "${topic}"?`)) {
      return;
    }

    setProcessingId(id);
    const result = await deleteReadingListItem(id);

    if (result.success) {
      toast.success("Removed from reading list");
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setProcessingId(null);
    setOpenMenuId(null);
  };

  const getBorderColorClass = (color: string): string => {
    const colorObj = borderColors.find((c) => c.value === color);
    return colorObj?.class || "border-l-gray-300";
  };

  if (items.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-b-xl">
        <Image
          src="/images/images2 1.png"
          alt="add courses"
          width={120}
          height={120}
          className="mx-auto mb-4"
        />
        <p className="text-gray-500 text-sm">
          No topics added yet. Click "Add Courses" and start reading!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider">
                Topic
              </th>
              <th className="px-6 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider">
                Class date
              </th>
              <th className="px-6 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider">
                Done?
              </th>
              <th className="px-6 py-3 text-left text-[0.67rem] font-medium text-gray-500 uppercase tracking-wider w-20"></th>
            </tr>
          </thead>
          <tbody className="bg-[#ffffff]">
            {currentItems.map((item, index) => (
              <tr
                key={item.id}
                className={`border-l-4 ${getBorderColorClass(item.border_color)}`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-[0.67rem] text-gray-500">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-[0.67rem] text-gray-900">
                    {item.course?.code}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="text-[0.67rem] text-gray-900">{item.topic}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-[0.67rem] text-gray-500">
                  {format(new Date(item.class_date), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <input
                    title="Mark as done"
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleDone(item.id, item.done)}
                    disabled={processingId === item.id}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-[0.67rem] text-gray-500 relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === item.id ? null : item.id)
                    }
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>

                  {openMenuId === item.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-[3.6rem] -top-1.5 mt-2 w-35 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        {/* Star/Unstar */}
                        <button
                          onClick={() =>
                            handleToggleStar(item.id, item.starred)
                          }
                          disabled={processingId === item.id}
                          className="w-full px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Star
                            className={`w-4 h-4 ${item.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
                          />
                          {item.starred ? "Unstar" : "Star"}
                        </button>

                        {/* Color Options */}
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-2 py-1">
                          <p className="text-xs text-gray-500 mb-2">
                            Border Color
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {borderColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() =>
                                  handleColorChange(item.id, color.value)
                                }
                                disabled={processingId === item.id}
                                className={`w-4 h-4 rounded-[50rem] border-2 cursor-pointer ${
                                  item.border_color === color.value
                                    ? "ring-2 ring-indigo-500 ring-offset-1"
                                    : ""
                                } hover:scale-110 transition-transform disabled:opacity-50`}
                                style={{
                                  backgroundColor:
                                    color.value === "gray"
                                      ? "#D1D5DB"
                                      : color.value === "red"
                                        ? "#EF4444"
                                        : color.value === "blue"
                                          ? "#3B82F6"
                                          : color.value === "green"
                                            ? "#10B981"
                                            : color.value === "yellow"
                                              ? "#F59E0B"
                                              : color.value === "purple"
                                                ? "#8B5CF6"
                                                : "#F97316",
                                }}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => handleDelete(item.id, item.topic)}
                          disabled={processingId === item.id}
                          className="w-full px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {startIndex + 1}-{Math.min(endIndex, items.length)} of{" "}
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
