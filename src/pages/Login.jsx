import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/admin";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await signIn({ email, password });
    } catch (signInError) {
      setMessage(signInError.message || "No se pudo iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-16 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-400 mb-3">Acceso</p>
        <h1 className="text-4xl font-semibold mb-4">Entrar al administrador</h1>
        <p className="text-neutral-300 mb-8">
          Usa tu usuario para administrar fotos, videos y categorias.
        </p>

        {!isSupabaseConfigured ? (
          <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Falta configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en tu archivo `.env`.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-neutral-300">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              placeholder="admin@correo.com"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-300">Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              placeholder="Tu contrasena"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || loading || !isSupabaseConfigured}
            className="w-full rounded-full bg-white px-4 py-3 font-semibold text-neutral-950 disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Iniciar sesion"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
        {!message && error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </div>
    </section>
  );
}
