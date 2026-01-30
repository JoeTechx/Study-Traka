"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    // Check internet connection before attempting login
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network and try again.");
      return;
    }

    const supabase = createClient();
    const timeoutDuration = 100000; // 60 seconds timeout

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), timeoutDuration);
      });

      // Race between the login request and timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      const { data: signInData, error } = await Promise.race([
        loginPromise,
        timeoutPromise,
      ]) as any;

      if (error) {
        // Handle specific authentication errors
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Incorrect email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email address before logging in. Check your inbox.");
        } else if (error.message.includes("User not found")) {
          toast.error("No account found with this email address.");
        } else if (error.message.includes("fetch") || error.message.includes("network")) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error(error.message || "Login failed. Please try again.");
        }
        return;
      }

      // Check if user session was created
      if (!signInData.user || !signInData.session) {
        toast.error("Failed to create session. Please try again.");
        return;
      }

      // Success
      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh(); // Refresh to update server components
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle different types of errors
      if (err.message === "timeout") {
        toast.error("Request timed out. Please check your internet connection and try again.");
      } else if (err.message?.includes("fetch") || err.name === "TypeError") {
        toast.error("Network error. Please check your connection and try again.");
      } else if (err.message?.includes("Failed to fetch")) {
        toast.error("Cannot reach the server. Please check your internet connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to continue tracking your studies</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}