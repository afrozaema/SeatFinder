
-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  office_room TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Anyone can read teachers
CREATE POLICY "Anyone can read teachers" ON public.teachers FOR SELECT USING (true);

-- Admins can manage teachers
CREATE POLICY "Admins can insert teachers" ON public.teachers FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update teachers" ON public.teachers FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete teachers" ON public.teachers FOR DELETE USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
