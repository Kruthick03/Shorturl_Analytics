import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { ArrowLeft, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { createSocket } from "../api/socket";
import Navbar from "../components/Navbar";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function renderStatList(title, items, total) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{title}</h3>
      {(!items || items.length === 0) ? (
        <p className="text-xs text-slate-400">No data available</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => {
            const name = item.browser || item.os || item.device || item.country || "Unknown";
            const count = Number(item.count || 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{name}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const { id } = useParams();
  const [urls, setUrls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (id) {
          const response = await api.get(`/analytics/${id}`);
          setAnalytics(response.data);
        } else {
          const response = await api.get("/url/myurls");
          setUrls(response.data.urls);
        }
      } catch {
        setError("Unable to load analytics");
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

        const updateAggregates = (list, key) => {
          const arr = [...(list || [])];
          const idx = arr.findIndex((item) => (item[key] || "Unknown") === (event.visit[key] || "Unknown"));
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], count: Number(arr[idx].count) + 1 };
          } else {
            arr.push({ [key]: event.visit[key] || "Unknown", count: 1 });
          }
          return arr.sort((a, b) => Number(b.count) - Number(a.count));
        };

        return {
          ...current,
          totalClicks: event.clicks,
          lastVisited: event.visit.visited_at,
          recentVisits: [event.visit, ...current.recentVisits].slice(0, 20),
          dailyTrend,
          browsers: updateAggregates(current.browsers, "browser"),
          os: updateAggregates(current.os, "os"),
          devices: updateAggregates(current.devices, "device"),
          countries: updateAggregates(current.countries, "country")
        };
      });
    });

    return () => socket.disconnect();
  }, [id]);

  if (!id) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <section className="mb-6">
            <div>
              <h1 className="text-3xl font-black">Analytics</h1>
              <p className="mt-2 text-slate-600">Select a short link to inspect its traffic.</p>
            </div>
          </section>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
          <section className="grid gap-3">
            {urls.length === 0 && !error && (
              <div className="card grid place-items-center gap-2 border-dashed p-12 text-center text-slate-600">
                <MousePointerClick size={32} />
                <p className="font-bold">No URLs available.</p>
              </div>
            )}
            {urls.map((url) => (
              <Link className="card grid gap-2 p-4 transition hover:border-emerald-300 md:grid-cols-[1fr_auto] md:items-center" key={url.id} to={`/analytics/${url.id}`}>
                <span className="break-all font-bold">{url.shortUrl}</span>
                <small className="font-black text-slate-500">{url.clicks} clicks</small>
              </Link>
            ))}
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand" to="/analytics">
          <ArrowLeft size={16} />
          All analytics
        </Link>

        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Link analytics</h1>
            <p className="mt-2 break-all text-slate-600">{analytics?.url?.shortUrl}</p>
          </div>
          <div className="card min-w-40 p-4 md:text-right">
            <span className="block text-3xl font-black">{analytics?.totalClicks ?? 0}</span>
            <small className="font-bold text-slate-500">Total clicks</small>
            <p className="mt-1 text-xs font-semibold text-emerald-700">Live updates on</p>
          </div>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        {!analytics && !error && <p className="font-semibold text-slate-600">Loading analytics...</p>}

        {analytics && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-lg font-black">Daily click trend</h2>
              {analytics.dailyTrend.length === 0 ? (
                <p className="text-slate-600">No clicks recorded yet.</p>
              ) : (
                <Line
                  data={{
                    labels: analytics.dailyTrend.map((item) => new Date(item.date).toLocaleDateString()),
                    datasets: [
                      {
                        label: "Clicks",
                        data: analytics.dailyTrend.map((item) => item.clicks),
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
            </section>

            <section className="card p-5 lg:col-span-2 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="md:col-span-2 lg:col-span-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black">Visitor Breakdown</h2>
                <p className="text-xs text-slate-500 mt-1">Detailed view of browsers, devices, OS, and countries of your visitors.</p>
              </div>
              {renderStatList("Top Countries", analytics.countries, analytics.totalClicks)}
              {renderStatList("Devices", analytics.devices, analytics.totalClicks)}
              {renderStatList("Operating Systems", analytics.os, analytics.totalClicks)}
              {renderStatList("Browsers", analytics.browsers, analytics.totalClicks)}
            </section>

            <section className="card p-5">
              <h2 className="mb-4 text-lg font-black">Visit summary</h2>
              <div className="grid gap-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Last visit</p>
                  <p className="mt-1 font-black">
                    {analytics.lastVisited ? new Date(analytics.lastVisited).toLocaleString() : "No visits yet"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Destination</p>
                  <p className="mt-1 break-all font-semibold">{analytics.url.original_url}</p>
                </div>
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 text-lg font-black">Recent visit history</h2>
              {analytics.recentVisits.length === 0 && (
                <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-slate-300 p-8 text-slate-600">
                  <MousePointerClick size={28} />
                  <p className="font-bold">No traffic yet.</p>
                </div>
              )}
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                {analytics.recentVisits.map((visit) => (
                  <div className="py-3 text-xs" key={visit.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 text-sm">
                        {new Date(visit.visited_at).toLocaleString()}
                      </span>
                      <strong className="text-slate-400">#{visit.id}</strong>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 font-semibold">
                      <span>IP: <span className="font-mono text-slate-600">{visit.ip_address || "Unknown"}</span></span>
                      <span>Country: <span className="text-slate-700">{visit.country || "Unknown"}</span></span>
                      <span>OS: <span className="text-slate-700">{visit.os || "Unknown"}</span></span>
                      <span>Browser: <span className="text-slate-700">{visit.browser || "Unknown"}</span></span>
                      <span>Device: <span className="text-slate-700">{visit.device || "Unknown"}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
