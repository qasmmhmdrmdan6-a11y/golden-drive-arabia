import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CarImage } from "@/components/car-image";
import { fetchCar, fetchCarImages, formatMileage, formatPrice } from "@/lib/cars";
import { resolveImage } from "@/lib/image";

export const Route = createFileRoute("/cars/$id")({
  component: CarDetailPage,
  head: () => ({
    meta: [{ title: "تفاصيل السيارة — القمة موتورز" }],
  }),
});

function CarDetailPage() {
  const { id } = Route.useParams();
  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: () => fetchCar(id),
  });
  const { data: extraImages = [] } = useQuery({
    queryKey: ["car-images", id],
    queryFn: () => fetchCarImages(id),
    enabled: Boolean(car),
  });

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  useEffect(() => {
    if (!car) return;
    (async () => {
      const cover = await resolveImage(car.cover_image);
      const others = await Promise.all(extraImages.map((i) => resolveImage(i.url)));
      setGalleryUrls([cover, ...others]);
    })();
  }, [car, extraImages]);

  const [active, setActive] = useState(0);

  if (isLoading) {
    return (
      <div className="bg-onyx text-white min-h-screen" dir="rtl">
        <SiteHeader />
        <p className="pt-40 text-center text-white/50">جاري التحميل...</p>
      </div>
    );
  }
  if (!car) throw notFound();

  const mainImage = galleryUrls[active];

  return (
    <div className="bg-onyx text-white min-h-screen font-body" dir="rtl">
      <SiteHeader />

      <section className="pt-32 max-w-7xl mx-auto px-6">
        <Link to="/cars" className="text-white/40 text-sm hover:text-gold">
          ← العودة إلى الأسطول
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
          <div>
            <div className="aspect-[4/3] bg-charcoal overflow-hidden">
              {mainImage ? (
                <img src={mainImage} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
              ) : (
                <CarImage car={car} className="w-full h-full object-cover" loading="eager" />
              )}
            </div>
            {galleryUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {galleryUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`aspect-square overflow-hidden border-2 transition ${
                      i === active ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-gold text-xs font-bold uppercase tracking-widest">
              {car.status === "sold" ? "تم البيع" : "متاحة الآن"}
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-3">
              {car.brand} {car.model}
            </h1>
            <p className="text-white/50 mb-8">موديل {car.year}</p>

            <div className="text-3xl md:text-4xl font-display font-bold text-gold mb-10 pb-8 border-b border-gold/10">
              {formatPrice(car.price)}
            </div>

            <dl className="grid grid-cols-2 gap-6 mb-10">
              <SpecRow label="المسافة المقطوعة" value={formatMileage(car.mileage)} />
              <SpecRow label="نوع الوقود" value={car.fuel} />
              <SpecRow label="ناقل الحركة" value={car.transmission} />
              <SpecRow label="اللون" value={car.color || "—"} />
            </dl>

            {car.description && (
              <div className="mb-10">
                <h3 className="text-sm text-gold font-bold uppercase tracking-widest mb-4">الوصف</h3>
                <p className="text-white/70 leading-relaxed">{car.description}</p>
              </div>
            )}

            <Link
              to="/test-drive"
              search={{ car: car.id }}
              className="btn-gold w-full py-4 text-center block rounded font-bold text-lg"
            >
              احجز تجربة قيادة لهذه السيارة
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-32">
        <SiteFooter />
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/5 pb-3">
      <dt className="text-xs uppercase tracking-widest text-white/40 mb-1">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
