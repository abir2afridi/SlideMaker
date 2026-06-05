import AppSidebar from '@/components/AppSidebar';
import { SectionEditor } from '@/components/handwriting/SectionEditor';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { HandwritingStyleTab } from '@/components/handwriting/HandwritingStyleTab';
import { PaperStyleTab } from '@/components/handwriting/PaperStyleTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/handwriting/store';
import { HANDWRITING_STYLES, INK_COLORS } from '@/lib/handwriting/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, Trash2, ClipboardPaste, Download, Image as ImageIcon, 
  Loader2, Maximize, FileDown, Layers, ChevronRight, 
  Menu, ZoomIn, ZoomOut, Search, ArrowLeft, MoreVertical, 
  Settings, Sparkles, ArrowRight, Save, Layout, Info, Scissors, RotateCcw,
  Cloud, Check, FileText, PenTool, ChevronDown, X, PanelLeftClose, PanelRightClose,
  Undo2, Redo2, Palette, Heading1, Heading2, Heading3, Type, List, ListOrdered, Upload, Move
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PAGE_SIZES } from '@/lib/handwriting/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EditorPage = () => {
  const { 
    pages, currentPageIndex, setCurrentPage, addPage, removePage, removeAllPages, addSection, 
    setText, showMargin, setShowMargin, showPageNumbers, setShowPageNumbers, 
    inkSmudge, setInkSmudge, setGlobalStyle, setGlobalColor, setGlobalSize, setGlobalLayout,
    globalStyleId, globalColorId, globalSizeId, globalLayoutId,
    globalMargins, setGlobalMargins,
    customPaperUrl, setCustomPaperUrl,
    customPaperOpacity, setCustomPaperOpacity,
    notes, activeNoteId, createNote, loadNote, deleteNote, renameNote, persistActiveNote,
    updateSection,
    undo, redo, past, future
  } = useAppStore();
  
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const isAllBlank = useMemo(() => 
    pages.every(p => p.sections.every(s => !s.content?.trim())),
    [pages]
  );

  useEffect(() => {
    if (isAllBlank) setShowBulk(true);
  }, [isAllBlank]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(0.8);
  const [noteTitle, setNoteTitle] = useState('Untitled Note');
  const [isSaved, setIsSaved] = useState(true);
  const [isEditingMargins, setIsEditingMargins] = useState(false);
  const [applyStyleToAll, setApplyStyleToAll] = useState(true);
  const [applyLayoutToAll, setApplyLayoutToAll] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [fontSearchOpen, setFontSearchOpen] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const contentDiagramInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const setPageRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    pageRefs.current[index] = el;
  }, []);

  const [isAutoZoom, setIsAutoZoom] = useState(true);

  // Live clock for header
  const [clockNow, setClockNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockH12 = clockNow.getHours() % 12 || 12;
  const clockMm = String(clockNow.getMinutes()).padStart(2, '0');
  const clockSs = String(clockNow.getSeconds()).padStart(2, '0');
  const clockAmPm = clockNow.getHours() >= 12 ? 'PM' : 'AM';
  const clockDate = clockNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const calculateScale = () => {
      if (!scrollContainerRef.current || !isAutoZoom) return;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const size = PAGE_SIZES.find(s => s.id === globalSizeId) || PAGE_SIZES[0];
      
      const navWidth = isMobile ? 40 : 60;
      const availableWidth = containerWidth - navWidth; 
      const baseScale = size.width * 2.8;
      let newScale = availableWidth / baseScale;
      
      if (newScale > 1.2) newScale = 1.2;
      if (newScale < 0.3) newScale = 0.3;
      
      setZoomScale(newScale);
    };

    const observer = new ResizeObserver(calculateScale);
    if (scrollContainerRef.current) {
       observer.observe(scrollContainerRef.current);
    }
    
    calculateScale();
    const timeout = setTimeout(calculateScale, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [globalSizeId, isAutoZoom, isMobile]);

  const handleManualZoom = (newScale: number | number[]) => {
    const scale = Array.isArray(newScale) ? newScale[0] : newScale;
    setZoomScale(scale);
    setIsAutoZoom(false);
  };

  // Performance: Optimized mobile state detector with debounced listener
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setShowLeftPanel(false);
        setShowRightPanel(false);
      } else {
        setShowLeftPanel(true);
        setShowRightPanel(true);
      }
    };
    
    checkMobile();
    let timeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const scrollToPage = (index: number) => {
    setCurrentPage(index);
    const el = pageRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  };

  const capturePages = async () => {
    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < pages.length; i++) {
       const el = pageRefs.current[i];
       if (!el) continue;
       const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
       canvases.push(canvas);
    }
    return canvases;
  };

  const exportAsPDF = async () => {
    setExporting('pdf');
    try {
      const size = PAGE_SIZES.find(s => s.id === pages[0].sizeId) || PAGE_SIZES[0];
      const pdf = new jsPDF({
        orientation: size.width > size.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [size.width, size.height],
      });
      const canvases = await capturePages();
      canvases.forEach((canvas, i) => {
        if (i > 0) pdf.addPage([size.width, size.height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, size.width, size.height);
      });
      pdf.save('assignment.pdf');
      toast.success('PDF exported!');
    } catch (e) { toast.error('Export failed.'); }
    setExporting(null);
  };

  const exportAsImages = async () => {
    setExporting('png');
    try {
      const canvases = await capturePages();
      canvases.forEach((canvas, i) => {
        const link = document.createElement('a');
        link.download = `page-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
      toast.success('Images exported!');
    } catch (e) { toast.error('Export failed.'); }
    setExporting(null);
  };

  // Memoize current page to reduce re-renders  
  const currentPage = useMemo(() => pages[currentPageIndex], [pages, currentPageIndex]);

  // AUTO-SAVE EFFECT
  useEffect(() => {
    if (activeNoteId) {
      const timeout = setTimeout(() => {
        persistActiveNote();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [pages, globalSizeId, activeNoteId, persistActiveNote]);

  const handleCreateNew = (sizeId: string) => {
    createNote(sizeId, `Assignment ${notes.length + 1}`);
    setIsSelectingSize(false);
  };

  if (!activeNoteId) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] w-full fixed inset-0">
        <AppSidebar className="shrink-0 h-screen sticky top-0" />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <header className="h-16 px-10 border-b border-border/40 bg-white flex items-center justify-between shrink-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-tight text-foreground uppercase">Assignments Gallery</h1>
                   <div className="flex items-center gap-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 hover:text-primary transition-colors">
                            <Maximize className="h-2 w-2" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{globalSizeId.toUpperCase()}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[140px]">
                          {PAGE_SIZES.map((size) => (
                            <DropdownMenuItem
                              key={size.id}
                              onClick={() => setGlobalSize(size.id, true)}
                              className={cn(
                                "text-[11px] font-bold uppercase tracking-wider",
                                globalSizeId === size.id && "text-primary"
                              )}
                            >
                              {size.name}
                              <span className="ml-auto text-[9px] text-muted-foreground">{size.width}×{size.height}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                   <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                   <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: globalColorId }} />
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">{globalColorId}</span>
                   </div>
                </div>
              </div>
            </div>
             <div className="flex items-center gap-4">
               <div className="flex items-center -space-x-2 mr-4 opacity-40 hover:opacity-100 transition-all">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#1a5276]" />
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#7b241c]" />
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#145a32]" />
               </div>
               <Button onClick={() => setIsSelectingSize(true)} className="gap-2 h-10 px-6 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all uppercase text-[10px] font-black tracking-widest shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4" />
                 New Assignment
               </Button>
             </div>
          </header>

          <main className="flex-1 overflow-y-auto p-12 relative">
             {/* Suble background decoration */}
             <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.4] pointer-events-none" />
             
             <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   {/* CREATE NEW CARD */}
                   <motion.button
                     whileHover={{ y: -2 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setIsSelectingSize(true)}
                     className="aspect-[3/4] rounded-2xl border-2 border-dashed border-muted/60 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                   >
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">Blank Paper</span>
                   </motion.button>

                {/* NOTE CARDS */}
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="group relative"
                  >
                    <div 
                      onClick={() => loadNote(note.id)}
                      className="aspect-[3/4] rounded-xl bg-white border border-border/40 overflow-hidden cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all p-6 flex flex-col"
                    >
                        <div className="flex-1 flex flex-col gap-2.5 opacity-5 group-hover:opacity-10 transition-opacity">
                           <div className="h-[2px] w-full bg-foreground rounded-full" />
                           <div className="h-[2px] w-full bg-foreground rounded-full" />
                           <div className="h-[2px] w-3/4 bg-foreground rounded-full" />
                        </div>
                       
                       <div className="mt-4">
                          <h3 className="text-xs font-bold text-foreground truncate">{note.title}</h3>
                          <div className="flex items-center justify-between mt-2">
                             <span className="text-[9px] font-semibold text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded">
                                {note.sizeId}
                             </span>
                             <span className="text-[9px] font-medium text-muted-foreground uppercase">
                                {new Date(note.lastModified).toLocaleDateString()}
                             </span>
                          </div>
                       </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-white/80 border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-all text-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                    ))}
                  </div>
                </div>

              {notes.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center opacity-30 mt-12 py-20 relative z-10">
                   <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center mb-8 border border-border/40">
                      <FileText className="h-8 w-8 text-primary/40" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground mb-3">Archive Empty</p>
                   <p className="text-[11px] font-medium text-muted-foreground italic max-w-[220px] leading-relaxed">
                      Begin your professional collection by selecting a paper format above.
                   </p>
                </div>
              )}
          </main>
        </div>

        {/* PAPER SIZE SELECTION DIALOG */}
        <Dialog open={isSelectingSize} onOpenChange={setIsSelectingSize}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none max-h-[95vh]">
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-10 border border-border shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                <Maximize className="h-64 w-64 text-primary" />
              </div>

              <div className="relative z-10">
                <header className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest mb-4 border border-primary/20">
                    <Layers className="h-3 w-3" /> Select Dimensions
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Choose Your Canvas</h2>
                  <p className="mt-1 text-muted-foreground font-medium uppercase text-[9px] tracking-[0.2em] opacity-50">Select format for your professional assignment</p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {PAGE_SIZES.map((size, idx) => (
                    <motion.button
                      key={size.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        createNote(size.id, `Assignment ${notes.length + 1}`);
                        setIsSelectingSize(false);
                      }}
                      className="group aspect-[3/4] bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center relative hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer box-border"
                    >
                      <div className="relative w-full h-full border border-dashed border-muted/30 rounded-lg group-hover:border-primary/20 transition-all flex flex-col items-center justify-center bg-muted/5">
                        <span className="text-sm font-black text-muted-foreground group-hover:text-primary transition-all mb-1">{size.id.toUpperCase()}</span>
                        <div className="flex flex-col items-center gap-0.5">
                           <p className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">{size.name}</p>
                           <p className="text-[10px] items-center font-bold text-muted-foreground/60">{size.width} × {size.height} <span className="text-[8px] opacity-50 ml-0.5">mm</span></p>
                           <p className="text-[7px] mt-1 font-black text-primary/40 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">Ratio {(size.height/size.width).toFixed(2)}:1</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="h-3 w-3 text-primary/40" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <Button variant="ghost" onClick={() => setIsSelectingSize(false)} className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-muted rounded-xl">
                    <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Return to Gallery
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] w-full fixed inset-0 selection:bg-primary/10">
      <AppSidebar className="shrink-0 h-screen sticky top-0" />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* ENHANCED TOP BAR */}
        <header className="h-14 border-b border-border/40 bg-white/80 backdrop-blur-md px-3 md:px-6 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-4">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => useAppStore.setState({ activeNoteId: null })}
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-all"
               >
                 <ArrowLeft className="h-4 w-4" />
               </Button>
               <div className="flex flex-col">
                 <input 
                  type="text" 
                  value={notes.find(n => n.id === activeNoteId)?.title || noteTitle}
                  onChange={(e) => {
                    if (activeNoteId) renameNote(activeNoteId, e.target.value);
                    setNoteTitle(e.target.value);
                    setIsSaved(false);
                    setTimeout(() => setIsSaved(true), 1500);
                  }}
                  className="bg-transparent border-0 p-0 text-sm font-bold tracking-tight text-foreground focus:ring-0 w-48 placeholder:text-muted-foreground/30 h-6"
                  placeholder="Draft Name"
                 />
                 <div className="flex items-center gap-1.5">
                   <Cloud className={cn("h-3 w-3 transition-colors", isSaved ? "text-green-500/80" : "text-amber-500/80")} />
                   <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-widest translate-y-[0.5px]">
                     {isSaved ? 'Draft Saved' : 'Saving Changes...'}
                   </span>
                 </div>
                </div>
              </div>
              
              <div className="h-4 w-[1px] bg-border/40" />

              {/* HISTORY ACTIONS - PREMIUM */}
              <div className="flex items-center gap-1.5 bg-white border border-border/40 px-2 py-1.5 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                <Tooltip>
                  <TooltipTrigger asChild>                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undo}
                      disabled={past.length === 0}
                      className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-20 gap-1.5"
                    >
                      <Undo2 className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Undo</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px] font-bold">Undo Action (Ctrl+Z)</TooltipContent>
                </Tooltip>
                <div className="w-[1px] h-4 bg-border/40 mx-0.5" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={redo}
                      disabled={future.length === 0}
                      className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-20 gap-1.5"
                    >
                      <Redo2 className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Redo</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px] font-bold">Redo Action (Ctrl+Y)</TooltipContent>

                </Tooltip>
              </div>


              <div className="h-4 w-[1px] bg-border/40" />
             
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isSaved ? "bg-green-500" : "bg-primary animate-pulse")} />
                    <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-[0.15em]">Private Draft</p>
                 </div>

                 <div className="h-4 w-[1px] bg-border/40" />

                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                    <FileText className="h-3 w-3 text-primary/60" />
                    <span className="text-[10px] font-black text-primary/80 tracking-wider">
                       Page {currentPageIndex + 1} / {pages.length}
                    </span>
                 </div>

                 <div className="h-4 w-[1px] bg-border/40" />
                 
                 <div className="flex items-center gap-3 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/20">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ZoomOut className="h-3 w-3 opacity-30 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => handleManualZoom(Math.max(0.3, zoomScale - 0.1))} />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-bold">Zoom Out</TooltipContent>
                    </Tooltip>
                   <Slider
                     value={[zoomScale]}
                     onValueChange={handleManualZoom}
                     min={0.3}
                     max={1.5}
                     step={0.01}
                     className="w-24 h-4 cursor-pointer"
                   />
                     <Tooltip>
                      <TooltipTrigger asChild>
                         <ZoomIn className="h-3 w-3 opacity-30 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => handleManualZoom(Math.min(1.5, zoomScale + 0.1))} />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-bold">Zoom In</TooltipContent>
                    </Tooltip>
                    <div className="h-3 w-[1px] bg-border/40 mx-1" />
                    <button 
                      onClick={() => {
                        setZoomScale(1.0);
                        setIsAutoZoom(false);
                      }} 
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/70 transition-colors px-2 py-0.5 rounded-md hover:bg-primary/5 border border-primary/10"
                    >
                       Reset 100%
                    </button>
                    <div className="h-3 w-[1px] bg-border/40 mx-1" />
                    <span className="text-[10px] font-bold text-muted-foreground/80 w-10 tabular-nums">{Math.round(zoomScale * 100)}%</span>
                 </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1 text-sm font-mono select-none mr-1">
              <span className="font-semibold text-foreground">{clockH12}:{clockMm}</span>
              <span className="font-bold text-red-500">{clockSs}</span>
              <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">{clockAmPm}</span>
              <span className="text-[10px] text-muted-foreground/60 ml-2">{clockDate}</span>
            </div>

            <div className="h-4 w-[1px] bg-border/40 hidden md:block" />

            {/* Mobile panel toggles */}
            {isMobile && (
              <>
                <Button 
                  variant={showLeftPanel ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => { setShowLeftPanel(!showLeftPanel); if (!showLeftPanel) setShowRightPanel(false); }}
                  className="h-8 w-8 rounded-lg lg:hidden"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={showRightPanel ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => { setShowRightPanel(!showRightPanel); if (!showRightPanel) setShowLeftPanel(false); }}
                  className="h-8 w-8 rounded-lg lg:hidden"
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {/* Single Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!!exporting}
                  className="h-9 px-3 sm:px-4 text-[10px] font-bold uppercase tracking-widest border-border/40 hover:bg-primary hover:text-white transition-all rounded-lg shadow-none gap-1.5"
                >
                  {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={exportAsPDF} disabled={!!exporting}>
                  <FileDown className="mr-2 h-4 w-4 text-primary" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsImages} disabled={!!exporting}>
                  <ImageIcon className="mr-2 h-4 w-4 text-emerald-500" />
                  Export as Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: PAGE SEGMENTS */}
           <div className={cn(
             "border-r border-border/40 bg-[#fafafa] flex flex-col h-full overflow-hidden z-20 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300",
              isMobile ? "fixed inset-y-0 left-0 w-[90vw] max-w-[400px] z-[100] h-full" : "w-[280px] xl:w-[360px]",
             isMobile && !showLeftPanel && "-translate-x-full opacity-0 pointer-events-none",
             isMobile && showLeftPanel && "translate-x-0 opacity-100"
           )}>
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowLeftPanel(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border border-border/40 z-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
                <div className="flex flex-col shrink-0 border-b border-border/40 bg-white">
                  <div className="px-4 py-3">
                     <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                         <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addPage}
                          className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-dashed border hover:border-primary hover:bg-primary/5 rounded-lg transition-all"
                         >
                           <Plus className="h-3.5 w-3.5 mr-1 text-primary" /> Paper
                         </Button>
                         <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addSection(currentPageIndex)}
                          className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-dashed border hover:border-primary hover:bg-primary/5 rounded-lg transition-all"
                         >
                           <Plus className="h-3.5 w-3.5 mr-1 text-primary" /> Section
                         </Button>
                         <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => useAppStore.getState().rebalancePages()} 
                          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-primary transition-all"
                          title="Rebalance Pages"
                         >
                           <Layers className="h-4 w-4" />
                         </Button>
                         <Button 
                          variant={showBulk ? "outline" : "ghost"} 
                          size="sm" 
                          onClick={() => setShowBulk(!showBulk)} 
                          className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                         >
                           {showBulk ? "Close" : "Import"}
                         </Button>
                         {pages.length > 1 && (
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="start" className="min-w-[140px]">
                               <DropdownMenuItem onClick={() => {
                                 const newIndex = Math.max(0, currentPageIndex - 1);
                                 removePage(currentPageIndex);
                                 setCurrentPage(newIndex);
                               }}>
                                 <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                                 <span className="text-xs font-semibold">Delete this page</span>
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={() => {
                                 if (confirm('Delete all pages and start fresh?')) removeAllPages();
                               }}>
                                 <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive/60" />
                                 <span className="text-xs font-semibold">Delete all pages</span>
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         )}
                       </div>
                     </div>
                  </div>
                </div>

              <div className="overflow-y-auto p-4 pt-3 pb-2 scrollbar-premium">

<AnimatePresence>
                  {(showBulk || isAllBlank) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      className="bg-muted/10 rounded-xl p-4 border border-border/40 mb-6 overflow-hidden relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold uppercase flex items-center gap-2 text-primary tracking-widest">
                          <ClipboardPaste className="h-4 w-4" /> Text Importer
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setBulkText(text);
                            } catch {
                              toast.error('Unable to read clipboard. Please paste manually.');
                            }
                          }}
                          className="h-7 px-2 text-[10px] font-bold uppercase text-primary/60 hover:text-primary"
                        >
                          <ClipboardPaste className="h-3 w-3 mr-1" /> Paste
                        </Button>
                      </div>
                      <Textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Paste text here to process across pages..."
                        className="min-h-[120px] text-sm leading-relaxed bg-white border border-border/20 focus-visible:ring-1 focus-visible:ring-primary/10 rounded-lg p-3 shadow-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button onClick={() => { setText(bulkText); setShowBulk(false); }} className="flex-1 h-10 text-xs uppercase font-bold tracking-widest rounded-lg">
                          Apply Changes
                        </Button>
                        {!isAllBlank && (
                          <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)} className="h-10 px-3 text-xs uppercase font-bold opacity-40">Cancel</Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isAllBlank && (
                /* Content Editor */
                <section className="space-y-3">                   
                   <div className="bg-white border border-border/40 rounded-xl p-3 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/20 rounded-lg mb-4 border border-border/10">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
                          disabled={currentPageIndex === 0}
                          className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180 opacity-40" />
                        </Button>
                        <div className="flex flex-col items-center overflow-hidden">
                          <div className="text-xs font-black text-foreground tracking-[0.4em] uppercase flex items-center gap-1">
                            <span>Sheet</span>
                            <AnimatePresence mode="popLayout">
                              <motion.span 
                                key={currentPageIndex}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                              >
                                {pages[currentPageIndex]?.sections.some(s => s.content?.trim()) ? currentPageIndex + 1 : 0}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Focusing active paper</span>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPageIndex + 1))}
                          disabled={currentPageIndex === pages.length - 1}
                          className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4 opacity-40" />
                        </Button>
                      </div>

                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                          key={currentPageIndex + (pages[currentPageIndex]?.id || 'deleted')}
                          initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <SectionEditor 
                            pageIndex={currentPageIndex} 
                            page={pages[currentPageIndex]} 
                          />
                         </motion.div>
                      </AnimatePresence>

                      </div>
                   </section>
                   )}

                  </div>

                {/* Content Textarea - sticky at bottom */}
                {pages[currentPageIndex] && (
                  <div className="bg-white border border-border/40 rounded-xl p-4 shrink-0 border-t-0 rounded-t-none flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Content
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (pages[currentPageIndex]?.sections[0]) {
                            const text = pages[currentPageIndex].sections.map(s => s.content).filter(Boolean).join('\n');
                            navigator.clipboard.writeText(text);
                          }
                        }}
                        className="h-7 px-2 text-[10px] font-bold uppercase opacity-40 hover:opacity-100 hover:bg-primary/5"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>

                    {/* Ink Color */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 shrink-0">
                        <Palette className="h-3.5 w-3.5" /> Ink
                      </span>
                      <div className="flex gap-2 flex-wrap items-center">
                        {INK_COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setGlobalColor(color.id, applyStyleToAll)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center relative",
                              globalColorId === color.id
                                ? "border-primary scale-110 shadow-md"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color.value }}
                          >
                            {globalColorId === color.id && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                          </button>
                        ))}
                        <div className="relative group flex items-center gap-1">
                          <input
                            type="color"
                            value={INK_COLORS.find(c => c.id === globalColorId)?.value || '#1a5276'}
                            onChange={(e) => setGlobalColor(e.target.value, applyStyleToAll)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center transition-all cursor-pointer",
                            !INK_COLORS.some(c => c.id === globalColorId)
                              ? "border-primary scale-110 bg-primary/5"
                              : "border-muted-foreground/30 hover:border-primary/50 group-hover:scale-105"
                          )}>
                            <div
                              className="w-3 h-3 rounded-full shadow-inner"
                              style={{ backgroundColor: !INK_COLORS.some(c => c.id === globalColorId) ? globalColorId : '#e2e8f0' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Handwritten/Typed + Style selector */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => {
                          const section = pages[currentPageIndex]?.sections[0];
                          if (!section) return;
                          const newType = section.type === 'handwritten' ? 'typed' : 'handwritten';
                          updateSection(currentPageIndex, 0, { type: newType });
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          pages[currentPageIndex]?.sections[0]?.type === 'handwritten'
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-secondary-foreground border-border"
                        )}
                      >
                        {pages[currentPageIndex]?.sections[0]?.type === 'handwritten' ? <PenTool className="h-3.5 w-3.5" /> : <Type className="h-3.5 w-3.5" />}
                        {pages[currentPageIndex]?.sections[0]?.type === 'handwritten' ? 'Handwritten' : 'Typed'}
                      </button>

                      {pages[currentPageIndex]?.sections[0]?.type === 'handwritten' && (
                        <Popover open={fontSearchOpen} onOpenChange={setFontSearchOpen}>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold border border-border bg-white hover:bg-muted/50 transition-all w-40 justify-between">
                              <span className={cn(HANDWRITING_STYLES.find(s => s.id === pages[currentPageIndex]?.sections[0]?.styleId)?.fontClass, "text-sm truncate")}>
                                {HANDWRITING_STYLES.find(s => s.id === pages[currentPageIndex]?.sections[0]?.styleId)?.name || 'Select style'}
                              </span>
                              <ChevronDown className="h-3 w-3 opacity-40 shrink-0" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search font..." className="h-8 text-xs" />
                              <CommandEmpty className="text-xs py-2 text-muted-foreground">No font found.</CommandEmpty>
                              <CommandGroup className="max-h-48 overflow-y-auto">
                                {HANDWRITING_STYLES.map(s => (
                                  <CommandItem
                                    key={s.id}
                                    value={s.name}
                                    onSelect={() => {
                                      updateSection(currentPageIndex, 0, { styleId: s.id });
                                      setFontSearchOpen(false);
                                    }}
                                    className="text-xs cursor-pointer"
                                  >
                                    <Check className={cn("h-3 w-3 mr-2 shrink-0", pages[currentPageIndex]?.sections[0]?.styleId === s.id ? "opacity-100" : "opacity-0")} />
                                    <span className={cn(s.fontClass, "text-sm")}>{s.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Formatting toolbar */}
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted/50 border mb-3">
                      {[
                        { icon: Heading1, label: 'H1', level: 1 },
                        { icon: Heading2, label: 'H2', level: 2 },
                        { icon: Heading3, label: 'H3', level: 3 },
                      ].map(({ icon: Icon, label, level }) => (
                        <Tooltip key={label}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                const section = pages[currentPageIndex]?.sections[0];
                                if (!section) return;
                                const isCurrent = section.isHeading && section.headingLevel === level;
                                updateSection(currentPageIndex, 0, { isHeading: !isCurrent, headingLevel: isCurrent ? undefined : level });
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                pages[currentPageIndex]?.sections[0]?.isHeading && pages[currentPageIndex]?.sections[0]?.headingLevel === level
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">{label}</TooltipContent>
                        </Tooltip>
                      ))}
                      <div className="w-px h-5 bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => updateSection(currentPageIndex, 0, { isHeading: false, headingLevel: undefined })}
                            className={cn(
                              "p-1.5 rounded-md transition-colors",
                              !pages[currentPageIndex]?.sections[0]?.isHeading
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                          >
                            <Type className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">Normal</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-5 bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              const section = pages[currentPageIndex]?.sections[0];
                              if (!section) return;
                              updateSection(currentPageIndex, 0, { content: section.content + '\n• ' });
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <List className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">Bullet</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              const section = pages[currentPageIndex]?.sections[0];
                              if (!section) return;
                              updateSection(currentPageIndex, 0, { content: section.content + '\n1. ' });
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">Numbered</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-5 bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => contentFileInputRef.current?.click()}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">Image</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => contentDiagramInputRef.current?.click()}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <Move className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">Diagram</TooltipContent>
                      </Tooltip>
                    </div>

                    <textarea
                      value={pages[currentPageIndex]?.sections[0]?.content || ''}
                      onChange={(e) => updateSection(currentPageIndex, 0, { content: e.target.value })}
                      placeholder="Write your text here..."
                      className="w-full flex-1 min-h-0 bg-background p-3 text-sm font-body text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 ring-1 ring-border/40 transition-all border border-border/40"
                    />
                  </div>
                )}

                            </div>

            {/* CENTER: PREVIEW PORT */}
           <div className={cn(
             "flex-1 bg-[#fcfcfd] flex flex-row overflow-hidden relative shadow-inner overflow-x-hidden",
             "transition-all duration-300 ease-out"
           )}>
              {/* Overlay for mobile when side panels are open */}
              <AnimatePresence>
                {isMobile && (showLeftPanel || showRightPanel) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
                    className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-[35]"
                  />
                )}
              </AnimatePresence>

 {/* MAIN SCROLL AREA: CLEAN & FOCUSED */}
             <div className="flex-1 flex flex-col min-w-0 bg-[#f4f4f7]">
                {/* Page Strip - inside content frame */}
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-white z-30">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 pr-2">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => scrollToPage(i)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shrink-0 border text-xs font-semibold",
                          i === currentPageIndex
                            ? "bg-white border-primary shadow-md ring-1 ring-primary/10 text-primary"
                            : "bg-muted/10 border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="font-bold">Sheet {i + 1}</span>
                        {i === currentPageIndex && <span className="text-[9px] opacity-60">· Focusing</span>}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={addPage}
                    className="shrink-0 w-7 h-7 rounded-lg border-border/8 border-dashed border-2 flex items-center justify-center hover:bg-muted/20 hover:border-primary transition-all opacity-40 hover:opacity-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

               <div
                 ref={scrollContainerRef}
                 className="flex-1 overflow-y-auto px-3 md:px-6 py-6 md:py-10 no-scrollbar"
                 style={{ scrollBehavior: 'auto', willChange: 'scroll-position' }}
               >
                <div className="flex flex-col items-center gap-10 md:gap-14 w-full mx-auto pb-[30vh]">
                   {pages.map((page, i) => {
                      const size = PAGE_SIZES.find(s => s.id === page.sizeId) || PAGE_SIZES[0];
                      const displayWidth = size.width * 2.5 * zoomScale;
                      const displayHeight = size.height * 2.5 * zoomScale;
                      const isCurrent = i === currentPageIndex;
                      
                       return (
                        <div
                          key={page.id}
                          className={cn(
                            "relative group/page",
                            isCurrent ? "z-10" : "z-0"
                          )}
                          style={{ 
                            contentVisibility: 'auto', 
                            containIntrinsicSize: `${displayWidth}px ${displayHeight}px`,
                            willChange: 'transform',
                          }}
                          onClick={() => setCurrentPage(i)}
                        >
                           {/* CLEAN PAGE SHADOW & WRAPPER */}
                            <div 
                              className="relative mx-auto"
                              style={{ width: displayWidth, height: displayHeight }}
                            >
                               <div 
                                 ref={(el) => { if (el) pageRefs.current[i] = el; }}
                                 className={cn(
                                  "bg-white ring-1 ring-border/10 absolute top-0 left-0",
                                  isCurrent 
                                  ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)] z-20" 
                                  : "shadow-sm"
                                )}
                                style={{ 
                                  width: size.width * 2.5 * zoomScale,
                                  height: size.height * 2.5 * zoomScale,
                                  contain: 'layout style',
                                }}
                                style={{ 
                                  width: size.width * 2.5 * zoomScale,
                                  height: size.height * 2.5 * zoomScale
                                }}
                               >
                                 <PagePreview
                                    page={page}
                                    showMargin={page.showMargin}
                                    showPageNumber={page.showPageNumber}
                                    inkSmudge={page.inkSmudge}
                                    customPaperUrl={customPaperUrl}
                                    customPaperOpacity={customPaperOpacity}
                                    scale={zoomScale}
                                    showGuidelines={isEditingMargins}
                                   ref={setPageRef(i)}
                                   onImageUpdate={(sectionId, imgIdx, updates) => {
                                     const sectionIdx = page.sections.findIndex(s => s.id === sectionId);
                                     if (sectionIdx !== -1) {
                                       const section = page.sections[sectionIdx];
                                       const newImages = [...(section.images || [])];
                                       newImages[imgIdx] = { ...newImages[imgIdx], ...updates };
                                       updateSection(i, sectionIdx, { images: newImages });
                                     }
                                   }}
                                 />
                         </div>
                           </div>

                         {/* SUBTLE PAGE INDICATOR */}
                         <div className="absolute top-0 -left-7 md:-left-8 h-full hidden md:flex items-center justify-center">
                            <span 
                              className={cn(
                                "text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                                i === currentPageIndex ? "text-primary/60" : "text-transparent group-hover/page:text-muted-foreground/30"
                              )}
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                              Page {i + 1}
                            </span>
                         </div>
                      </div>
                   );
                   })}
                </div>
             </div>
           </div>
           </div> {/* center preview section */}

           {/* RIGHT PANEL: EDITOR SETTINGS */}
           <div className={cn(
             "border-l border-border/40 bg-[#fafafa] flex flex-col h-full overflow-hidden z-20 shrink-0 transition-all duration-300",
              isMobile ? "fixed inset-y-0 right-0 w-[90vw] max-w-[400px] z-[100] h-full" : "w-[280px] xl:w-[360px]",
             isMobile && !showRightPanel && "translate-x-full opacity-0 pointer-events-none",
             isMobile && showRightPanel && "translate-x-0 opacity-100"
           )}>
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowRightPanel(false)}
                  className="absolute top-4 left-4 h-8 w-8 rounded-full bg-white border border-border/40 z-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

                <Tabs defaultValue="handwriting" className="flex-1 flex flex-col overflow-hidden">
                 <div className="px-6 pt-4 shrink-0">
                   <TabsList className="w-full grid grid-cols-2">
                     <TabsTrigger value="handwriting" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <PenTool className="h-3.5 w-3.5 mr-1.5" /> Handwriting Style
                     </TabsTrigger>
                     <TabsTrigger value="paper" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <Layout className="h-3.5 w-3.5 mr-1.5" /> Paper Style
                     </TabsTrigger>
                   </TabsList>
                 </div>
                  <div className="flex-1 overflow-hidden bg-[#fafafa]">
                    <TabsContent value="handwriting" className="mt-0 h-full">
                      <HandwritingStyleTab
                       globalStyleId={globalStyleId}
                       globalColorId={globalColorId}
                       onStyleChange={(id) => setGlobalStyle(id, applyStyleToAll)}
                       onColorChange={(id) => setGlobalColor(id, applyStyleToAll)}
                       applyStyleToAll={applyStyleToAll}
                       onApplyStyleToAllChange={setApplyStyleToAll}
                     />
                   </TabsContent>
                    <TabsContent value="paper" className="mt-0 h-full">
                       <div className="h-full overflow-y-auto scrollbar-premium">
                        <PaperStyleTab
                       selectedLayoutId={globalLayoutId}
                       showMargin={showMargin}
                       showPageNumbers={showPageNumbers}
                       inkSmudge={inkSmudge}
                       customPaperUrl={customPaperUrl}
                       applyLayoutToAll={applyLayoutToAll}
                       onLayoutChange={(id) => setGlobalLayout(id, applyLayoutToAll)}
                       onMarginChange={(v) => setShowMargin(v, applyLayoutToAll)}
                       onPageNumbersChange={(v) => setShowPageNumbers(v, applyLayoutToAll)}
                       onInkSmudgeChange={(v) => setInkSmudge(v)}
                       onCustomPaperUpload={(url) => setCustomPaperUrl(url)}
                       onApplyLayoutToAllChange={setApplyLayoutToAll}
                     />
                      </div>
                    </TabsContent>
                  </div>
                 </Tabs>

                {/* PAPER ARCHITECTURE — sticky at bottom, outside tabs */}
               <div
                 className="shrink-0 border-t border-border/40 bg-white px-6 py-4"
                 onMouseEnter={() => setIsEditingMargins(true)}
                 onMouseLeave={() => setIsEditingMargins(false)}
               >
                 <div className="flex items-center justify-between mb-4">
                   <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                     <Scissors className="h-3 w-3" /> Paper Architecture (mm)
                   </h4>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setGlobalMargins({ top: 20, bottom: 20, left: 20, right: 20 }, applyLayoutToAll)}
                     className="h-6 px-2 text-[8px] font-black uppercase tracking-tighter opacity-40 hover:opacity-100 hover:bg-primary/5"
                   >
                     <RotateCcw className="h-2.5 w-2.5 mr-1" /> Reset
                   </Button>
                 </div>
                 <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                   {[
                     { label: 'Top', key: 'top' as const },
                     { label: 'Bottom', key: 'bottom' as const },
                     { label: 'Left', key: 'left' as const },
                     { label: 'Right', key: 'right' as const }
                   ].map((m) => (
                     <div key={m.key} className="space-y-2">
                       <div className="flex justify-between items-center px-0.5">
                         <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{m.label}</span>
                         <span className="text-[9px] font-black text-foreground tabular-nums">{globalMargins[m.key]}mm</span>
                       </div>
                       <Slider
                         value={[globalMargins[m.key]]}
                         onValueChange={(v) => setGlobalMargins({ [m.key]: v[0] }, applyLayoutToAll)}
                         onPointerUp={() => useAppStore.getState().rebalancePages()}
                         min={0}
                         max={60}
                         step={1}
                         className="h-3"
                       />
                     </div>
                   ))}
                   </div>
                   <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                     <div className="flex justify-between items-center px-0.5">
                       <span className="text-[9px] font-bold text-muted-foreground/60 uppercase flex items-center gap-1.5">
                         {(!customPaperUrl || globalLayoutId !== 'custom') && (
                           <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                             <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                           </svg>
                         )}
                         Paper Opacity
                       </span>
                       <span className="text-[9px] font-black tabular-nums" style={{ color: (!customPaperUrl || globalLayoutId !== 'custom') ? '#9ca3af' : undefined }}>
                         {customPaperOpacity}%
                       </span>
                     </div>
                     <Slider
                       value={[customPaperOpacity]}
                       onValueChange={(v) => setCustomPaperOpacity(v[0])}
                       disabled={!customPaperUrl || globalLayoutId !== 'custom'}
                       min={10}
                       max={100}
                       step={1}
                       className="h-3"
                     />
                   </div>
                 </div>
              </div>

              {/* Hidden file inputs for content box */}
              <input
                ref={contentFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !pages[currentPageIndex]) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    updateSection(currentPageIndex, 0, { imageUrl: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={contentDiagramInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !pages[currentPageIndex]) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const section = pages[currentPageIndex]?.sections[0];
                    const existing = section?.images || [];
                    const newImg = { url: reader.result as string, x: 10, y: 10, width: 200, height: 150 };
                    updateSection(currentPageIndex, 0, { images: [...existing, newImg] });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />

             {/* Hidden Capture Area */}
          <div className="fixed -left-[8000px] top-0 pointer-events-none opacity-0">
              {pages.map((page, i) => (
                <div key={`export-wrapper-${page.id}`} className="bg-white">
                  <PagePreview
                    page={page}
                    showMargin={showMargin}
                    showPageNumber={showPageNumbers}
                    inkSmudge={inkSmudge}
                    customPaperUrl={customPaperUrl}
                    customPaperOpacity={customPaperOpacity}
                    scale={1.5}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default EditorPage;
