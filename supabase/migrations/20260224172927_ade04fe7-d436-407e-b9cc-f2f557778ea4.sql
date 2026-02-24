
-- Allow anonymous/any user to insert coupons (for self-service UPI purchase)
CREATE POLICY "Anyone can insert coupons for UPI purchase"
ON public.coupons
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own coupon by coupon_id (for coupon display after purchase)
CREATE POLICY "Anyone can read coupons"
ON public.coupons
FOR SELECT
USING (true);
