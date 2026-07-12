import { createFileRoute, Link } from "@tanstack/react-router";
import { CarForm } from "@/components/car-form";
import { useRequireAdmin } from "@/lib/auth";

export const Route = createFileRoute("/admin/cars/new")({
  component: NewCarPage,
});

function NewCarPage() {
  const admin = useRequireAdmin();
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
          <Link to="/admin" className="text-sm text-white/60 hover:text-gold">← رجوع</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display font-bold mb-8">إضافة سيارة جديدة</h1>
        <CarForm />
      </main>
    </div>
  );
}
