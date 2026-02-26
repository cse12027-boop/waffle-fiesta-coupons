-- Migration to allow public (anon) access for coupon generation
-- This enables customers to submit their transaction details and view their generated coupons

-- Allow anyone to insert coupons
CREATE POLICY "Public can insert coupons"
ON public.coupons
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view coupons (needed for showing the coupon card after generation)
CREATE POLICY "Public can view coupons"
ON public.coupons
FOR SELECT
USING (true);
