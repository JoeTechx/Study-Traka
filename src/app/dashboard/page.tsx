import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getReadingList } from "@/lib/supabase/readingListActions";
import { getCourses } from "@/lib/supabase/courseActions";
import {
  getUpcomingEvents,
  getReminderPreferences,
} from "@/lib/supabase/reminderActions";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { StarredPanel } from "@/components/dashboard/StarredPanel";
import {
  RemindersPanel,
  type ReminderPreferences,
} from "@/components/dashboard/RemindersPanel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch everything in parallel
  const [readingList, courses, upcomingEvents, reminderPrefs] =
    await Promise.all([
      getReadingList(),
      getCourses(),
      getUpcomingEvents(),
      getReminderPreferences(),
    ]);

  return (
    <div className="flex w-[95%]">
      {/* Left: Reading list table */}
      <div className="flex-1 min-w-0">
        <DashboardContent readingList={readingList} courses={courses} />
      </div>

      {/* Right: Reminders + Starred */}
      <div className="w-80 shrink-0 pt-8 flex flex-col gap-5">
        <RemindersPanel
          upcomingEvents={upcomingEvents}
          reminderPrefs={reminderPrefs}
          userEmail={user.email ?? ""}
        />
        <StarredPanel items={readingList} />
      </div>
    </div>
  );
}
