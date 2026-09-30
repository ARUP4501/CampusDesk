import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1.5 text-xs bg-[#101316] border border-[#252B31] hover:border-[#363E48] px-2 py-1 rounded-[4px] transition-colors">
      <Globe className="w-3.5 h-3.5 text-[#D6A84F]" aria-hidden="true" />
      <select
        value={i18n.resolvedLanguage || "en"}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border-none text-[#F3F4F6] text-xs font-medium cursor-pointer focus:outline-none pr-1"
        aria-label="Select portal language"
      >
        <option value="en" className="bg-[#14181C] text-[#F3F4F6]">EN (English)</option>
        <option value="hi" className="bg-[#14181C] text-[#F3F4F6]">HI (हिंदी)</option>
        <option value="or" className="bg-[#14181C] text-[#F3F4F6]">OR (ଓଡ଼ିଆ)</option>
      </select>
    </div>
  );
};
