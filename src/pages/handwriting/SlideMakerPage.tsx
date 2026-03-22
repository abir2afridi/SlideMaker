import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronLeft, ChevronRight, Download, Presentation, Layout, Type, Image, FileText } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { WizardTools } from '@/components/handwriting/WizardTools';

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  layout: 'title' | 'content' | 'two-column' | 'image-text' | 'text-image' | 'blank';
  bgColor: string;
  textColor: string;
  accentColor: string;
  imageUrl?: string;
  bulletPoints: string[];
}

const SLIDE_THEMES = [
  { name: 'Professional', bg: '#1e3a5f', text: '#ffffff', accent: '#4fc3f7' },
  { name: 'Clean White', bg: '#ffffff', text: '#1a1a2e', accent: '#e94560' },
  { name: 'Dark Modern', bg: '#0f0f23', text: '#e0e0e0', accent: '#00d4aa' },
  { name: 'Warm Earth', bg: '#2c1810', text: '#f5e6d3', accent: '#d4a574' },
  { name: 'Ocean Blue', bg: '#0a1628', text: '#e8f4f8', accent: '#06b6d4' },
  { name: 'Forest', bg: '#1a2e1a', text: '#e8f5e9', accent: '#66bb6a' },
  { name: 'Sunset', bg: '#1a0a2e', text: '#fce4ec', accent: '#ff6f61' },
  { name: 'Minimal Gray', bg: '#f5f5f5', text: '#212121', accent: '#ff5722' },
];

const LAYOUTS = [
  { id: 'title' as const, name: 'Title Slide', icon: Presentation },
  { id: 'content' as const, name: 'Content', icon: FileText },
  { id: 'two-column' as const, name: 'Two Column', icon: Layout },
  { id: 'image-text' as const, name: 'Image + Text', icon: Image },
  { id: 'text-image' as const, name: 'Text + Image', icon: Type },
  { id: 'blank' as const, name: 'Blank', icon: Layout },
];

const createSlide = (): SlideData => ({
  id: crypto.randomUUID(),
  title: '',
  subtitle: '',
  content: '',
  layout: 'title',
  bgColor: '#1e3a5f',
  textColor: '#ffffff',
  accentColor: '#4fc3f7',
  bulletPoints: [],
});

