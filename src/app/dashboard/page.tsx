import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getReadingList } from "@/lib/supabase/readingListActions";
// import { getCourses } from "@lib/supabase/courseActions";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getCourses } from "@/lib/supabase/courseActions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch both reading list and courses
  const [readingList, courses] = await Promise.all([
    getReadingList(),
    getCourses(),
  ]);

  const fullName = user.user_metadata?.full_name as string | undefined;

  return (
    <DashboardContent
      user={user}
      fullName={fullName}
      readingList={readingList}
      courses={courses}
    />
  );
}
