import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScheduleContent } from "@/components/schedule/ScheduleContent";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule | StudyTraka',
  description: 'View and manage your class schedule and timetable.',
  openGraph: {
    title: 'Schedule | StudyTraka',
    description: 'View and manage your class schedule and timetable.',
  },
  twitter: {
    title: 'Schedule | StudyTraka',
    description: 'View and manage your class schedule and timetable.',
  },
}

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only pass the user — ScheduleContent fetches everything else
  // client-side so it can re-fetch after mutations without a full page reload
  return <ScheduleContent userId={user.id} userEmail={user.email ?? ""} />;
}
