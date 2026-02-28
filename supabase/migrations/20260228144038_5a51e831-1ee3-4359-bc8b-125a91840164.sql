CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'super_admin' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last super_admin role. At least one super_admin must exist.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_last_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_super_admin_delete();