-- Migration to add unique constraint to transaction_id
-- This prevents reusing the same transaction ID for multiple coupons

ALTER TABLE public.coupons ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id);
