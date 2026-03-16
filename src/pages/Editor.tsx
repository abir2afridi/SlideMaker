import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Download, Share2, Globe, Users as UsersIcon, Link as LinkIcon, 
  Sparkles, Wand2, Type, Layout, Palette, Settings2, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, List, ListOrdered,
  ArrowLeft, Copy, Trash2, StickyNote, Plus, ChevronLeft, ChevronRight, 
  Maximize2, Play, Save, Loader2, Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '@/hooks/use-toast';
import { Slide, PresenceUser, BlockContent, PresentationTheme } from '@/types/presentation';
import SlideRenderer from '@/components/SlideRenderer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  loadPresentation, 
  savePresentation, 
  subscribeToPresentation, 
  subscribeToPresence, 
  publishPresentation,
  generateSlidesFromAI,
  rewriteSlideAI,
  narrateSlideAI
} from '@/lib/api';
import { generatePitchDeck } from '@/lib/slideGenerator';
import { exportToPdf, exportToPptx } from '@/lib/exportEngine';

const PRESET_THEMES: Record<string, PresentationTheme> = {
  modern: {
    name: 'Modern Indigo',
    primaryColor: '#4F46E5',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    style: 'modern',
    borderRadius: '0.75rem'
  },
  dark: {
    name: 'Dark Midnight',
    primaryColor: '#818CF8',
    accentColor: '#F472B6',
    backgroundColor: '#0F172A',
    textColor: '#F8FAFC',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    style: 'modern',
    borderRadius: '0.75rem'
  },
  elegant: {
    name: 'Elegant Serif',
    primaryColor: '#78350F',
    accentColor: '#B45309',
    backgroundColor: '#FFFBEB',
    textColor: '#451A03',
    fontHeading: 'Playfair Display',
    fontBody: 'Lora',
    style: 'elegant',
    borderRadius: '0rem'
  },
  vibrant: {
    name: 'Vibrant Mesh',
    primaryColor: '#D946EF',
    accentColor: '#3B82F6',
    backgroundColor: '#FDF4FF',
    textColor: '#4A044E',
    fontHeading: 'Outfit',
    fontBody: 'Outfit',
    style: 'bold',
    borderRadius: '1rem'
  }
};

