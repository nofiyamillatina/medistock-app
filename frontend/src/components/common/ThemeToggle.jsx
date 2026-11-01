import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const themeNames = { light: 'terang', dark: 'gelap', system: 'sistem' };

export default function ThemeToggle({ theme = 'system', onThemeChange, className = '', compact = false }) {
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = `Tema ${themeNames[theme] || themeNames.system}. Klik untuk beralih ke tema ${themeNames[nextTheme]}.`;

  return <button
    type="button"
    onClick={() => onThemeChange?.(nextTheme)}
    title={label}
    aria-label={label}
    className={`inline-flex ${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
  >
    <Icon size={compact ? 16 : 17} aria-hidden="true" />
  </button>;
}
