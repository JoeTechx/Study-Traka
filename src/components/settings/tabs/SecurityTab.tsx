"use client";

import { useState } from "react";
import {
  Shield,
  Monitor,
  LogOut,
  Lock,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  SettingCard,
  CardHeader,
  CardBody,
  CardFooter,
  SectionLabel,
  SoonBadge,
  Divider,
} from "@/components/settings/SettingsPrimitives";

interface SecurityTabProps {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata: Record<string, any>;
  };
}

function getDeviceInfo() {
  if (typeof window === "undefined")
    return { browser: "Browser", os: "Device" };
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : "Browser";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
      ? "macOS"
      : ua.includes("Linux")
        ? "Linux"
        : ua.includes("Android")
          ? "Android"
          : ua.includes("iPhone")
            ? "iOS"
            : "Device";
  return { browser, os };
}

export function SecurityTab({ user }: SecurityTabProps) {
  const supabase = createClient();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { browser, os } = getDeviceInfo();

  const lastActive = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  const DELETE_PHRASE = "delete my account";
  const canDelete = deleteConfirm === DELETE_PHRASE;

  // ── Sign out all devices ──────────────────────────────────────────────────
  const signOutAll = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast.error(error.message);
      setSigningOut(false);
    } else {
      toast.success("Signed out from all devices");
      window.location.href = "/login";
    }
  };

  // ── Export data ───────────────────────────────────────────────────────────
  const exportData = async () => {
    setExporting(true);
    try {
      const [eventsRes, prefsRes] = await Promise.all([
        supabase.from("schedule_events").select("*").eq("user_id", user.id),
        supabase
          .from("reminder_preferences")
          .select("*")
          .eq("user_id", user.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email, created_at: user.created_at },
        schedule_events: eventsRes.data ?? [],
        reminder_preferences: prefsRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studytraka-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported!");
    } catch (err: any) {
      toast.error(err.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const deleteAccount = async () => {
    if (!canDelete) return;
    // Full deletion requires a Supabase Edge Function with service_role key.
    // For now show a clear message.
    toast.error("Account deletion requires contacting support@studytraka.com");
  };

  return (
    <div className="space-y-6">
      {/* Current session */}
      <SectionLabel>Active session</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Monitor className="w-4 h-4 text-indigo-500" />}
          title="Current session"
          description="The device and browser you are signed in from right now"
        />
        <CardBody>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[0.85rem] font-semibold text-gray-800">
                  {browser} on {os}
                </p>
                <p className="text-[0.7rem] text-gray-400 mt-0.5">
                  Last active: {lastActive}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[0.7rem] font-semibold text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          </div>
        </CardBody>
        <CardFooter>
          <button
            type="button"
            onClick={signOutAll}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2 text-[0.78rem] font-medium text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            {signingOut ? "Signing out…" : "Sign out all devices"}
          </button>
        </CardFooter>
      </SettingCard>

      {/* 2FA */}
      <SectionLabel>Two-factor authentication</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Shield className="w-4 h-4 text-indigo-500" />}
          title="2FA methods"
          description="Add a second layer of security to your account"
        />
        <CardBody>
          {[
            {
              Icon: Smartphone,
              label: "Authenticator app",
              desc: "TOTP via Google Authenticator or Authy",
            },
            {
              Icon: Lock,
              label: "SMS verification",
              desc: "One-time codes sent to your phone",
            },
          ].map(({ Icon, label, desc }, i) => (
            <div key={label}>
              {i > 0 && <Divider />}
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[0.83rem] font-medium text-gray-700">
                        {label}
                      </p>
                      <SoonBadge />
                    </div>
                    <p className="text-[0.7rem] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 text-[0.72rem] font-medium border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                >
                  Set up
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </SettingCard>

      {/* Data export */}
      <SectionLabel>Data</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Download className="w-4 h-4 text-indigo-500" />}
          title="Export your data"
          description="Download all your StudyTraka data as a JSON file"
        />
        <CardBody>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[0.82rem] text-gray-700">
                Includes schedule events, reminder preferences, and account
                info.
              </p>
              <p className="text-[0.7rem] text-gray-400 mt-1">
                The file will download immediately to your device.
              </p>
            </div>
            <button
              type="button"
              onClick={exportData}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-[0.78rem] font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting…" : "Export data"}
            </button>
          </div>
        </CardBody>
      </SettingCard>

      {/* Danger zone */}
      <SectionLabel>Danger zone</SectionLabel>
      <SettingCard className="border-red-100">
        <button
          type="button"
          onClick={() => setDangerOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-left">
              <p className="text-[0.88rem] font-semibold text-red-700">
                Delete account
              </p>
              <p className="text-[0.7rem] text-red-400 mt-0.5">
                Permanently remove your account and all data
              </p>
            </div>
          </div>
          {dangerOpen ? (
            <ChevronUp className="w-4 h-4 text-red-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-400" />
          )}
        </button>

        {dangerOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-red-100 pt-4">
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[0.78rem] font-semibold text-red-700">
                  This action is irreversible
                </p>
                <ul className="text-[0.7rem] text-red-600 space-y-0.5 list-disc list-inside">
                  <li>All your schedule events will be deleted</li>
                  <li>Your courses and reading list will be deleted</li>
                  <li>Your reminder preferences will be deleted</li>
                  <li>Your account cannot be recovered</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-[0.75rem] font-medium text-gray-600 mb-1.5">
                Type{" "}
                <span className="font-mono font-bold text-red-600">
                  {DELETE_PHRASE}
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={DELETE_PHRASE}
                className={`w-full px-3 py-2.5 text-[0.82rem] border rounded-xl outline-none transition-all font-mono
                  ${
                    canDelete
                      ? "border-red-500 bg-red-50/60 focus:ring-2 focus:ring-red-300 text-red-700"
                      : "border-gray-200 focus:ring-2 focus:ring-gray-200"
                  }`}
              />
            </div>

            <button
              type="button"
              onClick={deleteAccount}
              disabled={!canDelete}
              className={`w-full py-2.5 rounded-xl text-[0.82rem] font-semibold transition-all ${
                canDelete
                  ? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Delete my account permanently
            </button>
          </div>
        )}
      </SettingCard>
    </div>
  );
}
