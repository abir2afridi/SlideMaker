import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center",
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "transition-all duration-300 hover:scale-105"
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn("h-4 w-4 absolute transition-all duration-300", dark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100")} />
      <Moon className={cn("h-4 w-4 absolute transition-all duration-300", dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0")} />
    </button>
  );
}
