import { supabase } from "@/integrations/supabase/client";

export type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  color: string;
  description: string;
  status: string;
  featured: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};

export type CarImage = {
  id: string;
  car_id: string;
  url: string;
  sort_order: number;
};

export async function fetchCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Car[];
}

export async function fetchFeaturedCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as Car[];
}

export async function fetchCar(id: string): Promise<Car | null> {
  const { data, error } = await supabase.from("cars").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Car) ?? null;
}

export async function fetchCarImages(carId: string): Promise<CarImage[]> {
  const { data, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", carId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CarImage[];
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(price) + " ر.س";
}

export function formatMileage(km: number): string {
  return new Intl.NumberFormat("ar-SA").format(km) + " كم";
}
