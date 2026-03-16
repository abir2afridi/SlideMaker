import { motion } from 'framer-motion';
import { Sparkles, Presentation, FileText, Layout, BarChart3, Globe, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Sparkles, label: 'Create', path: '/create' },
  { icon: Presentation, label: 'Presentations', path: '/' },
  { icon: Layout, label: 'Templates', path: '/templates' },
];

const secondaryItems = [
  { icon: FolderOpen, label: 'All Projects', path: '/', count: 12 },
  { icon: FileText, label: 'Drafts', path: '/', count: 3 },
  { icon: Globe, label: 'Published', path: '/', count: 5 },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', count: null },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="w-60 h-screen border-r border-border bg-surface flex flex-col shrink-0"
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">DeckAI</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
              ${location.pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-2">
        <div className="h-px bg-border" />
      </div>

      {/* Secondary Nav */}
      <nav className="p-3 space-y-1 flex-1">
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Library</p>
        {secondaryItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
              ${location.pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count !== null && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{item.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3">
        <div className="rounded-xl bg-hero-gradient p-4">
          <p className="text-sm font-semibold text-primary-foreground">Upgrade to Pro</p>
          <p className="text-xs text-primary-foreground/80 mt-1">Unlimited AI generations & exports</p>
          <button className="mt-3 w-full bg-background/20 backdrop-blur text-primary-foreground text-xs font-medium py-1.5 rounded-lg hover:bg-background/30 transition-colors duration-150">
            Learn more
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
