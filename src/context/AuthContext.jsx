import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
        }

        setSession(data.session || null);
        setLoading(false);
      })
      .catch((sessionError) => {
        if (!mounted) {
          return;
        }

        setError(sessionError.message || "No se pudo recuperar la sesion.");
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      throw new Error("Faltan las variables de Supabase para usar login.");
    }

    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }

    setSession(data.session || null);
    return data.session;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }

    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.user),
      loading,
      error,
      signIn,
      signOut,
    }),
    [session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
