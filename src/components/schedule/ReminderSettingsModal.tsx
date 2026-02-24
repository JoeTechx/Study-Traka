"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  Bell,
  BellOff,
  Clock,
  Info,
  MonitorSmartphone,
} from "lucide-react";
import type { ReminderPreferences } from "@/lib/supabase/reminderActions";
import { upsertReminderPreferences } from "@/lib/supabase/reminderActions";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const TIMING_OPTIONS = [
  { label: "5 min before", value: 5 },
  { label: "10 min before", value: 10 },
  { label: "15 min before", value: 15 },
  { label: "30 min before", value: 30 },
  { label: "1 hr before", value: 60 },
  { label: "2 hrs before", value: 120 },
  { label: "1 day before", value: 1440 },
  { label: "Custom", value: -1 },
];

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      title="Toggle"
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? "bg-indigo-500" : "bg-gray-200"}`}
      style={{ width: "2.25rem", height: "1.25rem" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(1rem)" : "translateX(0)" }}
      />
    </button>
  );
}

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ReminderPreferences | null;
  userEmail: string;
}

export function ReminderSettingsModal({
  isOpen,
  onClose,
  preferences,
  userEmail,
}: ReminderSettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications();

  const [form, setForm] = useState({
    email_enabled: true,
    web_push_enabled: false,
    email_override: "",
    default_minutes_before: 30,
    custom_minutes: "",
  });
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    const isPreset = TIMING_OPTIONS.some(
      (o) => o.value === preferences.default_minutes_before && o.value !== -1,
    );
    setShowCustom(!isPreset);
    setForm({
      email_enabled: preferences.email_enabled,
      web_push_enabled: preferences.web_push_enabled,
      email_override: preferences.email_override ?? "",
      default_minutes_before: preferences.default_minutes_before,
      custom_minutes: !isPreset
        ? String(preferences.default_minutes_before)
        : "",
    });
  }, [preferences, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleTimingSelect = (val: number) => {
    if (val === -1) {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      set("default_minutes_before", val);
      set("custom_minutes", "");
    }
  };

  const handleWebPushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (pushStatus === "denied") {
        toast.error(
          "Notifications are blocked. Go to browser Settings → Notifications → Allow for this site.",
        );
        return;
      }
      if (pushStatus === "unsupported") {
        toast.error(
          "Your browser does not support push notifications. Try Chrome or Edge.",
        );
        return;
      }
      const ok = await subscribe();
      if (ok) set("web_push_enabled", true);
    } else {
      const ok = await unsubscribe();
      if (ok) set("web_push_enabled", false);
    }
  };

  const handleSave = async () => {
    if (!form.email_enabled && !form.web_push_enabled) {
      toast.error("Please enable at least one reminder channel");
      return;
    }

    const minutesBefore = showCustom
      ? parseInt(form.custom_minutes, 10)
      : form.default_minutes_before;

    if (isNaN(minutesBefore) || minutesBefore < 1) {
      toast.error("Please enter a valid reminder time");
      return;
    }

    setSaving(true);
    const result = await upsertReminderPreferences({
      email_enabled: form.email_enabled,
      web_push_enabled: form.web_push_enabled,
      email_override: form.email_override.trim() || null,
      default_minutes_before: minutesBefore,
    });

    if (result.success) {
      toast.success("Reminder preferences saved");
      onClose();
    } else {
      toast.error(result.error ?? "Failed to save");
    }
    setSaving(false);
  };

  const currentTiming = showCustom ? -1 : form.default_minutes_before;
  const pushIsGranted = pushStatus === "granted";
  const pushIsLoading = pushStatus === "loading";

  const pushStatusLabel: Record<string, string> = {
    unsupported: "Not supported in this browser",
    denied: "Blocked — allow in browser settings",
    granted: "Active on this device",
    default: "Click to enable",
    loading: "Checking…",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-[0.92rem] font-semibold text-gray-900">
                Reminder Settings
              </h2>
              <p className="text-[0.68rem] text-gray-400 mt-0.5">
                Email & browser notifications
              </p>
            </div>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Channels */}
          <section>
            <h3 className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Notification Channels
            </h3>
            <div className="space-y-2.5">
              {/* Email */}
              <div
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                  form.email_enabled
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.82rem] font-semibold text-gray-800">
                      Email
                    </p>
                    <Toggle
                      checked={form.email_enabled}
                      onChange={(v) => set("email_enabled", v)}
                    />
                  </div>
                  <p className="text-[0.68rem] text-gray-400 mt-0.5 truncate">
                    Sends to{" "}
                    <span className="font-medium text-gray-600">
                      {form.email_override || userEmail}
                    </span>
                  </p>
                  {form.email_enabled && (
                    <input
                      type="email"
                      value={form.email_override}
                      onChange={(e) => set("email_override", e.target.value)}
                      placeholder="Use a different email (optional)"
                      className="mt-2 w-full px-2.5 py-1.5 text-[0.75rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-gray-300"
                    />
                  )}
                </div>
              </div>

              {/* Browser push */}
              <div
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                  pushStatus === "denied"
                    ? "border-red-100 bg-red-50/40"
                    : pushIsGranted && form.web_push_enabled
                      ? "border-violet-200 bg-violet-50/50"
                      : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  {pushStatus === "denied" ? (
                    <BellOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <MonitorSmartphone className="w-4 h-4 text-violet-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.82rem] font-semibold text-gray-800">
                      Browser notification
                    </p>
                    <Toggle
                      checked={pushIsGranted && form.web_push_enabled}
                      onChange={handleWebPushToggle}
                      disabled={pushIsLoading || pushStatus === "unsupported"}
                    />
                  </div>
                  <p
                    className={`text-[0.68rem] mt-0.5 ${pushStatus === "denied" ? "text-red-400" : "text-gray-400"}`}
                  >
                    {pushStatusLabel[pushStatus] ?? "Click to enable"}
                  </p>
                  {pushStatus === "denied" && (
                    <p className="mt-1.5 text-[0.65rem] text-amber-600 flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      Open browser Settings → Privacy & Security → Notifications
                      → Allow for this site
                    </p>
                  )}
                  {pushStatus === "unsupported" && (
                    <p className="mt-1 text-[0.65rem] text-gray-400 flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      Use Chrome, Edge, or Firefox on desktop for browser
                      notifications.
                    </p>
                  )}
                  {pushIsGranted && form.web_push_enabled && (
                    <p className="mt-1 text-[0.65rem] text-violet-500 font-medium">
                      ✓ Notifications will appear even when the tab is in the
                      background
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Timing */}
          <section>
            <h3 className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              <Clock className="w-3 h-3 inline mr-1.5" />
              Default Reminder Time
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TIMING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTimingSelect(opt.value)}
                  className={`px-3 py-2.5 rounded-xl border text-[0.75rem] font-medium text-left transition-all ${
                    currentTiming === opt.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {showCustom && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={form.custom_minutes}
                  onChange={(e) => set("custom_minutes", e.target.value)}
                  placeholder="e.g. 45"
                  className="flex-1 px-3 py-2 text-[0.8rem] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-[0.75rem] text-gray-500 shrink-0">
                  minutes before
                </span>
              </div>
            )}
            <p className="mt-2 text-[0.67rem] text-gray-400">
              All your events will be reminded at this time before they start.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[0.8rem] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-[0.8rem] font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}