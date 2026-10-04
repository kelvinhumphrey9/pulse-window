import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

type AuthProfile = {
  display_name: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: AuthProfile | null;
  isPending: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue>({ session: null, profile: null, isPending: true, error: null });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(getAuthErrorMessage(sessionError));
      setSession(data.session);
      setIsPending(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
      setIsPending(false);
      if (event === "PASSWORD_RECOVERY") navigate("/reset-password", { replace: true });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    let mounted = true;
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle().then(({ data }) => {
      if (mounted) setProfile(data ? { display_name: data.display_name } : null);
    });

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  const value = useMemo(() => ({ session, profile, isPending, error }), [session, profile, isPending, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
