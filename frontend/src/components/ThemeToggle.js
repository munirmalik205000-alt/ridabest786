import React from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      data-testid="theme-toggle-btn"
      className={`relative w-11 h-11 rounded-full surface-glass flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition ${className}`}
    >
      <Sun
        size={20}
        weight="fill"
        className={`absolute transition-all ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100 text-amber-500'}`}
      />
      <Moon
        size={20}
        weight="fill"
        className={`absolute transition-all ${isDark ? 'opacity-100 rotate-0 scale-100 text-indigo-300' : 'opacity-0 -rotate-90 scale-50'}`}
      />
    </button>
  );
};

export default ThemeToggle;
