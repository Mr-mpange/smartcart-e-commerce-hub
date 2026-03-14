-- Enforce reseller pricing: Cannot sell BELOW vendor's original price
-- Resellers can sell at vendor price or HIGHER (unlimited markup allowed)

-- Drop the old constraint
ALTER TABLE public.reseller_products
DROP CONSTRAINT IF EXISTS valid_reseller_price;

-- Add new constraint: reseller_price must be >= original_price (no selling below vendor price)
ALTER TABLE public.reseller_products
ADD CONSTRAINT valid_reseller_price CHECK (
    reseller_price >= original_price
);

-- Update markup_percentage to reflect actual markup
UPDATE public.reseller_products
SET markup_percentage = ((reseller_price - original_price) / original_price * 100);

-- Add comment explaining the rule
COMMENT ON CONSTRAINT valid_reseller_price ON public.reseller_products IS 
'PRICING RULE: Resellers cannot sell below vendor original price. 
Minimum price = vendor price. Markup is unlimited.';

