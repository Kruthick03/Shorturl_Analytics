import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { ArrowLeft, BarChart3, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function PublicStats() {
  const { shortCode } = useParams();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get(`/analytics/public/${shortCode}`);
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load public stats");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shortCode]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      <header className="border-b border-slate-200 bg-white py-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
          <Link className="flex items-center gap-2 font-black text-brand text-xl" to="/">
            <BarChart3 className="h-6 w-6 text-brand" />
            <span>ShortURL Analytics</span>
          </Link>
          <Link className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1" to="/login">
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand" to="/">
          <ArrowLeft size={16} />
          Go to Dashboard
        </Link>

        {loading && <p className="font-semibold text-slate-600">Loading public traffic metrics...</p>}

        {error && (
          <div className="card p-8 text-center bg-white border border-slate-200">
            <h2 className="text-xl font-black text-red-600 mb-2">Failed to load statistics</h2>
            <p className="text-slate-500 font-semibold">{error}</p>
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-black">Public Traffic Stats</h1>
                <a
                  className="mt-2 inline-flex items-center gap-1.5 font-bold text-brand break-all"
                  href={stats.url.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {stats.url.shortUrl}
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="card min-w-40 p-4 md:text-right bg-white">
                <span className="block text-3xl font-black">{stats.totalClicks ?? 0}</span>
                <small className="font-bold text-slate-500">Total clicks</small>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="card p-4 bg-white md:col-span-2">
                <h2 className="mb-4 text-sm font-black text-slate-400 uppercase tracking-wider">Daily click trend</h2>
                {stats.dailyTrend.length === 0 ? (
                  <p className="text-slate-600 text-xs py-10 text-center font-bold">No clicks recorded yet.</p>
                ) : (
                  <Line
                    data={{
                      labels: stats.dailyTrend.map((item) => new Date(item.date).toLocaleDateString()),
                      datasets: [
                        {
                          label: "Clicks",
                          data: stats.dailyTrend.map((item) => item.clicks),
                          borderColor: "#147a4b",
                          backgroundColor: "#147a4b",
                          tension: 0.35
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                    }}
                  />
                )}
              </div>

              <div className="card p-4 bg-white space-y-4">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">Link Summary</h2>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Destination</label>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-700">{stats.url.original_url}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Created At</label>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{new Date(stats.url.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Last visited</label>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {stats.lastVisited ? new Date(stats.lastVisited).toLocaleString() : "No visits logged"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
