import { NavLink } from "react-router-dom";
import {
  Clock,
  Gamepad2,
  LayoutDashboard,
  MessageSquareText,
  Users,
} from "lucide-react";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/player-persona", label: "Player Persona", icon: Users },
  {
    to: "/sentiment-analysis",
    label: "Sentiment Analysis",
    icon: MessageSquareText,
  },
  { to: "/playtime-prediction", label: "Playtime Prediction", icon: Clock },
  { to: "/recommendations", label: "Recommendations", icon: Gamepad2 },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Gamepad2 size={22} strokeWidth={1.9} />
        </span>
        <div>
          <p className="brand-name">Steam Review</p>
          <p className="brand-caption">Analytics Workspace</p>
        </div>
      </div>

      <nav className="sidebar-navigation" aria-label="Navigasi utama">
        <p className="navigation-label">Menu</p>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `navigation-link${isActive ? " is-active" : ""}`
              }
            >
              <span className="navigation-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <p className="sidebar-footer">Steam Review Analytics</p>
    </aside>
  );
}

export default Sidebar;