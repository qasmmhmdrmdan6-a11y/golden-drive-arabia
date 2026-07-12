import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CarForm } from "@/components/car-form";
import { useRequireAdmin } from "@/lib/auth";
import { fetchCar } from "@/lib/cars";

export const Route = createFileRoute("/admin/cars/$id/edit")({
  component: EditCarPage,
});

function EditCarPage() {
  const { id } = Route.useParams();
  const admin = useRequireAdmin();
  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: () => fetchCar(id),
    enabled: admin.isAdmin,
  });

  if (admin.loading || isLoading) {
    return <div className="min-h-screen bg-onyx grid place-items-center text-white/50">جاري التحميل...</div>;
  }
  if (!car) {
    return <div className="min-h-screen bg-onyx grid place-items-center text-white/50">السيارة غير موجودة.</div>;
  }

  return (
    <div className="min-h-screen bg-onyx text-white font-body" dir="rtl">
      <header className="border-b border-gold/10 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-display font-bold text-gold">
            لوحة التحكم
          </Link>
          <Link to="/admin" className="text-sm text-white/60 hover:text-gold">← رجوع</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display font-bold mb-2">
          تعديل: {car.brand} {car.model}
        </h1>
        <p className="text-white/50 mb-8 text-sm">موديل {car.year}</p>
        <CarForm initial={car} carId={car.id} />
      </main>
    </div>
  );
}
