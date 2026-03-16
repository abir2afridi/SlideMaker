import { motion } from 'framer-motion';
import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="h-14 border-b border-border bg-background px-6 flex items-center justify-between shrink-0"
    >
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search presentations, templates..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="hero" size="sm" onClick={() => navigate('/create')} className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Deck
        </Button>
        <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center text-xs font-bold text-primary-foreground ml-2">
          U
        </div>
      </div>
    </motion.header>
  );
}
