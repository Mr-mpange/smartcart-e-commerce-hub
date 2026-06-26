-- Enforce exactly one application role per user and assign it during account creation.

WITH ranked_roles AS (
  SELECT
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'vendor' THEN 2
        WHEN 'delivery_rider' THEN 3
        WHEN 'reseller' THEN 4
        WHEN 'customer' THEN 5
      END,
      created_at ASC
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked_roles rr
WHERE ur.id = rr.id
  AND rr.rn > 1;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));

  requested_role := CASE COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    WHEN 'admin' THEN 'admin'::public.app_role
    WHEN 'vendor' THEN 'vendor'::public.app_role
    WHEN 'delivery_rider' THEN 'delivery_rider'::public.app_role
    WHEN 'reseller' THEN 'reseller'::public.app_role
    ELSE 'customer'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$;
