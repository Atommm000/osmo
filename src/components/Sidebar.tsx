import React from "react";
import { Sparkles, FileText, History, ChevronRight, LucideIcon, LogOut } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { CosmoLogo } from "./CosmoLogo";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  activeTab: 'analyze' | 'script' | 'history';
  setActiveTab: (tab: 'analyze' | 'script' | 'history') => void;
  goHome: () => void;
}

export function Sidebar({ activeTab, setActiveTab, goHome }: SidebarProps) {
  const { t } = useLanguage();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    goHome();
  };

  const items: { key: 'analyze' | 'script' | 'history'; label: string; icon: LucideIcon }[] = [
    { key: "analyze", label: t.analysis, icon: Sparkles },
    { key: "script", label: t.script, icon: FileText },
    { key: "history", label: t.history, icon: History },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <button
          className="sidebar-brand w-full text-left"
          onClick={goHome}
          type="button"
        >
          <CosmoLogo size={40} />

          <div className="sidebar-brand-text">
            <div className="sidebar-title">Cosmo</div>
            <div className="sidebar-subtitle">
              Explore video intelligence
            </div>
          </div>
        </button>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
              type="button"
            >
              <span className="sidebar-item-icon">
                <Icon size={18} />
              </span>

              <span className="sidebar-item-label">{item.label}</span>

              <span className="sidebar-item-arrow">
                <ChevronRight size={16} />
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="sidebar-item logout-btn mb-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
        
        <span className="text-[10px] font-medium text-muted uppercase tracking-wider block text-center">
          An app by Mai Lan Huong
        </span>
      </div>
    </div>
  );
}
