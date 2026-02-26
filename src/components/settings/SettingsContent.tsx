"use client";

import { useState, useEffect } from "react";
import { User, Calendar, Bell, Palette, Shield } from "lucide-react";
import { AccountTab } from "@/components/settings/tabs/AccountTab";
import { ScheduleTab } from "@/components/settings/tabs/ScheduleTab";
import { NotificationsTab } from "@/components/settings/tabs/NotificationsTab";
import { AppearanceTab } from "@/components/settings/tabs/AppearanceTab";
import { SecurityTab } from "@/components/settings/tabs/SecurityTab";
import {
  getSchedulePreferences,
  getAppearancePreferences,
  getNotificationExtras,
  type SchedulePreferences,
  type AppearancePreferences,
  type NotificationExtras,
} from "@/lib/supabase/settingsActions";
import {
  getReminderPreferences,
  type ReminderPreferences,
} from "@/lib/supabase/reminderActions";

interface SettingsContentProps {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    user_metadata: Record<string, any>;
  };
}

type TabValue =
  | "profile"
  | "schedule"
  | "notifications"
  | "appearance"
  | "security";

const TABS: { value: TabValue; label: string; Icon: React.ElementType }[] = [
  { value: "profile", label: "Profile", Icon: User },
  { value: "schedule", label: "Schedule", Icon: Calendar },
  { value: "notifications", label: "Notifications", Icon: Bell },
  { value: "appearance", label: "Appearance", Icon: Palette },
  { value: "security", label: "Security", Icon: Shield },
];

export function SettingsContent({ user }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("profile");
  const [schedulePrefs, setSchedulePrefs] =
    useState<SchedulePreferences | null>(null);
  const [appearancePrefs, setAppearancePrefs] =
    useState<AppearancePreferences | null>(null);
  const [notificationExtras, setNotificationExtras] =
    useState<NotificationExtras | null>(null);
  const [reminderPrefs, setReminderPrefs] =
    useState<ReminderPreferences | null>(null);

  // Fetch all preferences on mount
  useEffect(() => {
    async function fetchPrefs() {
      const [schedule, appearance, notifications, reminders] =
        await Promise.all([
          getSchedulePreferences(),
          getAppearancePreferences(),
          getNotificationExtras(),
          getReminderPreferences(),
        ]);
      setSchedulePrefs(schedule);
      setAppearancePrefs(appearance);
      setNotificationExtras(notifications);
      setReminderPrefs(reminders);
    }
    fetchPrefs();
  }, []);

  // Re-fetch preferences when switching tabs to ensure fresh data
  useEffect(() => {
    async function refetchPrefs() {
      if (activeTab === "schedule") {
        const prefs = await getSchedulePreferences();
        setSchedulePrefs(prefs);
      } else if (activeTab === "appearance") {
        const prefs = await getAppearancePreferences();
        setAppearancePrefs(prefs);
      } else if (activeTab === "notifications") {
        const [extras, reminders] = await Promise.all([
          getNotificationExtras(),
          getReminderPreferences(),
        ]);
        setNotificationExtras(extras);
        setReminderPrefs(reminders);
      }
    }
    refetchPrefs();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-5 shrink-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-[0.8rem] sm:text-[0.85rem] text-gray-500 mt-1">
            Manage your account, preferences, and security
          </p>
        </div>
      </div>

      {/* Tabs & content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-0 sm:gap-6 p-0 sm:p-6">
          {/* Tab navigation */}
          <nav className="shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-100 sm:rounded-xl overflow-x-auto sm:overflow-visible">
            <div className="flex gap-0.5 sm:gap-1 p-2 sm:p-3 sm:w-48">
              {TABS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={` cursor-pointer flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[0.75rem] sm:text-[0.82rem] font-medium transition-all whitespace-nowrap ${
                    activeTab === value
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">{label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto bg-white sm:rounded-xl border-t sm:border border-gray-100 p-4 sm:p-6">
            {activeTab === "profile" && (
              <AccountTab
                user={{
                  ...user,
                  last_sign_in_at: user.last_sign_in_at ?? undefined,
                }}
              />
            )}
            {activeTab === "schedule" && (
              <ScheduleTab
                schedulePrefs={schedulePrefs}
                userEmail={user.email}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab
                reminderPrefs={reminderPrefs}
                notifExtras={notificationExtras}
                userEmail={user.email}
              />
            )}
            {activeTab === "appearance" && (
              <AppearanceTab appearancePrefs={appearancePrefs} />
            )}
            {activeTab === "security" && (
              <SecurityTab
                user={{
                  ...user,
                  last_sign_in_at: user.last_sign_in_at ?? undefined,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