const LAYOUTS = [
  { id: 'hero', name: 'Hero', icon: Layout },
  { id: 'bullets', name: 'Bullets', icon: List },
  { id: 'image-text', name: 'Image & Text', icon: ImageIcon },
  { id: 'stats', name: 'Stats', icon: Sparkles },
  { id: 'team', name: 'Team', icon: UsersIcon },
  { id: 'timeline', name: 'Timeline', icon: Layout },
  { id: 'feature-grid', name: 'Features', icon: Layout },
  { id: 'closing', name: 'Closing', icon: Layout },
] as const;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState('Untitled Presentation');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dbId, setDbId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<'design' | 'ai' | 'notes'>('design');
  const [currentTheme, setCurrentTheme] = useState(PRESET_THEMES.modern);
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef(slides);
  const titleRef = useRef(title);
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  useEffect(() => { titleRef.current = title; }, [title]);

  // Load slides & Subscribe
  useEffect(() => {
    let presSubscription: { unsubscribe: () => void } | null = null;
    let presentationSubscription: { unsubscribe: () => void } | null = null;

    const load = async () => {
      setIsLoading(true);
      try {
        if (id === 'new') {
          const stateSlides = location.state?.slides;
          const stateTitle = location.state?.title;
          if (stateSlides?.length) {
            setSlides(stateSlides);
            setTitle(stateTitle || 'New Presentation');
          } else {
            setSlides(generatePitchDeck(location.state?.prompt || 'AI Productivity Tool'));
            setTitle(location.state?.prompt || 'New Presentation');
          }
        } else if (id) {
          const data = await loadPresentation(id);
          if (data) {
            setSlides((data.slides as unknown as Slide[]) || []);
            setTitle(data.title);
            setDbId(data.id);
            setIsPublic(data.is_public);
            setShareToken(data.share_token);

            // Subscribe to real-time updates
            presentationSubscription = subscribeToPresentation(id, (updated) => {
              if (updated.title !== titleRef.current) setTitle(updated.title);
              if (JSON.stringify(updated.slides) !== JSON.stringify(slidesRef.current)) {
                setSlides((updated.slides as unknown as Slide[]) || []);
              }
            });

            // Subscribe to Presence
            presSubscription = subscribeToPresence(id, (users) => setActiveUsers(users));
          }
        }
      } catch (err) {
        console.error('Load error:', err);
        setSlides(generatePitchDeck('AI Productivity Tool'));
      } finally {
        setIsLoading(false);
      }
    };
    load();

    return () => {
      if (presentationSubscription) presentationSubscription.unsubscribe();
      if (presSubscription) presSubscription.unsubscribe();
    };
  }, [id, location.state]);

  // Scale calculation
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = rect.width / 1920;
      const scaleY = rect.height / 1080;
      setScale(Math.min(scaleX, scaleY) * 0.9);
    };
    // Delay to ensure container is rendered
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [isPresenting, isLoading]);

  const goNext = useCallback(() => setCurrentSlide(p => Math.min(p + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrentSlide(p => Math.max(p - 1, 0)), []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await savePresentation(
        title, 
        '', 
        slides,
        currentTheme,
        dbId || undefined,
      );
      if (!dbId) {
        setDbId(result.id);
        window.history.replaceState(null, '', `/editor/${result.id}`);
      }
      toast({ title: 'Saved!', description: 'Presentation saved successfully.' });
    } catch (err) {
      const error = err as Error;
      toast({ title: 'Save failed', description: error.message || 'Please sign in to save.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [title, slides, dbId, toast, currentTheme]);

  const duplicateSlide = () => {
    const slide = slides[currentSlide];
    if (!slide) return;
    const copy = { ...slide, id: `s${Date.now()}` };
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, copy);
    setSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
  };

  const addSlideWithAI = async () => {
    setIsSaving(true);
    try {
      const topic = prompt('What should this new slide be about?', 'Key competitive advantages');
      if (!topic) return;
      
      toast({ title: 'AI Assistant', description: 'Generating new slide...' });
      
      const result = await generateSlidesFromAI(topic, 'pitch-deck', 'single-slide');
      
      const newSlide: Slide = {
        ...result,
        id: `s${Date.now()}`, // Ensure unique local ID
      };
      
      const newSlides = [...slides];
      newSlides.splice(currentSlide + 1, 0, newSlide);
      setSlides(newSlides);
      setCurrentSlide(currentSlide + 1);
      toast({ title: 'Slide Added', description: 'AI successfully generated a new slide.' });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Generation failed', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const rewriteContent = async () => {
    setIsSaving(true);
    try {
      toast({ title: 'AI Assistant', description: 'Rewriting slide content...' });
      
      const current = slides[currentSlide];
      const newBlocks = await rewriteSlideAI(current.blocks);

      const newSlides = [...slides];
      newSlides[currentSlide] = { ...current, blocks: newBlocks };
      setSlides(newSlides);
      toast({ title: 'Content Rewritten', description: 'AI has polished your slide content.' });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Rewrite failed', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const narrateContent = async () => {
    setIsSaving(true);
    try {
      toast({ title: 'AI Assistant', description: 'Generating narration...' });
      
      const current = slides[currentSlide];
      const result = await narrateSlideAI(current.blocks);

      const newSlides = [...slides];
      newSlides[currentSlide] = { ...current, speakerNotes: result.script };
      setSlides(newSlides);
      setShowNotes(true);
      toast({ title: 'Narration Generated', description: 'Check the speaker notes for the script.' });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Narration failed', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== currentSlide);
    setSlides(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
  };

  const exitPresenting = useCallback(() => {
    setIsPresenting(false);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (err) { console.error('Fullscreen exit error:', err); }
  }, []);

  const handleShare = async () => {
    if (!dbId) {
      toast({ title: 'Save first', description: 'Please save your presentation before sharing.' });
      return;
    }
    
    try {
      const data = await publishPresentation(dbId, !isPublic);
      setIsPublic(data.is_public);
      setShareToken(data.share_token);
      
      if (data.is_public) {
        const url = `${window.location.origin}/share/${data.share_token}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Published!', description: 'Public link copied to clipboard.' });
      } else {
        toast({ title: 'Unpublished', description: 'Presentation is now private.' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update share settings.', variant: 'destructive' });
    }
  };

  const onDragEnd = (result: { destination?: { index: number }; source: { index: number } }) => {
    if (!result.destination) return;
    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSlides(items);
    setCurrentSlide(result.destination.index);
  };

  const handleBlockUpdate = (blockId: string, content: BlockContent) => {
    const newSlides = [...slides];
    const slide = { ...newSlides[currentSlide] };
    slide.blocks = slide.blocks.map(b => 
      b.id === blockId ? { ...b, content } : b
    );
    newSlides[currentSlide] = slide;
    setSlides(newSlides);
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `s${Date.now()}`,
      title: 'New Slide',
      layout: 'hero',
      blocks: [
        { id: `b1-${Date.now()}`, type: 'heading1', content: 'New Slide Title' },
        { id: `b2-${Date.now()}`, type: 'paragraph', content: 'Start typing here...' }
      ]
    };
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === 'ArrowRight' || (e.key === ' ' && isPresenting)) { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape' && isPresenting) { exitPresenting(); }
      if (e.key === 'f' && !isPresenting) {
        setIsPresenting(true);
        try { document.documentElement.requestFullscreen?.(); } catch (err) { console.warn('FS request failed', err); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isPresenting, handleSave, exitPresenting]);

  // Fullscreen presenter
  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 z-50 bg-foreground flex items-center justify-center"
        ref={containerRef}
        onClick={goNext}
      >
        <div
          className="slide-wrapper"
          style={{ transform: `scale(${scale})` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              {slides[currentSlide] && (
                <SlideRenderer 
                  slide={slides[currentSlide]} 
                  theme={currentTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/10 backdrop-blur text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          {currentSlide + 1} / {slides.length} · Press ESC to exit
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold text-foreground bg-transparent border-0 outline-none hover:bg-muted px-2 py-1 rounded transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={duplicateSlide} className="gap-1.5 text-xs text-muted-foreground">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={deleteSlide} disabled={slides.length <= 1} className="gap-1.5 text-xs text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="gap-1.5 text-xs">
            <StickyNote className="w-3.5 h-3.5" />
            Notes
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-primary font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={narrateContent}>
                <Wand2 className="w-4 h-4 mr-2" />
                Narrate Slide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={rewriteContent}>
                <Globe className="w-4 h-4 mr-2" />
                Rewrite Slide Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addSlideWithAI}>
                <Plus className="w-4 h-4 mr-2 text-primary" />
                Add Slide with AI
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-px h-5 bg-border" />
          <div className="flex -space-x-2 mr-2">
            {activeUsers.slice(0, 3).map((user, i) => (
              <div 
                key={i} 
                title={user.email}
                className="w-7 h-7 rounded-full border-2 border-background bg-hero-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm"
              >
                {user.email[0].toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          <Button 
            variant={isPublic ? "surface" : "ghost"} 
            size="sm" 
            onClick={handleShare} 
            className="gap-1.5 text-xs transition-all duration-300"
          >
            {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {isPublic ? 'Public' : 'Share'}
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 text-xs">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToPdf({ 
                title, slides, id: dbId || '', description: '', 
                theme: { name: 'PDF Export', primaryColor: '#4F46E5', accentColor: '#10B981', backgroundColor: '#FFFFFF', textColor: '#000000', fontHeading: 'Inter', fontBody: 'Lora', style: 'modern', borderRadius: '0.75rem' }, 
                status: 'draft', userId: '', isPublic: false, createdAt: '', updatedAt: '' 
              }, 'pdf-export-container')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPptx({ 
                title, slides, id: dbId || '', description: '', 
                theme: { name: 'PPTX Export', primaryColor: '#4F46E5', accentColor: '#10B981', backgroundColor: '#FFFFFF', textColor: '#000000', fontHeading: 'Inter', fontBody: 'Lora', style: 'modern', borderRadius: '0.75rem' }, 
                status: 'draft', userId: '', isPublic: false, createdAt: '', updatedAt: '' 
              })}>
                Export as PPTX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="hero"
              size="sm"
              onClick={() => { 
                setIsPresenting(true); 
                try { 
                  document.documentElement.requestFullscreen?.(); 
                } catch (err) {
                  console.error('Fullscreen error:', err);
                } 
              }}
              className="gap-1.5 text-xs"
            >
            <Play className="w-3.5 h-3.5" />
            Present
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 min-h-0">
        {/* Thumbnails */}
        <div className="w-56 border-r border-border bg-surface overflow-y-auto shrink-0 p-3 space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Slides</span>
             <Button variant="ghost" size="icon" className="w-6 h-6" onClick={addSlide}>
               <Plus className="w-3 h-3" />
             </Button>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="thumbnails">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {slides.map((slide, i) => (
                    <Draggable key={slide.id} draggableId={slide.id} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          <button
                            onClick={() => setCurrentSlide(i)}
                            className={`w-full aspect-[16/10] rounded-xl border-2 overflow-hidden relative transition-all duration-200 shadow-sm ${
                              i === currentSlide 
                                ? 'border-primary shadow-lg shadow-primary/10' 
                                : 'border-border/50 hover:border-primary/40'
                            }`}
                          >
                            <div className="absolute inset-0 origin-top-left" style={{ width: '1920px', height: '1080px', transform: 'scale(0.104)' }}>
                              <SlideRenderer slide={slide} theme={currentTheme} />
                            </div>
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="absolute bottom-1.5 left-1.5 bg-background/90 backdrop-blur text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-border/50 z-10">
                              {i + 1}
                            </div>
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          <div className="flex-1 relative overflow-hidden" ref={containerRef}>
            <div
              className="slide-wrapper absolute rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden bg-white"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  {slides[currentSlide] && (
                    <SlideRenderer 
                      slide={slides[currentSlide]} 
                      theme={currentTheme}
                      mode="edit"
                      onUpdateBlock={handleBlockUpdate}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Floating Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full px-4 py-2 shadow-2xl z-10">
              <Button variant="ghost" size="icon" onClick={goPrev} disabled={currentSlide === 0} className="w-8 h-8 rounded-full hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex flex-col items-center px-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Slide</span>
                <span className="text-sm font-bold text-slate-900 leading-none">{currentSlide + 1} / {slides.length}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={goNext} disabled={currentSlide === slides.length - 1} className="w-8 h-8 rounded-full hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-slate-200/60 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsPresenting(true); try { document.documentElement.requestFullscreen?.(); } catch (err) { console.warn('FS error', err); } }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Design Tools Sidebar (Gamma/Canva style) */}
        <div className="w-80 border-l border-border bg-white flex flex-col shrink-0">
          <div className="flex border-b border-border">
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'design' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Design
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              AI Prep
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'notes' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Notes
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {activeTab === 'design' && (
              <>
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Layout
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {LAYOUTS.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => {
                          const newSlides = [...slides];
                          newSlides[currentSlide] = { ...newSlides[currentSlide], layout: layout.id as Slide['layout'] };
                          setSlides(newSlides);
                        }}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                          slides[currentSlide]?.layout === layout.id 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-border hover:border-primary/40 text-slate-600'
                        }`}
                      >
                        <layout.icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold">{layout.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Theme
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(PRESET_THEMES).map(([id, theme]) => (
                      <button
                        key={id}
                        onClick={() => setCurrentTheme(theme)}
                        className={`w-full p-4 rounded-xl border-2 flex flex-col gap-3 transition-all ${
                          currentTheme.name === theme.name 
                            ? 'border-primary ring-4 ring-primary/10' 
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                          </div>
                        </div>
                        <div className="h-12 w-full rounded-md border border-slate-200/60 flex items-center px-4 overflow-hidden" style={{ backgroundColor: theme.backgroundColor }}>
                           <div className="w-12 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                           <div className="ml-auto w-4 h-4 rounded-sm" style={{ backgroundColor: theme.accentColor }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider">Smart Assistant</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "I can help you expand your points, change the tone, or generate completely new slides based on your current content."
                  </p>
                  <div className="space-y-2">
                    <Button onClick={rewriteContent} className="w-full justify-start gap-2 h-9 text-xs bg-white/10 hover:bg-white/20 border-0">
                      <Wand2 className="w-3.5 h-3.5" /> Professionalize Content
                    </Button>
                    <Button onClick={addSlideWithAI} className="w-full justify-start gap-2 h-9 text-xs bg-white/10 hover:bg-white/20 border-0">
                      <Plus className="w-3.5 h-3.5" /> Add Related Slide
                    </Button>
                    <Button onClick={narrateContent} className="w-full justify-start gap-2 h-9 text-xs bg-white/10 hover:bg-white/20 border-0">
                      <StickyNote className="w-3.5 h-3.5" /> Generate Voiceover Script
                    </Button>
                  </div>
                </div>

                <section className="px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Refinements</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start gap-2 h-10 text-xs border-slate-200">
                      <AlignCenter className="w-3.5 h-3.5" /> Center Alignment
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-10 text-xs border-slate-200">
                      <ImageIcon className="w-3.5 h-3.5" /> Replace Background
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-10 text-xs border-slate-200 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm('Are you sure you want to reset this slide?')) {
                        const newSlides = [...slides];
                        newSlides[currentSlide] = { 
                          ...newSlides[currentSlide], 
                          blocks: [
                            { id: `b1-${Date.now()}`, type: 'heading1', content: 'New Slide Title' },
                            { id: `b2-${Date.now()}`, type: 'paragraph', content: 'Start typing here...' }
                          ]
                        };
                        setSlides(newSlides);
                      }
                    }}>
                      <Trash2 className="w-3.5 h-3.5" /> Reset Slide Data
                    </Button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="h-full flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <StickyNote className="w-3.3 h-3.3" /> Speaker Notes
                </h3>
                <textarea 
                  value={slides[currentSlide]?.speakerNotes || ''}
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[currentSlide] = { ...newSlides[currentSlide], speakerNotes: e.target.value };
                    setSlides(newSlides);
                  }}
                  placeholder="Enter notes for the presenter here..."
                  className="flex-1 w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-content resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2 rounded-xl h-11 shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      
      {/* Hidden container for PDF export */}
      <div id="pdf-export-container" className="fixed -left-[5000px] -top-[5000px]">
        {slides.map((slide) => (
          <div key={slide.id} className="slide-wrapper w-[1920px] h-[1080px]">
            <SlideRenderer slide={slide} theme={currentTheme} />
          </div>
        ))}
      </div>
    </div>
  );
}
