
-- Add exam_date column to students table
ALTER TABLE public.students ADD COLUMN exam_date DATE NOT NULL DEFAULT CURRENT_DATE;
