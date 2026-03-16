import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slide, PresentationTheme } from '@/types/presentation';
import { loadPresentationByToken } from '@/lib/api';
import SlideRenderer from '@/components/SlideRenderer';
import { useToast } from '@/hooks/use-toast';

export default function SharePage() {
  const { token } = useParams();
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<PresentationTheme | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await loadPresentationByToken(token);
        if (data) {
          setSlides(data.slides as unknown as Slide[]);
          setTitle(data.title);
          setTheme(data.theme as unknown as PresentationTheme);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load presentation or it is not public.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast]);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = rect.width / 1920;
      const scaleY = rect.height / 1080;
      setScale(Math.min(scaleX, scaleY) * 0.9);
    };
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [isLoading]);

  const goNext = useCallback(() => setCurrentSlide(p => Math.min(p + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrentSlide(p => Math.max(p - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-display font-bold">Presentation not found</h1>
        <p className="text-muted-foreground">The link might be invalid or the presentation is no longer public.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="px-6 h-16 border-b flex items-center justify-between bg-background/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-display font-bold text-foreground truncate max-w-[300px]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
             const url = window.location.href;
             navigator.clipboard.writeText(url);
             toast({ title: 'Link copied!', description: 'Share this URL with others.' });
          }}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="surface" size="sm" onClick={() => containerRef.current?.requestFullscreen()}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-muted/30">
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
        >
          <div 
            className="slide-container shadow-2xl rounded-xl overflow-hidden bg-background"
            style={{ 
              width: '1920px', 
              height: '1080px',
              transform: `scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full"
              >
                <SlideRenderer slide={slides[currentSlide]} mode="view" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-background/80 backdrop-blur-xl border border-border/50 px-6 py-3 rounded-2xl shadow-xl z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goPrev} 
            disabled={currentSlide === 0}
            className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[80px] justify-center text-sm font-medium">
            <span className="text-primary">{currentSlide + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span>{slides.length}</span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goNext} 
            disabled={currentSlide === slides.length - 1}
            className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </main>

      <footer className="h-10 border-t bg-background/50 backdrop-blur-md px-6 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
        <div>Powered by SlideMaker AI</div>
        <div>{new Date().getFullYear()} © All Rights Reserved</div>
      </footer>
    </div>
  );
}
