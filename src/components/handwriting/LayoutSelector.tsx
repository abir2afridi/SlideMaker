import { PAGE_LAYOUTS, PAGE_SIZES } from '@/lib/handwriting/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface LayoutSelectorProps {
  selectedLayoutId: string;
  selectedSizeId: string;
  showMargin: boolean;
  showPageNumbers: boolean;
  inkSmudge: boolean;
  isSizeChangeDisabled?: boolean;
  onLayoutChange: (id: string) => void;
  onSizeChange: (id: string) => void;
  onMarginChange: (v: boolean) => void;
  onPageNumbersChange: (v: boolean) => void;
  onInkSmudgeChange: (v: boolean) => void;
}

export function LayoutSelector({
  selectedLayoutId, selectedSizeId, showMargin, showPageNumbers, inkSmudge,
  isSizeChangeDisabled,
  onLayoutChange, onSizeChange, onMarginChange, onPageNumbersChange, onInkSmudgeChange,
}: LayoutSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-foreground">Page Size</h3>
          {isSizeChangeDisabled && (
            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
              Size Locked (Content Exists)
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {PAGE_SIZES.map((size) => (
            <button
              key={size.id}
              disabled={isSizeChangeDisabled}
              onClick={() => onSizeChange(size.id)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-all relative overflow-hidden",
                selectedSizeId === size.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : isSizeChangeDisabled
                  ? "border-border bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              {size.name}
              <span className="text-xs ml-1 opacity-70">({size.width}×{size.height}mm)</span>
            </button>
          ))}
        </div>
        {isSizeChangeDisabled && (
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Page size must be chosen before writing. To change size, please clear all page content first.
          </p>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground mb-3">Paper Style</h3>
        <div className="grid grid-cols-2 gap-4">
          {PAGE_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onLayoutChange(layout.id)}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-xl border transition-all h-full",
                selectedLayoutId === layout.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "border-border hover:border-primary/40 bg-card hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-full aspect-[4/3] rounded-lg mb-3 shadow-inner border border-black/5",
                layout.id === 'aged' ? '' : 'bg-paper-white',
                layout.paperClass
              )} />
              <span className="text-xs font-medium text-foreground">{layout.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{layout.description}</span>
              {selectedLayoutId === layout.id && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-lg text-foreground">Options</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="margin" className="text-foreground">Show Margin</Label>
            <Switch id="margin" checked={showMargin} onCheckedChange={onMarginChange} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pagenum" className="text-foreground">Page Numbers</Label>
            <Switch id="pagenum" checked={showPageNumbers} onCheckedChange={onPageNumbersChange} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="smudge" className="text-foreground">Ink Smudge Effect</Label>
            <Switch id="smudge" checked={inkSmudge} onCheckedChange={onInkSmudgeChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
