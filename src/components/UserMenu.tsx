import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const UserMenu = () => {
  const { session, profile, isPending } = useAuth();
  const [open, setOpen] = useState(false);

  if (isPending) return null;

  if (!session?.user) {
    return <Link className="profile-button" aria-label="Sign in" to="/auth/sign-in"><UserRound size={16} /></Link>;
  }

  const displayName = session.user.user_metadata?.display_name || profile?.display_name || session.user.email?.split("@")[0] || "Athlete";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <div className="profile-control"><button className="profile-button" aria-label="Open profile" onClick={() => setOpen((value) => !value)}><span>{initials}</span></button>{open && <div className="profile-menu"><p className="menu-kicker">ATHLETE PROFILE</p><strong>{displayName}</strong><span>{session.user.email}</span><Link to="/profile" onClick={() => setOpen(false)}><UserRound size={14} /> Edit profile</Link><button onClick={() => { void supabase.auth.signOut(); setOpen(false); }}>Sign out <LogOut size={14} /></button><button onClick={() => setOpen(false)}>Close menu <X size={14} /></button></div>}</div>;
};

export default UserMenu;
