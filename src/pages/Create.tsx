import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Presentation, BarChart3, FileText, Globe, Loader2, Sparkles, Users, ArrowRight } from 'lucide-react';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  const handleGenerate = async (text?: string, type?: string) => {
    const finalPrompt = text || prompt;
    if (!finalPrompt.trim()) return;
    setIsGenerating(true);

    try {
      // Try AI generation
      const result = await generateSlidesFromAI(finalPrompt, type || 'pitch-deck');

      if (isLoggedIn && result.slides?.length) {
        // Save to DB
        const saved = await savePresentation(
          result.title || 'Untitled Presentation',
          result.description || '',
          result.slides,
          { primaryColor: '#4F46E5', accentColor: '#10B981', fontHeading: 'Inter', fontBody: 'Lora', style: 'modern' },
        );
        navigate(`/editor/${saved.id}`);
      } else {
        // Navigate with generated data in state
        navigate('/editor/new', { state: { prompt: finalPrompt, slides: result.slides, title: result.title } });
      }
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Please try again with a different prompt.',
        variant: 'destructive',
      });
      // Fallback to local generation
      const slides = generatePitchDeck(finalPrompt);
      navigate('/editor/new', { state: { prompt: finalPrompt, slides, title: finalPrompt } });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Generation
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            What will you <span className="text-gradient">create</span>?
          </h1>
          <p className="text-muted-foreground">Describe your presentation and let AI do the heavy lifting.</p>
        </div>

        {/* Prompt Input */}
        <div className="relative mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a startup pitch deck for an AI-powered design tool targeting enterprise teams..."
            className="w-full h-32 p-4 pr-14 text-sm bg-card border border-border rounded-xl resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground font-content"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-3 right-3"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 text-sm text-primary font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is crafting your presentation...
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '95%' }}
                transition={{ duration: 8, ease: 'easeOut' }}
                className="h-full bg-hero-gradient rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Preset Prompts */}
        {!isGenerating && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Start</p>
            <div className="grid grid-cols-2 gap-3">
              {presetPrompts.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => handleGenerate(item.prompt, item.type)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-md text-left transition-all duration-150 group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-150">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.prompt}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
