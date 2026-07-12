import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="py-20 border-t border-gold/10 bg-onyx">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="text-3xl font-display font-bold text-gold mb-6">الـقـمـة</div>
            <p className="text-white/40 leading-relaxed text-sm">
              وجهتكم الأولى في عالم السيارات الفاخرة والنادرة في الشرق الأوسط.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">الروابط</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li><Link to="/cars" className="hover:text-gold">الأسطول</Link></li>
              <li><Link to="/test-drive" className="hover:text-gold">حجز تجربة قيادة</Link></li>
              <li><Link to="/contact" className="hover:text-gold">تواصل معنا</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">تواصل معنا</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li>الرياض، المملكة العربية السعودية</li>
              <li dir="ltr" className="text-right">+966 800 123 4567</li>
              <li>contact@alqimma-motors.sa</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">ساعات العمل</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li>السبت - الخميس: 9 ص - 10 م</li>
              <li>الجمعة: 4 م - 10 م</li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-10 border-t border-white/5 text-white/20 text-xs">
          جميع الحقوق محفوظة © {new Date().getFullYear()} شركة القمة للسيارات الفاخرة
        </div>
      </div>
    </footer>
  );
}
