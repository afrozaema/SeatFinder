INSERT INTO public.user_roles (user_id, role)
VALUES ('8cbef27b-0e63-4030-9da3-24302c3bd310', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;