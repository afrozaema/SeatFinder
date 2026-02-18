
-- Keep alive log table
CREATE TABLE public.keep_alive_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ok',
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  record_count INTEGER,
  pinged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.keep_alive_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read keep_alive_log"
ON public.keep_alive_log
FOR SELECT
USING (true);

-- Incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read incidents"
ON public.incidents
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert incidents"
ON public.incidents
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update incidents"
ON public.incidents
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete incidents"
ON public.incidents
FOR DELETE
USING (is_admin(auth.uid()));

-- Site settings table for keep-alive ping target
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site_settings"
ON public.site_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default setting
INSERT INTO public.site_settings (key, value) VALUES ('site_name', 'JU SeatFinder');
