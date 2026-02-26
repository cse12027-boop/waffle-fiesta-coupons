
CREATE POLICY "Admins can delete coupons"
ON public.coupons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
