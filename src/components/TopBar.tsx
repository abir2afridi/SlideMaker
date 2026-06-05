import { motion } from 'framer-motion';
import { Search, Bell, Plus, Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/handwriting/ThemeToggle';

function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const h12 = now.getHours() % 12 || 12;
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { h12, mm, ss, ampm, dateStr };
}

export default function TopBar() {
  const navigate = useNavigate();
  const { h12, mm, ss, ampm, dateStr } = useLiveClock();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="h-14 border-b border-border bg-background px-3 sm:px-6 flex items-center justify-between shrink-0 gap-2"
    >
      {/* Search — hidden on small screens, toggleable via icon */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search presentations, templates..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        {/* Mobile search toggle */}
        {searchOpen ? (
          <div className="flex items-center gap-2 sm:hidden flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={() => setSearchOpen(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden text-muted-foreground p-1.5"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-4">
        {/* Live Clock */}
        <div className="flex items-center gap-1 text-sm font-mono select-none">
          <span className="font-semibold text-foreground">{h12}:{mm}</span>
          <span className="font-bold text-red-500 hidden xs:inline">{ss}</span>
          <span className="text-xs font-semibold text-muted-foreground ml-0.5 hidden xs:inline">{ampm}</span>
          <span className="text-xs text-muted-foreground/60 ml-2 hidden md:inline">{dateStr}</span>
        </div>

        <div className="h-4 w-[1px] bg-border hidden xs:block" />

        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/developer')}
          className="text-muted-foreground hover:text-foreground"
          title="About Developer"
        >
          <Terminal className="w-4 h-4" />
        </Button>

        <Button variant="hero" size="sm" onClick={() => navigate('/create')} className="gap-1.5 px-2 sm:px-3">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Deck</span>
        </Button>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-hero-gradient flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary-foreground">
          U
        </div>
      </div>
    </motion.header>
  );
}
