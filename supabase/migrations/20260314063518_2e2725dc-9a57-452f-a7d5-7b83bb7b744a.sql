
-- Create presentations table
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'shared')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own presentations"
  ON public.presentations FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own presentations"
  ON public.presentations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations"
  ON public.presentations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
  ON public.presentations FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for user lookups
CREATE INDEX idx_presentations_user_id ON public.presentations(user_id);
CREATE INDEX idx_presentations_status ON public.presentations(status);
