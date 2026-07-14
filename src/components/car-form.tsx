import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/image";
import type { Car } from "@/lib/cars";

const currentYear = new Date().getFullYear();
const carSchema = z.object({
  brand: z.string().trim().min(1, "الماركة مطلوبة").max(60, "الماركة طويلة جداً"),
  model: z.string().trim().min(1, "الموديل مطلوب").max(80, "الموديل طويل جداً"),
  year: z
    .number({ invalid_type_error: "أدخل سنة صحيحة" })
    .int("سنة غير صحيحة")
    .min(1950, "السنة يجب أن تكون بعد 1950")
    .max(currentYear + 1, `السنة يجب ألا تتجاوز ${currentYear + 1}`),
  price: z
    .number({ invalid_type_error: "أدخل سعراً صحيحاً" })
    .positive("السعر يجب أن يكون أكبر من صفر")
    .max(100_000_000, "السعر غير معقول"),
  mileage: z
    .number({ invalid_type_error: "أدخل مسافة صحيحة" })
    .min(0, "المسافة لا يمكن أن تكون سالبة")
    .max(2_000_000, "المسافة غير معقولة"),
  fuel: z.string().min(1),
  transmission: z.string().min(1),
  color: z.string().trim().max(40, "اللون طويل جداً"),
  description: z.string().trim().max(2000, "الوصف طويل جداً"),
  status: z.enum(["available", "sold", "reserved"]),
  featured: z.boolean(),
  cover_image: z.string().nullable(),
});

export type CarFormValues = {
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
};

