import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = {
  loading: boolean;
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
};

export function useRequireAdmin(): AdminState {
  const navigate = useNavigate();
  const [state, setState] = useState<AdminState>({
    loading: true,
    isAdmin: false,
    userId: null,
    email: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (!cancelled) navigate({ to: "/admin/login", replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (cancelled) return;
      if (!isAdmin) {
        navigate({ to: "/admin/login", replace: true });
        return;
      }
      setState({ loading: false, isAdmin: true, userId: user.id, email: user.email ?? null });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return state;
}
