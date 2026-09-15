# Deploying Prestige Jobs MY (beginner-friendly)

This guide takes you from your GitHub repo to a **live website on the internet**, step by step. No prior experience needed. It takes about 15–20 minutes and costs **nothing** (all free tiers).

You'll use two free services:

1. **Neon** — hosts your database (where the programmes are stored).
2. **Vercel** — hosts your website and connects to your GitHub repo.

---

## Part 1 — Create your database on Neon

1. Go to **<https://neon.tech>** and click **Sign up**. Choose **"Continue with GitHub"** (easiest — reuses your GitHub login).
2. After signing in, click **Create project** (or **New Project**).
   - **Name:** `prestige-jobs` (anything is fine)
   - **Postgres version:** leave the default
   - **Region:** pick the one closest to you (e.g. Singapore for Malaysia)
   - Click **Create**.
3. Neon shows you a **connection string** — a long line that starts with `postgresql://`. This is the address + password of your database.
   - Look for the **"Connection string"** box. Make sure the **"Pooled connection"** toggle is **ON** (this matters for the website to run reliably).
   - Click the **copy** icon. **Keep this somewhere safe for the next steps** — treat it like a password.

> That's your database ready. You don't need to create any tables — the app does that automatically the first time it runs.

---

## Part 2 — Deploy the website on Vercel

1. Go to **<https://vercel.com>** and click **Sign Up** → **Continue with GitHub**. Approve the access it asks for.
2. On your Vercel dashboard, click **Add New…** → **Project**.
3. You'll see a list of your GitHub repositories. Find **`prestige-jobs-my`** and click **Import**.
   - If you don't see it, click **"Adjust GitHub App Permissions"** / **"Configure GitHub App"** and give Vercel access to the repo, then come back.
4. On the **"Configure Project"** screen, Vercel auto-detects it's a Next.js app — **leave all the build settings as they are**.
5. Expand the **Environment Variables** section and add these two:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Paste the Neon connection string you copied in Part 1 |
   | `ADMIN_PASSWORD` | Choose a strong password for your admin panel |

   (Type the name on the left, paste/type the value on the right, click **Add** for each.)
6. Click **Deploy**. Wait 1–2 minutes while Vercel builds your site. 🎉
7. When it finishes, you'll get a live URL like **`https://prestige-jobs-my.vercel.app`**. Click it — your website is live!

> At this point the site works, but the table will be **empty**, because we haven't loaded the 125 programmes into the database yet. That's Part 3.

---

## Part 3 — Load the 125 starter programmes

Your database is empty until you "seed" it. You have two easy options.

### Option A — Seed from your own computer (recommended, one-time)

You need [Node.js](https://nodejs.org) installed (download the "LTS" version and install it — just click through).

1. Download your project: on your GitHub repo page, click the green **`< > Code`** button → **Download ZIP**, then unzip it. (Or, if you know Git: `git clone` it.)
2. Open a **terminal / command prompt** in that project folder.
   - **Windows:** open the folder in File Explorer, click the address bar, type `cmd`, press Enter.
   - **Mac:** right-click the folder → "New Terminal at Folder".
3. Create a file named **`.env.local`** in the project folder with this content (paste your real Neon string):
   ```
   DATABASE_URL="postgresql://...your Neon pooled string..."
   ```
4. In the terminal, run these three commands one at a time:
   ```bash
   npm install
   npm run seed
   ```
5. You should see: `✓ Seeded 125 programmes.` Refresh your Vercel website — the table is now full! ✅

### Option B — Add programmes through the admin panel

If you'd rather not touch a terminal, just go to **`https://your-site.vercel.app/admin`**, log in with your `ADMIN_PASSWORD`, and add programmes one by one with the **"+ Add programme"** button. (The table auto-creates itself on first load, so this works even on an empty database.)

---

## You're live! What now?

- **Your public board:** `https://your-site.vercel.app`
- **Your admin panel:** `https://your-site.vercel.app/admin`

### Making changes later
Every time you (or I) push a change to the `main` branch on GitHub, **Vercel automatically rebuilds and redeploys** your site within a minute or two. You don't have to do anything.

### Custom domain (optional)
Want `www.yoursite.com` instead of `.vercel.app`? In Vercel: **Project → Settings → Domains → Add**, and follow the instructions to point your domain at it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Site loads but table is empty | You haven't seeded yet — do **Part 3**. |
| "DATABASE_URL is not set" error | The env var is missing/misspelled in Vercel → **Settings → Environment Variables**. After adding it, **redeploy** (Deployments → ⋯ → Redeploy). |
| Can't log in to `/admin` | Use the exact `ADMIN_PASSWORD` you set in Vercel env vars. |
| Database connection errors | Make sure you used Neon's **pooled** connection string (the host usually contains `-pooler`). |
| Changed an env var but nothing changed | Env var changes only apply to **new** deployments — trigger a redeploy. |

---

*Need help with any step? Just ask — I can walk you through it or make code changes for you.*
