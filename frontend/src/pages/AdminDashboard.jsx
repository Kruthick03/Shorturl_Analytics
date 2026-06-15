import { useEffect, useState, useMemo } from "react";
import { Link2, Search, MousePointerClick, LinkIcon, Clock, AlertTriangle, Users, Edit2, Trash2, Calendar, X, Save, ExternalLink, ShieldCheck, Database, RefreshCw } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function AdminDashboard() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Database Inspector state
  const [activeView, setActiveView] = useState("urls"); // "urls" | "database"
  const [activeDbTable, setActiveDbTable] = useState("users"); // "users" | "urls" | "visits"
  const [dbTables, setDbTables] = useState({ users: [], urls: [], visits: [] });
  const [dbLoading, setDbLoading] = useState(false);

  async function fetchAllUrls() {
    try {
      setLoading(true);
      const response = await api.get("/url/admin/all");
      setUrls(response.data.urls);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load administrator metrics.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDbData() {
    try {
      setDbLoading(true);
      setError("");
      const response = await api.get("/url/admin/db");
      setDbTables(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load database inspector records.");
    } finally {
      setDbLoading(false);
    }
  }

  useEffect(() => {
    fetchAllUrls();
  }, []);

  useEffect(() => {
    if (activeView === "database") {
      fetchDbData();
    }
  }, [activeView]);

  const stats = useMemo(() => {
    const now = new Date();
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + Number(u.clicks || 0), 0);
    const expiredLinks = urls.filter((u) => u.expires_at && new Date(u.expires_at) < now).length;
    
    const uniqueCreators = new Set(urls.map((u) => u.creator_email).filter(Boolean)).size;
    
    return { totalLinks, totalClicks, expiredLinks, uniqueCreators };
  }, [urls]);

  const filteredUrls = useMemo(() => {
    const now = new Date();
    return urls.filter((u) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        u.original_url.toLowerCase().includes(query) ||
        u.short_code.toLowerCase().includes(query) ||
        (u.creator_name && u.creator_name.toLowerCase().includes(query)) ||
        (u.creator_email && u.creator_email.toLowerCase().includes(query));
      
      const isExpired = u.expires_at && new Date(u.expires_at) < now;
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "active" && !isExpired) ||
        (statusFilter === "expired" && isExpired);
      
      return matchesSearch && matchesFilter;
    });
  }, [urls, searchQuery, statusFilter]);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  async function performDelete(id) {
    try {
      await api.delete(`/url/admin/${id}`);
      setUrls((current) => current.filter((u) => u.id !== id));
      setSuccess("Short URL deleted successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete URL.");
    }
  }

  function startEdit(url) {
    setEditingId(url.id);
    setEditUrl(url.original_url);
    setEditExpiry(url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : "");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaveLoading(true);

    try {
      const formattedExpiry = editExpiry ? new Date(editExpiry).toISOString() : null;
      const response = await api.patch(`/url/admin/${editingId}`, {
        originalUrl: editUrl,
        expiresAt: formattedExpiry
      });
      
      // Update local state
      setUrls((current) =>
        current.map((u) => (u.id === editingId ? { ...u, original_url: response.data.url.original_url, expires_at: response.data.url.expires_at } : u))
      );
      
      setEditingId(null);
      setSuccess("Link details updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save link changes.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 page-wrapper">
        {/* Header */}
        <section className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
              <ShieldCheck size={22} className="text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
              <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">System-Wide Access Control</p>
            </div>
          </div>
        </section>

        {/* View Toggle tabs */}
        <section className="mb-6 flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveView("urls")}
            className={`pb-2 px-1 text-xs font-black uppercase tracking-wider transition border-b-2 ${
              activeView === "urls"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            URL Management
          </button>
          <button
            onClick={() => setActiveView("database")}
            className={`pb-2 px-1 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
              activeView === "database"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Database size={13} />
            PostgreSQL Database Inspector
          </button>
        </section>

        {/* Notifications */}
        <section className="space-y-3 mb-6">
          {success && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 p-0.5 rounded-full text-emerald-700 shrink-0">✓</span>
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
                <span className="bg-rose-100 p-0.5 rounded-full text-rose-700 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        {activeView === "urls" ? (
          <>
            {/* Global Statistics */}
            <section className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="card flex items-center gap-4 p-5 border-slate-900 bg-slate-900 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-emerald-450 border border-slate-700/80">
                  <LinkIcon size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black tracking-tight">{stats.totalLinks}</span>
                  <small className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total System Links</small>
                </div>
              </div>
              <div className="card-interactive flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm animate-float">
                  <MousePointerClick size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.totalClicks}</span>
                  <small className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total System Clicks</small>
                </div>
              </div>
              <div className="card-interactive flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 border border-teal-100 shadow-sm">
                  <Users size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.uniqueCreators}</span>
                  <small className="text-[9px] font-black uppercase tracking-wider text-slate-400">Unique Users</small>
                </div>
              </div>
              <div className="card-interactive flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
                  <AlertTriangle size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.expiredLinks}</span>
                  <small className="text-[9px] font-black uppercase tracking-wider text-slate-400">Expired Links</small>
                </div>
              </div>
            </section>

            {/* Search, Filter Bar */}
            <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 animate-fade-in">
              <div className="relative w-full sm:max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by long URL, alias, or creator email..."
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

            {/* System URLs List */}
            <section className="grid gap-4 animate-fade-in">
              {loading && (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading system database...</p>
                </div>
              )}
              
              {!loading && filteredUrls.length === 0 && (
                <div className="card grid place-items-center gap-3 border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 bg-slate-50/50 animate-fade-in">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">No URLs found</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Adjust filters or search parameters.</p>
                  </div>
                </div>
              )}

              {!loading && filteredUrls.map((url) => {
                const now = new Date();
                const isUrlExpired = url.expires_at && now > new Date(url.expires_at);
                const isUrlEditing = editingId === url.id;

                return (
                  <article key={url.id} className="card-interactive grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center relative overflow-hidden bg-white border border-slate-100 shadow-sm animate-fade-in">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isUrlExpired ? "bg-red-400" : "bg-emerald-400"}`} />

                    <div className="min-w-0 pl-1.5">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <a 
                          className="inline-flex max-w-full items-center gap-1.5 break-all font-black text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition" 
                          href={url.shortUrl} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          {url.shortUrl}
                          <ExternalLink size={13} className="shrink-0" />
                        </a>
                        <span className="text-[9px] font-black font-mono bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                          /{url.short_code}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-200 rounded-full px-2 py-0.5 flex items-center gap-1 border border-slate-750">
                          <span>By:</span>
                          <span className="font-black truncate max-w-[120px]">{url.creator_name || "Unknown"}</span>
                          <span className="opacity-50 font-medium">({url.creator_email || "Anonymous"})</span>
                        </span>
                      </div>

                      {isUrlEditing ? (
                        <form onSubmit={handleSave} className="mt-4 grid gap-3 max-w-xl bg-slate-50 p-4 rounded-xl border border-slate-200/65 shadow-inner animate-fade-in">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Destination URL</label>
                            <input
                              type="url"
                              required
                              className="w-full !px-3 !py-2 !text-xs"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Expiry Date & Time</label>
                            <input
                              type="datetime-local"
                              className="w-full !px-3 !py-2 !text-xs custom-datetime-input"
                              value={editExpiry}
                              onChange={(e) => setEditExpiry(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="submit"
                              disabled={saveLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                            >
                              <Save size={12} />
                              <span>{saveLoading ? "Saving..." : "Save"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
                            >
                              <X size={12} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="mt-1 break-all text-xs font-semibold text-slate-500 leading-relaxed max-w-2xl">{url.original_url}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
                            <span>
                              Created {new Date(url.created_at).toLocaleString()}
                            </span>
                            {url.expires_at && (
                              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 border ${
                                isUrlExpired 
                                  ? "text-red-500 bg-red-50/50 border-red-100" 
                                  : "text-amber-500 bg-amber-50/50 border-amber-100"
                              }`}>
                                <Calendar size={11} className="shrink-0" />
                                <span>{isUrlExpired ? "Expired" : "Expires"} {new Date(url.expires_at).toLocaleString()}</span>
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 mt-3 md:mt-0 pl-1 md:pl-0 justify-between md:justify-end">
                      <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {url.clicks} clicks
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          className="btn-icon text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          onClick={() => startEdit(url)}
                          title="Admin Edit Link"
                          type="button"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon text-red-500 hover:border-red-200 hover:text-red-650 hover:bg-red-50/50" 
                          onClick={() => setDeleteConfirmId(url.id)} 
                          title="Admin Delete URL" 
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : (
          <section className="animate-fade-in">
            {/* Database inspector tables */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/40 shadow-inner">
                {["users", "urls", "visits"].map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setActiveDbTable(tbl)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-all ${
                      activeDbTable === tbl
                        ? "bg-white text-slate-900 shadow-md"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tbl} Table
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchDbData}
                disabled={dbLoading}
                className="btn-primary min-h-[36px] text-xs px-4 py-1.5 bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto shadow-md"
              >
                <RefreshCw size={14} className={dbLoading ? "animate-spin" : ""} />
                <span>{dbLoading ? "Querying..." : "Refresh Tables"}</span>
              </button>
            </div>

            {dbLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Executing SQL Queries...</p>
              </div>
            ) : (
              <div className="card p-0 border border-slate-200/80 shadow-lg overflow-hidden bg-slate-950 text-slate-200">
                {/* Visual Terminal Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3.5 w-3.5 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="h-3.5 w-3.5 rounded-full bg-green-500/80 inline-block" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 ml-2">psql -d shorturl_analytics</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">SELECT * FROM {activeDbTable}</span>
                </div>

                <div className="overflow-x-auto">
                  {activeDbTable === "users" && (
                    <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">id</th>
                          <th className="py-2.5 px-4">name</th>
                          <th className="py-2.5 px-4">email</th>
                          <th className="py-2.5 px-4">password (bcrypt)</th>
                          <th className="py-2.5 px-4">role</th>
                          <th className="py-2.5 px-4">created_at</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {dbTables.users.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-4 text-emerald-400 font-bold">{row.id}</td>
                            <td className="py-2.5 px-4 text-white font-bold">{row.name}</td>
                            <td className="py-2.5 px-4 text-slate-350">{row.email}</td>
                            <td className="py-2.5 px-4 text-rose-450 font-semibold">{row.password}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${row.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                {row.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-450">{new Date(row.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeDbTable === "urls" && (
                    <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">id</th>
                          <th className="py-2.5 px-4">short_code</th>
                          <th className="py-2.5 px-4">original_url</th>
                          <th className="py-2.5 px-4">clicks</th>
                          <th className="py-2.5 px-4">user_id</th>
                          <th className="py-2.5 px-4">created_at</th>
                          <th className="py-2.5 px-4">expires_at</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {dbTables.urls.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-4 text-emerald-450 font-bold">{row.id}</td>
                            <td className="py-2.5 px-4 text-white font-bold">/{row.short_code}</td>
                            <td className="py-2.5 px-4 truncate max-w-xs text-slate-300" title={row.original_url}>{row.original_url}</td>
                            <td className="py-2.5 px-4 text-amber-400 font-bold">{row.clicks}</td>
                            <td className="py-2.5 px-4 text-blue-400 font-bold">{row.user_id}</td>
                            <td className="py-2.5 px-4 text-slate-450">{new Date(row.created_at).toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-slate-450">{row.expires_at ? new Date(row.expires_at).toLocaleString() : "NULL"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeDbTable === "visits" && (
                    <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">id</th>
                          <th className="py-2.5 px-4">url_id</th>
                          <th className="py-2.5 px-4">visited_at</th>
                          <th className="py-2.5 px-4">ip_address</th>
                          <th className="py-2.5 px-4">country</th>
                          <th className="py-2.5 px-4">device</th>
                          <th className="py-2.5 px-4">os</th>
                          <th className="py-2.5 px-4">browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {dbTables.visits.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-900/40 transition animate-fade-in">
                            <td className="py-2.5 px-4 text-emerald-450 font-bold">{row.id}</td>
                            <td className="py-2.5 px-4 text-blue-400 font-bold">{row.url_id}</td>
                            <td className="py-2.5 px-4 text-slate-450">{new Date(row.visited_at).toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-slate-300">{row.ip_address || "127.0.0.1"}</td>
                            <td className="py-2.5 px-4 text-amber-450 font-bold">{row.country || "Unknown"}</td>
                            <td className="py-2.5 px-4 text-slate-400">{row.device || "Desktop"}</td>
                            <td className="py-2.5 px-4 text-slate-400">{row.os || "Windows"}</td>
                            <td className="py-2.5 px-4 text-slate-400">{row.browser || "Chrome"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 bg-white border border-slate-200/60 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-650 mb-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-650 border border-red-100 shrink-0">
                <AlertTriangle size={20} className="stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-slate-800">Confirm System Delete</h3>
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
