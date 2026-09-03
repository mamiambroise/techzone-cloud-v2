import React, { useState } from "react";
import {
  ArrowRight,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ApiNotImplementedAlert } from "../common/ApiNotImplementedAlert";

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("admin@techzone.io");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missingRole, setMissingRole] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Saisissez une adresse email valide.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login({ email: email.trim() });
    if (!result.success)
      setError(
        result.error?.message || "Le backend n’a pas pu ouvrir la session.",
      );
    setLoading(false);
  };

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,_#1d4ed8,_#020617_58%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-sm font-extrabold tracking-wide">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <Layers3 className="h-5 w-5" />
          </span>
          Techzone Pack Platform
        </div>
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-300">
            BM · PM · PR
          </p>
          <h1 className="text-5xl font-black leading-tight">
            Définir, publier et résoudre sans ambiguïté.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Une seule chaîne de données, du contrat métier au manifest Runtime
            effectif.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Les identifiants de session sont émis exclusivement par le backend.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-white p-7 shadow-2xl sm:p-9">
          <div className="mb-7">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Session de développement
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Accéder à la plateforme
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le rôle, le tenant et les permissions proviennent du JWT signé par
              NestJS.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="block text-xs font-bold text-slate-700">
              Email
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  autoComplete="username"
                />
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"
              >
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {loading ? "Connexion…" : "Ouvrir la session"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() =>
                setMissingRole("réinitialiser le mot de passe utilisateur")
              }
              className="hover:text-blue-600"
            >
              Mot de passe oublié
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                setMissingRole("créer et enregistrer un nouvel utilisateur IAM")
              }
              className="hover:text-blue-600"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </section>

      {missingRole && (
        <ApiNotImplementedAlert
          role={missingRole}
          expectedEndpoint="POST /api/v1/auth/..."
          cdc="BM-CDC-00"
          technicalDetails="Le fournisseur IAM contractuel n’est pas encore raccordé. Aucun compte ni jeton de réinitialisation n’est créé dans le navigateur."
          onClose={() => setMissingRole("")}
        />
      )}
    </main>
  );
}
