import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Link2, ArrowRight, AlertTriangle, Check } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Load email from localStorage if "Remember Me" was checked previously
  const [form, setForm] = useState({ 
    email: localStorage.getItem("rememberedEmail") || "", 
    password: "" 
  });
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem("rememberedEmail")));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

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
      await login(form.email, form.password);
      
      // Save or remove email from localStorage based on "Remember Me"
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-fill demo credentials
  function fillDemoCredentials() {
    setDemoActive(true);
    setForm({
      email: "demo@example.com",
      password: "password123"
    });
    // Visual flash/pulsing effect
    setTimeout(() => {
      setDemoActive(false);
    }, 1000);
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

        {/* Live Mock Analytics Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6 z-10">
          <div>
            <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Live Monitor</h3>
            <h2 className="text-xl font-black mt-1">Real-time Traffic</h2>
          </div>

          {/* SVG Line Graph */}
          <div className="h-28 flex items-end gap-3 px-2 border-b border-slate-800 pb-3">
            <div className="w-full bg-emerald-500/20 rounded-t h-[30%] animate-pulse" />
            <div className="w-full bg-emerald-500/30 rounded-t h-[55%]" />
            <div className="w-full bg-emerald-500/50 rounded-t h-[80%] animate-pulse" style={{ animationDelay: "200ms" }} />
            <div className="w-full bg-emerald-500/40 rounded-t h-[45%]" />
            <div className="w-full bg-emerald-500/70 rounded-t h-[68%] animate-pulse" style={{ animationDelay: "400ms" }} />
            <div className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t h-[95%]" />
          </div>

          {/* Traffic ticker */}
          <div className="space-y-2.5 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Redirect from Tokyo, JP to <span className="text-emerald-400 font-bold font-mono">/react-repo</span> (2s ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
              <span>Redirect from Berlin, DE to <span className="text-emerald-400 font-bold font-mono">/tw-docs</span> (15s ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
              <span>Redirect from London, UK to <span className="text-emerald-400 font-bold font-mono">/hn-news</span> (1m ago)</span>
            </div>
          </div>
        </div>

        {/* Bullet description */}
        <div className="z-10">
          <p className="text-sm font-semibold text-slate-400 leading-relaxed">
            Deploy lightning-fast short codes with granular device, operating system, browser, and geographic analytics. Built for developers, optimized for recruiters.
          </p>
        </div>
      </section>

      {/* Right Column: Glassmorphic Login Form */}
      <section className="col-span-12 lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md z-10">
          <form 
            className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl grid gap-6 relative transition-all duration-300 ${demoActive ? "ring-2 ring-emerald-500/30 scale-[1.01]" : ""}`} 
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          >
            
            <div className="text-center">
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-400 font-semibold">Log in to manage and track your links.</p>
            </div>

            <div className="grid gap-4.5 mt-2">
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

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-brand focus:ring-offset-slate-900 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 mt-2">
              <button
                className="btn-primary w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-wait"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight size={15} className="stroke-[3.5]" />
                  </>
                )}
              </button>

              {/* Demo Account quick fill button */}
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 text-emerald-400 hover:text-emerald-300 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 text-sm"
              >
                <span>⚡ Use Demo Credentials</span>
              </button>
            </div>

            <p className="text-sm text-slate-400 text-center mt-1 font-semibold">
              Need an account? <Link className="font-bold text-emerald-400 hover:underline" to="/signup">Sign up for free</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
