import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { ArrowLeft, MousePointerClick, BarChart3, Activity, Calendar, Globe, MapPin, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { createSocket } from "../api/socket";
import Navbar from "../components/Navbar";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function Analytics() {
  const { id } = useParams();
  const [urls, setUrls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (id) {
          const response = await api.get(`/analytics/${id}`);
          setAnalytics(response.data);
        } else {
          const response = await api.get("/url/myurls");
          setUrls(response.data.urls);
        }
      } catch {
        setError("Unable to load analytics data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  useEffect(() => {
    const socket = createSocket();

    if (!socket) {
      return undefined;
    }

    socket.on("url:clicked", (event) => {
      if (!id) {
        setUrls((current) =>
          current.map((url) =>
            url.id === event.urlId ? { ...url, clicks: event.clicks } : url
          )
        );
        return;
      }

      if (Number(id) !== event.urlId) {
        return;
      }

      setAnalytics((current) => {
        if (!current) {
          return current;
        }

        const visitDate = new Date(event.visit.visited_at).toISOString().slice(0, 10);
        const trendIndex = current.dailyTrend.findIndex(
          (item) => new Date(item.date).toISOString().slice(0, 10) === visitDate
        );
        const dailyTrend = [...current.dailyTrend];

        if (trendIndex >= 0) {
          dailyTrend[trendIndex] = {
            ...dailyTrend[trendIndex],
            clicks: Number(dailyTrend[trendIndex].clicks) + 1
          };
        } else {
          dailyTrend.push({ date: event.visit.visited_at, clicks: 1 });
        }

        return {
          ...current,
          totalClicks: event.clicks,
          lastVisited: event.visit.visited_at,
          recentVisits: [event.visit, ...current.recentVisits].slice(0, 20),
          dailyTrend
        };
      });
    });

    return () => socket.disconnect();
  }, [id]);

  // Index Mode: Show all URLs so user can select one
  if (!id) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 page-wrapper">
          <section className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-emerald-500 h-7 w-7" />
              Link Analytics
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-slate-500 leading-relaxed max-w-xl">
              Inspect your shortened links and monitor real-time visitor activity feeds.
            </p>
          </section>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-700">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <section className="grid gap-4">
            {loading && (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading links...</p>
              </div>
            )}
            {!loading && urls.length === 0 && !error && (
              <div className="card grid place-items-center gap-3 border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 bg-slate-50/50">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <MousePointerClick size={36} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">No URLs to inspect</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs">Create shortened links on the dashboard first to view their analytics.</p>
                </div>
              </div>
            )}
            {!loading && urls.map((url) => (
              <Link 
                className="card-interactive grid gap-4 p-5 transition md:grid-cols-[1fr_auto] md:items-center relative overflow-hidden" 
                key={url.id} 
                to={`/analytics/${url.id}`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200" />
                <div className="min-w-0 pl-1">
                  <span className="break-all font-black text-sm text-slate-800">{url.shortUrl}</span>
                  <p className="truncate text-xs font-semibold text-slate-400 mt-1">{url.original_url}</p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 pl-1 md:pl-0 mt-2 md:mt-0">
                  <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-600">
                    {url.clicks} clicks
                  </span>
                </div>
              </Link>
            ))}
          </section>
        </main>
      </>
    );
  }

  // Link Specific Analytics Mode
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 page-wrapper">
        <Link className="mb-6 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition" to="/analytics">
          <ArrowLeft size={14} className="stroke-[3]" />
          <span>All Link Analytics</span>
        </Link>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-700">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {!analytics && !error && (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading metrics...</p>
          </div>
        )}

        {analytics && (
          <div className="space-y-6">
            {/* Header info */}
            <section className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Traffic Analysis</h1>
                <p className="mt-1.5 break-all text-xs font-mono font-bold text-emerald-600">{analytics.url.shortUrl}</p>
              </div>
              <div className="card-interactive bg-white border border-slate-100 flex items-center gap-4 py-3.5 px-5 shrink-0 self-start md:self-auto">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm">
                  <Activity size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-800 tracking-tight">{analytics.totalClicks}</span>
                  <small className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total clicks</small>
                </div>
              </div>
            </section>

            {/* Click Trend Graph */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-800">Daily Click Trend</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Metrics over the past 30 days</p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Real-time Feed</span>
                  </div>
                </div>

                {analytics.dailyTrend.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                    <Calendar size={28} className="stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-500">No clicks recorded yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <Line
                      data={{
                        labels: analytics.dailyTrend.map((item) => new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
                        datasets: [
                          {
                            label: "Clicks",
                            data: analytics.dailyTrend.map((item) => item.clicks),
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

              {/* Visit Summary Card */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-50 pb-3">Link Summary</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Destination</span>
                      <p className="mt-1 break-all text-xs font-semibold text-slate-700 leading-relaxed">{analytics.url.original_url}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Created At</span>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {new Date(analytics.url.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 mt-4">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-600">Last visited</span>
                  <p className="mt-1 text-xs font-black text-emerald-800">
                    {analytics.lastVisited ? new Date(analytics.lastVisited).toLocaleString() : "No visits logged yet"}
                  </p>
                </div>
              </div>
            </section>

            {/* Simplified Live History Feed */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-800">Live Traffic Feed</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Chronological feed of redirect events</p>
                </div>
              </div>

              {analytics.recentVisits.length === 0 ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                  <Globe size={32} className="stroke-[1.5]" />
                  <h4 className="text-xs font-bold text-slate-600">Waiting for visits...</h4>
                  <p className="text-[11px] font-medium text-slate-400">Visitor clicks will stream live into this feed.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-2">
                  {analytics.recentVisits.map((visit) => (
                    <div 
                      className="py-3.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 animate-fade-in" 
                      key={visit.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-700">{visit.ip_address || "Unknown IP"}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400">•</span>
                            <span className="font-extrabold text-slate-500">{visit.country || "Unknown Country"}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">Redirect Event ID #{visit.id}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-slate-500 self-start sm:self-auto">
                        {new Date(visit.visited_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
