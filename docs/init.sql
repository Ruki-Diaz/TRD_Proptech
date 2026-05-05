-- Create Enum Types
CREATE TYPE property_purpose AS ENUM ('sale', 'rent');
CREATE TYPE property_group AS ENUM ('land', 'house', 'apartment', 'commercial', 'annex');
CREATE TYPE size_unit AS ENUM ('perches', 'acres', 'sqft');
CREATE TYPE listing_status AS ENUM ('available', 'sold', 'rented');
CREATE TYPE listing_source AS ENUM ('owner', 'agent');

-- Create Properties Table
CREATE TABLE public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    purpose property_purpose NOT NULL,
    property_type property_group NOT NULL,
    price NUMERIC NOT NULL,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    land_size NUMERIC,
    land_size_unit size_unit DEFAULT 'perches',
    bedrooms INT,
    bathrooms INT,
    area_sqft NUMERIC,
    features TEXT[] DEFAULT '{}',
    main_image_url TEXT,
    image_urls TEXT[] DEFAULT '{}',
    agent_name TEXT,
    whatsapp_number TEXT,
    phone_number TEXT,
    status listing_status DEFAULT 'available',
    listed_by listing_source DEFAULT 'agent',
    is_verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Seed Mock Data
INSERT INTO public.properties (
  slug, title, description, purpose, property_type, price, district, city, 
  address, land_size, land_size_unit, bedrooms, bathrooms, area_sqft, features, 
  main_image_url, image_urls, agent_name, whatsapp_number, phone_number, status, listed_by, is_verified, featured, is_published
) VALUES
(
  'brand-new-luxury-house-colombo-6', 
  'Brand New Luxury House in Colombo 6', 
  'A stunning newly built 4-bedroom luxury house with modern amenities, a rooftop terrace, and parking for 2 vehicles. Located in a highly residential and peaceful neighborhood.', 
  'sale', 'house', 
  85000000, 
  'Colombo', 'Colombo 6', 
  'Marine Drive', 
  10, 'perches', 
  4, 3, 3200, 
  ARRAY['Air Conditioning', 'Rooftop Terrace', 'Maids Room', 'Hot Water', 'Secure Parking'],
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18efc2297?auto=format&fit=crop&w=1000&q=80'
  ],
  'Kamal Perera', '+94771234567', '0771234567', 
  'available', 'agent', true, true, true
),
(
  'prime-commercial-land-kandy', 
  'Prime Commercial Land near Kandy Lake', 
  'Highly valuable 15-perch land facing the main road. Ideal for a boutique hotel or a commercial building.', 
  'sale', 'land', 
  120000000, 
  'Kandy', 'Kandy', 
  'Lake Road', 
  15, 'perches', 
  null, null, null, 
  ARRAY['Main Road Facing', 'Clear Deeds', 'Water Connection', 'Electricity'],
  'https://images.unsplash.com/photo-1510257545934-58a43af2fd63?auto=format&fit=crop&w=1000&q=80',
  ARRAY[]::TEXT[],
  'Saman Kumara', '+94719876543', '0719876543', 
  'available', 'agent', true, true, true
),
(
  'modern-2br-apartment-nugegoda', 
  'Modern 2BR Apartment in Nugegoda', 
  'Fully furnished stylish apartment with pool and gym access. Walking distance to supermarkets and schools.', 
  'rent', 'apartment', 
  150000, 
  'Colombo', 'Nugegoda', 
  'High Level Road', 
  null, null, 
  2, 2, 1100, 
  ARRAY['Furnished', 'Swimming Pool', 'Gymnasium', '24/7 Security'],
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1542475510-d8bebe8752a7?auto=format&fit=crop&w=1000&q=80'
  ],
  'Nimali Silva', '+94765432100', '0765432100', 
  'available', 'agent', false, false, true
);
