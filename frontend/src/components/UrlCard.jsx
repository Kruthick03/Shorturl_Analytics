import { BarChart3, Check, Clipboard, ExternalLink, QrCode, Trash2, Edit2, Calendar, Globe } from "lucide-react";
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
      const response = await api.patch(`/url/${url.id}`, {
        originalUrl: editUrl,
        expiresAt: editExpiry || null
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
    <article className="card grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <a className="inline-flex max-w-full items-center gap-2 break-all font-bold text-brand" href={url.shortUrl} target="_blank" rel="noreferrer">
          {url.shortUrl}
          <ExternalLink size={16} />
        </a>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-3 grid gap-3 max-w-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Destination URL</label>
              <input
                type="url"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Expiry Date & Time (Optional)</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
              />
            </div>
            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  setEditUrl(url.original_url);
                  setEditExpiry(url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : "");
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-2 break-all text-sm text-slate-600">{url.original_url}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Created {new Date(url.created_at).toLocaleString()}
              </p>
              {url.expires_at && (
                <p className={`text-xs font-semibold flex items-center gap-1 ${isExpired ? "text-red-600" : "text-amber-600"}`}>
                  <Calendar size={12} />
                  {isExpired ? "Expired" : "Expires"} {new Date(url.expires_at).toLocaleString()}
                </p>
              )}
            </div>
          </>
        )}

        {showQr && (
          <div className="mt-4 inline-block rounded-lg border border-slate-200 bg-white p-3">
            <QRCodeCanvas value={url.shortUrl} size={132} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className="mr-auto rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 md:mr-2">
          {url.clicks} clicks
        </span>
        <button className="btn-icon" onClick={copyShortUrl} title="Copy short URL" type="button">
          {copied ? <Check size={18} /> : <Clipboard size={18} />}
        </button>
        <button className="btn-icon" onClick={() => setShowQr((value) => !value)} title="Show QR code" type="button">
          <QrCode size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={copyStatsUrl}
          title="Copy public stats link"
          type="button"
        >
          {statsCopied ? <Check size={18} /> : <Globe size={18} />}
        </button>
        <Link className="btn-icon" to={`/analytics/${url.id}`} title="View analytics">
          <BarChart3 size={18} />
        </Link>
        <button
          className="btn-icon text-slate-600 hover:text-slate-800"
          onClick={() => setIsEditing(true)}
          title="Edit link"
          type="button"
        >
          <Edit2 size={18} />
        </button>
        <button className="btn-icon text-red-600 hover:border-red-300 hover:text-red-700" onClick={() => onDelete(url.id)} title="Delete URL" type="button">
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
