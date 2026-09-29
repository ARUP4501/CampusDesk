import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1 text-sm bg-stone-100 border border-stone-300 px-2 py-1 rounded-[4px]">
      <Globe className="w-4 h-4 text-stone-600" aria-hidden="true" />
      <select
        value={i18n.resolvedLanguage || "en"}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border-none text-stone-800 text-xs font-medium cursor-pointer focus:outline-none"
        aria-label="Select portal language"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="or">ଓଡ଼ିଆ (Odia)</option>
      </select>
    </div>
  );
};
