import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-3xl font-semibold mb-4">Falta configurar login</h1>
          <p className="text-neutral-300">
            Agrega tus variables de Supabase en <code>.env</code> para proteger el admin con autenticacion.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6 text-white">
        <p className="text-neutral-300">Validando sesion...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
