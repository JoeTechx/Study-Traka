"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

// Comprehensive validation schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Full name can only contain letters, spaces, hyphens, and apostrophes",
      )
      .refine(
        (name) => {
          const trimmed = name.trim();
          const parts = trimmed.split(/\s+/);
          return parts.length >= 2 && parts.every((part) => part.length > 0);
        },
        {
          message: "Please enter both first and last name",
        },
      )
      .refine(
        (name) => {
          const trimmed = name.trim();
          return trimmed.length >= 2 && !/^\s|\s$/.test(name);
        },
        {
          message: "Full name cannot start or end with spaces",
        },
      ),
    email: z
      .string()
      .min(1, "Email is required")
      .max(255, "Email must not exceed 255 characters")
      .email("Invalid email address")
      .toLowerCase()
      .refine(
        (email) => {
          // Check for valid TLD (at least 2 characters)
          const parts = email.split("@");
          if (parts.length !== 2) return false;
          const domain = parts[1];
          const domainParts = domain.split(".");
          return domainParts[domainParts.length - 1].length >= 2;
        },
        {
          message: "Please enter a valid email domain",
        },
      )
      .refine(
        (email) => {
          // Block common temporary/disposable email domains
          const disposableDomains = [
            "tempmail",
            "throwaway",
            "guerrillamail",
            "10minutemail",
            "mailinator",
          ];
          return !disposableDomains.some((domain) => email.includes(domain));
        },
        {
          message: "Please use a permanent email address",
        },
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .refine((password) => /[a-z]/.test(password), {
        message: "Password must contain at least one lowercase letter",
      })
      .refine((password) => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Password must contain at least one number",
      })
      .refine((password) => /[^a-zA-Z0-9]/.test(password), {
        message:
          "Password must contain at least one special character (!@#$%^&*)",
      })
      .refine((password) => !/\s/.test(password), {
        message: "Password cannot contain spaces",
      }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched", // Validate on blur/touch for better UX
  });

  const passwordValue = watch("password");

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2)
      return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (strength <= 4)
      return { strength: 2, label: "Fair", color: "bg-yellow-500" };
    if (strength <= 5)
      return { strength: 3, label: "Good", color: "bg-blue-500" };
    return { strength: 4, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(passwordValue || "");

  const onSubmit = async (data: RegisterForm) => {
    // Sanitize and prepare data
    const trimmedFullName = data.fullName.trim().replace(/\s+/g, " ");
    const trimmedEmail = data.email.trim().toLowerCase();

    // Additional pre-submission validation
    if (trimmedFullName.length < 2) {
      toast.error("Please enter a valid full name");
      return;
    }

    // Check for suspicious email patterns
    const suspiciousPatterns = [
      "test@test",
      "fake@",
      "spam@",
      "dummy@",
      "example@",
      "admin@test",
    ];

    if (suspiciousPatterns.some((pattern) => trimmedEmail.includes(pattern))) {
      toast.warning("Please use your real email address");
      return;
    }

    // Check password strength
    if (passwordStrength.strength < 2) {
      toast.error("Please use a stronger password");
      return;
    }

    const supabase = createClient();

    try {
      // Show loading toast
      const loadingToast = toast.loading("Creating your account...", {
        description: "Please wait while we set up your account",
      });

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: trimmedEmail,
          password: data.password,
          options: {
            data: {
              full_name: trimmedFullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        },
      );

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (signUpError) {
        console.error("Supabase signup error:", signUpError);

        // Handle specific Supabase error cases
        const errorMsg = signUpError.message.toLowerCase();

        // Check for various "user already exists" error messages
        if (
          errorMsg.includes("already registered") ||
          errorMsg.includes("already exists") ||
          errorMsg.includes("user already registered") ||
          errorMsg.includes("duplicate") ||
          errorMsg.includes("unique constraint") ||
          errorMsg.includes("already in use")
        ) {
          toast.error("Email already registered", {
            description:
              "This email is already in use. Try logging in instead.",
            action: {
              label: "Login",
              onClick: () => router.push("/login"),
            },
            duration: 6000,
          });
          return;
        }

        if (errorMsg.includes("invalid email") || errorMsg.includes("email")) {
          toast.error("Invalid email address", {
            description: "Please check your email and try again.",
          });
          return;
        }

        if (errorMsg.includes("password")) {
          toast.error("Password requirements not met", {
            description: signUpError.message,
          });
          return;
        }

        if (errorMsg.includes("network") || errorMsg.includes("connection")) {
          toast.error("Connection error", {
            description: "Please check your internet connection and try again.",
          });
          return;
        }

        if (errorMsg.includes("rate limit") || errorMsg.includes("too many")) {
          toast.error("Too many attempts", {
            description: "Please wait a few minutes before trying again.",
          });
          return;
        }

        // For development: show the actual error
        if (process.env.NODE_ENV === "development") {
          console.log("Full signup error:", signUpError);
        }

        // Generic error
        toast.error("Registration failed", {
          description:
            signUpError.message ||
            "An unexpected error occurred. Please try again.",
        });
        return;
      }

      // Check the response data
      if (!authData?.user) {
        toast.error("Registration failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }

      // Check if this is a duplicate signup (Supabase sometimes returns success for existing users)
      // This happens when email confirmations are disabled and autoconfirm is on
      if (authData.user.identities && authData.user.identities.length === 0) {
        toast.error("Email already registered", {
          description: "This email is already in use. Try logging in instead.",
          action: {
            label: "Login",
            onClick: () => router.push("/login"),
          },
          duration: 6000,
        });
        return;
      }

      // Check if email confirmation is required
      if (authData.user && !authData.user.confirmed_at) {
        toast.success("Account created successfully!", {
          description: "Please check your email to confirm your account.",
          duration: 6000,
        });

        // Additional info toast
        setTimeout(() => {
          toast.info("Check your spam folder", {
            description:
              "If you don't see the email, check your spam/junk folder.",
            duration: 5000,
          });
        }, 2000);

        // Redirect to login page after a delay
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else if (authData.user && authData.user.confirmed_at) {
        // User is already confirmed (auto-confirm enabled)
        toast.success("Account created successfully!", {
          description: "Redirecting to your dashboard...",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        // Fallback success message
        toast.success("Registration successful!", {
          description: "Redirecting you to login...",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error: any) {
      // Catch any unexpected errors
      console.error("Registration error:", error);

      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again later.",
      });
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
            alt="Student registering illustration"
            width={720}
            height={720}
            className="drop-shadow-lg"
          />
        </motion.div>

        {/* Register form */}
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-normal text-gray-900">Register</h1>
            <p className="mt-2 text-gray-600">
              Track your studies at your own pace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name Field */}
            <div className="relative">
              <input
                id="fullName"
                type="text"
                placeholder=" "
                autoComplete="name"
                {...register("fullName")}
                className={`peer mt-1 block w-full text-[#000000] text-[0.7rem] px-3 py-[0.8rem] pt-5 border rounded-md shadow-sm focus:outline-none focus:ring-[#3946F0] focus:border-[#3946F0] transition-colors ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
              />
              <label
                htmlFor="fullName"
                className="absolute left-3 top-1 text-gray-500 text-xs transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#3946F0]"
              >
                Full name
              </label>
              {errors.fullName && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.fullName.message}
                </motion.p>
              )}
            </div>

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
                type="password"
                placeholder=" "
                autoComplete="new-password"
                {...register("password")}
                onFocus={() => setShowPasswordRequirements(true)}
                className={`peer mt-1 block w-full text-[#000000] text-[0.7rem] px-3 py-[0.8rem] pt-5 border rounded-md shadow-sm focus:outline-none focus:ring-[#3946F0] focus:border-[#3946F0] transition-colors ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-1 text-gray-500 text-xs transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#3946F0]"
              >
                Password
              </label>

              {/* Password Strength Indicator */}
              {passwordValue && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(passwordStrength.strength / 4) * 100}%`,
                        }}
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.strength === 1
                          ? "text-red-500"
                          : passwordStrength.strength === 2
                            ? "text-yellow-500"
                            : passwordStrength.strength === 3
                              ? "text-blue-500"
                              : "text-green-500"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Password Requirements */}
              {showPasswordRequirements && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 text-xs text-gray-600 space-y-1"
                >
                  <p
                    className={
                      passwordValue?.length >= 8 ? "text-green-600" : ""
                    }
                  >
                    • At least 8 characters
                  </p>
                  <p
                    className={
                      /[a-z]/.test(passwordValue || "") ? "text-green-600" : ""
                    }
                  >
                    • One lowercase letter
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(passwordValue || "") ? "text-green-600" : ""
                    }
                  >
                    • One uppercase letter
                  </p>
                  <p
                    className={
                      /[0-9]/.test(passwordValue || "") ? "text-green-600" : ""
                    }
                  >
                    • One number
                  </p>
                  <p
                    className={
                      /[^a-zA-Z0-9]/.test(passwordValue || "")
                        ? "text-green-600"
                        : ""
                    }
                  >
                    • One special character
                  </p>
                </motion.div>
              )}

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

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                placeholder=" "
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={`peer mt-1 block w-full text-[#000000] text-[0.7rem] px-3 py-[0.8rem] pt-5 border rounded-md shadow-sm focus:outline-none focus:ring-[#3946F0] focus:border-[#3946F0] transition-colors ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-3 top-1 text-gray-500 text-xs transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#3946F0]"
              >
                Confirm Password
              </label>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#3946F0] text-white font-medium rounded-[0.8rem] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#3946F0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                  Creating...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#3946F0] hover:text-blue-500 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
