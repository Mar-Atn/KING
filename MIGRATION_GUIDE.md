# AI Character Prototype - Database Migration Guide

**Follow these steps carefully. I'll verify each step before proceeding.**

---

## STEP 1: Create the exec Function (One-Time Setup)

### Action Required:

1. **Open this URL in your browser:**
   ```
   https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql/new
   ```

2. **Copy this SQL code:**
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

   COMMENT ON FUNCTION exec IS 'Execute arbitrary SQL (service_role only)';
   ```

3. **Paste it into the SQL Editor**

4. **Click the "Run" button** (or press Cmd/Ctrl + Enter)

5. **You should see:** "Success. No rows returned"

6. **Tell me when done!** Type "done" or "✅" and I'll verify it worked.

---

## What This Does:

This creates a PostgreSQL function called `exec` that allows us to run DDL (Data Definition Language) statements programmatically. This is a one-time setup - after this, all future migrations will be automatic!

**Security:** Only the service_role (which you control via the service key) can execute this function.

---

## Ready?

Once you've completed Step 1, let me know and I'll verify the function exists, then we'll proceed to Step 2!
