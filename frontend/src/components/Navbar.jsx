import { BarChart3, LinkIcon, LogOut, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createSocket } from "../api/socket";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = createSocket();
    if (!socket) return;

    setConnected(socket.connected);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 px-4 py-3.5 backdrop-blur-md shadow-sm shadow-slate-100/30">
      <div className="mx-auto flex flex-col md:flex-row md:items-center justify-between max-w-6xl gap-4">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 font-black text-slate-800 text-lg transition duration-200 hover:scale-[1.02]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
            <LinkIcon size={18} className="stroke-[2.5]" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-slate-800 bg-clip-text text-transparent">URLytics</span>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl">
          <NavLink 
            className={({ isActive }) => 
              `rounded-lg px-4 py-1.5 text-xs font-black tracking-wide transition-all duration-200 ${
                isActive 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`
            } 
            to="/" 
            end
          >
            Dashboard
          </NavLink>
          <NavLink 
            className={({ isActive }) => 
              `flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-black tracking-wide transition-all duration-200 ${
                isActive 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`
            } 
            to="/analytics"
          >
            <BarChart3 size={14} />
            Analytics
          </NavLink>
          {user?.role === "admin" && (
            <NavLink 
              className={({ isActive }) => 
                `rounded-lg px-4 py-1.5 text-xs font-black tracking-wide transition-all duration-200 ${
                  isActive 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`
              } 
              to="/admin"
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 justify-between md:justify-end">
          {/* Socket Status Badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all ${
            connected 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
              : "bg-amber-50 text-amber-600 border border-amber-100"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse-glow" : "bg-amber-400"}`} />
            <span className="font-extrabold tracking-wider uppercase text-[9px]">{connected ? "Live Connected" : "Connecting..."}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-black text-slate-800 border-l border-slate-200 pl-3 hidden sm:inline">{user?.name}</span>
            <button 
              className="btn-icon bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
              onClick={handleLogout} 
              title="Log out" 
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
