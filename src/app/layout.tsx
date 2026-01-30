"use client";

import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Monitor network status globally
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      toast.error("No internet connection. Please check your network.");
    };

    // Check initial status
    if (!navigator.onLine) {
      toast.error("No internet connection");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <html lang="en">
      <body className={montserrat.className}>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
