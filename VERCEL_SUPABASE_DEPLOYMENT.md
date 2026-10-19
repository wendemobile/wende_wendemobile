# Deployment Guide: Vercel & Supabase for Wende Mobile Butajira

This guide provides step-by-step instructions to deploy the **Wende Mobile Butajira** application to **Vercel** with a **Supabase PostgreSQL** database.

---

## 1. Supabase Database Setup

1. **Create an Account or Log In**: Go to [supabase.com](https://supabase.com) and sign in.
2. **Create a New Project**:
   - Project Name: `wende-mobile-pos`
   - Database Password: Create a strong password (save this securely).
   - Region: Select a region close to your users (e.g., `Frankfurt (eu-central-1)` or `London (eu-west-2)`).
3. **Retrieve Database Connection Strings**:
   - In your Supabase Dashboard, navigate to **Project Settings** (gear icon) -> **Database**.
   - Scroll down to the **Connection string** section.
   - Select the **URI** tab.

   ### A. Connection Pooling URL (for `DATABASE_URL`)
   - Change Mode to **Transaction** (Port `6543`).
   - Copy the URI. It will look like:
     ```env
     DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
     ```
   - **Crucial**: Ensure `?pgbouncer=true&connection_limit=1` is appended to prevent connection pool exhaustion on serverless environments.

   ### B. Direct Connection URL (for `DIRECT_URL`)
   - Change Mode to **Session** (Port `5432`) or direct connection.
   - Copy the URI. It will look like:
     ```env
     DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
     ```

4. **Storage (Optional for item images)**:
   - Go to **Project Settings** -> **API**.
   - Copy `Project URL` as `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy `service_role` secret as `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Initialize Database & Seed Default Accounts

Before deploying, initialize the schema and default accounts against your Supabase database:

1. In your local terminal, temporarily set your Supabase strings in `.env`:
   ```bash
   DATABASE_URL="your_supabase_transaction_pooler_url"
   DIRECT_URL="your_supabase_session_url"
   ```

2. Run the database setup script:
   ```bash
   npm run db:setup
   ```
   This executes `prisma db push` to create all tables and `prisma/seed.ts` to create the default user accounts:
   - **Admin**: username `admin` / password `admin123`
   - **Cashier**: username `cashier` / password `cashier123`
   - **Salesman**: username `salesman` / password `salesman123`
   - **Basement Manager**: username `basement` / password `basement123`

---

## 3. Vercel Deployment

### Step A: Push Code to Git
Push your project to GitHub or GitLab:
```bash
git add .
git commit -m "Add Wende Mobile Butajira landing page and Vercel/Supabase configuration"
git push origin main
```

### Step B: Import Project into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Select your repository and click **Import**.
4. Framework Preset: **Next.js** (detected automatically).
5. Root Directory: `./` (leave default).

### Step C: Configure Environment Variables
Under the **Environment Variables** section in Vercel, add:

| Variable Name | Value | Purpose |
|---------------|-------|---------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@...:6543/postgres?pgbouncer=true&connection_limit=1` | Supabase Transaction Pooler |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PASS]@...:5432/postgres` | Supabase Session Pooler |
| `NEXTAUTH_SECRET` | Generate random string with `openssl rand -base64 32` | JWT encryption |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (or your custom domain) | Auth redirection |
| `TRUSTED_HOSTS` | `localhost:3000,your-project.vercel.app` | Host authorization |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[YOUR-PROJECT-REF].supabase.co` | Supabase API |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key` | Storage upload bypass |
| `TELEGRAM_BOT_TOKEN` | (Optional) Your telegram bot token | Notifications |
| `TELEGRAM_CHAT_ID` | (Optional) Your telegram chat ID | Notifications |

### Step D: Build & Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` which runs `prisma generate && next build`.
3. Once finished, you will receive a production URL (e.g. `https://wende-mobile-butajira.vercel.app`).

---

## 4. Verification After Deployment

1. **Visit Root URL (`/`)**:
   - You should see the **Wende Mobile Butajira** flagship landing page with smartphones, AirPods & headsets showcase, and Butajira store information.
   - Click the top 3-bar menu (☰) to test the navigation drawer and quick login prompt.
2. **Visit Login Page (`/login`)**:
   - Verify the top bar displays **Wende Mobile Butajira** with the top 3-bar menu.
   - Enter `admin` / `admin123` to test sign-in.
   - You should be redirected directly into the Point of Sale & Management Dashboard (`/dashboard`).
