import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function MainHeader() {
  const { language, t } = useLanguage();

  return (
    <div className="main-header">
      <div className="main-header-left">
        <h1 className="main-header-title">{t.appTitle}</h1>
        <p className="main-header-subtitle">
          {language === 'vi' ? 'Khám phá tri thức từ video với AI' : 'Explore video intelligence with AI'}
        </p>
      </div>
    </div>
  );
}
