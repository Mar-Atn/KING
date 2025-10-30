# ONE-TIME SETUP - Create exec Function

**This needs to be done ONCE. After this, all future migrations will be automatic.**

## Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql/new

## Step 2: Copy and paste this SQL

```sql
CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

GRANT EXECUTE ON FUNCTION exec(text) TO service_role;
```

## Step 3: Click "Run"

That's it! Takes 5 seconds.

## Step 4: Run the automated migration script

After the exec function is created, run:

```bash
node execute_migrations_with_exec.mjs
```

This will automatically:
- Create the conversations table
- Seed all 10 AI prompts
- Verify everything worked

---

**Why is this needed?**

Supabase's security model prevents executing DDL (Data Definition Language) statements via the API for safety. The `exec` function creates a controlled way to run migrations programmatically using your service_role key.

Once this function exists, ALL future migrations will be automatic - no more manual steps!
