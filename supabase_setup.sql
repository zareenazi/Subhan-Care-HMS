-- ============================================================
-- SUBHAN CARE HMS – COMPLETE DATABASE SETUP
-- Run this entire script in: Supabase → SQL Editor → Run
-- ============================================================

-- 1. Drop old table & trigger if they exist (clean slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT,
  email      TEXT,
  role       TEXT CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff')),
  status     TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone (including anon key) to READ profiles (needed for role lookup)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow authenticated users to INSERT their own profile row
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile row
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Trigger: auto-create profile when a new Supabase Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Receptionist'),
    'Active'
  )
  ON CONFLICT (id) DO NOTHING;   -- safe to call multiple times
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DONE! Your database is ready.
-- After running this:
--   1. Go to Authentication → Settings → Disable email confirmation (for dev)
--   2. Register at /register with any role
--   3. Login → auto-redirected to the correct dashboard
-- ============================================================
