"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  toggleReadingListItem,
  deleteReadingListItem,
} from "@/lib/supabase/readingListActions";
import { toast } from "sonner";
import type { ReadingListItem } from "@/types/courses";
import { format } from "date-fns";

interface ReadingListTableProps {
  items: ReadingListItem[];
}

export function ReadingListTable({ items }: ReadingListTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">
          No topics added yet. Click "Add Courses +" to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Done?
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.course?.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.course?.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{item.topic}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.class_date), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    title="Checkbox"
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleDone(item.id, item.done)}
                    disabled={processingId === item.id}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === item.id ? null : item.id)
                    }
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === item.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => handleDelete(item.id, item.topic)}
                          disabled={processingId === item.id}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
}
