import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Presentation, BarChart3, FileText, Globe, Loader2, Sparkles, Users, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { generateSlidesFromAI, savePresentation } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePitchDeck } from '@/lib/slideGenerator';

const presetPrompts = [
  { icon: Presentation, label: 'Startup Pitch Deck', prompt: 'Create a startup pitch deck for an AI productivity tool', type: 'pitch-deck' },
  { icon: BarChart3, label: 'Marketing Report', prompt: 'Create a quarterly marketing performance report with data visualizations', type: 'report' },
  { icon: FileText, label: 'Product Launch', prompt: 'Create a product launch presentation for a new mobile app', type: 'product-launch' },
  { icon: Globe, label: 'Landing Page', prompt: 'Generate a high-converting landing page for a SaaS platform', type: 'landing-page' },
  { icon: Users, label: 'Portfolio Page', prompt: 'Create a minimalist portfolio page for a digital designer', type: 'portfolio' },
];

export default function CreatePage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    "Analyzing your prompt...",
    "Brainstorming with Gemini 2.0 Flash...",
    "Structuring presentation modules...",    "Crafting detailed slide content...",
    "Assembling your professional deck..."
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setGenerationStep(0);
    }
  }, [isGenerating, steps.length]);

  const handleGenerate = async (text?: string, type?: string) => {
    const finalPrompt = text || prompt;
    if (!finalPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(0);

    try {
      const result = await generateSlidesFromAI(finalPrompt, 'English', 8);

      if (isLoggedIn && result.slides?.length) {
        const saved = await savePresentation(
          result.presentation_title || result.title || finalPrompt,
          result.description || '',
          result.slides,
          { 
            name: 'Modern Indigo',
            primaryColor: '#4F46E5', 
            accentColor: '#10B981', 
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937',
            fontHeading: 'Inter', 
            fontBody: 'Lora', 
            style: 'modern',
            borderRadius: '0.75rem'
          },
        );
        navigate(`/editor/${saved.id}`);
      } else if (result.slides?.length) {
        navigate('/editor/new', { 
          state: { 
            prompt: finalPrompt, 
            slides: result.slides, 
            title: result.presentation_title || result.title || finalPrompt 
          } 
        });
      } else {
        throw new Error("No slides generated");
      }
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Please try again with a different prompt.',
        variant: 'destructive',
      });
      const slides = generatePitchDeck(finalPrompt);
      navigate('/editor/new', { state: { prompt: finalPrompt, slides, title: finalPrompt } });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm text-primary text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Content Specialist
          </motion.div>
          <h1 className="text-6xl font-display font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Turn ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">high-impact slides</span>.
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            Professional-level content research and structuring powered by Gemini 2.0 Flash.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Detailed Text', icon: FileText, color: 'text-primary' },
            { label: 'Smart Layouts', icon: Presentation, color: 'text-accent' },
            { label: 'AI Editor', icon: Wand2, color: 'text-indigo-500' },
          ].map((feat) => (
            <div key={feat.label} className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <feat.icon className={`w-5 h-5 ${feat.color} mb-2`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{feat.label}</span>
            </div>
          ))}
        </div>

        {/* Prompt Input Area */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[22px] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your topic in detail... (e.g. A comprehensive guide to quantum computing for investors)"
              className="w-full h-48 p-8 pr-20 text-lg bg-white/80 backdrop-blur-md border border-slate-200 rounded-[32px] shadow-2xl shadow-primary/5 resize-none outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-content placeholder:text-slate-400 leading-relaxed"
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
            <Button
              variant="default"
              size="lg"
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-4 right-4 rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 transition-transform active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="mr-2 font-bold uppercase tracking-wider text-xs">Generate</span>
                  <Wand2 className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Generation Overlays */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="w-8 h-8 text-white/10" />
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary/20 rounded-full animate-ping" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2 tracking-tight">{steps[generationStep]}</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium uppercase tracking-[0.2em]">Step {generationStep + 1} of {steps.length}</p>
              
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden max-w-md">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  className="h-full bg-hero-gradient"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Preset Prompts */}
        {!isGenerating && (
          <div className="animate-in-fast">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Jump Start</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {presetPrompts.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => handleGenerate(item.prompt, item.type)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group text-left"
                >
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Use template</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <button 
            onClick={() => navigate('/')} 
            className="group flex items-center gap-2 mx-auto text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span> Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
