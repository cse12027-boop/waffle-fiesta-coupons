-- Allow users with 'admin' role to delete coupons
CREATE POLICY "Admins can delete coupons" ON public.coupons
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
