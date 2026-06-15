import { Link2, Plus, Search, MousePointerClick, LinkIcon, Clock, AlertTriangle, Sparkles, Check, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { createSocket } from "../api/socket";
import Navbar from "../components/Navbar";
import UrlCard from "../components/UrlCard";

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [form, setForm] = useState({ originalUrl: "", customAlias: "", expiresAt: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const now = new Date();
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + Number(u.clicks || 0), 0);
    const expiredLinks = urls.filter((u) => u.expires_at && new Date(u.expires_at) < now).length;
    const activeLinks = totalLinks - expiredLinks;
    return { totalLinks, totalClicks, activeLinks, expiredLinks };
  }, [urls]);

  const filteredUrls = useMemo(() => {
    const now = new Date();
    return urls.filter((u) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        u.original_url.toLowerCase().includes(query) ||
        u.short_code.toLowerCase().includes(query);
      const isExpired = u.expires_at && new Date(u.expires_at) < now;
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "active" && !isExpired) ||
        (statusFilter === "expired" && isExpired);
      return matchesSearch && matchesFilter;
    });
  }, [urls, searchQuery, statusFilter]);

  async function loadUrls() {
    const response = await api.get("/url/myurls");
    setUrls(response.data.urls);
  }

  useEffect(() => {
    loadUrls()
      .catch(() => setError("Unable to load your URLs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshCountsQuietly() {
      try {
        const response = await api.get("/url/myurls");
        if (!cancelled) {
          setUrls(response.data.urls);
        }
      } catch {
        // quiet fail
      }
    }

    const intervalId = window.setInterval(refreshCountsQuietly, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const socket = createSocket();

    if (!socket) {
      return undefined;
    }

    socket.on("url:clicked", (event) => {
      setUrls((current) =>
        current.map((url) =>
          url.id === event.urlId ? { ...url, clicks: event.clicks } : url
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Convert datetime-local picker value to proper ISO string to avoid backend parser issues
      const formattedExpiry = form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined;

      const response = await api.post("/url/create", {
        originalUrl: form.originalUrl,
        customAlias: form.customAlias || undefined,
        expiresAt: formattedExpiry
      });
      setUrls((current) => [response.data.url, ...current]);
      setForm({ originalUrl: "", customAlias: "", expiresAt: "" });
      setSuccess("Short URL created successfully!");
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to shorten URL");
    } finally {
      setSubmitting(false);
    }
  }

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  async function performDelete(id) {
    try {
      await api.delete(`/url/${id}`);
      setUrls((current) => current.filter((url) => url.id !== id));
      setSuccess("URL deleted successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete URL");
    }
  }

  function handleUpdate(updatedUrl) {
    setUrls((current) =>
      current.map((url) => (url.id === updatedUrl.id ? updatedUrl : url))
    );
    setSuccess("URL updated successfully!");
    setTimeout(() => setSuccess(""), 4000);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 page-wrapper">
        {/* Page Header */}
        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Dashboard
              <Sparkles className="text-emerald-500 h-6 w-6 animate-pulse" />
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-slate-500 leading-relaxed max-w-xl">
              Create short links, add custom aliases, set expirations, and track your traffic metrics in real-time.
            </p>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 shadow-sm border border-emerald-100">
              <LinkIcon size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.totalLinks}</span>
              <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Links</small>
            </div>
          </div>
          <div className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 shadow-sm border border-blue-100">
              <MousePointerClick size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.totalClicks}</span>
              <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Clicks</small>
            </div>
          </div>
          <div className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 shadow-sm border border-teal-100">
              <Clock size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.activeLinks}</span>
              <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Links</small>
            </div>
          </div>
          <div className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm border border-rose-100">
              <AlertTriangle size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.expiredLinks}</span>
              <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expired Links</small>
            </div>
          </div>
        </section>

        {/* Shorten Link Form */}
        <section className="mb-6">
          <form
            className="card p-6 bg-slate-900 border-none shadow-xl grid gap-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end relative overflow-hidden"
            onSubmit={handleSubmit}
          >
            {/* Soft decorative glow background */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="z-10">
              <label className="text-white text-[10px] tracking-wider mb-2 block font-extrabold">Destination URL</label>
              <input
                name="originalUrl"
                type="url"
                placeholder="https://example.com/very/long/link/destination"
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:text-slate-600 focus:!border-emerald-500 focus:!ring-emerald-500/10"
                value={form.originalUrl}
                onChange={updateField}
                required
              />
            </div>
            <div className="z-10">
              <label className="text-white text-[10px] tracking-wider mb-2 block font-extrabold">Custom Alias (Optional)</label>
              <input
                name="customAlias"
                placeholder="e.g. promo2026"
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:text-slate-600 focus:!border-emerald-500 focus:!ring-emerald-500/10"
                value={form.customAlias}
                onChange={updateField}
              />
            </div>
            <div className="z-10">
              <label className="text-white text-[10px] tracking-wider mb-2 block font-extrabold">Expiry Date & Time (Optional)</label>
              <input
                type="datetime-local"
                name="expiresAt"
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:text-slate-600 focus:!border-emerald-500 focus:!ring-emerald-500/10 custom-datetime-input"
                value={form.expiresAt}
                onChange={updateField}
              />
            </div>
            <div className="z-10">
              <button 
                className="btn-primary w-full md:w-auto h-11 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 active:scale-95" 
                disabled={submitting} 
                type="submit"
              >
                <Plus size={18} className="stroke-[3]" />
                <span>{submitting ? "Shortening..." : "Shorten"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Notifications and messages */}
        <section className="space-y-3 mb-6">
          {success && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <Check size={16} className="bg-emerald-100 p-0.5 rounded-full text-emerald-700 shrink-0" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700">
                <X size={14} />
              </button>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-700 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="bg-rose-100 p-0.5 rounded-full text-rose-700 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        {/* Search, Filter and Actions Toolbar */}
        {urls.length > 0 && (
          <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by long URL or alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-10 !py-2.5 !text-xs !w-full"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              {["all", "active", "expired"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                    statusFilter === f
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Short URLs List */}
        <section className="grid gap-4">
          {loading && (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading your links...</p>
            </div>
          )}
          {!loading && urls.length === 0 && (
            <div className="card grid place-items-center gap-3 border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 bg-slate-50/50">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Link2 size={36} className="text-slate-400 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm">No shortened URLs yet</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs">Enter a long destination URL above to get your first trackable short link.</p>
              </div>
            </div>
          )}
          {!loading && urls.length > 0 && filteredUrls.length === 0 && (
            <div className="card grid place-items-center gap-3 border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 bg-slate-50/50">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <Search size={24} className="text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm">No results matched</h3>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Try altering your search text or switching the status filter.</p>
              </div>
            </div>
          )}
          {filteredUrls.map((url) => (
            <UrlCard key={url.id} url={url} onDelete={setDeleteConfirmId} onUpdate={handleUpdate} />
          ))}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 bg-white border border-slate-200/60 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-650 mb-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-650 border border-red-100 shrink-0">
                <AlertTriangle size={20} className="stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-slate-800">Delete Short Link</h3>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-5">
              Are you sure you want to delete this shortened URL? This action is permanent and will delete all traffic log statistics as well.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  performDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-750 text-white font-bold py-2.5 text-xs transition active:scale-95 shadow-sm shadow-red-500/10"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 text-xs transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
