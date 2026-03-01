// app/layout.tsx (UPDATED - Server Component)
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import type { Metadata } from "next";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyTraka - Track Your Studies, Class Dates & Exam Periods",
  description:
    "Keep track of your studies, class dates, and the period your exams will start with StudyTraka - your personal study management tool.",
  keywords: [
    "study tracker",
    "exam planner",
    "class schedule",
    "student planner",
    "study management",
    "exam dates",
  ],

  // Open Graph / Facebook / WhatsApp / LinkedIn
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://study-traka.vercel.app/",
    title: "StudyTraka - Track Your Studies & Exams",
    description:
      "Keep track of your studies, class dates, and the period your exams will start with StudyTraka.",
    siteName: "StudyTraka",
    images: [
      {
        url: "https://study-traka.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudyTraka - Track Your Studies, Class Dates & Exam Periods",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "StudyTraka - Track Your Studies & Exams",
    description:
      "Keep track of your studies, class dates, and the period your exams will start with StudyTraka.",
    images: ["https://study-traka.vercel.app/og-image.png"],
  },

  // Additional
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </Providers>
      </body>
    </html>
  );
}
