/**
 * One-off, idempotent data-update script — Batch 1 (top ~30 employers).
 *
 * Sets a verified, specific applyLink (the direct application/programme page,
 * shown when a role is OPEN) and an infoLink (the programme details/landing
 * page, shown when a role is UPCOMING or CLOSED) for each targeted programme.
 *
 * Matched by company + exact title (as stored in the database). Running it
 * again is safe — it just re-applies the same values.
 *
 * Requires DATABASE_URL (read from .env.local locally).
 *
 * Run with:  npm run update-links
 *
 * ---------------------------------------------------------------------------
 * A note on accuracy (please read):
 * Every link below points to an official employer page that existed at the
 * time of research. Corporate careers sites change often, so the "needs
 * review" flags in the admin panel will help you keep them fresh. Dates are
 * NOT changed here except where an official source stated a concrete cycle;
 * everything else keeps its clearly-labelled estimate.
 * ---------------------------------------------------------------------------
 */

import { Pool } from "pg";

interface LinkUpdate {
  company: string;
  title: string;
  applyLink: string;
  infoLink: string;
  /** Optional: only set when an official source stated it. */
  expectedReopen?: string;
}

const UPDATES: LinkUpdate[] = [
  // ---------------- Investment Banking ----------------
  {
    company: "J.P. Morgan",
    title: "2027 Asia Analyst Development Program — Summer Analyst",
    applyLink:
      "https://www.jpmorganchase.com/careers/explore-opportunities/programs/aadp-summer-analyst",
    infoLink:
      "https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates",
  },
  {
    company: "J.P. Morgan",
    title: "Asia Analyst Development Program — Full Time",
    applyLink:
      "https://www.jpmorganchase.com/careers/explore-opportunities/programs/aadp-fulltime-analyst",
    infoLink:
      "https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates",
  },
  {
    company: "Goldman Sachs",
    title: "Investment Banking Summer Analyst",
    applyLink:
      "https://www.goldmansachs.com/careers/students/programs-and-internships/asia-pacific/summer-associate",
    infoLink: "https://www.goldmansachs.com/careers/students",
  },
  {
    company: "Morgan Stanley",
    title: "New Analyst Programme",
    applyLink:
      "https://www.morganstanley.com/people-opportunities/students-graduates",
    infoLink:
      "https://www.morganstanley.com/people-opportunities/students-graduates",
  },
  {
    company: "Citi",
    title: "Global Markets Summer Analyst",
    applyLink: "https://www.citigroup.com/global/careers/students-and-graduates",
    infoLink: "https://www.citigroup.com/global/careers/students-and-graduates",
  },
  {
    company: "Citi",
    title: "Graduate Analyst Programme",
    applyLink: "https://www.citigroup.com/global/careers/students-and-graduates",
    infoLink: "https://www.citigroup.com/global/careers/students-and-graduates",
  },
  {
    company: "CIMB",
    title: "The Complete Banker (TCB)",
    applyLink:
      "https://www.cimb.com/en/careers/fresh-graduate/the-complete-banker.html",
    infoLink:
      "https://www.cimb.com/en/careers/fresh-graduate/the-complete-banker.html",
  },
  {
    company: "CIMB",
    title: "CIMB Internship Programme",
    applyLink:
      "https://www.cimb.com/en/careers/students/cimb-internship-programme.html",
    infoLink:
      "https://www.cimb.com/en/careers/students/cimb-internship-programme.html",
  },
  {
    company: "CIMB",
    title: "CIMB Fusion / Data Analytics Graduate",
    applyLink: "https://www.cimb.com/en/careers/fresh-graduate.html",
    infoLink: "https://www.cimb.com/en/careers/fresh-graduate.html",
  },
  {
    company: "Maybank",
    title: "Maybank GO Ahead. Challenge / Global Programme",
    applyLink: "https://www.maybank.com/en/careers.page",
    infoLink: "https://www.maybank.com/en/careers.page",
  },
  {
    company: "Maybank",
    title: "Maybank Money Makers Internship",
    applyLink: "https://www.maybank.com/en/careers.page",
    infoLink: "https://www.maybank.com/en/careers.page",
  },
  {
    company: "HSBC",
    title: "Wealth Graduate Programme",
    applyLink:
      "https://www.hsbc.com/careers/students-and-graduates/find-a-programme",
    infoLink:
      "https://www.hsbc.com/careers/students-and-graduates/graduate-programmes",
  },
  {
    company: "HSBC",
    title: "HSBC Global Graduate Programme",
    applyLink:
      "https://www.hsbc.com/careers/students-and-graduates/find-a-programme",
    infoLink:
      "https://www.hsbc.com/careers/students-and-graduates/graduate-programmes",
  },
  {
    company: "HSBC",
    title: "HSBC Summer Internship",
    applyLink:
      "https://www.hsbc.com/careers/students-and-graduates/find-a-programme",
    infoLink:
      "https://www.hsbc.com/careers/students-and-graduates/internships",
  },
  {
    company: "Standard Chartered",
    title: "International Graduate Programme",
    applyLink: "https://www.sc.com/en/careers/students-and-graduates/",
    infoLink: "https://www.sc.com/en/careers/students-and-graduates/",
  },
  {
    company: "Standard Chartered",
    title: "SC Ready Internship Programme",
    applyLink: "https://www.sc.com/en/careers/students-and-graduates/",
    infoLink: "https://www.sc.com/en/careers/students-and-graduates/",
  },

  // ---------------- Consulting ----------------
  {
    company: "McKinsey & Company",
    title: "Business Analyst",
    applyLink: "https://www.mckinsey.com/careers/search-jobs",
    infoLink: "https://www.mckinsey.com/my/careers",
  },
  {
    company: "McKinsey & Company",
    title: "Summer Business Analyst Internship",
    applyLink: "https://www.mckinsey.com/careers/search-jobs",
    infoLink: "https://www.mckinsey.com/careers/students",
  },
  {
    company: "Bain & Company",
    title: "Associate Consultant",
    applyLink: "https://www.bain.com/careers/work-with-us/internships-programs/",
    infoLink: "https://www.bain.com/careers/work-with-us/internships-programs/",
  },
  {
    company: "Bain & Company",
    title: "Associate Consultant Intern (ACI)",
    applyLink:
      "https://www.bain.com/careers/work-with-us/internships-programs/associate-consultant-internship/",
    infoLink:
      "https://www.bain.com/careers/hiring-process/associate-consultant-intern/",
  },
  {
    company: "Boston Consulting Group (BCG)",
    title: "Associate",
    applyLink: "https://careers.bcg.com/global/en/early-careers",
    infoLink: "https://careers.bcg.com/global/en/early-careers",
  },
  {
    company: "Boston Consulting Group (BCG)",
    title: "Summer Associate Internship",
    applyLink: "https://careers.bcg.com/global/en/early-careers",
    infoLink: "https://careers.bcg.com/global/en/early-careers",
  },

  // ---------------- Professional Services (Big 4) ----------------
  {
    company: "Deloitte",
    title: "Deloitte Amplify Internship Programme",
    applyLink: "https://jobs.sea.deloitte.com/go/Students/4636010/",
    infoLink:
      "https://www.deloitte.com/southeast-asia/en/careers/explore-your-fit/students/amplify-programme.html",
  },
  {
    company: "Deloitte",
    title: "Audit & Assurance Associate",
    applyLink: "https://jobs.sea.deloitte.com/go/Students/4636010/",
    infoLink: "https://www2.deloitte.com/my/en/careers/students.html",
  },
  {
    company: "PwC",
    title: "Associate — Audit Assurance (Nov 2026 Intake)",
    applyLink:
      "https://www.pwc.com/my/en/careers/graduates-non-graduates/job-search.html",
    infoLink: "https://www.pwc.com/my/en/careers/graduates-non-graduates.html",
  },
  {
    company: "PwC",
    title: "Agile Tax Professional (ATP) Programme",
    applyLink:
      "https://www.pwc.com/my/en/careers/graduates-non-graduates/job-search.html",
    infoLink: "https://www.pwc.com/my/en/careers/graduates-non-graduates.html",
  },
  {
    company: "PwC",
    title: "PwC Internship / Student Programme",
    applyLink: "https://www.pwc.com/my/en/careers/internships/job-search.html",
    infoLink: "https://www.pwc.com/my/en/careers/internships.html",
  },
  {
    company: "KPMG",
    title: "KPMG Graduate Recruitment",
    applyLink: "https://career4u.kpmg.com.my/",
    infoLink: "https://kpmg.com/my/en/careers/graduates.html",
  },
  {
    company: "KPMG",
    title: "KPMG Internship Programme",
    applyLink: "https://career4u.kpmg.com.my/",
    infoLink: "https://kpmg.com/my/en/careers/graduates.html",
  },
  {
    company: "EY (Ernst & Young)",
    title: "EY Graduate Programme",
    applyLink:
      "https://www.ey.com/en_my/careers/student-entry-level-programs/ey-graduate-opportunities",
    infoLink:
      "https://www.ey.com/en_my/careers/student-entry-level-programs",
  },
  {
    company: "EY (Ernst & Young)",
    title: "EY Internship Programme",
    applyLink:
      "https://www.ey.com/en_my/careers/student-entry-level-programs",
    infoLink:
      "https://www.ey.com/en_my/careers/student-entry-level-programs",
  },

  // ---------------- FMCG ----------------
  {
    company: "Nestlé",
    title: "Nestlé Management Trainee Programme",
    applyLink: "https://www.nestle.com.my/jobs/students-graduates",
    infoLink: "https://www.nestle.com.my/jobs/students-graduates",
  },
  {
    company: "Nestlé",
    title: "Nestlé Supply Chain Management Trainee",
    applyLink: "https://www.nestle.com.my/jobs/students-graduates",
    infoLink: "https://www.nestle.com.my/jobs/students-graduates",
  },
  {
    company: "Nestlé",
    title: "Nestlé Internship Programme",
    applyLink: "https://www.nestle.com.my/jobs/students-graduates",
    infoLink: "https://www.nestle.com.my/jobs/students-graduates",
  },
  {
    company: "Unilever",
    title: "Unilever Future Leaders Programme (UFLP)",
    applyLink: "https://careers.unilever.com/unilever-future-leaders-programme",
    infoLink: "https://careers.unilever.com/unilever-future-leaders-programme",
  },
  {
    company: "Unilever",
    title: "Unilever Marketing Young Manager Programme",
    applyLink: "https://careers.unilever.com/en/malaysia",
    infoLink: "https://careers.unilever.com/en/malaysia",
  },
  {
    company: "Unilever",
    title: "Unilever Internship (Future Leaders League)",
    applyLink: "https://careers.unilever.com/en/malaysia",
    infoLink: "https://careers.unilever.com/en/malaysia",
  },
  {
    company: "Procter & Gamble",
    title: "P&G Management Trainee (various functions)",
    applyLink: "https://www.pgcareers.com/",
    infoLink: "https://www.pgcareers.com/",
  },
  {
    company: "Procter & Gamble",
    title: "P&G Internship Programme",
    applyLink: "https://www.pgcareers.com/",
    infoLink: "https://www.pgcareers.com/",
  },
  {
    company: "L'Oréal",
    title: "L'Oréal Management Trainee Programme",
    applyLink: "https://careers.loreal.com/en_US/content/Students",
    infoLink: "https://careers.loreal.com/en_US/content/Students",
  },
  {
    company: "L'Oréal",
    title: "L'Oréal Internship Programme",
    applyLink: "https://careers.loreal.com/en_US/content/Students",
    infoLink: "https://careers.loreal.com/en_US/content/Students",
  },
  {
    company: "British American Tobacco",
    title: "BAT Global Graduate Programme",
    applyLink: "https://careers.bat.com/en/early-careers",
    infoLink: "https://careers.bat.com/en/early-careers",
  },

  // ---------------- Big Tech ----------------
  {
    company: "Google",
    title: "Software Engineering Internship",
    applyLink:
      "https://www.google.com/about/careers/applications/jobs/results?degree=PURSUING_DEGREE",
    infoLink:
      "https://www.google.com/about/careers/applications/students/",
  },
  {
    company: "Google",
    title: "Associate Product Manager (APM)",
    applyLink:
      "https://www.google.com/about/careers/applications/students/",
    infoLink:
      "https://www.google.com/about/careers/applications/students/",
  },
  {
    company: "Microsoft",
    title: "Microsoft Aspire / New-grad SWE",
    applyLink: "https://careers.microsoft.com/v2/global/en/recentgraduate",
    infoLink: "https://careers.microsoft.com/v2/global/en/recentgraduate",
  },
  {
    company: "Microsoft",
    title: "Microsoft Internship Programme",
    applyLink: "https://careers.microsoft.com/students/",
    infoLink: "https://careers.microsoft.com/students/",
  },
  {
    company: "Intel",
    title: "Intel Malaysia College Graduate Programme",
    applyLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
    infoLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
  },
  {
    company: "Intel",
    title: "Intel Internship Programme",
    applyLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
    infoLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
  },
  {
    company: "Intel",
    title: "Intel Internship for Malaysian Students (Business)",
    applyLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
    infoLink:
      "https://www.intel.com/content/www/us/en/jobs/locations/malaysia/students.html",
  },
  {
    company: "Grab",
    title: "Grab Kickstart Internship",
    applyLink: "https://www.grab.careers/en/my-internships/",
    infoLink: "https://www.grab.careers/en/my-internships/",
  },
  {
    company: "Grab",
    title: "Grab MEX (Management Associate) Programme",
    applyLink: "https://www.grab.careers/en/students/",
    infoLink: "https://www.grab.careers/en/students/",
  },
  {
    company: "Shopee",
    title: "Shopee & Monee Graduate Development Programme (GDP)",
    applyLink: "https://careers.shopee.com.my/",
    infoLink: "https://careers.shopee.com.my/",
  },
  {
    company: "Shopee",
    title: "Shopee Internship Programme",
    applyLink: "https://careers.shopee.com.my/",
    infoLink: "https://careers.shopee.com.my/",
  },

  // ---------------- Oil & Gas ----------------
  {
    company: "PETRONAS",
    title: "PETRONAS Graduate Employability Programme",
    applyLink: "https://www.petronas.com/careers/students-graduates",
    infoLink: "https://www.petronas.com/careers/students-graduates",
  },
  {
    company: "PETRONAS",
    title: "PETRONAS Internship (INSTEP / Sponsored)",
    applyLink: "https://www.petronas.com/careers/students-graduates",
    infoLink: "https://www.petronas.com/careers/students-graduates",
  },
  {
    company: "PETRONAS",
    title: "PETRONAS Digital Graduate Programme",
    applyLink: "https://www.petronas.com/careers/career-opportunities",
    infoLink: "https://www.petronas.com/careers/students-graduates",
  },
  {
    company: "Shell",
    title: "Shell Graduate Programme",
    applyLink:
      "https://www.shell.com.my/about-us/careers/early-careers/details-on-the-graduate-programme-and-how-to-apply.html",
    infoLink:
      "https://www.shell.com.my/about-us/careers/early-careers/details-on-the-graduate-programme-and-how-to-apply.html",
  },
  {
    company: "Shell",
    title: "Shell Internship / Assessed Internship",
    applyLink:
      "https://www.shell.com/careers/about-careers-at-shell/assessed-internships.html",
    infoLink:
      "https://www.shell.com/careers/about-careers-at-shell/assessed-internships.html",
  },

  // ---------------- Telecommunications ----------------
  {
    company: "Maxis",
    title: "Maxis Graduate Programme",
    applyLink:
      "https://www.maxis.com.my/en/about-maxis/career/maxis-graduate-programme/",
    infoLink:
      "https://www.maxis.com.my/en/about-maxis/career/maxis-graduate-programme/",
  },

  // ---------------- Banking (Management Associate) ----------------
  {
    company: "Hong Leong Bank",
    title: "Hong Leong Bank Management Associate Programme",
    applyLink:
      "https://www.hlb.com.my/en/personal-banking/about-us/careers/management-associate-program.html",
    infoLink:
      "https://www.hlb.com.my/en/personal-banking/about-us/careers/management-associate-program.html",
  },
  {
    company: "Hong Leong Bank",
    title: "Hong Leong Bank Graduate Trainee (GT)",
    applyLink:
      "https://www.hlb.com.my/en/personal-banking/about-us/careers.html",
    infoLink:
      "https://www.hlb.com.my/en/personal-banking/about-us/careers.html",
  },

  // ---------------- Management Trainee (Central Bank) ----------------
  {
    company: "Bank Negara Malaysia",
    title: "Bank Negara Malaysia Kijang Emas Scholarship / Graduate",
    applyLink: "https://www.bnm.gov.my/careers/kgp",
    infoLink: "https://www.bnm.gov.my/web/guest/careers/kgp",
    // Official: KGP Cohort 10.0 intake is September 2026.
    expectedReopen: "Expected Sep 2026 (KGP Cohort 10.0)",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "✗ DATABASE_URL is not set. Add it to .env.local (local) or the environment."
    );
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: url,
    ssl:
      url.includes("sslmode=require") || url.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  let updated = 0;
  const notFound: string[] = [];

  for (const u of UPDATES) {
    const sets = [`"applyLink" = $1`, `"infoLink" = $2`, `"updatedAt" = now()`];
    const params: unknown[] = [u.applyLink, u.infoLink];
    if (u.expectedReopen) {
      params.push(u.expectedReopen);
      sets.push(`"expectedReopen" = $${params.length}`);
    }
    params.push(u.company, u.title);
    const res = await pool.query(
      `UPDATE programs SET ${sets.join(", ")}
       WHERE company = $${params.length - 1} AND title = $${params.length}`,
      params
    );
    if (res.rowCount && res.rowCount > 0) updated += res.rowCount;
    else notFound.push(`${u.company} — ${u.title}`);
  }

  console.log(`✓ Updated ${updated} of ${UPDATES.length} targeted programmes.`);
  if (notFound.length) {
    console.log(
      `\n⚠ ${notFound.length} targeted programme(s) were not found by exact company+title (skipped):`
    );
    notFound.forEach((n) => console.log(`   - ${n}`));
  }
  await pool.end();
}

main().catch((err) => {
  console.error("✗ Update failed:", err);
  process.exit(1);
});
