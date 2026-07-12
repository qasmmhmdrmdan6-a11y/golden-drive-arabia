import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Phone, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — القمة موتورز" },
      { name: "description", content: "تواصل مع فريق القمة موتورز عبر الهاتف أو البريد أو النموذج." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, "الرسالة قصيرة جداً").max(1000),
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      full_name: String(fd.get("full_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      subject: String(fd.get("subject") ?? "") || undefined,
      message: String(fd.get("message") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("تعذر إرسال الرسالة.");
      return;
    }
    setDone(true);
    toast.success("تم استلام رسالتك، شكراً للتواصل.");
  }

  return (
    <div className="bg-onyx text-white min-h-screen font-body" dir="rtl">
      <SiteHeader />

      <section className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <span className="text-gold font-bold tracking-widest uppercase text-xs block mb-3">
          تواصل معنا
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">نحن هنا لخدمتك</h1>
        <p className="text-white/60 max-w-xl mb-16">
          فريق مستشارينا مستعد للإجابة على استفساراتك حول أي من سياراتنا أو خدماتنا.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <InfoBlock icon={<MapPin className="w-5 h-5" />} title="العنوان">
              الرياض، حي النرجس، طريق الملك سلمان
              <br />
              المملكة العربية السعودية
            </InfoBlock>
            <InfoBlock icon={<Phone className="w-5 h-5" />} title="الهاتف">
              <span dir="ltr">+966 800 123 4567</span>
            </InfoBlock>
            <InfoBlock icon={<Mail className="w-5 h-5" />} title="البريد الإلكتروني">
              contact@alqimma-motors.sa
            </InfoBlock>
          </div>

          <div className="lg:col-span-2 bg-charcoal/60 border border-gold/10 p-8 md:p-10 rounded">
            {done ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-display font-bold text-gold mb-4">شكراً لك!</h2>
                <p className="text-white/70">استلمنا رسالتك وسنرد عليك قريباً.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <ContactField label="الاسم الكامل" name="full_name" required />
                  <ContactField label="البريد الإلكتروني" name="email" type="email" required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <ContactField label="رقم الجوال" name="phone" type="tel" />
                  <ContactField label="الموضوع" name="subject" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    الرسالة <span className="text-gold">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
                  />
                </div>
                <button
                  disabled={submitting}
                  className="btn-gold py-4 rounded font-bold disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال الرسالة"}
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

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-gold">
        {icon}
        <h3 className="font-display font-bold">{title}</h3>
      </div>
      <p className="text-white/60 leading-relaxed">{children}</p>
    </div>
  );
}

function ContactField({
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
