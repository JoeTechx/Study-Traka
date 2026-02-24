"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Star, Trash2, X, StarOff } from "lucide-react";
import type { ReadingListItem, BorderColor } from "@/types/courses";
import {
  toggleStarredItem,
  deleteReadingListItem,
  updateBorderColor,
} from "@/lib/supabase/readingListActions";
import { toast } from "sonner";
import { StarredModal } from "@/components/dashboard/StarredModal";

interface StarredPanelProps {
  items: ReadingListItem[];
}

const BORDER_COLOR_MAP: Record<BorderColor, string> = {
  gray: "#D1D5DB",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  orange: "#F97316",
};

const PREVIEW_COUNT = 5;

function StarredItemMenu({
  item,
  onClose,
}: {
  item: ReadingListItem;
  onClose: () => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleUnstar = async () => {
    setProcessingId(item.id);
    const result = await toggleStarredItem(item.id, false);
    if (result.success) {
      toast.success("Removed from starred");
    } else {
      toast.error(result.error || "Failed to unstar");
    }
    setProcessingId(null);
    onClose();
  };

  const handleDelete = async () => {
    setProcessingId(item.id);
    const result = await deleteReadingListItem(item.id);
    if (result.success) {
      toast.success("Topic deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setProcessingId(null);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-6 top-0 z-50 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-1.5 overflow-hidden"
      style={{ marginTop: "2px" }}
    >
      {/* Unstar */}
      <button
        onClick={handleUnstar}
        disabled={processingId === item.id}
        className="w-full px-3.5 py-2 text-left text-[0.8rem] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5 disabled:opacity-50 font-medium"
      >
        <StarOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        Unstar
      </button>

      {/* Divider */}
      <div className="mx-3 my-1 h-px bg-gray-100" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={processingId === item.id}
        className="w-full px-3.5 py-2 text-left text-[0.8rem] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5 disabled:opacity-50 font-medium"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        Delete topic
      </button>
    </div>
  );
}

export function StarredPanel({ items }: StarredPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const starredItems = items.filter((item) => item.starred);
  const previewItems = starredItems.slice(0, PREVIEW_COUNT);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[0.95rem] font-semibold text-gray-900 tracking-tight">
            Starred
          </h3>
          {starredItems.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[0.72rem] font-medium text-indigo-600 hover:text-indigo-700 transition-colors hover:underline underline-offset-2"
            >
              See all ({starredItems.length})
            </button>
          )}
        </div>

        {/* Items */}
        {starredItems.length === 0 ? (
          <div className="px-5 pb-6 pt-2 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2.5">
              <Star className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-[0.75rem] text-gray-400 leading-relaxed">
              No starred topics yet.
              <br />
              Star a topic to save it here.
            </p>
          </div>
        ) : (
          <div className="pb-3">
            {previewItems.map((item) => {
              const borderHex =
                BORDER_COLOR_MAP[(item.border_color as BorderColor) || "gray"];

              return (
                <div
                  key={item.id}
                  className="relative group flex items-start gap-0 px-0 py-0 hover:bg-gray-50/80 transition-colors"
                >
                  {/* Colored left border strip */}
                  <div
                    className="w-[3.5px] shrink-0 self-stretch rounded-r-sm"
                    style={{ backgroundColor: borderHex }}
                  />

                  {/* Content */}
                  <div className="flex-1 flex items-start justify-between py-2.5 pl-3 pr-1 min-w-0">
                    <div className="min-w-0 pr-1">
                      <p className="text-[0.8rem] font-medium text-gray-800 leading-snug truncate">
                        {item.topic}
                      </p>
                      <p className="text-[0.7rem] text-gray-400 mt-0.5">
                        {item.course?.code ?? "—"}
                      </p>
                    </div>

                    {/* Three-dot menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === item.id ? null : item.id)
                        }
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                      </button>

                      {openMenuId === item.id && (
                        <StarredItemMenu
                          item={item}
                          onClose={() => setOpenMenuId(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "See all" nudge if more than preview */}
            {starredItems.length > PREVIEW_COUNT && (
              <div className="px-4 pt-2 pb-1">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full text-center text-[0.72rem] text-gray-400 hover:text-indigo-600 transition-colors py-1"
                >
                  +{starredItems.length - PREVIEW_COUNT} more — see all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <StarredModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items}
      />
    </>
  );
}
