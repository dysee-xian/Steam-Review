import { NavLink } from "react-router-dom";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/player-persona", label: "Player Persona", icon: "P" },
  { to: "/sentiment-analysis", label: "Sentiment Analysis", icon: "S" },
  { to: "/playtime-prediction", label: "Playtime Prediction", icon: "T" },
  { to: "/recommendations", label: "Recommendations", icon: "R" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          S
        </span>
        <div>
          <p className="brand-name">Steam Review</p>
          <p className="brand-caption">Analytics workspace</p>
        </div>
      </div>

      <nav className="sidebar-navigation" aria-label="Navigasi utama">
        <p className="navigation-label">Menu</p>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `navigation-link${isActive ? " is-active" : ""}`
            }
          >
            <span className="navigation-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="sidebar-footer">Steam Review Analytics</p>
    </aside>
  );
}

export default Sidebar;