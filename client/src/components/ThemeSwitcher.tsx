import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  compact = false,
  className = ""
}) => {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
          theme === "dark"
            ? "bg-[#111111] text-[#FAF3E1] border-[#FAF3E1]/15 hover:border-[#FF6D1F]/50"
            : "bg-[#F5E7C6] text-[#222222] border-[#222222]/15 hover:border-[#FF6D1F]/50"
        } ${className}`}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Active: ${theme.toUpperCase()} mode. Click to toggle.`}
      >
        {theme === "dark" ? (
          <Moon className="w-3.5 h-3.5 text-[#FF6D1F]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#FF6D1F]" />
        )}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode switcher"
      className={`inline-flex items-center p-0.5 rounded-lg border font-mono text-[10px] tracking-wider font-semibold select-none ${
        theme === "dark"
          ? "bg-[#0A0A0A] border-[#FAF3E1]/10 text-[#F5E7C6]/70"
          : "bg-[#F5E7C6] border-[#222222]/15 text-[#524E48]"
      } ${className}`}
    >
      {/* Dark Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded-md transition-all ${
          theme === "dark"
            ? "bg-[#1A1A1A] text-[#FAF3E1] shadow-xs border border-[#FAF3E1]/10 font-bold"
            : "text-[#524E48] hover:text-[#222222]"
        }`}
      >
        <Moon className={`w-3 h-3 ${theme === "dark" ? "text-[#FF6D1F]" : "text-[#524E48]"}`} />
        <span>DARK</span>
      </button>

      {/* Light Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => setTheme("light")}
        className={`flex items-center space-x-1.5 px-2 py-1 rounded-md transition-all ${
          theme === "light"
            ? "bg-[#FAF3E1] text-[#222222] shadow-xs border border-[#222222]/10 font-bold"
            : "text-[#F5E7C6]/70 hover:text-[#FAF3E1]"
        }`}
      >
        <Sun className={`w-3 h-3 ${theme === "light" ? "text-[#FF6D1F]" : "text-[#F5E7C6]/60"}`} />
        <span>LIGHT</span>
      </button>
    </div>
  );
};
