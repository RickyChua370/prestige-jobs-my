"use client";

import { useMemo, useState } from "react";
import {
  INDUSTRIES,
  ROLE_TYPES,
  STATUSES,
  computeStatus,
  pickLink,
  type Program,
  type Status,
} from "@/lib/types";
import { STATUS_META, daysUntil, formatDate } from "@/lib/format";

type SortKey = "company" | "title" | "industry" | "closeDate" | "status";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<Status, number> = { open: 0, upcoming: 1, closed: 2 };

export default function JobsTable({ programs }: { programs: Program[] }) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [roleType, setRoleType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [hideClosed, setHideClosed] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("closeDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Attach the computed (date-derived) status to each program once.
  const withStatus = useMemo(
    () => programs.map((p) => ({ ...p, _status: computeStatus(p) })),
    [programs]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = withStatus.filter((p) => {
      if (industry !== "all" && p.industry !== industry) return false;
      if (roleType !== "all" && p.roleType !== roleType) return false;
      if (status !== "all" && p._status !== status) return false;
      if (hideClosed && status === "all" && p._status === "closed") return false;
      if (q) {
        const hay = `${p.title} ${p.company} ${p.industry} ${p.location} ${
          p.eligibility ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "status":
          cmp = STATUS_ORDER[a._status] - STATUS_ORDER[b._status];
          break;
        case "closeDate": {
          // Nulls sort last regardless of direction.
          const av = a.closeDate ?? "9999-12-31";
          const bv = b.closeDate ?? "9999-12-31";
          cmp = av < bv ? -1 : av > bv ? 1 : 0;
          break;
        }
        default:
          cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [withStatus, search, industry, roleType, status, hideClosed, sortKey, sortDir]);

  const counts = useMemo(() => {
    const c = { open: 0, upcoming: 0, closed: 0 };
    withStatus.forEach((p) => (c[p._status] += 1));
    return c;
  }, [withStatus]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function resetFilters() {
    setSearch("");
    setIndustry("all");
    setRoleType("all");
    setStatus("all");
    setHideClosed(true);
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div>
      {/* Summary chips */}
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <StatChip label="Open now" value={counts.open} tone="emerald" />
        <StatChip label="Upcoming" value={counts.upcoming} tone="amber" />
        <StatChip label="Total programmes" value={programs.length} tone="brand" />
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Company, role, keyword…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All industries</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Role type
            </label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All role types</option>
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <div className="flex gap-1">
              <StatusPill
                active={status === "all"}
                onClick={() => setStatus("all")}
                label="All"
              />
              {STATUSES.map((s) => (
                <StatusPill
                  key={s}
                  active={status === s}
                  onClick={() => setStatus(s)}
                  label={STATUS_META[s].label}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={hideClosed}
              disabled={status !== "all"}
              onChange={(e) => setHideClosed(e.target.checked)}
              className="rounded border-slate-300"
            />
            Hide closed
          </label>
          <button
            onClick={resetFilters}
            className="ml-auto text-sm text-brand-600 hover:underline"
          >
            Reset filters
          </button>
        </div>
      </div>

      <p className="mb-2 text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
        of {programs.length} programmes
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <Th onClick={() => toggleSort("title")}>
                Role{sortIndicator("title")}
              </Th>
              <Th onClick={() => toggleSort("company")}>
                Company{sortIndicator("company")}
              </Th>
              <Th onClick={() => toggleSort("industry")}>
                Industry{sortIndicator("industry")}
              </Th>
              <Th onClick={() => toggleSort("status")}>
                Status{sortIndicator("status")}
              </Th>
              <th className="px-4 py-3 font-medium">Opens</th>
              <Th onClick={() => toggleSort("closeDate")}>
                Closes{sortIndicator("closeDate")}
              </Th>
              <th className="px-4 py-3 font-medium">Apply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const days = daysUntil(p.closeDate);
              const closingSoon =
                p._status === "open" && days !== null && days <= 14 && days >= 0;
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">
                      {p.roleType} · {p.location}
                    </div>
                    {p.eligibility && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {p.eligibility}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {p.company}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.industry}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p._status} />
                    {p._status === "upcoming" && p.expectedReopen && (
                      <div className="mt-1 text-xs text-slate-500">
                        {p.expectedReopen}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.openDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.closeDate)}
                    {closingSoon && (
                      <div className="text-xs font-medium text-rose-600">
                        {days === 0 ? "Closes today" : `${days} day${days === 1 ? "" : "s"} left`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const link = pickLink(p);
                      return (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ${
                            link.isApply
                              ? "bg-brand-600 text-white hover:bg-brand-700"
                              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {link.label} ↗
                        </a>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No programmes match your filters.
                  <button
                    onClick={resetFilters}
                    className="ml-1 text-brand-600 hover:underline"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-4 py-3 font-medium hover:text-brand-600"
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function StatusPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "brand";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    brand: "border-brand-100 bg-brand-50 text-brand-700",
  } as const;
  return (
    <div className={`rounded-lg border px-3 py-1.5 ${tones[tone]}`}>
      <span className="text-base font-semibold">{value}</span>{" "}
      <span className="text-xs">{label}</span>
    </div>
  );
}
