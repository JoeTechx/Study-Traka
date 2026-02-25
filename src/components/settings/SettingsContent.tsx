"use client";

import { useState } from "react";
import { User, Bell, Calendar, Palette, Shield } from "lucide-react";
import { AccountTab } from "@/components/settings/AccountTab";
import { NotificationsTab } from "@/components/settings/tabs/NotificationsTab";
import { ScheduleTab } from "@/components/settings/tabs/ScheduleTab";
import { AppearanceTab } from "@/components/settings/tabs/AppearanceTab";
import { SecurityTab } from "@/components/settings/tabs/SecurityTab";
import type { ReminderPreferences } from "@/lib/supabase/reminderActions";
import type {
  SchedulePreferences,
  AppearancePreferences,
  NotificationExtras,
} from "@/lib/supabase/settingsActions";

type Tab = "account" | "notifications" | "schedule" | "appearance" | "security";

const TABS: { value: Tab; label: string; Icon: React.ElementType }[] = [
  { value: "account", label: "Account", Icon: User },
  { value: "notifications", label: "Notifications", Icon: Bell },
  { value: "schedule", label: "Schedule", Icon: Calendar },
  { value: "appearance", label: "Appearance", Icon: Palette },
  { value: "security", label: "Privacy & Security", Icon: Shield },
];

interface SettingsContentProps {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata: Record<string, any>;
  };
  reminderPrefs: ReminderPreferences | null;
  schedulePrefs: SchedulePreferences | null;
  appearancePrefs: AppearancePreferences | null;
  notifExtras: NotificationExtras | null;
}

export function SettingsContent({
  user,
  reminderPrefs,
  schedulePrefs,
  appearancePrefs,
  notifExtras,
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header + tab bar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 pt-6 pb-0 shrink-0">
        <h1 className="text-[1.15rem] font-bold text-gray-900 mb-4">
          Settings
        </h1>
        <div className="flex gap-0 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[0.78rem] sm:text-[0.82rem] font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === value
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {activeTab === "account" && <AccountTab user={user} />}
          {activeTab === "notifications" && (
            <NotificationsTab
              reminderPrefs={reminderPrefs}
              notifExtras={notifExtras}
              userEmail={user.email}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab schedulePrefs={schedulePrefs} />
          )}
          {activeTab === "appearance" && (
            <AppearanceTab appearancePrefs={appearancePrefs} />
          )}
          {activeTab === "security" && <SecurityTab user={user} />}
        </div>
      </div>
    </div>
  );
}
