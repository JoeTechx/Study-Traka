// app/layout-metadata.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  // General Meta Tags
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
  authors: [{ name: "StudyTraka" }],
  creator: "StudyTraka",

  // Open Graph (Facebook, WhatsApp, LinkedIn)
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
        type: "image/png",
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
    creator: "@studytraka", // Replace with your actual Twitter handle if you have one
    site: "@studytraka", // Replace with your actual Twitter handle if you have one
  },

  // Additional Meta Tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification (add these when you set up)
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  // },
};
