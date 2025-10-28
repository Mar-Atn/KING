-- Fix RLS policies for users table to allow self-registration

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Facilitators can view all users" ON users;
DROP POLICY IF EXISTS "Facilitators have full access to users" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_facilitator());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
