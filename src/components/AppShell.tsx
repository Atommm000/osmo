import React from "react";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbarRight?: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  sidebar,
  topbarRight,
  header,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell layout-shell">
      <aside className="sidebar-shell">
        {sidebar}
      </aside>

      <div className="main-shell">
        <div className="flex justify-between items-center px-8 pt-6 pb-2">
          <div />
          <div className="app-main-topbar-right">
            {topbarRight}
          </div>
        </div>

        <header className="main-header-shell">
          {header}
        </header>

        <main className="main-content-shell">
          {children}
        </main>
      </div>
    </div>
  );
}
