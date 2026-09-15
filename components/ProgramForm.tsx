"use client";

import { useState } from "react";
import {
  INDUSTRIES,
  ROLE_TYPES,
  type Program,
  type ProgramInput,
} from "@/lib/types";

const EMPTY: ProgramInput = {
  title: "",
  company: "",
  industry: "Investment Banking",
  roleType: "Internship",
  location: "Malaysia",
  openDate: null,
  closeDate: null,
  expectedReopen: null,
  applyLink: "",
  eligibility: null,
  notes: null,
};

export default function ProgramForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Program;
  onSubmit: (data: ProgramInput) => Promise<{ errors?: string[] } | void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<ProgramInput>(
    initial
      ? {
          title: initial.title,
          company: initial.company,
          industry: initial.industry,
          roleType: initial.roleType,
          location: initial.location,
          openDate: initial.openDate,
          closeDate: initial.closeDate,
          expectedReopen: initial.expectedReopen,
          applyLink: initial.applyLink,
          eligibility: initial.eligibility,
          notes: initial.notes,
        }
      : EMPTY
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProgramInput>(key: K, value: ProgramInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    const result = await onSubmit(form);
    setSaving(false);
    if (result?.errors?.length) setErrors(result.errors);
    else if (!initial) setForm(EMPTY); // reset after successful create
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <ul className="list-inside list-disc">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title *">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Summer Analyst — Investment Banking"
            className={inputCls}
          />
        </Field>
        <Field label="Company *">
          <input
            required
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Goldman Sachs"
            className={inputCls}
          />
        </Field>
        <Field label="Industry *">
          <select
            value={form.industry}
            onChange={(e) => set("industry", e.target.value as never)}
            className={inputCls}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role type *">
          <select
            value={form.roleType}
            onChange={(e) => set("roleType", e.target.value as never)}
            className={inputCls}
          >
            {ROLE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Kuala Lumpur"
            className={inputCls}
          />
        </Field>
        <Field label="Apply link *">
          <input
            required
            type="url"
            value={form.applyLink}
            onChange={(e) => set("applyLink", e.target.value)}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
        <Field label="Application opens">
          <input
            type="date"
            value={form.openDate ?? ""}
            onChange={(e) => set("openDate", e.target.value || null)}
            className={inputCls}
          />
        </Field>
        <Field label="Application closes">
          <input
            type="date"
            value={form.closeDate ?? ""}
            onChange={(e) => set("closeDate", e.target.value || null)}
            className={inputCls}
          />
        </Field>
        <Field label="Expected reopen (for upcoming annual cycles)">
          <input
            value={form.expectedReopen ?? ""}
            onChange={(e) => set("expectedReopen", e.target.value || null)}
            placeholder="Expected Aug 2026"
            className={inputCls}
          />
        </Field>
        <Field label="Eligibility">
          <input
            value={form.eligibility ?? ""}
            onChange={(e) => set("eligibility", e.target.value || null)}
            placeholder="Penultimate-year students"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
          rows={2}
          placeholder="Perks, cohort size, selection process…"
          className={inputCls}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
