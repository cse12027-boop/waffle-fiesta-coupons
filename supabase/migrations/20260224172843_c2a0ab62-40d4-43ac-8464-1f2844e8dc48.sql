-- Add transaction_id column
ALTER TABLE public.coupons ADD COLUMN transaction_id TEXT;

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('Pending', 'Verified');

-- Add verification_status column
ALTER TABLE public.coupons 
ADD COLUMN verification_status public.verification_status 
NOT NULL DEFAULT 'Pending';

-- Verify all Cash payments automatically
UPDATE public.coupons 
SET verification_status = 'Verified' 
WHERE payment_type = 'Cash';

-- 🔐 Make transaction_id UNIQUE (only if not NULL)
CREATE UNIQUE INDEX unique_transaction_id_not_null
ON public.coupons (transaction_id)
WHERE transaction_id IS NOT NULL;
