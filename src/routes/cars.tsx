import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CarImage } from "@/components/car-image";
import { fetchCars, formatMileage, formatPrice } from "@/lib/cars";

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "أسطول السيارات الفاخرة — القمة موتورز" },
      { name: "description", content: "تصفح مجموعتنا الحصرية من السيارات الفاخرة المتوفرة." },
      { property: "og:title", content: "أسطول السيارات الفاخرة — القمة موتورز" },
    ],
  }),
  component: CarsPage,
});

function CarsPage() {
  const { data: cars = [], isLoading } = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [fuel, setFuel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const brands = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))), [cars]);
  const fuels = useMemo(() => Array.from(new Set(cars.map((c) => c.fuel))), [cars]);

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (q && !`${c.brand} ${c.model}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (brand && c.brand !== brand) return false;
      if (fuel && c.fuel !== fuel) return false;
      if (maxPrice && c.price > Number(maxPrice)) return false;
      return true;
    });
  }, [cars, q, brand, fuel, maxPrice]);

  return (
    <div className="bg-onyx text-white min-h-screen font-body" dir="rtl">
      <SiteHeader />

      <div className="pt-32 pb-16 border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-6">
          <span className="text-gold font-bold tracking-widest uppercase text-xs block mb-3">
            المجموعة الكاملة
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold">الأسطول</h1>
          <p className="text-white/50 mt-4 max-w-xl">
            استعرض جميع السيارات الفاخرة المتوفرة حالياً في صالة العرض.
          </p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="relative md:col-span-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن سيارة..."
              className="w-full bg-charcoal border border-white/10 pr-10 pl-4 py-3 focus:border-gold outline-none transition rounded text-sm"
            />
          </div>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-charcoal border border-white/10 px-4 py-3 focus:border-gold outline-none transition rounded text-sm"
          >
            <option value="">كل الماركات</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="bg-charcoal border border-white/10 px-4 py-3 focus:border-gold outline-none transition rounded text-sm"
          >
            <option value="">نوع الوقود</option>
            {fuels.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            placeholder="السعر الأقصى (ر.س)"
            className="bg-charcoal border border-white/10 px-4 py-3 focus:border-gold outline-none transition rounded text-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-white/50 text-center py-20">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-white/50 text-center py-20">لا توجد سيارات مطابقة للبحث.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((car) => (
              <Link
                key={car.id}
                to="/cars/$id"
                params={{ id: car.id }}
                className="group block"
              >
                <div className="overflow-hidden aspect-[4/3] bg-charcoal mb-6">
                  <CarImage
                    car={car}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <h3 className="text-xl font-display font-bold mb-1">
                  {car.brand} {car.model}
                </h3>
                <p className="text-white/40 text-sm mb-3">
                  {car.year} • {formatMileage(car.mileage)} • {car.fuel}
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-gold font-bold">{formatPrice(car.price)}</span>
                  <span className="text-xs text-white/40">التفاصيل ←</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
