import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { ArrowLeft, BarChart3, ExternalLink, Activity, Link2, Calendar, ShieldAlert } from "lucide-react";
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
        setLoading(true);
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
    <div className="min-h-screen bg-surface text-slate-800 antialiased font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-sm shadow-sm shadow-slate-100/30">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link className="flex items-center gap-2.5 font-black text-slate-850 text-lg transition duration-200 hover:scale-[1.01]" to="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Link2 size={18} className="stroke-[2.5]" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-slate-800 bg-clip-text text-transparent">URLytics</span>
          </Link>
          <Link className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-slate-100/80 px-3.5 py-1.5 rounded-lg transition" to="/login">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-grow page-wrapper">
        <Link className="mb-6 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition" to="/">
          <ArrowLeft size={14} className="stroke-[3]" />
          <span>Back to Dashboard</span>
        </Link>

        {loading && (
          <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading public traffic metrics...</p>
          </div>
        )}

        {error && (
          <div className="card p-12 text-center bg-white border border-slate-200/60 max-w-xl mx-auto flex flex-col items-center gap-3">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-500">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-700">Failed to load statistics</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">{error}</p>
            </div>
            <Link to="/" className="btn-primary mt-3 text-xs min-h-[36px]">
              Go to Dashboard
            </Link>
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Traffic Statistics</h1>
                <a
                  className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-xs text-emerald-600 hover:text-emerald-700 transition break-all"
                  href={stats.url.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{stats.url.shortUrl}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
              <div className="card-interactive bg-white flex items-center gap-4 py-3.5 px-5 shrink-0 self-start md:self-auto">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm">
                  <Activity size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-800 tracking-tight">{stats.totalClicks ?? 0}</span>
                  <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total clicks</small>
                </div>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Daily Trend Line Graph */}
              <div className="card p-6 md:col-span-2 bg-white flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-black text-slate-800 mb-4 border-b border-slate-50 pb-3 uppercase tracking-wider">Daily Click Trend</h2>
                </div>
                
                {stats.dailyTrend.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                    <Calendar size={28} className="stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-500">No clicks recorded yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <Line
                      data={{
                        labels: stats.dailyTrend.map((item) => new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
                        datasets: [
                          {
                            label: "Clicks",
                            data: stats.dailyTrend.map((item) => item.clicks),
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.04)",
                            tension: 0.35,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointBackgroundColor: "#10b981",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 1.5,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        animation: {
                          duration: 1500,
                          easing: "easeInOutQuart"
                        },
                        hover: {
                          mode: 'nearest',
                          intersect: true
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { font: { weight: "bold", size: 10 } } },
                          y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { precision: 0, font: { weight: "bold", size: 10 } } }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Link Summary details */}
              <div className="card p-6 bg-white space-y-5">
                <h2 className="text-xs font-black text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">Link Details</h2>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Destination</label>
                    <p className="break-all text-xs font-semibold text-slate-700 leading-relaxed">{stats.url.original_url}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Created At</label>
                    <p className="text-xs font-bold text-slate-700">{new Date(stats.url.created_at).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Last visited</label>
                    <p className="text-xs font-black text-emerald-700">
                      {stats.lastVisited ? new Date(stats.lastVisited).toLocaleString() : "No visits logged yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
