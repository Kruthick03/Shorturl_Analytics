import { BarChart3, Check, Clipboard, ExternalLink, QrCode, Trash2, Edit2, Calendar, Globe, X, Save } from "lucide-react";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function UrlCard({ url, onDelete, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [statsCopied, setStatsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(url.original_url);
  const [editExpiry, setEditExpiry] = useState(
    url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function copyShortUrl() {
    await navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyStatsUrl() {
    const statsUrl = `${window.location.origin}/stats/${url.short_code}`;
    await navigator.clipboard.writeText(statsUrl);
    setStatsCopied(true);
    window.setTimeout(() => setStatsCopied(false), 1800);
  }

  const isExpired = url.expires_at && new Date() > new Date(url.expires_at);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert datetime-local picker value to proper ISO string to avoid backend parser issues
      const formattedExpiry = editExpiry ? new Date(editExpiry).toISOString() : null;

      const response = await api.patch(`/url/${url.id}`, {
        originalUrl: editUrl,
        expiresAt: formattedExpiry
      });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(response.data.url);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card-interactive grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center animate-fade-in relative overflow-hidden bg-white border border-slate-100 shadow-sm">
      {/* Decorative vertical colored stripe for visual distinction */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isExpired ? "bg-red-400" : "bg-emerald-400"}`} />
      
      <div className="min-w-0 pl-1">
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
          <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
            /{url.short_code}
          </span>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-4 grid gap-3 max-w-xl bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-inner">
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Expiry Date & Time (Optional)</label>
              <input
                type="datetime-local"
                className="w-full !px-3 !py-2 !text-xs custom-datetime-input"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
              />
            </div>
            {error && <p className="text-xs font-bold text-red-650 animate-fade-in">{error}</p>}
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
              >
                <Save size={12} />
                <span>{loading ? "Saving..." : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  setEditUrl(url.original_url);
                  setEditExpiry(url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : "");
                }}
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
                  isExpired 
                    ? "text-red-500 bg-red-50/50 border-red-100" 
                    : "text-amber-500 bg-amber-50/50 border-amber-100"
                }`}>
                  <Calendar size={11} className="shrink-0" />
                  <span>{isExpired ? "Expired" : "Expires"} {new Date(url.expires_at).toLocaleString()}</span>
                </span>
              )}
            </div>
          </>
        )}

        {showQr && (
          <div className="mt-4 inline-flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-sm animate-fade-in">
            <QRCodeCanvas value={url.shortUrl} size={112} className="rounded" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Scan short link</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0 pl-1 md:pl-0 mt-3 md:mt-0">
        <span className="mr-auto text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl md:mr-2">
          {url.clicks} clicks
        </span>
        <button 
          className={`btn-icon ${copied ? "!bg-emerald-50 !text-emerald-500 !border-emerald-200" : ""}`} 
          onClick={copyShortUrl} 
          title="Copy short URL" 
          type="button"
        >
          {copied ? <Check size={16} className="stroke-[3]" /> : <Clipboard size={16} />}
        </button>
        <button 
          className={`btn-icon ${showQr ? "!bg-emerald-50 !text-emerald-500 !border-emerald-200" : ""}`} 
          onClick={() => setShowQr((value) => !value)} 
          title="Show QR code" 
          type="button"
        >
          <QrCode size={16} />
        </button>
        <button
          className={`btn-icon ${statsCopied ? "!bg-emerald-50 !text-emerald-500 !border-emerald-200" : ""}`}
          onClick={copyStatsUrl}
          title="Copy public stats link"
          type="button"
        >
          {statsCopied ? <Check size={16} className="stroke-[3]" /> : <Globe size={16} />}
        </button>
        <Link className="btn-icon" to={`/analytics/${url.id}`} title="View analytics">
          <BarChart3 size={16} />
        </Link>
        <button
          className="btn-icon text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          onClick={() => setIsEditing(true)}
          title="Edit link"
          type="button"
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="btn-icon text-red-500 hover:border-red-200 hover:text-red-650 hover:bg-red-50/50" 
          onClick={() => onDelete(url.id)} 
          title="Delete URL" 
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
