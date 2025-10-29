# How to Give Claude Direct Database Access

## Option 1: Service Role Key (RECOMMENDED - 2 minutes)

### Step 1: Get Your Service Role Key
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx
2. Go to **Settings** → **API**
3. Scroll to "Project API keys"
4. Copy the **`service_role`** key (the long one, NOT the anon key)

### Step 2: Update .env.local
Replace line 4 in `.env.local` with your actual service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz....  (your actual key)
```

### Step 3: Tell Claude
Just say "I've updated the service role key" and Claude will be able to:
- Run diagnostics with full database access
- Measure actual field sizes
- Identify base64 images in the database
- Create migration scripts to fix the issue

## Option 2: Run SQL Script Yourself (5 minutes)

If you prefer not to share the service role key, you can:

1. Open Supabase Dashboard → **SQL Editor**
2. Run the script: `scripts/measureRoleFieldSizes.sql`
3. Copy the results and share them with Claude

## Option 3: Create Test Credentials (10 minutes)

Create a test facilitator account:

1. Register at: http://localhost:5173/register
2. Email: `test@test.com`
3. Password: `Test123!@#`
4. Role: Facilitator
5. Tell Claude: "Test account created: test@test.com / Test123!@#"

---

**Security Note:** The service role key bypasses Row Level Security (RLS) and has full admin access. Claude will only use it for diagnostics and migrations, never for production code. You can revoke/rotate the key anytime in Supabase Dashboard.
