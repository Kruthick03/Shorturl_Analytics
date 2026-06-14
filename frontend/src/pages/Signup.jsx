import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, Link2, ArrowRight, AlertTriangle } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  // Detect Caps Lock key state
  function handleKeyDown(event) {
    if (event.getModifierState && event.getModifierState("CapsLock")) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(form.name, form.email, form.password);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-12 overflow-hidden bg-slate-950 text-white font-sans">
      
      {/* Left Column: Product Showcase Panel (Visible on desktop) */}
      <section className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/50">
        {/* Glow meshes */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand logo */}
        <div className="flex items-center gap-2.5 font-black text-xl text-emerald-400 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Link2 size={20} className="stroke-[3]" />
          </div>
          <span>ShortURL Analytics</span>
        </div>

        {/* Value Propositions list */}
        <div className="space-y-8 z-10 max-w-sm">
          <div>
            <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Features Included</h3>
            <h2 className="text-2xl font-black mt-1">Grow your reach with detailed tracking</h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">✓</div>
              <div>
                <h4 className="font-bold text-sm">Granular Analytics</h4>
                <p className="text-xs text-slate-400 mt-1">Inspect visitor countries, device types, operating systems, and browsers.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">✓</div>
              <div>
                <h4 className="font-bold text-sm">Live WebSocket Updates</h4>
                <p className="text-xs text-slate-400 mt-1">See clicks and live traffic stats populate instantly without page reloads.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">✓</div>
              <div>
                <h4 className="font-bold text-sm">Custom Aliases & QR Codes</h4>
                <p className="text-xs text-slate-400 mt-1">Customize short codes for brand campaigns and generate instant QR graphics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bullet description */}
        <div className="z-10">
          <p className="text-sm font-semibold text-slate-400 leading-relaxed">
            Create a free account in seconds and unlock state-of-the-art link tracking.
          </p>
        </div>
      </section>

      {/* Right Column: Glassmorphic Signup Form */}
      <section className="col-span-12 lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md z-10">
          <form 
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl grid gap-6 relative" 
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          >
            
            <div className="text-center">
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Create account</h1>
              <p className="mt-2 text-sm text-slate-400 font-semibold">Start shortening and tracking URLs for free.</p>
            </div>

            <div className="grid gap-4.5 mt-2">
              <label className="relative block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</span>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 pr-4 w-full rounded-xl border border-slate-850 bg-slate-950/80 text-white placeholder-slate-600 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm"
                    value={form.name}
                    onChange={updateField}
                    required
                  />
                </div>
              </label>

              <label className="relative block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 pr-4 w-full rounded-xl border border-slate-850 bg-slate-950/80 text-white placeholder-slate-600 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm"
                    value={form.email}
                    onChange={updateField}
                    required
                  />
                </div>
              </label>

              <label className="relative block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</span>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    minLength="6"
                    className="pl-10 pr-10 w-full rounded-xl border border-slate-850 bg-slate-950/80 text-white placeholder-slate-600 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm"
                    value={form.password}
                    onChange={updateField}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {/* Caps Lock warning */}
            {capsLock && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs font-semibold text-amber-400">
                <AlertTriangle size={14} />
                <span>Caps Lock is ON</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn-primary w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-wait mt-2"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Sign up</span>
                  <ArrowRight size={15} className="stroke-[3.5]" />
                </>
              )}
            </button>

            <p className="text-sm text-slate-400 text-center mt-1 font-semibold">
              Already have an account? <Link className="font-bold text-emerald-400 hover:underline" to="/login">Log in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
