import { StyleSelector } from './StyleSelector';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'neat', label: 'Neat' },
  { id: 'casual', label: 'Casual' },
  { id: 'messy', label: 'Messy' },
  { id: 'cursive', label: 'Cursive' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'typed', label: 'Typed' },
];

interface HandwritingStyleTabProps {
  globalStyleId: string;
  globalColorId: string;
  onStyleChange: (id: string) => void;
  onColorChange: (id: string) => void;
  applyStyleToAll: boolean;
  onApplyStyleToAllChange: (v: boolean) => void;
}

export function HandwritingStyleTab({
  globalStyleId,
  globalColorId,
  onStyleChange,
  onColorChange,
  applyStyleToAll,
  onApplyStyleToAllChange,
}: HandwritingStyleTabProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 pt-4 pb-3 border-b border-border/10 bg-[#fafafa] space-y-3">
        <h3 className="font-display text-lg text-foreground leading-none">Handwriting Style</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fonts..."
              className="w-full h-9 pl-8 pr-8 text-xs font-medium bg-background border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-auto h-9 text-[10px] font-semibold bg-background border-border/40 shrink-0 px-2.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs font-medium">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer group/toggle">
          <input
            type="checkbox"
            className="accent-primary w-3 h-3 rounded-sm cursor-pointer"
            checked={applyStyleToAll}
            onChange={(e) => onApplyStyleToAllChange(e.target.checked)}
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover/toggle:text-primary transition-colors">Apply to All Pages</span>
        </label>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-premium px-6 pb-6 pt-4">
        <StyleSelector
          selectedStyleId={globalStyleId}
          selectedColorId={globalColorId}
          onStyleChange={onStyleChange}
          onColorChange={onColorChange}
          hideColor
          hideTitle
          search={search}
          activeCategory={activeCategory}
        />
      </div>
    </div>
  );
}
