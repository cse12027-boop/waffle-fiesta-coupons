
-- Create enum types
CREATE TYPE public.payment_type AS ENUM ('Online', 'Cash');
CREATE TYPE public.coupon_status AS ENUM ('Unused', 'Redeemed');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    coupon_id TEXT NOT NULL UNIQUE,
    payment_id TEXT,
    payment_type payment_type NOT NULL DEFAULT 'Online',
    status coupon_status NOT NULL DEFAULT 'Unused',
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE UNIQUE INDEX unique_payment_id_not_null
ON public.coupons (payment_id)
WHERE payment_id IS NOT NULL;

ALTER TABLE public.coupons
ADD CONSTRAINT payment_id_required_for_online
CHECK (
  (payment_type = 'Online' AND payment_id IS NOT NULL)
  OR
  (payment_type = 'Cash')
);


-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can view roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for coupons: only admins
CREATE POLICY "Admins can view all coupons" ON public.coupons
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert coupons" ON public.coupons
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update coupons" ON public.coupons
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role policy for edge functions (coupon creation after payment)
CREATE POLICY "Service role can insert coupons" ON public.coupons
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can select coupons" ON public.coupons
FOR SELECT TO service_role
USING (true);

CREATE POLICY "Service role can update coupons" ON public.coupons
FOR UPDATE TO service_role
USING (true);
