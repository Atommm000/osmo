import React from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-switcher">
      <div className="language-switcher-icon">
        <Globe size={14} />
      </div>

      <select
        className="language-switcher-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as "vi" | "en")}
        aria-label={t.selectLanguage}
      >
        <option value="vi">{t.vietnamese}</option>
        <option value="en">{t.english}</option>
      </select>

      <div className="language-switcher-chevron">
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
