import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import "./auth.css";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

const AuthPage = () => {
  const { path = "sign-in" } = useParams();
  const navigate = useNavigate();
  const mode: AuthMode = path === "sign-up" || path === "forgot-password" ? path : "sign-in";
  const callbackUrl = new URL("/auth/callback", window.location.origin).href;
  const resetUrl = new URL("/reset-password", window.location.origin).href;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = mode === "sign-up"
    ? { kicker: "CREATE YOUR BASE", title: "Start where you are.", subtitle: "Create your PulseWindow account after your first win." }
    : mode === "forgot-password"
      ? { kicker: "PASSWORD RESET", title: "Find your way back.", subtitle: "We’ll send a secure link to reset your password." }
      : { kicker: "HYBRID TRAINING OS", title: "Welcome back.", subtitle: "Your next good window is closer than you think." };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName }, emailRedirectTo: callbackUrl },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          navigate("/", { replace: true });
        } else {
          setMessage("Check your email to confirm your account, then come back to PulseWindow.");
        }
      } else if (mode === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetUrl });
        if (resetError) throw resetError;
        setMessage("If an account exists for that email, a reset link is on its way.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate("/", { replace: true });
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="pulse-auth-page"><div className="pulse-auth-shell"><div className="pulse-auth-brand"><span className="pulse-auth-mark"><i /><i /><i /></span><span>PulseWindow</span></div><div className="pulse-auth-card"><Link className="pulse-auth-back" to="/">Back to guest mode</Link><div className="pulse-auth-heading"><p className="pulse-auth-kicker">{copy.kicker}</p><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>{mode === "forgot-password" ? <form className="pulse-reset-form" onSubmit={handleSubmit}><label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{error && <p className="pulse-auth-error">{error}</p>}{message && <p className="pulse-auth-success">{message}</p>}<button className="pulse-auth-button" disabled={isSubmitting} type="submit">{isSubmitting ? "Sending link…" : "Send reset link"}</button><Link className="pulse-auth-inline-link" to="/auth/sign-in">Back to sign in</Link></form> : <form className="pulse-reset-form" onSubmit={handleSubmit}>{mode === "sign-up" && <label>Display name<input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}<label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required minLength={6} type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="pulse-auth-error">{error}</p>}{message && <p className="pulse-auth-success">{message}</p>}<button className="pulse-auth-button" disabled={isSubmitting} type="submit">{isSubmitting ? "Working…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>{mode === "sign-in" && <Link className="pulse-auth-inline-link" to="/auth/forgot-password">Forgot your password?</Link>}</form>}<p className="pulse-auth-switch">{mode === "sign-up" ? <>Already have an account? <Link to="/auth/sign-in">Sign in</Link></> : mode === "forgot-password" ? <>Need an account? <Link to="/auth/sign-up">Create one</Link></> : <>New here? <Link to="/auth/sign-up">Create an account</Link></>}</p></div><p className="pulse-auth-footnote">You can keep using guest mode without creating an account.</p></div></main>;
};

export default AuthPage;
