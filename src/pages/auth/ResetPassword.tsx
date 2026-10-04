import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import "./auth.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(getAuthErrorMessage(updateError));
      return;
    }
    setMessage("Your password is updated. You can head back to your dashboard.");
  };

  return <main className="pulse-auth-page"><div className="pulse-auth-shell"><div className="pulse-auth-brand"><span className="pulse-auth-mark"><i /><i /><i /></span><span>PulseWindow</span></div><div className="pulse-auth-card"><Link className="pulse-auth-back" to="/">Back to the app</Link><div className="pulse-auth-heading"><p className="pulse-auth-kicker">SECURE RESET</p><h1>Set a new password.</h1><p>Make it memorable, then get back to your next good window.</p></div><form className="pulse-reset-form" onSubmit={handleSubmit}><label>New password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label>Confirm password<input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{error && <p className="pulse-auth-error">{error}</p>}{message && <p className="pulse-auth-success">{message}</p>}<button className="pulse-auth-button" type="submit">Update password</button></form></div></div></main>;
};

export default ResetPassword;
