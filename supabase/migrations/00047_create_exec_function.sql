-- Create exec function for executing raw SQL
-- This allows running DDL statements via RPC

CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION exec(text) TO service_role;

COMMENT ON FUNCTION exec IS 'Execute arbitrary SQL (service_role only)';
