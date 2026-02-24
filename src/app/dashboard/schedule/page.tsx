import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCourses } from "@/lib/supabase/courseActions";
import { ScheduleContent } from "@/components/schedule/ScheduleContent";
import { getScheduleEvents } from "@/lib/supabase/scheduleActions";
import { getReminderPreferences } from "@/lib/supabase/reminderActions";

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [events, courses, preferences] = await Promise.all([
    getScheduleEvents(),
    getCourses(),
    getReminderPreferences(),
  ]);

  return (
    <ScheduleContent
      events={events}
      courses={courses}
      preferences={preferences}
      userEmail={user.email ?? ""}
    />
  );
}
