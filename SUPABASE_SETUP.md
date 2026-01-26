# Supabase Setup Guide for SOVRN Protocol

This guide provides step-by-step instructions to set up Supabase for the SOVRN Protocol.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (sign up at https://supabase.com)

## Step 1: Install Supabase CLI

### Windows (PowerShell)
```powershell
# Using npm
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS
```bash
# Using Homebrew
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Linux
```bash
# Using npm
npm install -g supabase

# Or download binary from GitHub releases
```

### Verify Installation
```bash
supabase --version
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After successful login, you'll be able to link your project.

## Step 3: Link Your Project to Supabase Cloud

1. **Create a new project** in Supabase Dashboard (https://app.supabase.com) if you haven't already
2. **Get your project reference ID** from the project settings
3. **Link your local project** to the cloud project:

```bash
# Navigate to your project root
cd c:\Users\Hp\Desktop\SOVRN

# Link to your Supabase project (replace YOUR_PROJECT_REF with your actual project reference)
supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted to enter your database password. This is the password you set when creating the Supabase project.

## Step 4: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com/project/YOUR_PROJECT_REF
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
4. Navigate to **Settings** → **Database**
5. Copy the **Connection string** (URI format) → `DATABASE_URL`

## Step 5: Configure Environment Variables

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Open `.env` and fill in your Supabase credentials:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**⚠️ Important**: Replace `[YOUR-PASSWORD]` in the DATABASE_URL with your actual database password.

## Step 6: Push Database Schema to Cloud

Push the migration to your Supabase cloud database:

```bash
supabase db push
```

This will apply the migration file `supabase/migrations/20260126_init.sql` to your cloud database.

## Step 7: Verify the Migration

You can verify that the tables were created successfully:

```bash
# Open Supabase Studio (web interface)
supabase studio

# Or check via CLI
supabase db remote list
```

## Alternative: Manual Migration via Dashboard

If you prefer to run the migration manually:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20260126_init.sql`
4. Paste and execute the SQL

## Troubleshooting

### Issue: "Project not found"
- Make sure you're logged in: `supabase login`
- Verify your project reference ID is correct
- Check that you have access to the project

### Issue: "Database connection failed"
- Verify your `DATABASE_URL` is correct
- Check that your database password is correct
- Ensure your IP is allowed (Supabase allows all IPs by default for cloud projects)

### Issue: "Migration failed"
- Check the error message in the Supabase dashboard → Logs
- Verify the SQL syntax in the migration file
- Make sure you're using the correct database version

## Next Steps

After setting up Supabase:

1. **Test the connection** by running your API:
   ```bash
   cd apps/api
   npm install
   npm run dev
   ```

2. **Verify tables exist** in Supabase Dashboard → Table Editor

3. **Set up RLS policies** if needed (already included in the migration)

## Useful Commands

```bash
# Check Supabase status
supabase status

# View database migrations
supabase migration list

# Create a new migration
supabase migration new migration_name

# Reset local database (development only)
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --linked > src/types/database.ts
```

## Security Notes

- **Never commit** your `.env` file to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secret
- Use environment-specific `.env` files for different environments
- Consider using Supabase's built-in secrets management for production
