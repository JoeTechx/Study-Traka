"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

// ── Settings card ─────────────────────────────────────────────────────────────
export function SettingCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ── Card header ───────────────────────────────────────────────────────────────
export function CardHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-50 flex items-start gap-3">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      <div>
        <p className="text-[0.88rem] font-semibold text-gray-900">{title}</p>
        {description && (
          <p className="text-[0.72rem] text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ── Card body ─────────────────────────────────────────────────────────────────
export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

// ── Card footer ───────────────────────────────────────────────────────────────
export function CardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-end gap-3">
      {children}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? "1.875rem" : "2.25rem";
  const h = size === "sm" ? "1.125rem" : "1.25rem";
  const dotSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const translateX = size === "sm" ? "0.75rem" : "1rem";

  return (
    <button
      title="Toggle switch"
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
        disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? "bg-indigo-500" : "bg-gray-200"}`}
      style={{ width: w, height: h }}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${dotSize} bg-white rounded-full shadow transition-transform duration-200`}
        style={{
          transform: checked ? `translateX(${translateX})` : "translateX(0)",
        }}
      />
    </button>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[0.83rem] font-medium text-gray-800">{label}</p>
          {badge}
        </div>
        {description && (
          <p className="text-[0.7rem] text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── Save button ───────────────────────────────────────────────────────────────
export function SaveButton({
  saving,
  onClick,
  label = "Save changes",
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[0.8rem] font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
    >
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {saving ? "Saving…" : label}
    </button>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────
export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  readOnly = false,
  hint,
  error,
  suffix,
  prefix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-[0.75rem] font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.8rem] text-gray-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          className={`w-full px-3 py-2.5 text-[0.82rem] border rounded-xl outline-none transition-all
            ${prefix ? "pl-7" : ""}
            ${suffix ? "pr-10" : ""}
            ${
              readOnly
                ? "bg-gray-50 border-gray-100 text-gray-500 cursor-default"
                : error
                  ? "border-red-300 bg-red-50/40 focus:ring-2 focus:ring-red-300"
                  : "border-gray-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[0.68rem] text-red-500 mt-1">{error}</p>}
      {hint && !error && (
        <p className="text-[0.68rem] text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

// ── Select field ──────────────────────────────────────────────────────────────
export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[0.75rem] font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[0.82rem] border border-gray-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[0.68rem] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="border-t border-gray-100 my-1" />;
}

// ── Coming soon badge ─────────────────────────────────────────────────────────
export function SoonBadge() {
  return (
    <span className="px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
      Soon
    </span>
  );
}
