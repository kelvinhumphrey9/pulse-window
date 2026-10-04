import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import "./auth.css";

const AuthPage = () => {
  const { path = "sign-in" } = useParams();
  const callbackUrl = new URL("/auth/callback", window.location.origin).href;
  const title = path === "sign-up" ? "Start where you are." : "Welcome back.";
  const subtitle = path === "sign-up" ? "Create your PulseWindow account after your first win." : "Your next good window is closer than you think.";

  return (
    <main className="pulse-auth-page">
      <div className="pulse-auth-shell">
        <div className="pulse-auth-brand"><span className="pulse-auth-mark"><i /><i /><i /></span><span>PulseWindow</span></div>
        <div className="pulse-auth-card">
          <Link className="pulse-auth-back" to="/">Back to guest mode</Link>
          <div className="pulse-auth-heading"><p className="pulse-auth-kicker">HYBRID TRAINING OS</p><h1>{title}</h1><p>{subtitle}</p></div>
          <Auth
            supabaseClient={supabase}
            redirectTo={callbackUrl}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#b8f34a",
                    brandAccent: "#9ed936",
                    brandButtonText: "#11182a",
                    inputText: "#11182a",
                    inputPlaceholder: "#8a929e",
                    inputBackground: "#f4f6ef",
                    inputBorder: "#dfe4d9",
                  },
                  radii: { borderRadiusButton: "12px", inputBorderRadius: "12px" },
                },
              },
              className: { container: "pulse-auth-ui" },
            }}
            theme="light"
          />
        </div>
        <p className="pulse-auth-footnote">You can keep using guest mode without creating an account.</p>
      </div>
    </main>
  );
};

export default AuthPage;
