"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import type { Countdown } from "@/lib/supabase/countdownActions";
import { SoonBadge } from "@/components/settings/SettingsPrimitives";

interface DashboardSidebarProps {
  user: User | null;
  setUser: (user: User | null) => void;
  initialCountdown: Countdown | null;
  children: React.ReactNode;
}

const menuItems = [
  { icon: Home, label: "Home", href: "/dashboard", soon: false },
  { icon: BookOpen, label: "Courses", href: "/dashboard/courses", soon: false },
  {
    icon: PlayCircle,
    label: "Tutorials",
    href: "/dashboard/tutorials",
    soon: true,
  },
  { icon: FileText, label: "Notes", href: "/dashboard/notes", soon: true },
  {
    icon: Calendar,
    label: "Schedule",
    href: "/dashboard/schedule",
    soon: false,
  },
  { icon: HelpCircle, label: "Help", href: "/dashboard/help", soon: true },
  {
    icon: Settings,
    label: "Settings",
    href: "/dashboard/settings",
    soon: false,
  },
];

export function DashboardSidebar({
user,
setUser,
initialCountdown,
children
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  // Listen for real-time profile / avatar / email changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

if (!user) return null;

const fullName = (user.user_metadata?.full_name as string) || "";
const email = user.email || "";
const initials =
  fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ||
  email[0]?.toUpperCase() ||
  "U";

  return (
    <>
      <aside
        className={cn(
          "group fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-40",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Collapse toggle */}
          <div className="flex ml-auto items-center gap-2 p-4 pb-3 shrink-0">
            <button
              type="button"
              title={isCollapsed ? "Expand" : "Collapse"}
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

          {/* Logo area */}
          <div className="px-4 pb-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-base">
                S
              </div>
              {!isCollapsed && (
                <h1 className="text-[0.95rem] font-semibold text-gray-900">
                  Study<span className="font-medium">Traka</span>
                </h1>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1.5 pb-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isComingSoon = item.soon && !isActive;

              return (
                <Link
                  key={item.href}
                  href={isComingSoon ? "#" : item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[0.8125rem] font-medium",
                    isActive
                      ? "bg-indigo-50/80 text-indigo-700"
                      : isComingSoon
                        ? "text-gray-400 cursor-not-allowed hover:bg-transparent"
                        : "text-gray-700 hover:bg-gray-100/70 active:bg-gray-200/40",
                    isCollapsed && "justify-center px-4",
                  )}
                  title={item.label + (item.soon ? " (coming soon)" : "")}
                  onClick={(e) => {
                    if (isComingSoon) {
                      e.preventDefault();
                      // Optional: toast.info("Feature coming soon");
                    }
                  }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-500 group-hover:text-gray-600",
                    )}
                  />

                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.soon && <SoonBadge />}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Countdown timer section */}
          <div className="px-3 py-4 shrink-0 border-t border-gray-100/60">
            <CountdownTimer
              initialCountdown={initialCountdown}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* User profile section */}
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "justify-center",
              )}
            >
              <div className="w-10 h-10 rounded-full bg-[#3946F0] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {initials}
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                  </div>

                  <button
                    title="Sign out"
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

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
