-- Phase 1: Role-Based Accounts Database Migration (Corrected)

-- 1. Ensure set_updated_at function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create User Role Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
    END IF;
END $$;

-- 3. Create Profiles Table (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'user',
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-update updated_at for profiles
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. Create Agent Profiles Table (Linked to profiles)
CREATE TABLE IF NOT EXISTS public.agent_profiles (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT,
    license_number TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-update updated_at for agent_profiles
DROP TRIGGER IF EXISTS agent_profiles_set_updated_at ON public.agent_profiles;
CREATE TRIGGER agent_profiles_set_updated_at
BEFORE UPDATE ON public.agent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5. Auto-Create Profile Trigger for New Signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user' -- Default role is 'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Safe Data Backfill for Existing Users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Role-Ready RLS Policies (Conservative Phase 1)

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: CONSERVATIVE RLS - Users can ONLY read and update their own profile.
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Agent Profiles: Users can ONLY read and update their own agent profile.
DROP POLICY IF EXISTS "Agents can read own profile" ON public.agent_profiles;
CREATE POLICY "Agents can read own profile" 
ON public.agent_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Agents can update own profile" ON public.agent_profiles;
CREATE POLICY "Agents can update own profile" 
ON public.agent_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = profile_id) 
WITH CHECK (auth.uid() = profile_id);

-- Properties RLS: Maintain existing permissive behavior to prevent breaking the app,
-- but ensure referential integrity by requiring the user to have a profile.
DROP POLICY IF EXISTS "authenticated users can insert their own properties" ON public.properties;
CREATE POLICY "authenticated users can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);
