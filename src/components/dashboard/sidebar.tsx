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
  children: React.ReactNode;
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
  children,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
    <>
      <aside
        className={cn(
          "group fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-40",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        {/* Scrollable container with custom scrollbar */}
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* macOS-style traffic lights */}
          <div className="flex ml-auto items-center gap-2 p-4 pb-3 shrink-0">
            <button
            type="button"
            title={isCollapsed ? "Expand" : "Collapse"}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer relative"
              onMouseEnter={() => setHoveredItem("expand")}
              onMouseLeave={() => setHoveredItem(null)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Header with logo and collapse button */}
          <div className="px-4 pb-6 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-[1rem]">
                  S
                </div>
                {!isCollapsed && (
                  <h1 className="text-[0.9rem] font-semibold text-gray-900">
                    Study<span className="font-medium">Traka</span>
                  </h1>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-3 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    title={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-[#f5f6ff] text-[#3946f0]"
                        : "text-gray-700 hover:bg-gray-50",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <Icon
                      className={cn("w-4 h-4", isActive && "text-[#3946f0]")}
                    />
                    {!isCollapsed && (
                      <span className="text-[0.75rem] font-medium">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Countdown Timer Section */}
          <div className="px-3 py-4 shrink-0">
            <CountdownTimer
              initialCountdown={initialCountdown}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div
              className={cn(
                "flex items-center gap-3 relative",
                isCollapsed && "justify-center",
              )}
              onMouseEnter={() => setHoveredItem("profile")}
              onMouseLeave={() => setHoveredItem(null)}
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
                title="Logout"
                type="button"
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tooltips rendered OUTSIDE the scrollable container */}
        {/* {isCollapsed && hoveredItem === "expand" && (
          <div className="fixed left-22 top-5 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-50">
            Expand
          </div>
        )} */}

        {/* {isCollapsed &&
          hoveredItem &&
          menuItems.find((item) => item.href === hoveredItem) && (
            <div
              className="fixed px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-50"
              style={{
                left: "88px",
                top: `${120 + menuItems.findIndex((item) => item.href === hoveredItem) * 60}px`,
              }}
            >
              {menuItems.find((item) => item.href === hoveredItem)?.label}
            </div>
          )} */}

        {isCollapsed && hoveredItem === "profile" && (
          <div className="fixed left-22 bottom-5 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-50 max-w-50">
            <div className="font-semibold">{fullName || "User"}</div>
            <div className="text-[10px] text-gray-300 truncate">{email}</div>
          </div>
        )}
      </aside>

      {/* Main content with responsive margin */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-20" : "ml-72",
        )}
      >
        {children}
      </main>
    </>
  );
}
