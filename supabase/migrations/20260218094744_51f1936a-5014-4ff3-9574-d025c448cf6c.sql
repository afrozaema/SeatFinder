-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can read activity logs" ON public.activity_logs;

-- Recreate as permissive policies
CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));