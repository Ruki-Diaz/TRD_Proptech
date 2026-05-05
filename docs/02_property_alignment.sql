DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('available', 'sold', 'rented');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_source') THEN
        CREATE TYPE listing_source AS ENUM ('owner', 'agent');
    END IF;
END $$;

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status listing_status DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS listed_by listing_source DEFAULT 'agent',
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

UPDATE public.properties
SET
    status = COALESCE(status, 'available'),
    listed_by = COALESCE(listed_by, 'agent'),
    is_verified = COALESCE(is_verified, false);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;
CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "published properties are readable by everyone" ON public.properties;
DROP POLICY IF EXISTS "authenticated users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "owners can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "owners can delete their own properties" ON public.properties;

CREATE POLICY "published properties are readable by everyone"
ON public.properties
FOR SELECT
USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "authenticated users can insert their own properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners can update their own properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners can delete their own properties"
ON public.properties
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
