import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, LogOut, Mail, Calendar, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useRequireAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCars, formatPrice } from "@/lib/cars";

const STATUS_LABEL: Record<string, string> = {
  available: "متاحة",
  reserved: "محجوزة",
  sold: "مباعة",
};
const STATUS_CLASS: Record<string, string> = {
  available: "border-emerald-500/40 text-emerald-300",
  reserved: "border-amber-500/40 text-amber-300",
  sold: "border-rose-500/40 text-rose-300",
};

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const admin = useRequireAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cars = [] } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: fetchCars,
    enabled: admin.isAdmin,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_drives")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: admin.isAdmin,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: admin.isAdmin,
  });

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه السيارة؟")) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) {
      toast.error("تعذر الحذف");
      return;
    }
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["admin-cars"] });
    qc.invalidateQueries({ queryKey: ["cars"] });
    qc.invalidateQueries({ queryKey: ["featured-cars"] });
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  if (admin.loading) {
    return <div className="min-h-screen bg-onyx grid place-items-center text-white/50">جاري التحقق...</div>;
  }

  return (
    <div className="min-h-screen bg-onyx text-white font-body" dir="rtl">
      <header className="border-b border-gold/10 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-display font-bold text-gold">
            لوحة التحكم
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-white/60 text-sm hover:text-gold">
              عرض الموقع
            </Link>
            <button
              onClick={handleSignOut}
              className="text-white/60 text-sm hover:text-gold inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Cars */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold">السيارات ({cars.length})</h2>
              <p className="text-white/50 text-sm mt-1">إدارة أسطول السيارات</p>
            </div>
            <Link
              to="/admin/cars/new"
              className="btn-gold px-5 py-2.5 rounded font-bold text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> إضافة سيارة
            </Link>
          </div>
          <div className="bg-charcoal/60 border border-gold/10 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-onyx/60 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-right px-4 py-3">الماركة والموديل</th>
                  <th className="text-right px-4 py-3">السنة</th>
                  <th className="text-right px-4 py-3">السعر</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-right px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((c) => (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium">{c.brand} {c.model}</td>
                    <td className="px-4 py-3 text-white/70">{c.year}</td>
                    <td className="px-4 py-3 text-gold">{formatPrice(c.price)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded border border-white/10">
                        {c.status === "available" ? "متاحة" : "مباعة"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          to="/admin/cars/$id/edit"
                          params={{ id: c.id }}
                          className="p-2 border border-white/10 hover:border-gold hover:text-gold rounded"
                          aria-label="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 border border-white/10 hover:border-destructive hover:text-destructive rounded"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/40">
                      لا توجد سيارات بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bookings */}
        <section>
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gold" /> حجوزات تجربة القيادة ({bookings.length})
          </h2>
          <div className="grid gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-charcoal/60 border border-gold/10 p-4 rounded flex flex-wrap gap-4 justify-between">
                <div>
                  <p className="font-bold">{b.full_name}</p>
                  <p className="text-sm text-white/60" dir="ltr">{b.phone}</p>
                  {b.email && <p className="text-xs text-white/40">{b.email}</p>}
                </div>
                <div className="text-sm text-white/60 text-left">
                  <p>{b.preferred_date ?? "لم يحدد تاريخ"}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(b.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-center py-8 text-white/40">لا توجد حجوزات بعد.</p>
            )}
          </div>
        </section>

        {/* Messages */}
        <section>
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
            <Mail className="w-5 h-5 text-gold" /> رسائل التواصل ({messages.length})
          </h2>
          <div className="grid gap-3">
            {messages.map((m) => (
              <div key={m.id} className="bg-charcoal/60 border border-gold/10 p-4 rounded">
                <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <p className="font-bold">{m.full_name} — <span className="text-white/50 font-normal text-sm">{m.email}</span></p>
                  <p className="text-xs text-white/40">
                    {new Date(m.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                {m.subject && <p className="text-sm text-gold mb-1">{m.subject}</p>}
                <p className="text-white/70 text-sm whitespace-pre-line">{m.message}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center py-8 text-white/40">لا توجد رسائل بعد.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