export function CarForm({ initial, carId }: { initial?: Car; carId?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [values, setValues] = useState<CarFormValues>({
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    year: initial?.year ?? new Date().getFullYear(),
    price: initial?.price ?? 0,
    mileage: initial?.mileage ?? 0,
    fuel: initial?.fuel ?? "بنزين",
    transmission: initial?.transmission ?? "أوتوماتيك",
    color: initial?.color ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "available",
    featured: initial?.featured ?? false,
    cover_image: initial?.cover_image ?? null,
  });
  const [gallery, setGallery] = useState<{ id?: string; path: string; preview: string }[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.cover_image) {
      resolveImage(initial.cover_image).then(setCoverPreview);
    }
  }, [initial?.cover_image]);

  useEffect(() => {
    if (!carId) return;
    (async () => {
      const { data } = await supabase
        .from("car_images")
        .select("*")
        .eq("car_id", carId)
        .order("sort_order");
      if (!data) return;
      const enriched = await Promise.all(
        data.map(async (row) => ({
          id: row.id,
          path: row.url,
          preview: await resolveImage(row.url),
        })),
      );
      setGallery(enriched);
    })();
  }, [carId]);

  function up<K extends keyof CarFormValues>(k: K, v: CarFormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function uploadFile(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("تعذر رفع الملف: " + error.message);
      return null;
    }
    return path;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (path) {
      up("cover_image", path);
      const url = await resolveImage(path);
      setCoverPreview(url);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const results: { path: string; preview: string }[] = [];
    for (const f of files) {
      const path = await uploadFile(f);
      if (path) results.push({ path, preview: await resolveImage(path) });
    }
    setUploading(false);
    setGallery((g) => [...g, ...results]);
  }

  function removeGalleryItem(idx: number) {
    setGallery((g) => g.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let id = carId;
    if (id) {
      const { error } = await supabase.from("cars").update(values).eq("id", id);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from("cars").insert(values).select().single();
      if (error || !data) {
        setSaving(false);
        toast.error(error?.message ?? "خطأ");
        return;
      }
      id = data.id;
    }

    // Sync gallery
    if (id) {
      const { data: existing } = await supabase.from("car_images").select("id").eq("car_id", id);
      const keepIds = new Set(gallery.filter((g) => g.id).map((g) => g.id!));
      const removeIds = (existing ?? []).map((r) => r.id).filter((rid) => !keepIds.has(rid));
      if (removeIds.length > 0) {
        await supabase.from("car_images").delete().in("id", removeIds);
      }
      const toInsert = gallery
        .filter((g) => !g.id)
        .map((g, i) => ({ car_id: id!, url: g.path, sort_order: i }));
      if (toInsert.length > 0) {
        await supabase.from("car_images").insert(toInsert);
      }
    }

    setSaving(false);
    toast.success(carId ? "تم التحديث" : "تمت إضافة السيارة");
    qc.invalidateQueries({ queryKey: ["admin-cars"] });
    qc.invalidateQueries({ queryKey: ["cars"] });
    qc.invalidateQueries({ queryKey: ["featured-cars"] });
    navigate({ to: "/admin" });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto grid gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="الماركة" required>
          <input
            required
            value={values.brand}
            onChange={(e) => up("brand", e.target.value)}
            className="input"
          />
        </FormField>
        <FormField label="الموديل" required>
          <input
            required
            value={values.model}
            onChange={(e) => up("model", e.target.value)}
            className="input"
          />
        </FormField>
        <FormField label="السنة" required>
          <input
            required
            type="number"
            value={values.year}
            onChange={(e) => up("year", Number(e.target.value))}
            className="input"
          />
        </FormField>
        <FormField label="السعر (ر.س)" required>
          <input
            required
            type="number"
            value={values.price}
            onChange={(e) => up("price", Number(e.target.value))}
            className="input"
          />
        </FormField>
        <FormField label="المسافة المقطوعة (كم)">
          <input
            type="number"
            value={values.mileage}
            onChange={(e) => up("mileage", Number(e.target.value))}
            className="input"
          />
        </FormField>
        <FormField label="اللون">
          <input
            value={values.color}
            onChange={(e) => up("color", e.target.value)}
            className="input"
          />
        </FormField>
        <FormField label="نوع الوقود">
          <select value={values.fuel} onChange={(e) => up("fuel", e.target.value)} className="input">
            <option>بنزين</option>
            <option>ديزل</option>
            <option>هجين</option>
            <option>كهربائي</option>
          </select>
        </FormField>
        <FormField label="ناقل الحركة">
          <select value={values.transmission} onChange={(e) => up("transmission", e.target.value)} className="input">
            <option>أوتوماتيك</option>
            <option>يدوي</option>
          </select>
        </FormField>
        <FormField label="الحالة">
          <select value={values.status} onChange={(e) => up("status", e.target.value)} className="input">
            <option value="available">متاحة</option>
            <option value="sold">مباعة</option>
          </select>
        </FormField>
        <FormField label="مميّزة (تظهر في الصفحة الرئيسية)">
          <label className="flex items-center gap-2 h-[46px] px-4 bg-onyx border border-white/10 rounded">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => up("featured", e.target.checked)}
              className="accent-[color:var(--color-gold)]"
            />
            <span className="text-sm text-white/70">إضافة إلى المميزة</span>
          </label>
        </FormField>
      </div>

      <FormField label="الوصف">
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => up("description", e.target.value)}
          className="input min-h-[100px]"
        />
      </FormField>

      <FormField label="صورة الغلاف">
        <div className="flex items-center gap-4 flex-wrap">
          {coverPreview && (
            <img src={coverPreview} alt="" className="w-32 h-24 object-cover rounded border border-gold/20" />
          )}
          <label className="btn-outline-gold px-4 py-2 rounded cursor-pointer inline-flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> رفع صورة
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>
        </div>
      </FormField>

      <FormField label="صور إضافية (معرض السيارة)">
        <div>
          <label className="btn-outline-gold px-4 py-2 rounded cursor-pointer inline-flex items-center gap-2 text-sm mb-4">
            <Upload className="w-4 h-4" /> رفع صور متعددة
            <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map((g, i) => (
              <div key={i} className="relative">
                <img src={g.preview} alt="" className="w-full aspect-square object-cover rounded border border-white/10" />
                <button
                  type="button"
                  onClick={() => removeGalleryItem(i)}
                  className="absolute top-1 left-1 bg-onyx/80 hover:bg-destructive p-1 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </FormField>

      {uploading && <p className="text-gold text-sm">جاري رفع الصور...</p>}

      <div className="flex gap-3 pt-4 border-t border-gold/10">
        <button
          disabled={saving || uploading}
          className="btn-gold px-8 py-3 rounded font-bold disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : carId ? "حفظ التعديلات" : "إضافة السيارة"}
        </button>
        <Link to="/admin" className="px-8 py-3 border border-white/10 rounded hover:border-white/30">
          إلغاء
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--color-onyx);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.75rem 1rem;
          border-radius: 0.25rem;
          color: white;
          outline: none;
          font-size: 0.875rem;
        }
        .input:focus { border-color: var(--color-gold); }
      `}</style>
    </form>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children}
    </div>
  );
}
