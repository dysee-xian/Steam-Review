import { Outlet } from "react-router-dom";
import PageHeader from "./PageHeader";
import Sidebar from "./Sidebar";

function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <PageHeader />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;