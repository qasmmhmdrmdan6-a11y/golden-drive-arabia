import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { fetchCars } from "@/lib/cars";
import { supabase } from "@/integrations/supabase/client";
import steering from "@/assets/steering.jpg";

const searchSchema = z.object({ car: z.string().optional() });

export const Route = createFileRoute("/test-drive")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "احجز تجربة قيادة — القمة موتورز" },
      { name: "description", content: "احجز موعداً لتجربة قيادة إحدى سياراتنا الفاخرة." },
    ],
  }),
  component: TestDrivePage,
});

const bookingSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(100),
  phone: z.string().trim().min(6, "رقم الجوال مطلوب").max(20),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255).optional().or(z.literal("")),
  preferred_date: z.string().optional(),
  car_id: z.string().uuid().optional(),
  message: z.string().max(500).optional(),
});

function TestDrivePage() {
  const search = Route.useSearch();
  const { data: cars = [] } = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: String(fd.get("full_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      preferred_date: String(fd.get("preferred_date") ?? "") || undefined,
      car_id: String(fd.get("car_id") ?? "") || undefined,
      message: String(fd.get("message") ?? "") || undefined,
    };
    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("test_drives").insert({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      preferred_date: parsed.data.preferred_date ?? null,
      car_id: parsed.data.car_id ?? null,
      message: parsed.data.message ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("تعذر إرسال الحجز. حاول مرة أخرى.");
      return;
    }
    setDone(true);
    toast.success("تم استلام حجزك، سنتواصل معك قريباً.");
  }

  return (
    <div className="bg-onyx text-white min-h-screen font-body" dir="rtl">
      <SiteHeader />

      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-gold font-bold tracking-widest uppercase text-xs block mb-4">
              تجربة قيادة
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
              اشعر بقوة الأداء
              <br />
              <span className="text-gold">خلف المقود</span>
            </h1>
            <p className="text-white/60 mb-10 leading-relaxed">
              املأ النموذج التالي وسيتواصل معك أحد مستشارينا لتأكيد موعد تجربة القيادة
              الخاصة بك في أقرب وقت.
            </p>
            <div className="hidden md:block aspect-[3/4] overflow-hidden bg-charcoal max-w-md">
              <img src={steering} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>

          <div className="bg-charcoal/60 border border-gold/10 p-8 md:p-10 rounded">
            {done ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-display font-bold text-gold mb-4">شكراً لك!</h2>
                <p className="text-white/70">تم استلام طلبك بنجاح. سنتواصل معك خلال 24 ساعة.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <Field label="الاسم الكامل" name="full_name" required />
                <Field label="رقم الجوال" name="phone" type="tel" required />
                <Field label="البريد الإلكتروني (اختياري)" name="email" type="email" />
                <Field label="التاريخ المفضل" name="preferred_date" type="date" />
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    السيارة المفضلة
                  </label>
                  <select
                    name="car_id"
                    defaultValue={search.car ?? ""}
                    className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
                  >
                    <option value="">اختر السيارة (اختياري)</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} — {c.year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
                  />
                </div>
                <button
                  disabled={submitting}
                  className="btn-gold w-full py-4 rounded font-bold text-lg disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "تأكيد الحجز"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
      />
    </div>
  );
}
