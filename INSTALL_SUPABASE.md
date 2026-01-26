# Installing Supabase CLI - Alternative Methods

Your npm installation has configuration issues (offline mode and proxy settings). Here are alternative ways to install Supabase CLI on Windows:

## Method 1: Using Scoop (Recommended for Windows)

```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Add Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Install Supabase CLI
scoop install supabase
```

## Method 2: Download Binary Directly

1. Go to: https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.zip` (or appropriate version for your system)
3. Extract the zip file
4. Move `supabase.exe` to a folder in your PATH (e.g., `C:\Windows\System32` or create `C:\Tools\supabase` and add it to PATH)
5. Verify: `supabase --version`

## Method 3: Using Chocolatey

```powershell
# Install Chocolatey if you don't have it (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Supabase CLI
choco install supabase
```

## Method 4: Fix npm Configuration (If you want to use npm)

You need to fix your npm configuration:

1. **Check environment variables:**
   ```powershell
   $env:npm_config_offline
   $env:HTTP_PROXY
   $env:HTTPS_PROXY
   ```

2. **Unset problematic environment variables:**
   ```powershell
   [Environment]::SetEnvironmentVariable("npm_config_offline", $null, "User")
   [Environment]::SetEnvironmentVariable("HTTP_PROXY", $null, "User")
   [Environment]::SetEnvironmentVariable("HTTPS_PROXY", $null, "User")
   ```

3. **Restart your terminal/PowerShell** and try again:
   ```powershell
   npm install -g supabase
   ```

## Verify Installation

After installation, verify it works:

```powershell
supabase --version
```

## Next Steps After Installation

Once Supabase CLI is installed:

1. **Login:**
   ```powershell
   supabase login
   ```

2. **Link your project:**
   ```powershell
   cd c:\Users\Hp\Desktop\SOVRN
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Push your schema:**
   ```powershell
   supabase db push
   ```

## Recommended: Use Scoop

Scoop is the easiest method for Windows and doesn't require fixing npm configuration issues.
