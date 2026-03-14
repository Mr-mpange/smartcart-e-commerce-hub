-- Add slug and tracking columns to payment_links table
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_collected DECIMAL(12,2) DEFAULT 0;

-- Create index for slug lookups (faster queries)
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON public.payment_links(slug);

-- Create index for active links (for public access)
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON public.payment_links(status) WHERE status = 'active';
