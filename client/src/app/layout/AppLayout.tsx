import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../lib/auth";
import { visibleNav } from "./nav";

/** Sidebar (only the pages this user may open) + header with the user and logout. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // close the mobile menu after navigating
  useEffect(() => setNavOpen(false), [location.pathname]);

  const groups = visibleNav(user!.permissions);

  return (
    <div className={`shell ${navOpen ? "nav-open" : ""}`}>
      <nav className="sidebar" aria-label="Main">
        <div className="brand">
          <img src="/favicon.svg" alt="" />
          Material Calc
        </div>
        {groups.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className="nav-link">
                {i.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost menu-toggle" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
            ☰
          </button>
          <div className="user-chip">
            <strong>{user!.name}</strong>
            <small>
              {user!.role ?? "No role"}
              {user!.department ? ` · ${user!.department}` : ""}
            </small>
          </div>
          <button className="btn btn-sm" onClick={logout}>
            Log out
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** "/" -> the first page this user may open. */
export function HomeRedirect() {
  const { user } = useAuth();
  const first = visibleNav(user!.permissions)[0]?.items[0];
  if (first) return <Navigate to={first.to} replace />;
  return (
    <div className="card">
      <div className="card-body">
        <h2>Welcome, {user!.name}</h2>
        <p className="muted">Your account has no pages yet. Ask an Admin to assign you a role.</p>
      </div>
    </div>
  );
}
