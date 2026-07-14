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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const brands = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand))).sort(),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cars.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (brandFilter !== "all" && c.brand !== brandFilter) return false;
      if (featuredOnly && !c.featured) return false;
      if (q) {
        const hay = `${c.brand} ${c.model} ${c.year} ${c.color}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cars, search, statusFilter, brandFilter, featuredOnly]);

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase.from("cars").update({ featured: !current }).eq("id", id);
    if (error) {
      toast.error("تعذر التحديث");
      return;
    }
    toast.success(!current ? "تمت الإضافة إلى المميزة" : "أُزيلت من المميزة");
    qc.invalidateQueries({ queryKey: ["admin-cars"] });
    qc.invalidateQueries({ queryKey: ["cars"] });
    qc.invalidateQueries({ queryKey: ["featured-cars"] });
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/admin" className="text-lg sm:text-xl font-display font-bold text-gold truncate">
            لوحة التحكم
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link to="/" className="text-white/60 text-xs sm:text-sm hover:text-gold">
              عرض الموقع
            </Link>
            <button
              onClick={handleSignOut}
              className="text-white/60 text-xs sm:text-sm hover:text-gold inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Cars */}
        <section>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-bold">السيارات ({filteredCars.length}/{cars.length})</h2>
              <p className="text-white/50 text-xs sm:text-sm mt-1">إدارة أسطول السيارات</p>
            </div>
            <Link
              to="/admin/cars/new"
              className="btn-gold px-3 sm:px-5 py-2.5 rounded font-bold text-sm inline-flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">إضافة سيارة</span>
              <span className="sm:hidden">إضافة</span>
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث: ماركة، موديل، لون..."
                className="w-full bg-charcoal/60 border border-white/10 focus:border-gold outline-none rounded pr-10 pl-3 py-2.5 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-charcoal/60 border border-white/10 focus:border-gold outline-none rounded px-3 py-2.5 text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="available">متاحة</option>
              <option value="reserved">محجوزة</option>
              <option value="sold">مباعة</option>
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-charcoal/60 border border-white/10 focus:border-gold outline-none rounded px-3 py-2.5 text-sm"
            >
              <option value="all">كل الماركات</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 bg-charcoal/60 border border-white/10 rounded px-3 py-2.5 text-sm cursor-pointer hover:border-gold/40">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="accent-[color:var(--color-gold)]"
              />
              <span>المميزة فقط</span>
            </label>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-charcoal/60 border border-gold/10 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-onyx/60 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-right px-4 py-3">الماركة والموديل</th>
                  <th className="text-right px-4 py-3">السنة</th>
                  <th className="text-right px-4 py-3">السعر</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-right px-4 py-3">مميّزة</th>
                  <th className="text-right px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map((c) => (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium">{c.brand} {c.model}</td>
                    <td className="px-4 py-3 text-white/70">{c.year}</td>
                    <td className="px-4 py-3 text-gold whitespace-nowrap">{formatPrice(c.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded border ${STATUS_CLASS[c.status] ?? "border-white/10"}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFeatured(c.id, c.featured)}
                        aria-label="تبديل المميزة"
                        className="p-1.5 rounded hover:bg-white/5"
                      >
                        <Star className={`w-4 h-4 ${c.featured ? "fill-gold text-gold" : "text-white/30"}`} />
                      </button>
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
                {filteredCars.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white/40">
                      لا توجد نتائج.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filteredCars.map((c) => (
              <div key={c.id} className="bg-charcoal/60 border border-gold/10 rounded p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{c.brand} {c.model}</p>
                    <p className="text-xs text-white/50 mt-0.5">{c.year} • {c.color || "—"}</p>
                    <p className="text-gold text-sm mt-2 font-bold">{formatPrice(c.price)}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_CLASS[c.status] ?? "border-white/10"}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      {c.featured && (
                        <span className="text-[10px] px-2 py-0.5 rounded border border-gold/40 text-gold inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-gold" /> مميزة
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => toggleFeatured(c.id, c.featured)}
                      className="p-2 border border-white/10 rounded"
                      aria-label="تبديل المميزة"
                    >
                      <Star className={`w-4 h-4 ${c.featured ? "fill-gold text-gold" : "text-white/40"}`} />
                    </button>
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
                </div>
              </div>
            ))}
            {filteredCars.length === 0 && (
              <p className="text-center py-8 text-white/40 text-sm">لا توجد نتائج.</p>
            )}
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
