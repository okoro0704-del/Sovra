<!-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY -->
# SOVRA Protocol - Deployment Guide
## GitHub & Supabase Setup

---

## 🚀 Part 1: Push to GitHub

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository settings:
   - **Name**: `sovra-protocol` (or your preferred name)
   - **Description**: "SOVRA Protocol - The World's First Vitalized Ledger Technology"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### Step 2: Add GitHub Remote

Copy the repository URL from GitHub (should look like `https://github.com/YOUR_USERNAME/sovra-protocol.git`)

Then run these commands:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/sovra-protocol.git

# Verify remote was added
git remote -v
```

### Step 3: Push to GitHub

```bash
# Push to GitHub (first time)
git push -u origin master

# Or if you prefer 'main' as branch name:
git branch -M main
git push -u origin main
```

**Enter your GitHub credentials when prompted.**

### Step 4: Verify on GitHub

1. Go to your repository URL: `https://github.com/YOUR_USERNAME/sovra-protocol`
2. You should see all 150 files committed
3. Check that `MANIFESTO.md`, `SOVRA_PROTOCOL.md`, and `global-hub/chain/config/genesis.json` are visible

---

## 🗄️ Part 2: Connect to Supabase

### Prerequisites

Install Supabase CLI (choose one method):

**Method 1: Using Scoop (Recommended for Windows)**
```bash
# Install Scoop first (if not installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Method 2: Direct Download (Windows)**
1. Go to https://github.com/supabase/cli/releases
2. Download `supabase_windows_amd64.zip`
3. Extract and add to PATH

**Method 3: Using npx (No installation needed)**
```bash
# Use npx to run Supabase commands
npx supabase --version
```

Verify installation:
```bash
supabase --version
# Or with npx
npx supabase --version
```

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Project settings:
   - **Name**: `sovra-nigeria` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose closest to Nigeria (e.g., `eu-west-1` or `ap-southeast-1`)
   - **Pricing Plan**: Choose **Free** tier to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be provisioned

### Step 2: Get Project Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API Key (anon public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Project API Key (service_role secret)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Go to **Settings** → **General**
4. Copy **Reference ID**: `xxxxxxxxxxxxx`

### Step 3: Link Local Project to Supabase

Navigate to Nigeria spoke directory:

```bash
cd spokes/nigeria
```

Login to Supabase:

```bash
supabase login
```

Link to your project:

```bash
# Replace xxxxxxxxxxxxx with your Reference ID
supabase link --project-ref xxxxxxxxxxxxx
```

### Step 4: Push Database Schema

```bash
# Push migrations to Supabase
supabase db push

# Or reset and push fresh schema
supabase db reset
```

### Step 5: Update Environment Variables

Edit `spokes/nigeria/.env` (create from `.env.example`):

```bash
# Copy example file
cp .env.example .env
```

Update with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 6: Verify Connection

Test the connection:

```bash
# Check database status
supabase db status

# Open Supabase Studio locally
supabase start
```

Visit `http://localhost:54323` to see Supabase Studio.

### Step 7: Verify Tables Created

In Supabase Dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - `citizens`
   - `pff_verifications`
   - `consent_records`
   - `api_keys`
   - `token_balances`

---

## 🔐 Part 3: Security Setup

### GitHub Secrets (for CI/CD)

If you plan to use GitHub Actions:

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Supabase Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pff_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Verification Checklist

### GitHub
- [ ] Repository created on GitHub
- [ ] Remote added: `git remote -v` shows origin
- [ ] Code pushed: All 150 files visible on GitHub
- [ ] Genesis file visible: `global-hub/chain/config/genesis.json`
- [ ] VLT_Core module visible: `global-hub/chain/x/vltcore/`

### Supabase
- [ ] Supabase project created
- [ ] Local project linked: `supabase link` successful
- [ ] Database schema pushed: Tables visible in dashboard
- [ ] Environment variables configured
- [ ] Connection tested: `supabase db status` works
- [ ] RLS enabled on all tables

---

## 🚀 Next Steps

1. **Deploy API**: Deploy Nigeria spoke API to production
2. **Configure DNS**: Point custom domain to Supabase
3. **Enable Realtime**: Configure Supabase Realtime for live updates
4. **Setup Backups**: Configure automated database backups
5. **Monitor Performance**: Setup monitoring and alerts

---

## 📚 Additional Resources

- **GitHub Docs**: https://docs.github.com
- **Supabase Docs**: https://supabase.com/docs
- **SOVRA Protocol Docs**: See `SOVRA_PROTOCOL.md`
- **VLT Core Security**: See `global-hub/docs/VLT_CORE_SECURITY.md`

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**  
**The SOVRA Protocol - Born in Lagos, Built for the World**

