import { FormEvent, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import "./auth/auth.css";

type ProfileForm = {
  display_name: string;
  fitness_goal: string;
  preferred_mode: "lift" | "run" | "hybrid";
};

const Profile = () => {
  const { session, isPending } = useAuth();
  const [form, setForm] = useState<ProfileForm>({ display_name: "", fitness_goal: "", preferred_mode: "hybrid" });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    supabase.from("profiles").select("display_name, fitness_goal, preferred_mode").eq("id", session.user.id).maybeSingle().then(({ data, error: loadError }) => {
      if (loadError) {
        setError(getAuthErrorMessage(loadError));
        return;
      }
      setForm({
        display_name: data?.display_name || session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "",
        fitness_goal: data?.fitness_goal || "",
        preferred_mode: data?.preferred_mode === "lift" || data?.preferred_mode === "run" ? data.preferred_mode : "hybrid",
      });
    });
  }, [session]);

  if (isPending) return null;
  if (!session?.user) return <Navigate to="/auth/sign-in" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    const { error: saveError } = await supabase.from("profiles").upsert({ id: session.user.id, ...form, updated_at: new Date().toISOString() });
    if (saveError) {
      setError(getAuthErrorMessage(saveError));
      return;
    }
    const { error: metadataError } = await supabase.auth.updateUser({ data: { display_name: form.display_name } });
    if (metadataError) {
      setError(getAuthErrorMessage(metadataError));
      return;
    }
    setStatus("Profile saved.");
  };

  return <main className="pulse-auth-page"><div className="pulse-auth-shell"><div className="pulse-auth-brand"><span className="pulse-auth-mark"><i /><i /><i /></span><span>PulseWindow</span></div><div className="pulse-auth-card"><Link className="pulse-auth-back" to="/">Back to dashboard</Link><div className="pulse-auth-heading"><p className="pulse-auth-kicker">ATHLETE PROFILE</p><h1>Make it yours.</h1><p>Your preferences help PulseWindow shape better training moments.</p></div><form className="pulse-reset-form" onSubmit={handleSubmit}><label>Display name<input required value={form.display_name} onChange={(event) => setForm((value) => ({ ...value, display_name: event.target.value }))} /></label><label>What are you working toward?<input placeholder="Build a steady hybrid habit" value={form.fitness_goal} onChange={(event) => setForm((value) => ({ ...value, fitness_goal: event.target.value }))} /></label><label>Preferred mode<select value={form.preferred_mode} onChange={(event) => setForm((value) => ({ ...value, preferred_mode: event.target.value as ProfileForm["preferred_mode"] }))}><option value="hybrid">Hybrid</option><option value="lift">Lift</option><option value="run">Run</option></select></label>{error && <p className="pulse-auth-error">{error}</p>}{status && <p className="pulse-auth-success">{status}</p>}<button className="pulse-auth-button" type="submit">Save profile</button></form></div></div></main>;
};

export default Profile;
