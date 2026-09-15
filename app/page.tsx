import JobsTable from "@/components/JobsTable";
import { listPrograms } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const programs = await listPrograms();

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          The prestige shortlist for Malaysia&apos;s next graduates
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Every summer internship, management trainee scheme and graduate
          programme worth your time — from investment banks and consulting firms
          to FMCG giants and Big Tech — compiled in one place. Track what&apos;s{" "}
          <span className="font-medium text-emerald-700">open now</span> and
          what&apos;s{" "}
          <span className="font-medium text-amber-700">expected to reopen</span>.
        </p>
      </section>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">
            No programmes yet. Run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
              npm run seed
            </code>{" "}
            to load the curated list, or add programmes via the{" "}
            <a href="/admin" className="text-brand-600 hover:underline">
              admin panel
            </a>
            .
          </p>
        </div>
      ) : (
        <JobsTable programs={programs} />
      )}
    </div>
  );
}