const SlideMakerPage = () => {
  const [slides, setSlides] = useState<SlideData[]>([createSlide()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [bulkText, setBulkText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const current = slides[currentIdx];

  const updateSlide = useCallback((updates: Partial<SlideData>) => {
    setSlides(prev => prev.map((s, i) => i === currentIdx ? { ...s, ...updates } : s));
  }, [currentIdx]);

  const addSlide = () => {
    const ns = createSlide();
    ns.bgColor = current.bgColor;
    ns.textColor = current.textColor;
    ns.accentColor = current.accentColor;
    ns.layout = 'content';
    setSlides(prev => [...prev, ns]);
    setCurrentIdx(slides.length);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== currentIdx));
    setCurrentIdx(Math.max(0, currentIdx - 1));
  };

  const applyTheme = (theme: typeof SLIDE_THEMES[0]) => {
    setSlides(prev => prev.map(s => ({ ...s, bgColor: theme.bg, textColor: theme.text, accentColor: theme.accent })));
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateSlide({ imageUrl: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [updateSlide]);

  const generateFromText = () => {
    if (!bulkText.trim()) return;
    const paragraphs = bulkText.split('\n\n').filter(p => p.trim());
    const newSlides: SlideData[] = [];

    paragraphs.forEach((para, i) => {
      const lines = para.split('\n').filter(l => l.trim());
      const slide = createSlide();
      slide.bgColor = current.bgColor;
      slide.textColor = current.textColor;
      slide.accentColor = current.accentColor;

      if (i === 0) {
        slide.layout = 'title';
        slide.title = lines[0] || 'Presentation';
        slide.subtitle = lines.slice(1).join(' ');
      } else {
        slide.layout = 'content';
        slide.title = lines[0] || `Slide ${i + 1}`;
        const bullets = lines.slice(1).map(l => l.replace(/^[-•*]\s*/, ''));
        if (bullets.length > 0) {
          slide.bulletPoints = bullets;
        }
        slide.content = lines.slice(1).join('\n');
      }
      newSlides.push(slide);
    });

    if (newSlides.length === 0) {
      const s = createSlide();
      s.title = bulkText.slice(0, 50);
      s.content = bulkText;
      newSlides.push(s);
    }

    setSlides(newSlides);
    setCurrentIdx(0);
    setShowBulkInput(false);
  };

  const exportPDF = async () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
    for (let i = 0; i < slides.length; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      if (i > 0) pdf.addPage();
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 960, 540);
    }
    pdf.save('presentation.pdf');
  };

  const renderSlide = (slide: SlideData, index: number, isPreview = false) => {
    const w = isPreview ? 960 : 160;
    const h = isPreview ? 540 : 90;
    const s = isPreview ? 1 : 160 / 960;

    return (
      <div
        ref={isPreview ? (el) => { slideRefs.current[index] = el; } : undefined}
        className={cn("overflow-hidden flex-shrink-0", isPreview ? "rounded-lg shadow-2xl" : "rounded")}
        style={{
          width: w,
          height: h,
          backgroundColor: slide.bgColor,
          color: slide.textColor,
          position: 'relative',
        }}
      >
        <div style={{
          width: 960,
          height: 540,
          transform: isPreview ? 'none' : `scale(${s})`,
          transformOrigin: 'top left',
          padding: '48px 64px',
          display: 'flex',
          flexDirection: slide.layout === 'two-column' || slide.layout === 'image-text' || slide.layout === 'text-image' ? 'row' : 'column',
          justifyContent: slide.layout === 'title' ? 'center' : 'flex-start',
          alignItems: slide.layout === 'title' ? 'center' : 'flex-start',
          gap: 32,
        }}>
          {slide.layout === 'title' && (
            <div className="text-center w-full">
              <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                {slide.title || 'Presentation Title'}
              </div>
              <div style={{ fontSize: 24, opacity: 0.8, color: slide.accentColor }}>
                {slide.subtitle || 'Your subtitle here'}
              </div>
              <div style={{ width: 80, height: 4, backgroundColor: slide.accentColor, margin: '24px auto 0', borderRadius: 2 }} />
            </div>
          )}

          {slide.layout === 'content' && (
            <div className="w-full">
              <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
                {slide.title || 'Slide Title'}
              </div>
              <div style={{ width: 60, height: 3, backgroundColor: slide.accentColor, borderRadius: 2, marginBottom: 24 }} />
              {slide.bulletPoints.length > 0 ? (
                <ul style={{ fontSize: 22, lineHeight: 1.8, paddingLeft: 24 }}>
                  {slide.bulletPoints.map((bp, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <span style={{ color: slide.accentColor, marginRight: 12 }}>●</span>
                      {bp}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: 22, lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                  {slide.content || 'Add your content...'}
                </div>
              )}
            </div>
          )}

          {slide.layout === 'two-column' && (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
                  {slide.title || 'Column Title'}
                </div>
                <div style={{ width: 50, height: 3, backgroundColor: slide.accentColor, borderRadius: 2, marginBottom: 16 }} />
                <div style={{ fontSize: 18, lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                  {slide.content || 'Left column content'}
                </div>
              </div>
              <div style={{ width: 2, backgroundColor: slide.accentColor, opacity: 0.3, alignSelf: 'stretch' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                  {slide.subtitle || 'Right column content'}
                </div>
                {slide.imageUrl && (
                  <img src={slide.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, marginTop: 16 }} />
                )}
              </div>
            </>
          )}

          {(slide.layout === 'image-text' || slide.layout === 'text-image') && (
            <>
              {slide.layout === 'image-text' && slide.imageUrl && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={slide.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 12 }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
                  {slide.title || 'Title'}
                </div>
                <div style={{ width: 50, height: 3, backgroundColor: slide.accentColor, borderRadius: 2, marginBottom: 16 }} />
                <div style={{ fontSize: 18, lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                  {slide.content || 'Content goes here...'}
                </div>
              </div>
              {slide.layout === 'text-image' && slide.imageUrl && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={slide.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 12 }} />
                </div>
              )}
              {!slide.imageUrl && (
                <div
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${slide.accentColor}40`, borderRadius: 12 }}
                  className="cursor-pointer"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <Image style={{ width: 48, height: 48, margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14 }}>Click to add image</div>
                  </div>
                </div>
              )}
            </>
          )}

          {slide.layout === 'blank' && (
            <div className="w-full h-full flex items-center justify-center">
              <div style={{ fontSize: 20, opacity: 0.5 }}>
                {slide.content || 'Blank slide'}
              </div>
            </div>
          )}

          {/* Slide number */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 32,
            fontSize: 14,
            opacity: 0.4,
          }}>
            {index + 1} / {slides.length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container py-6">
            <WizardTools />
            
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground">Slide Maker</h1>
            <p className="text-sm text-muted-foreground mt-1">Create presentation slides from text</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkInput(!showBulkInput)} className="rounded-lg">
              <FileText className="h-4 w-4 mr-1.5" />
              {showBulkInput ? 'Editor' : 'From Text'}
            </Button>
            <Button variant="outline" size="sm" onClick={addSlide} className="rounded-lg">
              <Plus className="h-4 w-4 mr-1.5" /> Add Slide
            </Button>
            <Button size="sm" onClick={exportPDF} className="rounded-lg">
              <Download className="h-4 w-4 mr-1.5" /> Export PDF
            </Button>
          </div>
        </motion.div>

        {showBulkInput ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-display text-lg text-foreground mb-2">Generate Slides from Text</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Separate slides with blank lines. First line of each paragraph becomes the slide title, remaining lines become bullet points.
              </p>
              <span className="text-xs text-muted-foreground block mb-2">Example format:</span>
              <pre className="text-[10px] bg-muted p-2 rounded mb-4 overflow-x-auto">
                {`My Presentation\nA brief overview of the topic\n\nSlide 2 Title\n- First key point\n- Second key point\n- Third key point`}
              </pre>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Type or paste your presentation text here..."
                className="min-h-[300px] font-body rounded-lg"
              />
              <Button onClick={generateFromText} className="mt-4 w-full">
                Generate Slides
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              {/* Slide thumbnails */}
              <div className="bg-card rounded-xl border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Slides ({slides.length})</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap max-h-[200px] overflow-y-auto p-1">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentIdx(i)}
                      className={cn(
                        "border-2 rounded transition-all",
                        i === currentIdx ? "border-primary shadow-md" : "border-border hover:border-primary/40"
                      )}
                    >
                      {renderSlide(slide, i, false)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide editor */}
              <div className="bg-card rounded-xl border p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Edit Slide {currentIdx + 1}</span>
                  {slides.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={removeSlide}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Layout picker */}
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Layout</Label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {LAYOUTS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => updateSlide({ layout: l.id })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] border transition-all",
                          current.layout === l.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                        )}
                      >
                        <l.icon className="h-3.5 w-3.5" />
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Theme Presets</Label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {SLIDE_THEMES.map(t => (
                      <button
                        key={t.name}
                        onClick={() => applyTheme(t)}
                        className="w-7 h-7 rounded-full border-2 border-border hover:scale-110 transition-all shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground">Title</Label>
                    <Input
                      value={current.title}
                      onChange={(e) => updateSlide({ title: e.target.value })}
                      placeholder="Slide title..."
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground">Subtitle / Column 2</Label>
                    <Input
                      value={current.subtitle}
                      onChange={(e) => updateSlide({ subtitle: e.target.value })}
                      placeholder="Subtitle..."
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground">Content</Label>
                    <Textarea
                      value={current.content}
                      onChange={(e) => updateSlide({ content: e.target.value })}
                      placeholder="Add main content text here..."
                      className="min-h-[80px] text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground font-bold text-accent">Bullet Points</Label>
                    <Textarea
                      value={current.bulletPoints.join('\n')}
                      onChange={(e) => updateSlide({ bulletPoints: e.target.value.split('\n') })}
                      placeholder="Point 1&#10;Point 2&#10;Point 3"
                      className="min-h-[60px] text-xs mt-1 bg-accent/5 border-accent/20"
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full h-8 text-xs mt-2" onClick={() => imageInputRef.current?.click()}>
                  <Image className="h-3.5 w-3.5 mr-1.5" />
                  {current.imageUrl ? 'Change Image' : 'Add Image'}
                </Button>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Preview: Slide {currentIdx + 1} of {slides.length}
                </span>
              </div>
              <div className="w-full max-w-[960px] overflow-hidden bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderSlide(current, currentIdx, true)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="rounded-lg h-9"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <div className="px-4 py-1.5 rounded-full bg-card border text-sm font-medium">
                  {currentIdx + 1} <span className="opacity-40 px-1">/</span> {slides.length}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))}
                  disabled={currentIdx === slides.length - 1}
                  className="rounded-lg h-9"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
        </main>
      </div>
    </div>
  );
};

export default SlideMakerPage;
