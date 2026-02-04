"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  PlayCircle,
  FileText,
  Calendar,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { CountdownTimer } from "./countdownTimer";
import { cn } from "@/lib/utils";
import type { Countdown } from "@/lib/supabase/countdownActions";

interface DashboardSidebarProps {
  user: User;
  initialCountdown: Countdown | null;
}

const menuItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BookOpen, label: "Courses", href: "/dashboard/courses" },
  { icon: PlayCircle, label: "Tutorials", href: "/dashboard/tutorials" },
  { icon: FileText, label: "Notes", href: "/dashboard/notes" },
  { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
  { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar({
  user,
  initialCountdown,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const fullName = user.user_metadata?.full_name as string | undefined;
  const email = user.email || "";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0]?.toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      {/* macOS-style traffic lights */}
      <div className="flex items-center gap-2 p-4 pb-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Header with logo and collapse button */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
              S
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">StudyTraka</h1>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50",
                isCollapsed && "justify-center",
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-indigo-600")} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Countdown Timer Section */}
      <div className="px-3 pb-4">
        <CountdownTimer
          initialCountdown={initialCountdown}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-[#3946F0] flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {fullName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
