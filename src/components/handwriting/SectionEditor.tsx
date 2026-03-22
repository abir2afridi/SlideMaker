import { useAppStore } from '@/lib/handwriting/store';
import { HANDWRITING_STYLES, INK_COLORS } from '@/lib/handwriting/types';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Type, PenTool, Heading1, Heading2, Heading3, List, ListOrdered, Upload, Move, Maximize2, Palette, Sparkles, Loader2, Wand2, Settings, Languages, Check } from 'lucide-react';
import { refineTextWithAI, isUsingCustomKey, setCustomAPIKey, switchToDefaultKey, switchToCustomKey, getCustomKey } from '@/lib/handwriting/aiHelper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionEditorProps {
  pageIndex: number;
  page: PageConfig;
}

function FormatButton({ icon: Icon, label, onClick, active }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "p-1.5 rounded transition-colors",
            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SectionEditor({ pageIndex, page }: SectionEditorProps) {
  const { updateSection, addSection, removeSection, setGlobalStyle, setGlobalColor } = useAppStore();
  const [applyToAll, setApplyToAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagramInputRef = useRef<HTMLInputElement>(null);
  const activeImageSection = useRef<number>(0);
  const [editingImageIdx, setEditingImageIdx] = useState<{ sIdx: number; imgIdx: number } | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState<number | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(getCustomKey());
  const [usingCustom, setUsingCustom] = useState(isUsingCustomKey());

  const handleAIAssist = async (sIdx: number, sectionContent: string, instruction: string) => {
    if (!sectionContent.trim()) return;
    setIsGeneratingId(sIdx);
    
    // Auto-enable apply to all if user is doing AI refinement and it's a global task? No, let user decide.
    
    try {
      const improved = await refineTextWithAI({
        content: sectionContent,
        instruction,
      });
      
      if (improved) {
        if (applyToAll) {
          useAppStore.getState().updateSectionGlobally({ content: improved });
        } else {
          updateSection(pageIndex, sIdx, { content: improved });
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert(error instanceof Error ? error.message : "AI refinement failed. Please try again.");
    } finally {
      setIsGeneratingId(null);
    }
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, sIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSection(pageIndex, sIdx, { imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [pageIndex, updateSection]);

  const handleDiagramUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, sIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const section = page.sections[sIdx];
      const existing = section.images || [];
      const newImg = {
        url: reader.result as string,
        x: 10,
        y: 10,
        width: 200,
        height: 150,
      };
      updateSection(pageIndex, sIdx, { images: [...existing, newImg] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [pageIndex, updateSection, page]);

  if (!page) return null;

  const insertFormatting = (sIdx: number, prefix: string) => {
    const section = page.sections[sIdx];
    const newContent = section.content + prefix;
    updateSection(pageIndex, sIdx, { content: newContent });
  };

  const updateImage = (sIdx: number, imgIdx: number, updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    const section = page.sections[sIdx];
    const images = [...(section.images || [])];
    images[imgIdx] = { ...images[imgIdx], ...updates };
    updateSection(pageIndex, sIdx, { images });
  };

  const removeImage = (sIdx: number, imgIdx: number) => {
    const section = page.sections[sIdx];
    const images = (section.images || []).filter((_, i) => i !== imgIdx);
    updateSection(pageIndex, sIdx, { images });
    setEditingImageIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="flex items-center gap-2 cursor-pointer group bg-muted/20 px-3 py-1.5 rounded-lg border border-border/10 hover:bg-muted/30 transition-all">
          <input 
            type="checkbox" 
            checked={applyToAll} 
            onChange={(e) => setApplyToAll(e.target.checked)} 
            className="w-3.5 h-3.5 rounded border-primary/20 text-primary focus:ring-primary/20"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Apply formatting to all pages</span>
        </label>
      </div>

      <AnimatePresence>
        {page.sections.map((section, sIdx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Top toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const newType = section.type === 'handwritten' ? 'typed' : 'handwritten';
                    if (applyToAll) {
                      useAppStore.getState().updateSectionGlobally({ type: newType });
                    } else {
                      updateSection(pageIndex, sIdx, { type: newType });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    section.type === 'handwritten'
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary text-secondary-foreground border-border"
                  )}
                >
                  {section.type === 'handwritten' ? <PenTool className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                  {section.type === 'handwritten' ? 'Handwritten' : 'Typed'}
                </button>

                {section.type === 'handwritten' && (
                  <Select 
                    value={section.styleId} 
                    onValueChange={(v) => {
                      if (applyToAll) setGlobalStyle(v, true);
                      else updateSection(pageIndex, sIdx, { styleId: v });
                    }}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDWRITING_STYLES.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className={cn(s.fontClass, "text-sm")}>{s.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Ink color buttons */}
                <div className="flex gap-1 items-center">
                  {INK_COLORS.slice(0, 6).map(c => (
                    <Tooltip key={c.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (applyToAll) setGlobalColor(c.id, true);
                            else updateSection(pageIndex, sIdx, { colorId: c.id, customColor: undefined });
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                            section.colorId === c.id && !section.customColor ? "border-foreground scale-110 shadow-md" : "border-border"
                          )}
                          style={{ backgroundColor: c.value }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{c.name}</TooltipContent>
                    </Tooltip>
                  ))}

                  {/* Color Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                          section.customColor ? "border-foreground scale-110 shadow-md" : "border-border bg-secondary"
                        )}
                        style={section.customColor ? { backgroundColor: section.customColor } : undefined}
                      >
                        {!section.customColor && <Palette className="h-3 w-3 text-muted-foreground" />}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" side="bottom">
                      <div className="flex items-center justify-between mb-3 border-b border-border/10 pb-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ink Controls</Label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={applyToAll} 
                            onChange={(e) => setApplyToAll(e.target.checked)} 
                            className="w-3 h-3 rounded"
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Apply to all</span>
                        </label>
                      </div>
                      <Label className="text-xs font-medium mb-2 block">Custom Ink Color</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={section.customColor || '#1a5276'}
                          onChange={(e) => updateSection(pageIndex, sIdx, { customColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <Input
                          value={section.customColor || ''}
                          onChange={(e) => updateSection(pageIndex, sIdx, { customColor: e.target.value })}
                          placeholder="#1a5276"
                          className="text-xs h-8"
                        />
                      </div>
                      {section.customColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full text-xs"
                          onClick={() => updateSection(pageIndex, sIdx, { customColor: undefined })}
                        >
                          Reset to preset
                        </Button>
                      )}
                      {/* More preset colors */}
                      <div className="flex gap-1.5 flex-wrap mt-3 pt-2 border-t">
                        {INK_COLORS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => updateSection(pageIndex, sIdx, { colorId: c.id, customColor: undefined })}
                            className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-all"
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <button
                onClick={() => removeSection(pageIndex, sIdx)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-muted/50 border">
              <FormatButton 
                icon={Heading1} 
                label="Heading 1" 
                onClick={() => {
                  const partial = { isHeading: section.isHeading && section.headingLevel === 1 ? false : true, headingLevel: section.isHeading && section.headingLevel === 1 ? undefined : 1 };
                  if (applyToAll) useAppStore.getState().updateSectionGlobally(partial);
                  else updateSection(pageIndex, sIdx, partial);
                }} 
                active={section.isHeading && section.headingLevel === 1} 
              />
              <FormatButton 
                icon={Heading2} 
                label="Heading 2" 
                onClick={() => {
                  const partial = { isHeading: section.isHeading && section.headingLevel === 2 ? false : true, headingLevel: section.isHeading && section.headingLevel === 2 ? undefined : 2 };
                  if (applyToAll) useAppStore.getState().updateSectionGlobally(partial);
                  else updateSection(pageIndex, sIdx, partial);
                }} 
                active={section.isHeading && section.headingLevel === 2} 
              />
              <FormatButton 
                icon={Heading3} 
                label="Heading 3" 
                onClick={() => {
                  const partial = { isHeading: section.isHeading && section.headingLevel === 3 ? false : true, headingLevel: section.isHeading && section.headingLevel === 3 ? undefined : 3 };
                  if (applyToAll) useAppStore.getState().updateSectionGlobally(partial);
                  else updateSection(pageIndex, sIdx, partial);
                }} 
                active={section.isHeading && section.headingLevel === 3} 
              />
              <div className="w-px h-5 bg-border mx-1" />
              <FormatButton 
                icon={Type} 
                label="Normal text" 
                onClick={() => {
                  const partial = { isHeading: false, headingLevel: undefined };
                  if (applyToAll) useAppStore.getState().updateSectionGlobally(partial);
                  else updateSection(pageIndex, sIdx, partial);
                }} 
                active={!section.isHeading} 
              />
              <div className="w-px h-5 bg-border mx-1" />
              <FormatButton icon={List} label="Bullet list" onClick={() => insertFormatting(sIdx, '\n• ')} />
              <FormatButton icon={ListOrdered} label="Numbered list" onClick={() => insertFormatting(sIdx, '\n1. ')} />
              <div className="w-px h-5 bg-border mx-1" />
              <FormatButton
                icon={Upload}
                label="Upload inline image"
                onClick={() => {
                  activeImageSection.current = sIdx;
                  fileInputRef.current?.click();
                }}
              />
              <FormatButton
                icon={Move}
                label="Add positionable diagram"
                onClick={() => {
                  activeImageSection.current = sIdx;
                  diagramInputRef.current?.click();
                }}
              />
            </div>

            {/* Inline image preview */}
            {section.imageUrl && (
              <div className="relative group">
                <img
                  src={section.imageUrl}
                  alt="Uploaded"
                  className="max-h-40 rounded-lg border object-contain"
                />
                <button
                  onClick={() => updateSection(pageIndex, sIdx, { imageUrl: undefined })}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Positionable diagrams */}
            {section.images && section.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Diagrams ({section.images.length})</span>
                <div className="flex gap-2 flex-wrap">
                  {section.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative group">
                      <img
                        src={img.url}
                        alt={`Diagram ${imgIdx + 1}`}
                        className={cn(
                          "h-20 rounded-lg border object-cover cursor-pointer transition-all",
                          editingImageIdx?.sIdx === sIdx && editingImageIdx?.imgIdx === imgIdx
                            ? "ring-2 ring-primary"
                            : "hover:ring-1 hover:ring-primary/50"
                        )}
                        onClick={() => setEditingImageIdx(
                          editingImageIdx?.sIdx === sIdx && editingImageIdx?.imgIdx === imgIdx
                            ? null
                            : { sIdx, imgIdx }
                        )}
                      />
                      <button
                        onClick={() => removeImage(sIdx, imgIdx)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Image position/size editor */}
                {editingImageIdx && editingImageIdx.sIdx === sIdx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-muted/50 rounded-lg border p-3 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Maximize2 className="h-3.5 w-3.5" />
                      Diagram {editingImageIdx.imgIdx + 1} — Position & Size
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">X Position</Label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={section.images![editingImageIdx.imgIdx].x}
                              onChange={(e) => updateImage(sIdx, editingImageIdx.imgIdx, { x: Number(e.target.value) })}
                              className="w-10 h-5 bg-transparent border-none text-[10px] text-right font-mono focus:ring-0 p-0"
                            />
                            <button 
                              onClick={() => updateImage(sIdx, editingImageIdx.imgIdx, { x: 100 })}
                              className="text-[9px] bg-primary/5 hover:bg-primary/10 px-1 rounded transition-colors"
                            >
                              Center
                            </button>
                          </div>
                        </div>
                        <Slider
                          value={[section.images![editingImageIdx.imgIdx].x]}
                          onValueChange={([v]) => {
                            if (applyToAll) {
                              useAppStore.getState().updateSectionGlobally({ 
                                images: section.images?.map((img, i) => i === editingImageIdx.imgIdx ? { ...img, x: v } : img) 
                              });
                            } else {
                              updateImage(sIdx, editingImageIdx.imgIdx, { x: v });
                            }
                          }}
                          min={0} max={600} step={1}
                          className="mt-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Y Position</Label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={section.images![editingImageIdx.imgIdx].y}
                              onChange={(e) => updateImage(sIdx, editingImageIdx.imgIdx, { y: Number(e.target.value) })}
                              className="w-10 h-5 bg-transparent border-none text-[10px] text-right font-mono focus:ring-0 p-0"
                            />
                            <button 
                              onClick={() => updateImage(sIdx, editingImageIdx.imgIdx, { y: 250 })}
                              className="text-[9px] bg-primary/5 hover:bg-primary/10 px-1 rounded transition-colors"
                            >
                              Center
                            </button>
                          </div>
                        </div>
                        <Slider
                          value={[section.images![editingImageIdx.imgIdx].y]}
                          onValueChange={([v]) => {
                            if (applyToAll) {
                              useAppStore.getState().updateSectionGlobally({ 
                                images: section.images?.map((img, i) => i === editingImageIdx.imgIdx ? { ...img, y: v } : img) 
                              });
                            } else {
                              updateImage(sIdx, editingImageIdx.imgIdx, { y: v });
                            }
                          }}
                          min={0} max={900} step={1}
                          className="mt-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Width</Label>
                          <input 
                            type="number" 
                            value={section.images![editingImageIdx.imgIdx].width}
                            onChange={(e) => updateImage(sIdx, editingImageIdx.imgIdx, { width: Number(e.target.value) })}
                            className="w-10 h-5 bg-transparent border-none text-[10px] text-right font-mono focus:ring-0 p-0"
                          />
                        </div>
                        <Slider
                          value={[section.images![editingImageIdx.imgIdx].width]}
                          onValueChange={([v]) => {
                            if (applyToAll) {
                              useAppStore.getState().updateSectionGlobally({ 
                                images: section.images?.map((img, i) => i === editingImageIdx.imgIdx ? { ...img, width: v } : img) 
                              });
                            } else {
                              updateImage(sIdx, editingImageIdx.imgIdx, { width: v });
                            }
                          }}
                          min={20} max={800} step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Height</Label>
                        <Slider
                          value={[section.images![editingImageIdx.imgIdx].height]}
                          onValueChange={([v]) => {
                            if (applyToAll) {
                              useAppStore.getState().updateSectionGlobally({ 
                                images: section.images?.map((img, i) => i === editingImageIdx.imgIdx ? { ...img, height: v } : img) 
                              });
                            } else {
                              updateImage(sIdx, editingImageIdx.imgIdx, { height: v });
                            }
                          }}
                          min={50} max={900} step={1}
                          className="mt-1"
                        />
                        <span className="text-[10px] text-muted-foreground">{section.images![editingImageIdx.imgIdx].height}px</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Textarea */}
            <div className="relative group/textarea">
              <textarea
                value={section.content}
                onChange={(e) => updateSection(pageIndex, sIdx, { content: e.target.value })}
                placeholder={section.type === 'handwritten' ? 'Write your handwritten text here...' : 'Type your text here...'}
                className="w-full min-h-[140px] bg-background rounded-lg border p-3 text-sm font-body text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all pb-10"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover/textarea:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-7 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-none gap-1">
                      {isGeneratingId === sIdx ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Ask AI
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleAIAssist(sIdx, section.content, "Fix grammar and spelling")}>
                      <Wand2 className="mr-2 h-4 w-4 text-primary" />
                      Fix Grammar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAssist(sIdx, section.content, "Refine and professionally improve text")}>
                      <Sparkles className="mr-2 h-4 w-4 text-green-500" />
                      Refine Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAssist(sIdx, section.content, "Rephrase for better clarity and engagement")}>
                      <Type className="mr-2 h-4 w-4 text-blue-500" />
                      Rephrase
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAssist(sIdx, section.content, "Translate to Bengali professionally")}>
                      <span className="mr-2 text-sm">🇧🇩</span>
                      Translate to Bengali
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIAssist(sIdx, section.content, "Translate to English professionally")}>
                      <Languages className="mr-2 h-4 w-4 text-orange-500" />
                      Translate to English
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowAISettings(!showAISettings); }}>
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      AI Settings
                    </DropdownMenuItem>
                    {showAISettings && (
                      <div className="px-2 py-3 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { switchToDefaultKey(); setUsingCustom(false); }}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all",
                                !usingCustom ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                              )}
                            >
                              {!usingCustom && <Check className="inline h-3 w-3 mr-1" />}Default Key
                            </button>
                            <button
                              onClick={() => { switchToCustomKey(); setUsingCustom(true); }}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all",
                                usingCustom ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                              )}
                            >
                              {usingCustom && <Check className="inline h-3 w-3 mr-1" />}Own Key
                            </button>
                          </div>
                          {usingCustom && (
                            <div className="space-y-1">
                              <Input
                                type="password"
                                placeholder="sk-or-v1-..."
                                value={customKeyInput}
                                onChange={e => setCustomKeyInput(e.target.value)}
                                className="h-7 text-xs"
                              />
                              <Button
                                size="sm"
                                className="w-full h-6 text-[9px] uppercase font-bold tracking-widest"
                                onClick={() => { setCustomAPIKey(customKeyInput); }}
                              >
                                Save Key
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">
                          {usingCustom ? "Using your own OpenRouter key" : "Using default SlideMaker key"}
                        </p>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e, activeImageSection.current)}
      />
      <input
        ref={diagramInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleDiagramUpload(e, activeImageSection.current)}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => addSection(pageIndex)}
        className="w-full rounded-xl border-dashed hover:border-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4 mr-1" /> Add Section
      </Button>
    </div>
  );
}
