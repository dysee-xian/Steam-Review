import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronDown,
  Gamepad2,
  History,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Users,
} from "lucide-react";

const navigationItems = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  {
    to: "/sentiment-analysis",
    label: "Sentiment Analysis",
    icon: MessageSquareText,
  },
  { to: "/absa-analysis", label: "ABSA Analysis", icon: BarChart3 },
  { to: "/player-persona", label: "Player Persona (SAW)", icon: Users },
  {
    to: "/engagement-decline-prediction",
    label: "Engagement Decline Prediction",
    icon: Activity,
  },
  { to: "/analysis-history", label: "Analysis History", icon: History },
];

function SidebarContents() {
  return (
    <>
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Gamepad2 size={22} strokeWidth={1.9} />
        </span>
        <div>
          <p className="brand-name">Steam Review</p>
          <p className="brand-caption">Analitik Ulasan Game</p>
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

      <p className="sidebar-footer">Wawasan dari suara pemain</p>
    </>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-desktop">
        <SidebarContents />
      </div>
      <details className="sidebar-drawer">
        <summary
          className="sidebar-drawer-toggle"
          aria-label="Buka atau tutup navigasi"
        >
          <Menu size={20} aria-hidden="true" />
          <span>Menu</span>
          <ChevronDown
            className="sidebar-drawer-chevron"
            size={18}
            aria-hidden="true"
          />
        </summary>
        <div className="sidebar-content">
          <SidebarContents />
        </div>
      </details>
    </aside>
  );
}

export default Sidebar;