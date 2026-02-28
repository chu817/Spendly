import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
  datasetLabel?: string;
}

const SIDEBAR_STORAGE_KEY = "spendly_sidebar_open";

export default function Layout({ children, datasetLabel = "Elo historical_transactions.csv" }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) setSidebarOpen(stored === "true");
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const isDashboard = router.pathname === "/dashboard" && !router.query.card_id;

  return (
    <div className={`layoutRoot ${sidebarOpen ? "" : "sidebarClosed"}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebarHeader">
          <Link href="/dashboard" className="sidebarLogo">
            Spendly
          </Link>
          <div className="datasetPill">{datasetLabel}</div>
          <button
            type="button"
            className="sidebarToggle sidebarToggleClose"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <span aria-hidden>←</span>
          </button>
        </div>

        <nav className="sidebarNav">
          <span className="navSection">OVERVIEW</span>
          <Link
            href="/dashboard"
            className={`navItem ${isDashboard ? "navItemActive" : ""}`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="sidebarFooter">
          <div className="userPill">Spendly User</div>
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          type="button"
          className="sidebarOpenBtn"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <span aria-hidden>☰</span>
        </button>
      )}

      <main className="layoutMain">{children}</main>
    </div>
  );
}
