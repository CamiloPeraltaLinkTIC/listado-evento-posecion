"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card lift overflow-hidden rounded-2xl">
          <div className="flag-bar h-1.5 w-full" />
          <div className="p-8">
            <div className="mb-6 inline-block rounded-xl bg-white px-4 py-3 ring-1 ring-brand-500/30">
              <Image
                src="/cne-logo.png"
                alt="Consejo Nacional Electoral de Colombia"
                width={360}
                height={180}
                priority
                unoptimized
                className="h-auto w-[180px]"
              />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Control de Asistencia
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Declaración de Presidente Electo. Ingresa el token de seguridad
              para continuar.
            </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="eyebrow mb-1.5 block">
                Token de seguridad
              </label>
              <input
                type="password"
                autoFocus
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-lg border border-line bg-paper/50 px-4 py-3 font-mono text-ink outline-none transition placeholder:text-ink-faint focus:border-ink focus:bg-card"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600 animate-fade-in-up">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="glow flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-widest text-ink-faint">
          <span className="flag-bar inline-block h-2.5 w-4 rounded-[2px]" />
          Consejo Nacional Electoral
        </p>
      </div>
    </main>
  );
}
