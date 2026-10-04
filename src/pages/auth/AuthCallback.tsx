import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import "./auth.css";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const code = params.get("code");
      const isRecovery = params.get("type") === "recovery" || hashParams.get("type") === "recovery";
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(getAuthErrorMessage(exchangeError));
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError(sessionError ? getAuthErrorMessage(sessionError) : "We couldn't finish signing you in.");
        return;
      }
      navigate(isRecovery ? "/reset-password" : "/", { replace: true });
    };

    void completeAuth();
  }, [navigate]);

  return <main className="pulse-auth-page"><div className="pulse-auth-shell"><div className="pulse-auth-brand"><span className="pulse-auth-mark"><i /><i /><i /></span><span>PulseWindow</span></div><div className="pulse-auth-card pulse-auth-status"><div className="pulse-auth-status-icon">{error ? "!" : "✓"}</div><p className="pulse-auth-kicker">ACCOUNT CHECKPOINT</p><h1>{error ? "That link needs another try." : "Getting you inside."}</h1><p>{error ?? "Your session is being confirmed. You’ll be back in the app in a moment."}</p>{error && <Link className="pulse-auth-button" to="/auth/sign-in">Return to sign in</Link>}</div></div></main>;
};

export default AuthCallback;
