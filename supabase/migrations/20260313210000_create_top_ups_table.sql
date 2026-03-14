-- Create top_ups table for tracking wallet top-up payments
CREATE TABLE public.top_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  snippe_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.top_ups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own top-ups
CREATE POLICY "Users can view own top-ups"
ON public.top_ups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create top-ups
CREATE POLICY "Users can create top-ups"
ON public.top_ups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all top-ups
CREATE POLICY "Admins can view all top-ups"
ON public.top_ups
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

-- Create indexes
CREATE INDEX idx_top_ups_user_id ON public.top_ups(user_id);
CREATE INDEX idx_top_ups_status ON public.top_ups(status);
CREATE INDEX idx_top_ups_snippe_reference ON public.top_ups(snippe_reference);
CREATE INDEX idx_top_ups_created_at ON public.top_ups(created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.top_ups;
