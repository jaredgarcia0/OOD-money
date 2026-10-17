import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Overview", icon: "◈" },
  { to: "/paychecks", label: "Paychecks", icon: "＋" },
  { to: "/fixed-expenses", label: "Fixed expenses", icon: "▣" },
  { to: "/purchases", label: "Purchases", icon: "↗" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const page = links.find((link) => location.pathname.startsWith(link.to));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="app-brand" to="/dashboard">
          <span className="app-brand__mark" aria-hidden="true"><span /></span>
          <span>OOD<span>-</span>Money</span>
        </NavLink>
        <p className="sidebar__label">Your workspace</p>
        <nav className="sidebar__nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`} to={link.to}>
              <span className="nav-link__icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <div className="sidebar__tip"><span>✦</span><div><strong>Small steps</strong><p>Build your financial momentum one choice at a time.</p></div></div>
          <button className="logout-button" onClick={() => void logout()}><span>↪</span> Sign out</button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div><p className="topbar__eyebrow">Personal finance</p><p className="topbar__title">{page?.label || "Workspace"}</p></div>
          <div className="user-chip"><span className="user-chip__avatar">{String(user?.email || "U")[0].toUpperCase()}</span><span>{String(user?.email || "Your account")}</span></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
