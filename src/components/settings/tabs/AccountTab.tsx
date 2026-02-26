"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera, Mail, Lock, Info, Eye, EyeOff,
  Copy, Check, User, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  updateProfile,
  updatePassword,
  updateAvatarUrl,
} from "@/lib/supabase/settingsActions";
import {
  SettingCard, CardHeader, CardBody, CardFooter,
  SectionLabel, SaveButton, InputField, Divider,
} from "@/components/settings/SettingsPrimitives";

interface AccountTabProps {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata: Record<string, any>;
  };
}

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];
const STRENGTH_TEXT  = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-green-600"];

export function AccountTab({ user }: AccountTabProps) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const meta     = user.user_metadata ?? {};

  // Profile state — initialised from real user data
  const [fullName,      setFullName]      = useState<string>(meta.full_name ?? "");
  const [username,      setUsername]      = useState<string>(meta.username  ?? "");
  const [phone,         setPhone]         = useState<string>(meta.phone     ?? "");
  const [bio,           setBio]           = useState<string>(meta.bio       ?? "");
  const [avatarUrl,     setAvatarUrl]     = useState<string>(meta.avatar_url ?? "");
  const [uploading,     setUploading]     = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [dragging,      setDragging]      = useState(false);

  // Password state
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw,    setSavingPw]    = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url      = `${data.publicUrl}?t=${Date.now()}`;

      // Save URL to auth metadata via server action
      const res = await updateAvatarUrl(url);
      if (!res.success) throw new Error(res.error);

      setAvatarUrl(url);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [supabase, user.id]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const initials = (fullName || user.email)
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // ── Save profile ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSavingProfile(true);
    const res = await updateProfile({ full_name: fullName, username, phone, bio });
    setSavingProfile(false);
    if (res.success) toast.success("Profile saved");
    else toast.error(res.error ?? "Failed to save");
  };

  // ── Save password ────────────────────────────────────────────────────────
  const strength    = getStrength(newPw);
  const pwMismatch  = confirmPw.length > 0 && newPw !== confirmPw;

  const checks = [
    { label: "8+ characters",   ok: newPw.length >= 8          },
    { label: "Uppercase letter", ok: /[A-Z]/.test(newPw)        },
    { label: "Number",           ok: /[0-9]/.test(newPw)        },
    { label: "Symbol (!@#$…)",   ok: /[^A-Za-z0-9]/.test(newPw) },
  ];

  const savePass = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (strength < 2)        { toast.error("Password is too weak");    return; }
    setSavingPw(true);
    const res = await updatePassword(newPw);
    setSavingPw(false);
    if (res.success) {
      toast.success("Password updated");
      setNewPw(""); setConfirmPw("");
    } else {
      toast.error(res.error ?? "Failed to update password");
    }
  };

  // ── Copy user ID ──────────────────────────────────────────────────────────
  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-6">

      {/* Profile */}
      <SectionLabel>Profile</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<User className="w-4 h-4 text-indigo-500" />}
          title="Personal information"
          description="Your name, username, and bio"
        />
        <CardBody className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative w-20 h-20 rounded-2xl cursor-pointer group shrink-0 transition-all
                ${dragging ? "ring-2 ring-indigo-400 ring-offset-2 scale-105" : ""}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input
            title="Upload new avatar"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div>
              <p className="text-[0.82rem] font-medium text-gray-700">Profile photo</p>
              <p className="text-[0.7rem] text-gray-400 mt-0.5">
                Click or drag & drop. JPG, PNG, WEBP — max 5MB.
              </p>
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Full name"  value={fullName}  onChange={setFullName}  placeholder="Your full name"   />
            <InputField label="Username"   value={username}  onChange={(v) => setUsername(v.toLowerCase().replace(/\s/g, "_"))} placeholder="your_username" prefix="@" hint="Letters, numbers and underscores only" />
          </div>

          <InputField label="Phone number" value={phone} onChange={setPhone} type="tel" placeholder="+234 800 000 0000" />

          <div>
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-1.5">Bio</label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Tell others a little about yourself…"
                rows={3}
                className="w-full px-3 py-2.5 text-[0.82rem] border border-gray-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
              <span className={`absolute bottom-2.5 right-3 text-[0.65rem] tabular-nums ${bio.length >= 190 ? "text-amber-500" : "text-gray-300"}`}>
                {bio.length}/200
              </span>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <SaveButton saving={savingProfile} onClick={saveProfile} />
        </CardFooter>
      </SettingCard>

      {/* Email */}
      <SectionLabel>Email address</SectionLabel>
      <SettingCard>
        <CardHeader icon={<Mail className="w-4 h-4 text-indigo-500" />} title="Email" description="Used for login and reminder notifications" />
        <CardBody>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[0.88rem] font-semibold text-gray-900">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[0.7rem] text-green-600 font-medium">Verified</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                if (error) toast.error(error.message);
                else toast.success("Email change link sent — check your inbox");
              }}
              className="px-3.5 py-2 text-[0.78rem] font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
            >
              Change email
            </button>
          </div>
        </CardBody>
      </SettingCard>

      {/* Password */}
      <SectionLabel>Security</SectionLabel>
      <SettingCard>
        <CardHeader icon={<Lock className="w-4 h-4 text-indigo-500" />} title="Change password" description="Use a strong password you don't use elsewhere" />
        <CardBody className="space-y-4">
          <InputField
            label="New password"
            value={newPw}
            onChange={setNewPw}
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            suffix={
              <button type="button" onClick={() => setShowNew(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {newPw.length > 0 && (
            <div>
              <div className="flex gap-1 mb-1.5">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_COLOR[strength] : "bg-gray-100"}`} />
                ))}
              </div>
              <p className={`text-[0.68rem] font-medium ${STRENGTH_TEXT[strength]}`}>{STRENGTH_LABEL[strength]}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-green-500" : "bg-gray-100"}`}>
                      {c.ok && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[0.68rem] ${c.ok ? "text-green-600" : "text-gray-400"}`}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InputField
            label="Confirm new password"
            value={confirmPw}
            onChange={setConfirmPw}
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            error={pwMismatch ? "Passwords do not match" : undefined}
            suffix={
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </CardBody>
        <CardFooter>
          <SaveButton saving={savingPw} onClick={savePass} label="Update password" />
        </CardFooter>
      </SettingCard>

      {/* Account info */}
      <SectionLabel>Account info</SectionLabel>
      <SettingCard>
        <CardHeader icon={<Info className="w-4 h-4 text-indigo-500" />} title="Account details" description="Read-only information about your account" />
        <CardBody>
          <div className="space-y-1">
            {[
              { label: "User ID",      value: user.id,               copy: true  },
              { label: "Member since", value: fmt(user.created_at),  copy: false },
              { label: "Last sign in", value: fmt(user.last_sign_in_at), copy: false },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-[0.75rem] text-gray-500 shrink-0">{row.label}</p>
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[0.78rem] font-medium text-gray-700 truncate font-mono">{row.value}</p>
                  {row.copy && (
                    <button type="button" onClick={copyId} className="shrink-0 text-gray-400 hover:text-indigo-500 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </SettingCard>
    </div>
  );
}