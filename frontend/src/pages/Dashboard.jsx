import { Link2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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

    return () => socket.disconnect();
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
      const response = await api.post("/url/create", {
        originalUrl: form.originalUrl,
        customAlias: form.customAlias || undefined,
        expiresAt: form.expiresAt || undefined
      });
      setUrls((current) => [response.data.url, ...current]);
      setForm({ originalUrl: "", customAlias: "", expiresAt: "" });
      setSuccess("Short URL created successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to shorten URL");
    } finally {
      setSubmitting(false);
    }
  }



  async function handleDelete(id) {
    try {
      await api.delete(`/url/${id}`);
      setUrls((current) => current.filter((url) => url.id !== id));
      setSuccess("URL deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete URL");
    }
  }

  function handleUpdate(updatedUrl) {
    setUrls((current) =>
      current.map((url) => (url.id === updatedUrl.id ? updatedUrl : url))
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal">Dashboard</h1>
            <p className="mt-2 text-slate-600">Create short links, add custom aliases, set expirations, and track traffic.</p>
          </div>
          <div className="card min-w-40 p-4 md:text-right">
            <span className="block text-3xl font-black">
              {urls.reduce((total, url) => total + Number(url.clicks || 0), 0)}
            </span>
            <small className="font-bold text-slate-500">Total clicks</small>
          </div>
        </section>

        {/* Form Container */}
        <form
          className="card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
          onSubmit={handleSubmit}
        >
          <label>
            Destination URL
            <input
              name="originalUrl"
              placeholder="https://example.com/very/long/link"
              value={form.originalUrl}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Custom Alias (Optional)
            <input
              name="customAlias"
              placeholder="giri"
              value={form.customAlias}
              onChange={updateField}
            />
          </label>
          <label>
            Expiry Date & Time (Optional)
            <input
              type="datetime-local"
              name="expiresAt"
              value={form.expiresAt}
              onChange={updateField}
            />
          </label>
          <button className="btn-primary w-full md:w-auto" disabled={submitting} type="submit">
            <Plus size={18} />
            {submitting ? "Creating..." : "Shorten"}
          </button>
        </form>

        <div className="mt-4 grid gap-3">
          {success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</p>}
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        </div>

        <section className="mt-5 grid gap-3">
          {loading && <p className="font-semibold text-slate-600">Loading links...</p>}
          {!loading && urls.length === 0 && (
            <div className="card grid place-items-center gap-2 border-dashed p-12 text-center text-slate-600">
              <Link2 size={36} />
              <p className="font-bold">No links yet.</p>
            </div>
          )}
          {urls.map((url) => (
            <UrlCard key={url.id} url={url} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </section>
      </main>
    </>
  );
}
