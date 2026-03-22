import AppSidebar from '@/components/AppSidebar';
import { SectionEditor } from '@/components/handwriting/SectionEditor';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { StyleSelector } from '@/components/handwriting/StyleSelector';
import { LayoutSelector } from '@/components/handwriting/LayoutSelector';
import { useAppStore } from '@/lib/handwriting/store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, Trash2, ClipboardPaste, Download, Image as ImageIcon, 
  Loader2, Type, Palette, Maximize, FileDown, Layers, ChevronRight, 
  Menu, ZoomIn, ZoomOut, Search, Scissors, ArrowLeft, MoreVertical, 
  Settings, Sparkles, ArrowRight, Save, Layout, Info, RotateCcw,
  Cloud, Check, FileText, PenTool, ChevronDown, X, PanelLeftClose, PanelRightClose,
  Undo2, Redo2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
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

const MinimalHeader = ({ icon: Icon, title, count }: { icon: React.ElementType, title: string, count?: number }) => (
  <div className="flex items-center justify-between mb-4 px-1">
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">{title}</h3>
    </div>
    {count !== undefined && (
      <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">
        {count} items
      </span>
    )}
  </div>
);

const EditorPage = () => {
  const { 
    pages, currentPageIndex, setCurrentPage, addPage, removePage, 
    setText, showMargin, setShowMargin, showPageNumbers, setShowPageNumbers, 
    inkSmudge, setInkSmudge, setGlobalStyle, setGlobalColor, setGlobalSize, setGlobalLayout,
    globalStyleId, globalColorId, globalSizeId, globalLayoutId,
    globalMargins, setGlobalMargins,
    notes, activeNoteId, createNote, loadNote, deleteNote, renameNote, persistActiveNote,
    updateSection,
    undo, redo, past, future
  } = useAppStore();
  
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const setPageRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    pageRefs.current[index] = el;
  }, []);

  const [isAutoZoom, setIsAutoZoom] = useState(true);

  useEffect(() => {
    const calculateScale = () => {
      if (!scrollContainerRef.current || !isAutoZoom) return;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const size = PAGE_SIZES.find(s => s.id === globalSizeId) || PAGE_SIZES[0];
      
      const availableWidth = containerWidth - (isMobile ? 32 : 80); 
      let newScale = availableWidth / (size.width * 2.5);
      
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
                   <div className="flex items-center gap-1">
                      <Maximize className="h-2 w-2" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{globalSizeId.toUpperCase()}</span>
                   </div>
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
             isMobile ? "fixed inset-y-0 left-0 w-[90vw] max-w-[400px] z-[100] h-full" : "w-[340px] xl:w-[440px]",
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
                <div className="p-6 pb-4">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">Content Editor</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">Manage structure</p>
                          <div className="h-1.5 w-1.5 rounded-full bg-border" />
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                             <input 
                               type="checkbox" 
                               checked={applyStyleToAll} 
                               onChange={(e) => setApplyStyleToAll(e.target.checked)}
                               className="w-3 h-3 rounded border-primary/20 accent-primary"
                             />
                             <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">Apply to all pages</span>
                          </label>
                        </div>
                      </div>
                     <div className="flex gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => useAppStore.getState().rebalancePages()} 
                        className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-primary transition-all bg-muted/20 hover:shadow-sm"
                        title="Rebalance Pages"
                       >
                         <Layers className="h-4 w-4" />
                       </Button>
                       <Button 
                        variant={showBulk ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => setShowBulk(!showBulk)} 
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-none"
                       >
                         {showBulk ? "Close Importer" : "Import Text"}
                       </Button>
                     </div>
                   </div>
                </div>
              </div>

             <div className="flex-1 overflow-y-auto p-8 pt-4 pb-32 scrollbar-none scroll-smooth">
<AnimatePresence>
                  {showBulk && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      className="bg-muted/10 rounded-2xl p-6 border border-border/40 mb-10 overflow-hidden relative"
                    >
                      <h3 className="text-[9px] font-bold uppercase mb-3 flex items-center gap-2 text-primary tracking-widest">
                        <ClipboardPaste className="h-3 w-3" /> Text Importer
                      </h3>
                      <Textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Paste text here to process across pages..."
                        className="min-h-[160px] text-xs leading-relaxed bg-white border border-border/20 focus-visible:ring-1 focus-visible:ring-primary/10 rounded-xl p-4 shadow-none"
                      />
                      <div className="flex gap-2 mt-4">
                        <Button onClick={() => { setText(bulkText); setShowBulk(false); }} className="flex-1 h-10 text-[10px] uppercase font-bold tracking-widest rounded-lg">
                          Apply Changes
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)} className="h-10 px-4 text-[10px] uppercase font-bold opacity-40">Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content Editor */}
                <section className="space-y-6">
                   <MinimalHeader icon={Type} title="Page Segments" count={pages[currentPageIndex]?.sections.length} />
                   
                   <div className="bg-white border border-border/40 rounded-2xl p-6 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 rounded-xl mb-6 border border-border/10">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
                          disabled={currentPageIndex === 0}
                          className="h-10 w-10 rounded-2xl hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180 opacity-40" />
                        </Button>
                        <div className="flex flex-col items-center overflow-hidden">
                          <AnimatePresence mode="popLayout">
                            <motion.span 
                              key={currentPageIndex}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className="text-[11px] font-black text-foreground tracking-[0.5em] uppercase"
                            >
                              Sheet 0{currentPageIndex + 1}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1 opacity-60">Focusing active paper</span>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPageIndex + 1))}
                          disabled={currentPageIndex === pages.length - 1}
                          className="h-10 w-10 rounded-2xl hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="h-5 w-5 opacity-40" />
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
                      
                      <div className="grid grid-cols-2 gap-4 pt-8 border-t border-muted/60 mt-8">
                        <Button variant="outline" size="sm" onClick={addPage} className="h-12 gap-3 text-[10px] font-black uppercase tracking-widest border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all rounded-[20px]">
                           <Plus className="h-4 w-4 text-primary" /> Insert Paper
                        </Button>
                        {pages.length > 1 && (
                          <Button 
                            variant="ghost" size="sm" 
                            onClick={() => {
                              const newIndex = Math.max(0, currentPageIndex - 1);
                              removePage(currentPageIndex);
                              setCurrentPage(newIndex);
                            }} 
                            className="h-12 text-destructive text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 rounded-[20px]"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Segment
                          </Button>
                        )}
                      </div>
                   </div>
                </section>

                           </div>
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

{/* SIMPLIFIED PAGE NAVIGATION (CLEAN SIDEBAR) */}
             <div className="w-14 md:w-20 border-r border-border/40 bg-white flex flex-col items-center py-6 gap-4 shrink-0 overflow-y-auto no-scrollbar z-30">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToPage(i)}
                    className={cn(
                      "w-14 h-20 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border relative group shrink-0",
                      i === currentPageIndex 
                      ? "bg-white border-primary shadow-md ring-2 ring-primary/10" 
                      : "bg-muted/10 border-transparent hover:bg-muted/30 opacity-60 hover:opacity-100"
                    )}
                  >
                     <div className={cn("w-6 h-0.5 rounded-full transition-colors", i === currentPageIndex ? "bg-primary" : "bg-foreground/20")} />
                     <div className={cn("w-4 h-0.5 rounded-full transition-colors opacity-40", i === currentPageIndex ? "bg-primary" : "bg-foreground/20")} />
                     <span className={cn("text-[10px] font-bold transition-colors mt-1", i === currentPageIndex ? "text-primary" : "text-muted-foreground")}>{i + 1}</span>
                  </button>
                ))}
                
                <button 
                  onClick={addPage} 
                  className="w-12 h-12 rounded-xl border-border/8 border-dashed border-2 flex items-center justify-center hover:bg-muted/20 hover:border-primary transition-all opacity-40 hover:opacity-100"
                >
                   <Plus className="h-4 w-4" />
                </button>
             </div>
 
             {/* MAIN SCROLL AREA: CLEAN & FOCUSED */}
             <div
               ref={scrollContainerRef}
               className="flex-1 overflow-y-auto px-4 md:px-10 py-10 md:py-20 bg-[#f4f4f7] space-y-12 scroll-smooth no-scrollbar"
             >
                <div className="flex flex-col items-center gap-16 w-full mx-auto pb-[50vh]">
                   {pages.map((page, i) => {
                      const size = PAGE_SIZES.find(s => s.id === page.sizeId) || PAGE_SIZES[0];
                      const displayWidth = size.width * 2.5 * zoomScale;
                      const displayHeight = size.height * 2.5 * zoomScale;
                      
                      return (
                        <motion.div
                          key={page.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className={cn(
                            "relative transition-all duration-500",
                            i === currentPageIndex ? "z-10" : "z-0 opacity-40"
                          )}
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
                                  i === currentPageIndex 
                                  ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]" 
                                  : "shadow-sm"
                                )}
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
                         <div className="absolute top-0 -left-8 h-full hidden lg:flex items-center justify-center">
                            <span 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-widest transition-all",
                                i === currentPageIndex ? "text-primary/60" : "text-transparent"
                              )}
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                              Page {i + 1}
                            </span>
                         </div>
                      </motion.div>
                   );
                   })}
                </div>
             </div>
           </div> {/* Added missing closing div for the center preview section */}

           {/* RIGHT PANEL: EDITOR SETTINGS */}
           <div className={cn(
             "border-l border-border/40 bg-[#fafafa] flex flex-col h-full overflow-hidden z-20 shrink-0 transition-all duration-300",
             isMobile ? "fixed inset-y-0 right-0 w-[90vw] max-w-[400px] z-[100] h-full" : "w-[340px] xl:w-[440px]",
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

              <div className="flex flex-col shrink-0 border-b border-border/40 bg-white">
                <div className="p-6 pb-4">
                   <div className="flex flex-col">
                     <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">Editor Settings</h2>
                     <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest mt-1.5">Configure appearance</p>
                   </div>
                </div>
                <div className="px-6 py-3 bg-muted/20 flex flex-wrap items-center gap-3 border-t border-border/20">
                     <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-border/30 shadow-sm">
                        <Maximize className="h-3 w-3 text-primary opacity-60" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Paper:<span className="text-foreground ml-1">{globalSizeId.toUpperCase()}</span></span>
                     </div>
                     <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-border/30 shadow-sm">
                        <Palette className="h-3 w-3 text-primary opacity-60" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ink:<span className="text-foreground ml-1 capitalize">{globalColorId}</span></span>
                     </div>
                </div>
              </div>

             <div className="flex-1 overflow-y-auto p-8 pt-4 pb-32 scrollbar-none scroll-smooth bg-[#fafafa]">
<section>
                   <MinimalHeader icon={Palette} title="Styling & Pigments" />
                   <div className="border border-border/40 rounded-2xl p-7 bg-white hover:shadow-sm transition-all overflow-hidden relative group">
                     {/* Subtle Background Icon */}
                     <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                        <Palette className="h-32 w-32" />
                     </div>
                     <StyleSelector 
                        selectedStyleId={globalStyleId} 
                        selectedColorId={globalColorId} 
                        onStyleChange={(id) => setGlobalStyle(id, applyStyleToAll)} 
                        onColorChange={(id) => setGlobalColor(id, applyStyleToAll)} 
                      />
                      
                      <div className="flex items-center justify-between pt-5 mt-6 border-t border-border/10">
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group/toggle">
                          <input 
                            type="checkbox" 
                            className="accent-primary w-3.5 h-3.5 rounded-sm cursor-pointer"
                            checked={applyStyleToAll}
                            onChange={e => setApplyStyleToAll(e.target.checked)}
                          />
                          <span className="group-hover/toggle:text-primary transition-colors">Apply to All Pages</span>
                        </label>
                      </div>
                   </div>
                </section>

                 <section>
                    <MinimalHeader icon={Maximize} title="Layout Architecture" />
                    <div className="border border-border/40 rounded-2xl p-7 bg-white hover:shadow-sm transition-all overflow-hidden relative group space-y-10">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                         <Layout className="h-32 w-32" />
                      </div>
                       <LayoutSelector 
                         selectedLayoutId={globalLayoutId}
                         selectedSizeId={globalSizeId}
                         showMargin={showMargin}
                         showPageNumbers={showPageNumbers}
                         inkSmudge={inkSmudge}
                         isSizeChangeDisabled={true}
                         onLayoutChange={(id) => setGlobalLayout(id, applyLayoutToAll)}
                         onSizeChange={(id) => setGlobalSize(id, applyLayoutToAll)}
                         onMarginChange={(v) => setShowMargin(v, applyLayoutToAll)}
                         onPageNumbersChange={(v) => setShowPageNumbers(v, applyLayoutToAll)}
                         onInkSmudgeChange={(v) => setInkSmudge(v)}
                       />

                       <div 
                         className="pt-6 border-t border-border/10"
                         onMouseEnter={() => setIsEditingMargins(true)}
                         onMouseLeave={() => setIsEditingMargins(false)}
                       >
                          <div className="flex items-center justify-between mb-6">
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
                          
                          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                             {[
                               { label: 'Top', key: 'top' as const },
                               { label: 'Bottom', key: 'bottom' as const },
                               { label: 'Left', key: 'left' as const },
                               { label: 'Right', key: 'right' as const }
                             ].map((m) => (
                               <div key={m.key} className="space-y-3">
                                  <div className="flex justify-between items-center px-1">
                                     <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{m.label}</span>
                                     <span className="text-[10px] font-black text-foreground tabular-nums">{globalMargins[m.key]}mm</span>
                                  </div>
                                  <Slider
                                    value={[globalMargins[m.key]]}
                                    onValueChange={(v) => setGlobalMargins({ [m.key]: v[0] }, applyLayoutToAll)}
                                    onPointerUp={() => useAppStore.getState().rebalancePages()}
                                    min={0}
                                    max={60}
                                    step={1}
                                    className="h-4"
                                  />
                               </div>
                             ))}
                          </div>
                       </div>

                        <div className="flex items-center justify-between pt-5 mt-4 border-t border-border/10">
                          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group/toggle">
                            <input 
                              type="checkbox" 
                              className="accent-primary w-3.5 h-3.5 rounded-sm cursor-pointer"
                              checked={applyLayoutToAll}
                              onChange={e => setApplyLayoutToAll(e.target.checked)}
                            />
                            <span className="group-hover/toggle:text-primary transition-colors">Apply to All Pages</span>
                          </label>
                        </div>
                    </div>
                 </section>
             </div>
          </div>
{/* Hidden Capture Area */}
          <div className="fixed -left-[8000px] top-0 pointer-events-none opacity-0">
              {pages.map((page, i) => (
                <div key={`export-wrapper-${page.id}`} className="bg-white">
                  <PagePreview
                    page={page}
                    showMargin={showMargin}
                    showPageNumber={showPageNumbers}
                    inkSmudge={inkSmudge}
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
