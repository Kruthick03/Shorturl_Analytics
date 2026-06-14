import { BarChart3, Link as LinkIcon, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-6xl items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
      <NavLink to="/" className="flex items-center gap-2 font-black text-ink">
        <LinkIcon size={22} />
        <span>ShortURL</span>
      </NavLink>

      <nav className="flex items-center gap-2">
        <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-bold ${isActive ? "bg-emerald-50 text-brand" : "text-slate-600"}`} to="/" end>
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${isActive ? "bg-emerald-50 text-brand" : "text-slate-600"}`} to="/analytics">
          <BarChart3 size={18} />
          Analytics
        </NavLink>
      </nav>

      <div className="flex items-center justify-start gap-3 text-sm font-semibold text-slate-600 md:justify-end">
        <span className="truncate">{user?.name}</span>
        <button className="btn-icon" onClick={handleLogout} title="Log out" type="button">
          <LogOut size={18} />
        </button>
      </div>
      </div>
    </header>
  );
}
