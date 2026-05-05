import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

async function check() {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.find(b => b.name === 'property-images')) {
        console.log("Creating bucket...");
        const { data, error } = await supabase.storage.createBucket('property-images', { public: true });
        if (error) console.log(error);
        else console.log("Created successfully");
    } else {
        console.log("Bucket already exists");
    }
}
check();
