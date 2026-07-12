import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/cars", label: "الأسطول" },
  { to: "/test-drive", label: "تجربة قيادة" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-onyx/80 backdrop-blur-md border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-display font-bold tracking-widest text-gold">
          الـقـمـة
        </Link>

        <div className="hidden md:flex gap-10 text-sm font-medium tracking-wide text-white/70">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: l.to === "/" }}
              className="hover:text-gold transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Link to="/test-drive" className="btn-outline-gold px-6 py-2 text-sm font-bold rounded">
            حجز تجربة
          </Link>
        </div>

        <button
          className="md:hidden text-gold"
          onClick={() => setOpen((o) => !o)}
          aria-label="القائمة"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold/10 bg-onyx">
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/test-drive"
              onClick={() => setOpen(false)}
              className="btn-outline-gold px-6 py-2 text-sm font-bold rounded text-center"
            >
              حجز تجربة
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
