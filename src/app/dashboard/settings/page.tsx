import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getReminderPreferences } from "@/lib/supabase/reminderActions";
import {
  getSchedulePreferences,
  getAppearancePreferences,
  getNotificationExtras,
} from "@/lib/supabase/settingsActions";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [reminderPrefs, schedulePrefs, appearancePrefs, notifExtras] =
    await Promise.all([
      getReminderPreferences(),
      getSchedulePreferences(),
      getAppearancePreferences(),
      getNotificationExtras(),
    ]);

  return (
    <SettingsContent
      user={{
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata ?? {},
      }}
      reminderPrefs={reminderPrefs}
      schedulePrefs={schedulePrefs}
      appearancePrefs={appearancePrefs}
      notifExtras={notifExtras}
    />
  );
}
