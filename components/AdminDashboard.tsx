"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { displayStatus, type Program, type ProgramInput } from "@/lib/types";
import { DISPLAY_STATUS_META, formatDate, timeAgo } from "@/lib/format";
import {
  getReviewReasons,
  summarizeReview,
  type ReviewReasonCode,
} from "@/lib/review";
import ProgramForm from "./ProgramForm";

const REASON_LABEL: Record<ReviewReasonCode, string> = {
  closed_recently: "Closed — update dates",
  reopen_due: "Reopen due",
  closing_soon: "Closing soon",
  stale: "Stale",
};

export default function AdminDashboard({
  initialPrograms,
}: {
  initialPrograms: Program[];
}) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [editing, setEditing] = useState<Program | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function refresh() {
    const res = await fetch("/api/programs");
    const json = await res.json();
    setPrograms(json.programs);
  }

  async function handleCreate(data: ProgramInput) {
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { errors: json.errors ?? ["Failed to create."] };
    await refresh();
    setShowAdd(false);
    flash("Programme added.");
  }

  async function handleUpdate(id: number, data: ProgramInput) {
    const res = await fetch(`/api/programs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { errors: json.errors ?? ["Failed to update."] };
    await refresh();
    setEditing(null);
    flash("Programme updated.");
  }

  async function handleDelete(p: Program) {
    if (!confirm(`Delete "${p.title}" at ${p.company}? This cannot be undone.`))
      return;
    const res = await fetch(`/api/programs/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      await refresh();
      flash("Programme deleted.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportErrors([]);
    const csv = await file.text();
    const res = await fetch("/api/programs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const json = await res.json().catch(() => ({}));
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      setImportErrors(json.errors ?? ["Import failed."]);
      return;
    }
    await refresh();
    setImportOpen(false);
    const o = json.outcome;
    const parts = [`${o.created} added`, `${o.updated} updated`];
    if (o.skippedMissingIds?.length)
      parts.push(`${o.skippedMissingIds.length} skipped (unknown id)`);
    flash(`Import complete: ${parts.join(", ")}.`);
  }

  const summary = useMemo(() => summarizeReview(programs), [programs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (q && !`${p.title} ${p.company} ${p.industry}`.toLowerCase().includes(q))
        return false;
      if (reviewOnly && getReviewReasons(p).length === 0) return false;
      return true;
    });
  }, [programs, search, reviewOnly]);

  return (
    <div>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {programs.length} programmes in the database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowAdd((s) => !s);
              setEditing(null);
            }}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showAdd ? "Close form" : "+ Add programme"}
          </button>
          <a
            href="/api/programs/export"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ↓ Export CSV
          </a>
          <button
            onClick={() => {
              setImportOpen((s) => !s);
              setImportErrors([]);
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ↑ Import CSV
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Needs-review banner */}
      {summary.needsReview > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-amber-900">
                {summary.needsReview} programme
                {summary.needsReview === 1 ? "" : "s"} need review
              </span>
              <span className="ml-2 text-sm text-amber-800">
                {summary.byCode.closed_recently > 0 &&
                  `${summary.byCode.closed_recently} closed · `}
                {summary.byCode.reopen_due > 0 &&
                  `${summary.byCode.reopen_due} reopen due · `}
                {summary.byCode.closing_soon > 0 &&
                  `${summary.byCode.closing_soon} closing soon · `}
                {summary.byCode.stale > 0 && `${summary.byCode.stale} stale`}
              </span>
            </div>
            <button
              onClick={() => setReviewOnly((v) => !v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                reviewOnly
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "border border-amber-400 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {reviewOnly ? "Showing flagged only" : "Show flagged only"}
            </button>
          </div>
        </div>
      )}

      {/* Import panel */}
      {importOpen && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold">Import from CSV</h2>
          <p className="mb-3 text-sm text-slate-500">
            Upload a CSV to add or update many programmes at once. Rows with an{" "}
            <code className="rounded bg-slate-100 px-1">id</code> update that
            programme; rows with a blank id create a new one.{" "}
            <a
              href="/api/programs/export"
              className="text-brand-600 hover:underline"
            >
              Export first
            </a>{" "}
            to get a correctly-formatted template. If any row is invalid the
            whole import is rejected — nothing is changed.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
            className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
          {importing && (
            <p className="mt-2 text-sm text-slate-500">Importing…</p>
          )}
          {importErrors.length > 0 && (
            <div className="mt-3 max-h-48 overflow-auto rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p className="mb-1 font-medium">
                Import rejected — please fix these and try again:
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                {importErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Add a programme</h2>
          <ProgramForm onSubmit={handleCreate} submitLabel="Add programme" />
        </div>
      )}

      {editing && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/40 p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Edit: {editing.title} — {editing.company}
          </h2>
          <ProgramForm
            initial={editing}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={(data) => handleUpdate(editing.id, data)}
          />
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by company, role or industry…"
        className="mb-3 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Role / Company</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Closes</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const status = displayStatus(p);
              const reasons = getReviewReasons(p);
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.company}</div>
                    {reasons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {reasons.map((r) => (
                          <span
                            key={r.code}
                            title={r.message}
                            className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20"
                          >
                            ⚑ {REASON_LABEL[r.code]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.industry}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${DISPLAY_STATUS_META[status].className}`}
                    >
                      {DISPLAY_STATUS_META[status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.closeDate)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {timeAgo(p.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setShowAdd(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No programmes match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
