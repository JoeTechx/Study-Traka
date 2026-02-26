import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScheduleContent } from "@/components/schedule/ScheduleContent";

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
