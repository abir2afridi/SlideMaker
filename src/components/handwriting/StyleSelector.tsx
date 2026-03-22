import { HANDWRITING_STYLES, INK_COLORS } from '@/lib/handwriting/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface StyleSelectorProps {
  selectedStyleId: string;
  selectedColorId: string;
  onStyleChange: (id: string) => void;
  onColorChange: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'neat', label: 'Neat' },
  { id: 'casual', label: 'Casual' },
  { id: 'messy', label: 'Messy' },
  { id: 'cursive', label: 'Cursive' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'typed', label: 'Typed' },
];

export function StyleSelector({ selectedStyleId, selectedColorId, onStyleChange, onColorChange }: StyleSelectorProps) {
  const selectedColor = INK_COLORS.find(c => c.id === selectedColorId) || INK_COLORS[0];
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredStyles = activeCategory === 'all'
    ? HANDWRITING_STYLES
    : HANDWRITING_STYLES.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-foreground mb-3">Handwriting Style</h3>
        
        {/* Category filter */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                selectedStyleId === style.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 bg-card"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm font-medium text-foreground">{style.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    "bg-muted text-muted-foreground"
                  )}>
                    {style.category}
                  </span>
                  {selectedStyleId === style.id && <Check className="h-4 w-4 text-primary" />}
                </div>
              </div>
              <span
                className={cn(style.fontClass, "text-lg leading-tight")}
                style={{ color: selectedColor.value }}
              >
                The quick brown fox
              </span>
              <span className="text-xs text-muted-foreground mt-1">{style.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-foreground mb-0">Ink Color</h3>
          <span className="text-[10px] font-black tracking-widest uppercase text-primary/60">
            {INK_COLORS.find(c => c.id === selectedColorId)?.name || 'Custom Color'}
          </span>
        </div>
        
        <div className="flex gap-2.5 flex-wrap">
          {INK_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.id)}
              className={cn(
                "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center relative",
                selectedColorId === color.id
                  ? "border-primary scale-110 shadow-md"
                  : "border-transparent hover:scale-105 bg-muted/40"
              )}
              style={{ backgroundColor: color.value }}
            >
              {selectedColorId === color.id && <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />}
            </button>
          ))}

          {/* CUSTOM COLOR PICKER */}
          <div className="relative group">
             <input 
               type="color"
               value={selectedColor.value}
               onChange={(e) => {
                 // We don't have a direct 'setCustomColor' in store yet, 
                 // but we can pass a special marker or just use it as colorId if it starts with #
                 onColorChange(e.target.value);
               }}
               className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
             />
             <div className={cn(
               "w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-all",
               !INK_COLORS.some(c => c.id === selectedColorId)
               ? "border-primary scale-110 bg-primary/5"
               : "border-muted-foreground/30 hover:border-primary/50 group-hover:scale-105"
             )}>
                <div 
                  className="w-5 h-5 rounded-full shadow-inner" 
                  style={{ backgroundColor: !INK_COLORS.some(c => c.id === selectedColorId) ? selectedColorId : '#cbd5e1' }} 
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
