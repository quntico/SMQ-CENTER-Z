import { supabase } from '@/lib/customSupabaseClient';

const PREFERRED_BUCKET = "logos-bucket";
const FALLBACK_BUCKETS = ["quotation-files", "logos", "public", "assets"];

let resolvedBucket = null;

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return [];
  }
  return data.map(b => b.name);
}

async function bucketExists(name) {
    try {
        const { data, error } = await supabase.storage.from(name).list('', { limit: 1 });
        if (error && error.message.includes("Bucket not found")) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

export async function getActiveBucket() {
  if (resolvedBucket) {
    return resolvedBucket;
  }

  if (await bucketExists(PREFERRED_BUCKET)) {
    resolvedBucket = PREFERRED_BUCKET;
    console.log(`Using preferred bucket: ${resolvedBucket}`);
    return resolvedBucket;
  }

  for (const bucket of FALLBACK_BUCKETS) {
    if (await bucketExists(bucket)) {
      resolvedBucket = bucket;
      console.log(`Using fallback bucket: ${resolvedBucket}`);
      return resolvedBucket;
    }
  }

  try {
    const allBuckets = await listBuckets();
    if (allBuckets.length > 0) {
      resolvedBucket = allBuckets[0];
      console.log(`Using first available bucket: ${resolvedBucket}`);
      return resolvedBucket;
    }
  } catch (e) {
    console.error("Could not find any usable bucket after listing all.", e);
  }

  console.warn("No usable Supabase Storage bucket was found. Defaulting to 'logos-bucket' as a last resort.");
  return PREFERRED_BUCKET;
}