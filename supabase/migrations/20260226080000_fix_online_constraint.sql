-- Migration to fix CHECK constraint for Online payments
-- Allows transaction_id to be used instead of payment_id for Online purchases

-- 1. Drop the old constraint
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS payment_id_required_for_online;

-- 2. Add a more flexible constraint that accepts either payment_id or transaction_id for Online
ALTER TABLE public.coupons
ADD CONSTRAINT payment_identifier_required_for_online
CHECK (
  (payment_type = 'Online' AND (payment_id IS NOT NULL OR transaction_id IS NOT NULL))
  OR
  (payment_type = 'Cash')
);
