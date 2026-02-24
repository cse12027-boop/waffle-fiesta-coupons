
-- Add transaction_id column
ALTER TABLE public.coupons ADD COLUMN transaction_id TEXT;

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('Pending', 'Verified');

-- Add verification_status column with default 'Pending'
ALTER TABLE public.coupons ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'Pending';

-- For existing Cash coupons, set verification_status to 'Verified'
UPDATE public.coupons SET verification_status = 'Verified' WHERE payment_type = 'Cash';
