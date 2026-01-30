import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster richColors position="top-right" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back{fullName ? `, ${fullName}` : ""}!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          You are successfully authenticated. Your StudyTraka dashboard is ready.
        </p>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-700">
            User ID: <code className="bg-gray-100 px-2 py-1 rounded">{user.id}</code>
          </p>
          <p className="mt-2 text-gray-700">
            Email: <code className="bg-gray-100 px-2 py-1 rounded">{user.email}</code>
          </p>
          <p className="mt-2 text-gray-700">
            fullname: <code className="bg-gray-100 px-2 py-1 rounded">{fullName}</code>
          </p>
        </div>
      </div>
    </div>
  );
}