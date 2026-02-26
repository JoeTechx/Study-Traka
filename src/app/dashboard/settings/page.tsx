import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only user identity is passed — SettingsContent fetches all preferences
  // client-side so switching tabs always shows the latest saved values
  return (
    <SettingsContent
      user={{
        id: user.id,
        email: user.email ?? "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        user_metadata: user.user_metadata ?? {},
      }}
    />
  );
}
