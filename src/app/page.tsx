"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import UserProfile from "@/components/UserProfile";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudyTrakaLanding() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Check current session
    const checkUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError) {
          console.error("Error fetching user:", userError);
          
          // Only show error toast for critical errors
          if (userError.message.toLowerCase().includes("network")) {
            toast.error("Connection issue", {
              description: "Unable to verify your session. Please check your internet connection.",
            });
            setError("Connection issue");
          }
          
          setUser(null);
        } else {
          setUser(user);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error in checkUser:", err);
        
        if (!mounted) return;
        
        setUser(null);
        setError("Unable to verify session");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          setUser(session?.user ?? null);
          setError(null);
          toast.success("Successfully signed in!", {
            description: "Welcome back to StudyTraka",
          });
          break;

        case "SIGNED_OUT":
          setUser(null);
          setError(null);
          toast.info("Signed out", {
            description: "You've been signed out successfully.",
          });
          break;

        case "TOKEN_REFRESHED":
          setUser(session?.user ?? null);
          break;

        case "USER_UPDATED":
          setUser(session?.user ?? null);
          break;

        default:
          setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="px-8 py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 bg-linear-to-t from-[#3946F0] to-[#737BEF] rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-white text-[17px] font-medium">S</span>
              </motion.div>
              <h1 className="text-[17px]">
                <span className="text-[#000000] font-bold">Study</span>
                <span className="text-[#000000] font-medium">Traka</span>
              </h1>
            </Link>

            {/* User Profile or Loading */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    Loading...
                  </span>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Retry
                  </button>
                </motion.div>
              ) : user ? (
                <motion.div
                  key="user"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <UserProfile user={user} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center px-8 py-16 lg:py-24">
          <motion.div
            className="max-w-3xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-[1.5rem] md:text-[1.8rem] lg:text-[2rem] font-medium mb-6 leading-tight">
              <span className="text-gray-700">Welcome to </span>
              <motion.span
                className="bg-[#3946F0] font-semibold bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                STUDY TRAKA
              </motion.span>
              <span className="text-gray-700"> where you can keep </span>
              <motion.span
                className="bg-[#3946F0] font-semibold bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                TRACK
              </motion.span>
              <span className="text-gray-700">
                {" "}
                of your studies, class dates, and the period your exams will
                start.
              </span>
            </h2>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading-cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-8 py-3"
                  >
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error-cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-white text-gray-800 rounded-[0.6rem] font-medium text-[0.8rem] shadow-lg border border-[#9D9C9C] hover:bg-gray-50 transition-all duration-300 min-w-48"
                    >
                      Retry Loading
                    </button>
                    <Link
                      href="/register"
                      className="px-6 py-3 bg-[#3946F0] text-[#ffffff] rounded-[0.6rem] font-medium text-[0.8rem] shadow-xl hover:bg-blue-700 transition-colors min-w-48"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                ) : user ? (
                  // Signed in - Show "Enter your study room" button
                  <motion.div
                    key="authenticated"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-[0.6rem] font-medium text-[0.8rem] shadow-lg border border-[#9D9C9C] hover:bg-[#dfe1ff] hover:border-[#dfe1ff] hover:text-[#03084a] transition-all duration-300 min-w-48 justify-center"
                    >
                      Enter your study room
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ) : (
                  // Not signed in - Show register and login buttons
                  <motion.div
                    key="unauthenticated"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                  >
                    <Link
                      href="/register"
                      className="px-6 py-3 bg-white text-gray-800 rounded-[0.6rem] font-medium text-[0.8rem] shadow-lg border border-[#9D9C9C] hover:border-[#3946F0] hover:bg-gray-50 transition-all duration-300 min-w-40 text-center"
                    >
                      Track your studies
                    </Link>

                    <Link
                      href="/login"
                      className="px-6 py-3 bg-[#3946F0] text-[#ffffff] rounded-[0.6rem] font-medium text-[0.8rem] shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all duration-300 min-w-40 text-center"
                    >
                      Don't lose track
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Illustration Section */}
          <motion.div
            className="relative w-full flex justify-center max-w-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Image
              src="/images/student-character.png"
              alt="Student Character"
              width={520}
              height={520}
              className="drop-shadow-lg w-full h-auto max-w-130"
              priority
            />
          </motion.div>

          {/* Features Section (Optional) */}
          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#3946F0] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Track Studies
              </h3>
              <p className="text-sm text-gray-600">
                Keep organized records of all your study sessions and progress
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#3946F0] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Schedule
              </h3>
              <p className="text-sm text-gray-600">
                Never miss a class or exam with our smart scheduling system
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#3946F0] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stay Motivated
              </h3>
              <p className="text-sm text-gray-600">
                Track your progress and stay motivated throughout your journey
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}