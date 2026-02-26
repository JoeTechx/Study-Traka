"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BookOpen, PlayCircle, FileText,
  Calendar, HelpCircle, Settings,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { CountdownTimer } from "./countdownTimer";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Countdown } from "@/lib/supabase/countdownActions";

interface DashboardSidebarProps {
  user: User;
  initialCountdown: Countdown | null;
  children: React.ReactNode;
}

// soon: true  → greyed out, click blocked, shows "Soon" badge
// soon: false → normal active link
const menuItems = [
  { icon: Home,        label: "Home",      href: "/dashboard",           soon: false },
  { icon: BookOpen,    label: "Courses",   href: "/dashboard/courses",   soon: false },
  { icon: PlayCircle,  label: "Tutorials", href: "/dashboard/tutorials", soon: true  },
  { icon: FileText,    label: "Notes",     href: "/dashboard/notes",     soon: true  },
  { icon: Calendar,    label: "Schedule",  href: "/dashboard/schedule",  soon: false },
  { icon: HelpCircle,  label: "Help",      href: "/dashboard/help",      soon: true  },
  { icon: Settings,    label: "Settings",  href: "/dashboard/settings",  soon: false },
];

export function DashboardSidebar({
  user,
  initialCountdown,
  children,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();

  // ── Live user state ───────────────────────────────────────────────────────
  const [fullName,  setFullName]  = useState<string>(user.user_metadata?.full_name  ?? "");
  const [email,     setEmail]     = useState<string>(user.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string>(user.user_metadata?.avatar_url ?? "");
  const [imgError,  setImgError]  = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const u = session.user;
          setFullName(u.user_metadata?.full_name  ?? "");
          setEmail(u.email ?? "");
          const newUrl = u.user_metadata?.avatar_url ?? "";
          if (newUrl !== avatarUrl) {
            setAvatarUrl(newUrl);
            setImgError(false);
          }
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [supabase, avatarUrl]);

  const initials = (fullName || email)
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleSignOut = async () => {
    const promise = supabase.auth.signOut();
    toast.promise(promise, {
      loading: "Signing out…",
      success: () => {
        router.push("/login");
        router.refresh();
        return "Signed out successfully";
      },
      error: "Failed to sign out",
    });
  };

  return (
    <>
      <aside
        className={cn(
          "group fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-40",
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
              className="w-7 h-7 rounded-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed
                ? <ChevronRight className="w-4 h-4 text-gray-600" />
                : <ChevronLeft  className="w-4 h-4 text-gray-600" />}
            </button>
          </div>

          {/* Logo */}
          <div className="px-4 pb-6 shrink-0">
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

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 pb-4">
            {menuItems.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname === item.href;

              if (item.soon) {
                // ── Disabled / Soon item ────────────────────────────────────
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg cursor-not-allowed select-none opacity-45",
                        isCollapsed ? "justify-center" : "",
                      )}
                      title={isCollapsed ? `${item.label} — coming soon` : undefined}
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      {!isCollapsed && (
                        <span className="text-[0.75rem] font-medium text-gray-400 flex-1">
                          {item.label}
                        </span>
                      )}
                      {/* Soon badge — only when sidebar expanded */}
                      {!isCollapsed && (
                        <span className="px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200 rounded-full shrink-0">
                          Soon
                        </span>
                      )}
                    </div>

                    {/* Collapsed tooltip */}
                    {isCollapsed && hoveredItem === item.href && (
                      <div className="fixed left-[88px] px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50"
                        style={{ top: `${120 + menuItems.findIndex((m) => m.href === item.href) * 52}px` }}
                      >
                        {item.label}
                        <span className="ml-1.5 px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide bg-amber-500 text-white rounded-full">
                          Soon
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // ── Active / normal item ──────────────────────────────────────
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
                    <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-[#3946f0]")} />
                    {!isCollapsed && (
                      <span className="text-[0.75rem] font-medium">{item.label}</span>
                    )}
                  </Link>

                  {/* Collapsed tooltip */}
                  {isCollapsed && hoveredItem === item.href && (
                    <div className="fixed left-[88px] px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50"
                      style={{ top: `${120 + menuItems.findIndex((m) => m.href === item.href) * 52}px` }}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Countdown */}
          <div className="px-3 py-4 shrink-0">
            <CountdownTimer
              initialCountdown={initialCountdown}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* User profile footer */}
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div
              className={cn("flex items-center gap-3 relative", isCollapsed && "justify-center")}
              onMouseEnter={() => setHoveredItem("profile")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                {avatarUrl && !imgError ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName || "Avatar"}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full rounded-full"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-white font-semibold text-sm bg-indigo-600 w-full h-full flex items-center justify-center rounded-full">
                    {initials}
                  </span>
                )}
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
                    type="button"
                    title="Sign out"
                    onClick={handleSignOut}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Collapsed profile tooltip */}
            {isCollapsed && hoveredItem === "profile" && (
              <div className="fixed left-[88px] bottom-5 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none z-50 max-w-[200px]">
                <div className="font-semibold truncate">{fullName || "User"}</div>
                <div className="text-[10px] text-gray-300 truncate">{email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300 ease-in-out", isCollapsed ? "ml-20" : "ml-72")}>
        {children}
      </main>
    </>
  );
}