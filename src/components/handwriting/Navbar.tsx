import { Link, useLocation } from 'react-router-dom';
import { PenTool, FileText, Layout, Eye, Download, Home, Menu, X, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: Layout },
  { path: '/editor-handwriting', label: 'Editor', icon: FileText },
  { path: '/styles', label: 'Styles', icon: PenTool },
  { path: '/layout', label: 'Layout', icon: Layout },
  { path: '/preview', label: 'Preview', icon: Eye },
  { path: '/slides-handwriting', label: 'Slides', icon: Presentation },
  { path: '/export', label: 'Export', icon: Download },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
            <PenTool className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg text-foreground leading-tight">AI Assignment Writer</span>
            <span className="text-[10px] text-muted-foreground leading-none font-medium tracking-wider uppercase">Master</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="w-px h-6 bg-border mx-2" />
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-card overflow-hidden"
          >
            <div className="container py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
