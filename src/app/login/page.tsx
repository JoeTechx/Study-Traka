"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

// Enhanced login validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginForm) => {
    const supabase = createClient();

    try {
      // Show loading toast
      const loadingToast = toast.loading("Signing you in...", {
        description: "Please wait",
      });

      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (error) {
        console.error("Login error:", error);
        const errorMsg = error.message.toLowerCase();

        // Handle specific authentication errors with helpful messages
        if (
          errorMsg.includes("invalid login credentials") ||
          errorMsg.includes("invalid email or password")
        ) {
          toast.error("Incorrect email or password", {
            description: "Please check your credentials and try again.",
            duration: 5000,
          });
          return;
        }

        if (
          errorMsg.includes("email not confirmed") ||
          errorMsg.includes("verify your email")
        ) {
          toast.error("Email not confirmed", {
            description:
              "Please check your email and click the confirmation link.",
            duration: 6000,
            action: {
              label: "Resend",
              onClick: async () => {
                const { error: resendError } = await supabase.auth.resend({
                  type: "signup",
                  email: data.email,
                });

                if (resendError) {
                  toast.error("Failed to resend email", {
                    description: resendError.message,
                  });
                } else {
                  toast.success("Confirmation email sent!", {
                    description: "Please check your inbox.",
                  });
                }
              },
            },
          });
          return;
        }

        if (
          errorMsg.includes("user not found") ||
          errorMsg.includes("no user found")
        ) {
          toast.error("Account not found", {
            description: "No account exists with this email address.",
            action: {
              label: "Register",
              onClick: () => router.push("/register"),
            },
            duration: 6000,
          });
          return;
        }

        if (
          errorMsg.includes("too many requests") ||
          errorMsg.includes("rate limit")
        ) {
          toast.error("Too many login attempts", {
            description: "Please wait a few minutes before trying again.",
            duration: 6000,
          });
          return;
        }

        if (
          errorMsg.includes("network") ||
          errorMsg.includes("connection") ||
          errorMsg.includes("fetch failed")
        ) {
          toast.error("Connection error", {
            description: "Please check your internet connection and try again.",
            duration: 5000,
          });
          return;
        }

        // Generic error with the actual message
        toast.error("Login failed", {
          description: error.message || "An unexpected error occurred.",
          duration: 5000,
        });
        return;
      }

      // Validate session creation
      if (!signInData?.user || !signInData?.session) {
        toast.error("Login failed", {
          description: "Unable to create session. Please try again.",
        });
        return;
      }

      // Success! Show welcome message with user's name if available
      const userName = signInData.user.user_metadata?.full_name;

      toast.success(
        userName ? `Welcome back, ${userName.split(" ")[0]}!` : "Welcome back!",
        {
          description: "Redirecting to your dashboard...",
          duration: 3000,
        },
      );

      // Small delay before redirect for better UX
      setTimeout(() => {
        router.push(redirect);
        router.refresh(); // Refresh to update server components
      }, 800);
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle network errors
      if (
        err.message?.includes("fetch") ||
        err.name === "TypeError" ||
        err.message?.includes("Failed to fetch")
      ) {
        toast.error("Network error", {
          description:
            "Unable to connect to the server. Please check your internet connection.",
          duration: 5000,
        });
      } else {
        toast.error("Something went wrong", {
          description: "An unexpected error occurred. Please try again later.",
          duration: 5000,
        });
      }
    }
  };

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
          <div className="flex items-center gap-2">
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
          </div>
        </motion.header>
      </div>

      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-[#fafafa] px-4">
        <motion.div
          className="relative w-full hidden md:flex flex-col justify-center max-w-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Image
            src="/images/Training-Materials-1 1.png"
            alt="Student studying illustration"
            width={720}
            height={720}
            className="drop-shadow-lg"
            priority
          />
        </motion.div>

        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-600">
              Don't give up, continue from where you stopped
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder=" "
                autoComplete="email"
                {...register("email")}
                className={`peer mt-1 block w-full text-[#000000] text-[0.7rem] px-3 py-[0.8rem] pt-5 border rounded-md shadow-sm focus:outline-none focus:ring-[#3946F0] focus:border-[#3946F0] transition-colors ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-1 text-gray-500 text-xs transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#3946F0]"
              >
                Email
              </label>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                autoComplete="current-password"
                {...register("password")}
                className={`peer mt-1 block w-full text-[#000000] text-[0.7rem] px-3 py-[0.8rem] pt-5 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-[#3946F0] focus:border-[#3946F0] transition-colors ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-1 text-gray-500 text-xs transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#3946F0]"
              >
                Password
              </label>

              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>

              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#3946F0] hover:text-blue-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#3946F0] text-white font-medium rounded-[0.8rem] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#3946F0] focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#3946F0] hover:text-blue-500 transition-colors"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
