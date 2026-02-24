"use client";

import { useState, useEffect, useRef } from "react";
import { X, Star, Trash2, StarOff, MoreVertical, Search } from "lucide-react";
import type { ReadingListItem, BorderColor } from "@/types/courses";
import {
  toggleStarredItem,
  deleteReadingListItem,
  updateBorderColor,
} from "@/lib/supabase/readingListActions";
import { toast } from "sonner";

interface StarredModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const COLOR_OPTIONS: { value: BorderColor; hex: string; label: string }[] = [
  { value: "gray", hex: "#D1D5DB", label: "Gray" },
  { value: "red", hex: "#EF4444", label: "Red" },
  { value: "blue", hex: "#3B82F6", label: "Blue" },
  { value: "green", hex: "#10B981", label: "Green" },
  { value: "yellow", hex: "#F59E0B", label: "Yellow" },
  { value: "purple", hex: "#8B5CF6", label: "Purple" },
  { value: "orange", hex: "#F97316", label: "Orange" },
];

function ItemActionMenu({
  item,
  onClose,
}: {
  item: ReadingListItem;
  onClose: () => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showColors, setShowColors] = useState(false);
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

  const handleColorChange = async (color: BorderColor) => {
    setProcessingId(item.id);
    const result = await updateBorderColor(item.id, color);
    if (result.success) {
      toast.success("Border colour updated");
    } else {
      toast.error(result.error || "Failed to update colour");
    }
    setProcessingId(null);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-7 z-50 w-52 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.14)] border border-gray-100 py-1.5"
    >
      {/* Unstar */}
      <button
        onClick={handleUnstar}
        disabled={processingId === item.id}
        className="w-full px-3.5 py-2 text-left text-[0.82rem] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5 disabled:opacity-50 font-medium"
      >
        <StarOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        Unstar
      </button>

      {/* Change border colour */}
      <button
        onClick={() => setShowColors(!showColors)}
        className="w-full px-3.5 py-2 text-left text-[0.82rem] text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2.5 font-medium"
      >
        <span className="flex items-center gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white ring-1 ring-gray-200"
            style={{
              backgroundColor:
                BORDER_COLOR_MAP[(item.border_color as BorderColor) || "gray"],
            }}
          />
          Border colour
        </span>
        <span className="text-gray-400 text-xs">{showColors ? "▲" : "▼"}</span>
      </button>

      {showColors && (
        <div className="px-3.5 py-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleColorChange(c.value)}
                disabled={processingId === item.id}
                title={c.label}
                className="w-5 h-5 rounded-full border-2 border-white shadow transition-transform hover:scale-110 disabled:opacity-50"
                style={{
                  backgroundColor: c.hex,
                  outline:
                    item.border_color === c.value
                      ? `2px solid ${c.hex}`
                      : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 my-1 h-px bg-gray-100" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={processingId === item.id}
        className="w-full px-3.5 py-2 text-left text-[0.82rem] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5 disabled:opacity-50 font-medium"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        Delete topic
      </button>
    </div>
  );
}

export function StarredModal({ isOpen, onClose, items }: StarredModalProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const starredItems = items.filter((i) => i.starred);

  const filteredItems = starredItems.filter(
    (item) =>
      item.topic.toLowerCase().includes(search.toLowerCase()) ||
      (item.course?.code ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{
          animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-[0.95rem] font-semibold text-gray-900 leading-tight">
                Starred Topics
              </h2>
              <p className="text-[0.7rem] text-gray-400 mt-0.5">
                {starredItems.length}{" "}
                {starredItems.length === 1 ? "topic" : "topics"} starred
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        {starredItems.length > 3 && (
          <div className="px-6 py-3 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search starred topics..."
                className="flex-1 bg-transparent text-[0.8rem] text-gray-700 placeholder-gray-400 outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} title="Clear search">
                  <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-amber-300" />
              </div>
              <p className="text-[0.82rem] text-gray-400 text-center">
                {search ? "No results found." : "No starred topics yet."}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item, idx) => {
                const borderHex =
                  BORDER_COLOR_MAP[
                    (item.border_color as BorderColor) || "gray"
                  ];

                return (
                  <div
                    key={item.id}
                    className="relative group flex items-stretch hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Coloured left border */}
                    <div
                      className="w-1 shrink-0 self-stretch"
                      style={{ backgroundColor: borderHex }}
                    />

                    {/* Row content */}
                    <div className="flex-1 flex items-center justify-between py-3 pl-4 pr-4 min-w-0">
                      {/* Left: number + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[0.7rem] text-gray-300 font-medium w-4 shrink-0 text-right">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.82rem] font-medium text-gray-800 leading-snug truncate">
                            {item.topic}
                          </p>
                          <p className="text-[0.7rem] text-gray-400 mt-0.5">
                            {item.course?.code ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* Right: colour dot + menu */}
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {/* colour dot indicator */}
                        <span
                          className="w-2 h-2 rounded-full shrink-0 opacity-70"
                          style={{ backgroundColor: borderHex }}
                        />

                        {/* three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === item.id ? null : item.id,
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-gray-200 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                          </button>

                          {openMenuId === item.id && (
                            <ItemActionMenu
                              item={item}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 shrink-0">
          <p className="text-[0.7rem] text-gray-400 text-center">
            Hover over a topic to access actions
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
