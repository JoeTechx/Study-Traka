"use client";

import { useState } from "react";
import { Palette, AlignLeft, Globe, Accessibility } from "lucide-react";
import { toast } from "sonner";
import {
  upsertAppearancePreferences,
  type AppearancePreferences,
} from "@/lib/supabase/settingsActions";
import {
  SettingCard,
  CardHeader,
  CardBody,
  CardFooter,
  SectionLabel,
  ToggleRow,
  SaveButton,
  SoonBadge,
} from "@/components/settings/SettingsPrimitives";

interface AppearanceTabProps {
  appearancePrefs: AppearancePreferences | null;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "ar", label: "العربية" },
  { value: "yo", label: "Yorùbá" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "pt", label: "Português" },
];

function ThemePreview({ theme }: { theme: string }) {
  const configs: Record<
    string,
    { sidebar: string; main: string; line1: string; line2: string; dot: string }
  > = {
    light: {
      sidebar: "bg-gray-100",
      main: "bg-white",
      dot: "bg-indigo-500",
      line1: "bg-gray-200",
      line2: "bg-gray-100",
    },
    dark: {
      sidebar: "bg-gray-800",
      main: "bg-gray-900",
      dot: "bg-indigo-400",
      line1: "bg-gray-700",
      line2: "bg-gray-800",
    },
    system: {
      sidebar: "bg-gradient-to-b from-gray-100 to-gray-800",
      main: "bg-gradient-to-b from-white to-gray-900",
      dot: "bg-indigo-500",
      line1: "bg-gray-300",
      line2: "bg-gray-600",
    },
  };
  const c = configs[theme] ?? configs.light;
  return (
    <div className="w-full h-14 rounded-lg overflow-hidden flex border border-gray-100">
      <div className={`w-6 ${c.sidebar} flex flex-col gap-1 p-1 pt-2`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 rounded-full ${i === 1 ? c.dot : c.line1} opacity-80`}
          />
        ))}
      </div>
      <div className={`flex-1 ${c.main} p-2 space-y-1`}>
        <div className={`h-1.5 w-3/4 rounded-full ${c.line1}`} />
        <div className={`h-1 w-1/2 rounded-full ${c.line2}`} />
        <div className={`h-1 w-2/3 rounded-full ${c.line2}`} />
      </div>
    </div>
  );
}

function DensityPreview({ density }: { density: string }) {
  const lines: Record<string, number[]> = {
    comfortable: [10, 7, 8],
    compact: [6, 5, 6],
    spacious: [14, 10, 12],
  };
  return (
    <div className="w-full flex flex-col gap-1 py-2">
      {(lines[density] ?? lines.comfortable).map((w, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-full transition-all duration-300"
          style={{ height: "6px", width: `${w * 10}%` }}
        />
      ))}
    </div>
  );
}

export function AppearanceTab({ appearancePrefs }: AppearanceTabProps) {
  const [theme, setTheme] = useState(appearancePrefs?.theme ?? "light");
  const [density, setDensity] = useState(
    appearancePrefs?.density ?? "comfortable",
  );
  const [language, setLanguage] = useState(appearancePrefs?.language ?? "en");
  const [fontSize, setFontSize] = useState(
    appearancePrefs?.font_size ?? "medium",
  );
  const [reduceMotion, setReduceMotion] = useState(
    appearancePrefs?.reduce_motion ?? false,
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await upsertAppearancePreferences({
      theme,
      density,
      language,
      font_size: fontSize,
      reduce_motion: reduceMotion,
    });
    setSaving(false);
    if (res.success) toast.success("Appearance saved");
    else toast.error(res.error ?? "Failed to save");
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <SectionLabel>Theme</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Palette className="w-4 h-4 text-indigo-500" />}
          title="Colour theme"
          description="Choose how StudyTraka looks"
        />
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: "Light", soon: false },
              { value: "dark", label: "Dark", soon: true },
              { value: "system", label: "System", soon: true },
            ].map(({ value, label, soon }) => (
              <button
                key={value}
                type="button"
                disabled={soon}
                onClick={() => !soon && setTheme(value)}
                className={`relative flex flex-col gap-2.5 p-3 rounded-xl border-2 transition-all text-left
                  ${soon ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  ${theme === value && !soon ? "border-indigo-500 bg-indigo-50/60" : "border-gray-100 hover:border-gray-200"}`}
              >
                <ThemePreview theme={value} />
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[0.78rem] font-semibold ${theme === value && !soon ? "text-indigo-700" : "text-gray-700"}`}
                  >
                    {label}
                  </span>
                  {soon && <SoonBadge />}
                </div>
              </button>
            ))}
          </div>
        </CardBody>
      </SettingCard>

      {/* Density */}
      <SectionLabel>Density</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<AlignLeft className="w-4 h-4 text-indigo-500" />}
          title="Interface density"
          description="How much spacing the UI uses between elements"
        />
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            {["comfortable", "compact", "spacious"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`flex flex-col gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                  density === d
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <DensityPreview density={d} />
                <span
                  className={`text-[0.75rem] font-semibold mt-1 capitalize ${density === d ? "text-indigo-700" : "text-gray-600"}`}
                >
                  {d}
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </SettingCard>

      {/* Language */}
      <SectionLabel>Language & text</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Globe className="w-4 h-4 text-indigo-500" />}
          title="Language & font size"
          description="Display language and base text size"
        />
        <CardBody className="space-y-4">
          <div>
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-2">
              Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={`px-3 py-2 rounded-xl border text-[0.75rem] font-medium transition-all text-left ${
                    language === lang.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-2">
              Font size
            </label>
            <div className="flex gap-2">
              {[
                { value: "small", label: "Small", cls: "text-xs" },
                { value: "medium", label: "Medium", cls: "text-sm" },
                { value: "large", label: "Large", cls: "text-base" },
              ].map((fs) => (
                <button
                  key={fs.value}
                  type="button"
                  onClick={() => setFontSize(fs.value)}
                  className={`flex-1 py-2.5 rounded-xl border transition-all ${
                    fontSize === fs.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-semibold ${fs.cls}`}>{fs.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </SettingCard>

      {/* Accessibility */}
      <SectionLabel>Accessibility</SectionLabel>
      <SettingCard>
        <CardHeader
          icon={<Accessibility className="w-4 h-4 text-indigo-500" />}
          title="Accessibility"
          description="Make StudyTraka work better for you"
        />
        <CardBody className="divide-y divide-gray-50">
          <ToggleRow
            label="Reduce motion"
            description="Minimise animations and transitions throughout the app"
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
          <ToggleRow
            label="High contrast"
            description="Increase colour contrast for better readability"
            checked={false}
            onChange={() => toast.info("High contrast coming soon")}
            badge={<SoonBadge />}
          />
        </CardBody>
        <CardFooter>
          <SaveButton saving={saving} onClick={save} />
        </CardFooter>
      </SettingCard>
    </div>
  );
}
