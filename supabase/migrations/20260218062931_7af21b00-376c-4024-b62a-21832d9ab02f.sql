
-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs"
ON public.activity_logs
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Search logs table (public insert, admin read)
CREATE TABLE public.search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_number TEXT NOT NULL,
  found BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search logs"
ON public.search_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can read search logs"
ON public.search_logs
FOR SELECT
USING (is_admin(auth.uid()));
