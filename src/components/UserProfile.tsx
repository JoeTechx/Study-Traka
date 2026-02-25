// components/UserProfile.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";

interface UserProfileProps {
  user: User | null;
  setUser: (user: User | null) => void; // ← receive setter
}

export default function UserProfile({ user, setUser }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!user) return null;

  const fullName = user.user_metadata?.full_name || "";
  const firstName =
    fullName.split(" ")[0] || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url || "/images/userImage.png";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.display = "none";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
          <Image
            src={avatarUrl}
            alt={firstName}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-[#3946F0] text-white font-medium text-sm pointer-events-none">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {firstName}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50"
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-base font-semibold text-gray-900 truncate">
                {fullName || firstName}
              </p>
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>

            <div className="border-t border-gray-100 mt-1 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
