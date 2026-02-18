ALTER TABLE public.students ADD COLUMN unit text NOT NULL DEFAULT 'UNIT-A';

CREATE INDEX idx_students_unit ON public.students(unit);