import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CarImage } from "@/components/car-image";
import { fetchFeaturedCars, formatPrice } from "@/lib/cars";
import heroCar from "@/assets/hero-car.jpg";
import steering from "@/assets/steering.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "القمة موتورز — أرقى السيارات الفاخرة في المملكة" },
      {
        name: "description",
        content:
          "معرض القمة للسيارات الفاخرة. مايباخ، رولز رويس، بنتلي، ولامبورغيني. احجز تجربة قيادة اليوم.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-cars"],
    queryFn: fetchFeaturedCars,
  });

  const brands = ["MAYBACH", "ROLLS-ROYCE", "BENTLEY", "LAMBORGHINI", "ASTON MARTIN", "FERRARI"];

  return (
    <div className="bg-onyx text-white min-h-screen font-body" dir="rtl">
      <SiteHeader />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroCar}
            alt="سيارة فاخرة"
            className="w-full h-full object-cover opacity-70"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/50 to-onyx/20" />
          <div className="absolute inset-0 bg-gradient-to-l from-onyx via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <span className="inline-block text-gold text-sm font-bold tracking-[0.3em] uppercase mb-6">
              معرض القمة للسيارات
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-bold leading-[1.05] mb-6">
              الفخامة تتجاوز
              <br />
              <span className="text-gold">التوقعات</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-10 font-light leading-relaxed max-w-xl">
              نقدم لك النخبة من السيارات الفاخرة التي تجمع بين القوة والجمال،
              صُممت خصيصاً لمن يقدرون التميز في أدق التفاصيل.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/cars"
                className="btn-gold px-10 py-4 text-lg rounded font-bold inline-flex items-center gap-2"
              >
                استكشف الأسطول
              </Link>
              <Link
                to="/test-drive"
                className="px-10 py-4 border border-white/20 hover:border-gold/60 hover:text-gold transition-all rounded font-medium"
              >
                حجز تجربة قيادة
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand marquee */}
      <div className="py-12 border-y border-gold/10 bg-charcoal/30 overflow-hidden">
        <div className="flex gap-16 items-center whitespace-nowrap px-6 grayscale opacity-40 animate-[marquee_40s_linear_infinite]">
          {[...brands, ...brands].map((b, i) => (
            <span key={i} className="text-2xl md:text-3xl font-display font-bold tracking-widest">
              {b}
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Featured cars */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12 md:mb-16 flex-wrap gap-4">
          <div>
            <span className="text-gold font-bold tracking-widest uppercase text-xs md:text-sm block mb-2">
              المجموعة الحصرية
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold">أحدث طرازاتنا</h2>
          </div>
          <Link
            to="/cars"
            className="text-gold border-b border-gold/20 pb-1 hover:border-gold transition-all inline-flex items-center gap-2"
          >
            مشاهدة الكل <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((car) => (
            <Link
              key={car.id}
              to="/cars/$id"
              params={{ id: car.id }}
              className="group cursor-pointer block"
            >
              <div className="overflow-hidden mb-6 aspect-[4/3] bg-charcoal">
                <CarImage
                  car={car}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">
                {car.brand} {car.model}
              </h3>
              <div className="flex justify-between items-center text-white/50 text-sm">
                <span>{car.year} • {car.fuel}</span>
                <span className="text-gold font-bold">{formatPrice(car.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Booking teaser */}
      <section className="py-24 md:py-32 bg-gold/5 border-y border-gold/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
          <div>
            <span className="text-gold font-bold tracking-widest uppercase text-xs md:text-sm block mb-4">
              تجربة قيادة حصرية
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
              اشعر بقوة الأداء
              <br />
              <span className="text-gold">خلف المقود</span>
            </h2>
            <p className="text-white/60 mb-10 leading-relaxed">
              احجز موعداً لتجربة قيادة إحدى سياراتنا الحصرية واكتشف المعنى الحقيقي
              للرفاهية والقوة على الطريق تحت إشراف مستشارينا المتخصصين.
            </p>
            <Link
              to="/test-drive"
              className="btn-gold px-10 py-4 rounded inline-block font-bold"
            >
              احجز موعدك الآن
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="aspect-[3/4] overflow-hidden bg-charcoal">
              <img
                src={steering}
                alt="مقصورة سيارة فاخرة"
                className="w-full h-full object-cover"
                width={1200}
                height={1600}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
