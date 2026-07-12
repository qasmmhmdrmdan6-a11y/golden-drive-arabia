import { supabase } from "@/integrations/supabase/client";
import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";

const seedMap: Record<string, string> = {
  "car-1": car1,
  "car-2": car2,
  "car-3": car3,
};

const signedCache = new Map<string, string>();

/**
 * Resolve a stored image reference to a usable URL.
 * - Seed keys (car-1..3) map to bundled assets.
 * - Anything starting with http(s) is treated as a full URL.
 * - Otherwise treated as a storage path in the `car-images` bucket
 *   and turned into a long-lived signed URL.
 */
export async function resolveImage(ref: string | null | undefined): Promise<string> {
  if (!ref) return car1;
  if (seedMap[ref]) return seedMap[ref];
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;

  const cached = signedCache.get(ref);
  if (cached) return cached;

  const { data } = await supabase.storage
    .from("car-images")
    .createSignedUrl(ref, 60 * 60 * 24 * 30); // 30 days
  const url = data?.signedUrl ?? car1;
  signedCache.set(ref, url);
  return url;
}

export function resolveImageSync(ref: string | null | undefined): string | null {
  if (!ref) return car1;
  if (seedMap[ref]) return seedMap[ref];
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  return signedCache.get(ref) ?? null;
}
