import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || password.length < 6) {
      toast.error("يرجى إدخال بريد وكلمة مرور صحيحة (6 أحرف على الأقل)");
      return;
    }
    setSubmitting(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("تم إنشاء الحساب، جاري تسجيل الدخول...");
      // Try to sign in immediately (auto-confirm is enabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) navigate({ to: "/admin", replace: true });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="min-h-screen bg-onyx flex items-center justify-center px-6 font-body" dir="rtl">
      <div className="w-full max-w-md bg-charcoal/60 border border-gold/10 p-10 rounded">
        <div className="text-center mb-8">
          <div className="text-3xl font-display font-bold text-gold mb-2">الـقـمـة</div>
          <p className="text-white/50 text-sm">
            {mode === "signin" ? "تسجيل دخول المسؤول" : "إنشاء حساب مسؤول"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              البريد الإلكتروني
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              كلمة المرور
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full bg-onyx border border-white/10 px-4 py-3 focus:border-gold outline-none rounded text-sm"
            />
          </div>
          <button
            disabled={submitting}
            className="btn-gold py-3 rounded font-bold mt-2 disabled:opacity-50"
          >
            {submitting ? "..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-white/50">
          {mode === "signin" ? (
            <>
              ليس لديك حساب؟{" "}
              <button onClick={() => setMode("signup")} className="text-gold hover:underline">
                إنشاء حساب
              </button>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{" "}
              <button onClick={() => setMode("signin")} className="text-gold hover:underline">
                تسجيل الدخول
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
