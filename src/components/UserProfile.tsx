"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Live state — initialised from server-rendered user prop
  const [fullName, setFullName] = useState<string>(
    user.user_metadata?.full_name ?? "",
  );
  const [email, setEmail] = useState<string>(user.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user.user_metadata?.avatar_url ?? "",
  );
  const [imgError, setImgError] = useState(false);

  // ── Fetch fresh user data from Supabase ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    const {
      data: { user: fresh },
    } = await supabase.auth.getUser();
    if (!fresh) return;
    setFullName(fresh.user_metadata?.full_name ?? "");
    setEmail(fresh.email ?? "");
    const newUrl = fresh.user_metadata?.avatar_url ?? "";
    setAvatarUrl((prev) => {
      if (prev !== newUrl) setImgError(false); // reset img error on new URL
      return newUrl;
    });
  }, [supabase]);

  useEffect(() => {
    // 1. Listen for USER_UPDATED event — fires when updateUser() is called
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED" && session?.user) {
        const u = session.user;
        setFullName(u.user_metadata?.full_name ?? "");
        setEmail(u.email ?? "");
        const newUrl = u.user_metadata?.avatar_url ?? "";
        setAvatarUrl((prev) => {
          if (prev !== newUrl) setImgError(false);
          return newUrl;
        });
      }
    });

    // 2. Also poll every 3 seconds while the page is open as a safety net
    //    (catches cases where the event doesn't fire e.g. server actions)
    const interval = setInterval(refreshUser, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [supabase, refreshUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = fullName.split(" ")[0] || email.split("@")[0] || "User";
  const initials =
    (fullName || email)
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

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

  // ── Avatar component — shared between button and dropdown ─────────────────
  function Avatar({ size }: { size: number }) {
    return (
      <div
        className="rounded-full overflow-hidden bg-indigo-100 shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {avatarUrl && !imgError ? (
          <Image
            src={avatarUrl}
            alt={firstName}
            width={size}
            height={size}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
            unoptimized // avoids caching stale avatar after upload
          />
        ) : (
          <span
            className="bg-indigo-600 text-white font-semibold w-full h-full flex items-center justify-center"
            style={{ fontSize: size * 0.35 }}
          >
            {initials}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Avatar size={32} />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {firstName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
          >
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Avatar size={36} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {fullName || firstName}
                </p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-gray-400" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100 py-1 mt-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
