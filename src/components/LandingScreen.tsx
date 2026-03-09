import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CreatorNoteModal } from "./CreatorNoteModal";

interface LandingScreenProps {
  onEnter: () => void;
}

export function LandingScreen({ onEnter }: LandingScreenProps) {
  const { language, t } = useLanguage();
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  return (
    <div className="landing-screen">
      <div className="landing-bg" />
      <div className="landing-overlay" />
      <div className="landing-stars" />

      <div className="landing-topbar">
        <LanguageSwitcher />
      </div>

      <div className="landing-content">
        <div className="landing-badge">Cosmo Interface</div>

        <h1 className="landing-title">{t.landingTitle}</h1>

        <p className="landing-subtitle">
          {t.landingSubtitle}
        </p>

        <div className="flex flex-col items-center gap-6">
          <button className="btn btn-primary landing-button" onClick={onEnter} type="button">
            {t.enterSystem}
          </button>

          <button 
            onClick={() => setIsNoteOpen(true)}
            className="text-xs text-muted hover:text-primary transition-colors underline underline-offset-4 decoration-white/10"
          >
            {language === 'vi' ? 'hoặc đọc đôi lời từ người sáng tạo' : 'or read a short note from the creator'}
          </button>
        </div>
      </div>

      <CreatorNoteModal isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} />
    </div>
  );
}
