import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "sonner";
import { getCountdown } from "@/lib/supabase/countdownActions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's countdown
  const countdown = await getCountdown();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster richColors position="top-right" />
      <DashboardSidebar user={user} initialCountdown={countdown} />
      <main className="flex-1 transition-all duration-300">{children}</main>
    </div>
  );
}
