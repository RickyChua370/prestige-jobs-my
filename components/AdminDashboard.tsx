"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeStatus, type Program, type ProgramInput } from "@/lib/types";
import { STATUS_META, formatDate } from "@/lib/format";
import ProgramForm from "./ProgramForm";

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
  const [toast, setToast] = useState<string>("");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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

  const filtered = programs.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.title} ${p.company} ${p.industry}`.toLowerCase().includes(q);
  });

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
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAdd((s) => !s);
              setEditing(null);
            }}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showAdd ? "Close form" : "+ Add programme"}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>

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
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const status = computeStatus(p);
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.company}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.industry}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_META[status].className}`}
                    >
                      {STATUS_META[status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.closeDate)}
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
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
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
