# Quick Start: Supabase Setup Commands

## Exact Terminal Commands to Run

### 1. Install Supabase CLI

**Windows (PowerShell):**
```powershell
npm install -g supabase
```

**macOS/Linux:**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

### 2. Login to Supabase

```bash
supabase login
```

This opens your browser for authentication.

### 3. Link Project to Supabase Cloud

**First, create a project at https://app.supabase.com if you haven't already.**

Then, from your project root directory:

```bash
cd c:\Users\Hp\Desktop\SOVRN
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID from the Supabase dashboard.

**Example:**
```bash
supabase link --project-ref abcdefghijklmnop
```

You'll be prompted for your database password (the one you set when creating the project).

### 4. Get Your Credentials

1. Go to: https://app.supabase.com/project/YOUR_PROJECT_REF/settings/api
2. Copy:
   - **Project URL** → Use for `SUPABASE_URL`
   - **service_role key** (secret) → Use for `SUPABASE_SERVICE_ROLE_KEY`
3. Go to: https://app.supabase.com/project/YOUR_PROJECT_REF/settings/database
4. Copy **Connection string** (URI) → Use for `DATABASE_URL`

### 5. Create .env File

```bash
copy .env.example .env
```

Then edit `.env` and fill in your credentials.

### 6. Push Database Schema to Cloud

```bash
supabase db push
```

This applies `supabase/migrations/20260126_init.sql` to your cloud database.

### 7. Verify Setup

```bash
# Check status
supabase status

# Or open Supabase Studio
supabase studio
```

## Complete Command Sequence (Copy-Paste Ready)

```powershell
# 1. Install CLI
npm install -g supabase

# 2. Verify
supabase --version

# 3. Login
supabase login

# 4. Navigate to project (if not already there)
cd c:\Users\Hp\Desktop\SOVRN

# 5. Link project (replace YOUR_PROJECT_REF)
supabase link --project-ref YOUR_PROJECT_REF

# 6. Create .env file
copy .env.example .env
# Then edit .env with your credentials from Supabase dashboard

# 7. Push schema
supabase db push

# 8. Verify
supabase status
```

## What Gets Created

After running `supabase db push`, these tables will be created in your cloud database:

- ✅ `citizen_registry` (with RLS enabled)
- ✅ `registered_entities` (with RLS enabled)
- ✅ `consent_logs` (with RLS enabled)

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Need Help?

See `SUPABASE_SETUP.md` for detailed troubleshooting and additional information.
