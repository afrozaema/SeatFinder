-- Create a function that allows executing arbitrary SQL (admin use only via service role)
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  trimmed_query text;
  query_type text;
BEGIN
  trimmed_query := trim(query);
  query_type := upper(split_part(trim(trimmed_query), ' ', 1));

  -- For SELECT queries, return rows as JSON array
  IF query_type = 'SELECT' OR query_type = 'WITH' THEN
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
  END IF;

  -- For INSERT with RETURNING
  IF query_type = 'INSERT' THEN
    IF position('RETURNING' IN upper(query)) > 0 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
      RETURN COALESCE(result, '[]'::jsonb);
    ELSE
      EXECUTE query;
      GET DIAGNOSTICS result = ROW_COUNT;
      RETURN jsonb_build_object('affected_rows', result);
    END IF;
  END IF;

  -- For UPDATE / DELETE with optional RETURNING
  IF query_type = 'UPDATE' OR query_type = 'DELETE' THEN
    IF position('RETURNING' IN upper(query)) > 0 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
      RETURN COALESCE(result, '[]'::jsonb);
    ELSE
      EXECUTE query;
      RETURN jsonb_build_object('affected_rows', (SELECT COUNT(*) FROM (SELECT 1) x));
    END IF;
  END IF;

  -- Other statements (CREATE TABLE, ALTER, etc.) - execute and return OK
  EXECUTE query;
  RETURN jsonb_build_object('status', 'OK');

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Restrict execute_sql to be callable only by service role (the function itself is security definer)
REVOKE ALL ON FUNCTION public.execute_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.execute_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
