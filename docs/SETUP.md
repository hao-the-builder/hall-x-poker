# Setup: Supabase + Vercel

Total time: about 15 minutes. You need a Supabase account and a Vercel account (both free tiers are fine) and this repo pushed to GitHub.

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Pick a name (for example `hall-x-poker`), a strong database password (save it somewhere; you rarely need it again), and the **Southeast Asia (Singapore)** region for the lowest latency from Hong Kong.
3. Wait for provisioning to finish (about a minute).

## 2. Run the database schema

1. In the left sidebar open **SQL Editor** and click **New query**.
2. Open `supabase/schema.sql` from this repo, copy the whole file, paste it in, and click **Run**.
3. You should see "Success. No rows returned". Re-running the file later is safe.

This creates the tables, the leaderboard view, the rating function, all the write functions, row-level security, and two triggers on the auth table:

- one that **rejects any sign-up whose email does not end in `@connect.ust.hk`**
- one that creates a profile row for every new user

## 3. Configure authentication

Open **Authentication** in the sidebar.

### Providers

**Authentication > Sign In / Providers > Email**

- Enable email provider: **on**
- Confirm email: **off**. The site does not send verification emails; people sign up and are signed in straight away. The `@connect.ust.hk` rule is still enforced by the database.
- Minimum password length: 8

### URL configuration

**Authentication > URL Configuration**

- **Site URL**: your production URL once deployed, e.g. `https://hall-x-poker.vercel.app`. `http://localhost:3000` is fine until then.

No email sending (SMTP) is needed. Password reset by email is not offered; if someone forgets their password, delete their user under **Authentication > Users** (their results go with it) or set a new password for them there.

## 4. Get the API keys

**Project Settings > API** (or **Project Settings > Data API** in newer dashboards):

- **Project URL**: `https://xxxxxxxx.supabase.co`
- **anon public** key (under Project API keys). The site only ever uses this key; it is safe to expose to browsers because row-level security governs what it can do. Never use the `service_role` key in this project.

## 5. Run locally

```bash
cp .env.example .env.local
# edit .env.local and fill in the two Supabase values
npm install
npm run dev
```

Open <http://localhost:3000> and create an account with a `@connect.ust.hk` address. You are signed in immediately.

To preview the design with sample data and no database at all, set `NEXT_PUBLIC_DEMO=1` in `.env.local` instead. Writes are disabled in that mode.

## 6. Deploy to Vercel

1. Push this repository to GitHub.
2. Go to <https://vercel.com/new>, import the repository. Framework preset: **Next.js** (auto-detected). Leave build settings as default.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_ANON_KEY` | your anon public key |
   | `SITE_URL` | your production URL, e.g. `https://hall-x-poker.vercel.app` |

   Use these plain names. Vercel refuses to save `NEXT_PUBLIC_` names without extra steps, and the site copies the plain names into place when it builds. You can deploy first and add them afterwards, but you must **redeploy** after adding or changing them, because they are read at build time.

4. Click **Deploy**. When it finishes, copy the production URL.
5. Back in Supabase, set **Site URL** to that production URL.
6. If you later add a custom domain, update `SITE_URL` and redeploy.

## 7. Verify the deployment

- Sign up with a non-UST address: the form should refuse it. If you bypass the form, the database trigger refuses it too.
- Sign up with your UST address: you land on the leaderboard, signed in.
- Create a tournament, join from a second account, enter results, and check the leaderboard updates.

## Troubleshooting

- **"Only @connect.ust.hk addresses can register"** when the address is correct: a database trigger failed. Re-run `supabase/schema.sql`, then check **Database > Logs** in Supabase for the error.
- **"Supabase still requires email confirmation"** after signing up: "Confirm email" is still on. Turn it off (step 3), then sign in.
- **"This account was created while email confirmation was on"** at sign-in: that account predates the change. Delete it under **Authentication > Users** and sign up again.
- **Everyone sees "unrated"**: ratings only count tournaments whose host has entered results.
