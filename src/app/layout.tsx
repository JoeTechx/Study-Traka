// app/layout.tsx
"use client";

import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <html lang="en">
      <head>
        {/* General Meta Tags */}
        <title>
          StudyTraka - Track Your Studies, Class Dates & Exam Periods
        </title>
        <meta
          name="description"
          content="Keep track of your studies, class dates, and the period your exams will start with StudyTraka - your personal study management tool."
        />
        <meta
          name="keywords"
          content="study tracker, exam planner, class schedule, student planner, study management, exam dates"
        />

        {/* Open Graph / Facebook / WhatsApp / LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://study-traka.vercel.app/" />
        <meta
          property="og:title"
          content="StudyTraka - Track Your Studies & Exams"
        />
        <meta
          property="og:description"
          content="Keep track of your studies, class dates, and the period your exams will start with StudyTraka."
        />
        <meta
          property="og:image"
          content="https://study-traka.vercel.app/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="StudyTraka - Track Your Studies, Class Dates & Exam Periods"
        />
        <meta property="og:site_name" content="StudyTraka" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://study-traka.vercel.app/" />
        <meta
          name="twitter:title"
          content="StudyTraka - Track Your Studies & Exams"
        />
        <meta
          name="twitter:description"
          content="Keep track of your studies, class dates, and the period your exams will start with StudyTraka."
        />
        <meta
          name="twitter:image"
          content="https://study-traka.vercel.app/og-image.png"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={montserrat.className}>
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </>
        )}
      </body>
    </html>
  );
}
