import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import ProjectCard from '@/components/ProjectCard';
import TemplateGallery from '@/components/TemplateGallery';
import { mockPresentations } from '@/data/mockData';
import { loadUserPresentations } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Presentation, PresentationTheme, Slide } from '@/types/presentation';

const Index = () => {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<Record<string, unknown>[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const data = await loadUserPresentations();
        setPresentations(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Convert DB presentations to display format
  const displayPresentations: Presentation[] = presentations.length > 0
    ? presentations.map((p) => ({
        id: p.id as string,
        title: p.title as string,
        description: (p.description as string) || '',
        createdAt: p.created_at as string,
        updatedAt: p.updated_at as string,
        theme: (p.theme as PresentationTheme) || { 
          name: 'Default',
          primaryColor: '#4F46E5', 
          accentColor: '#10B981', 
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          fontHeading: 'Inter', 
          fontBody: 'Lora', 
          style: 'modern' as const,
          borderRadius: '0.75rem'
        },
        slides: (p.slides as unknown as Slide[]) || [],
        status: (p.status as 'draft' | 'published' | 'shared') || 'draft',
        userId: (p.user_id as string) || '',
        isPublic: (p.is_public as boolean) || false
      }))
    : mockPresentations;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-hero-gradient p-6 mb-6 flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                Welcome back 👋
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                {isLoggedIn ? 'Create stunning presentations in seconds with AI.' : 'Sign in to save your presentations, or try creating one now!'}
              </p>
            </div>
            <Button variant="surface" onClick={() => navigate('/create')} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Create with AI
            </Button>
          </motion.div>

          {/* Recent Projects */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {presentations.length > 0 ? 'Your Presentations' : 'Demo Projects'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPresentations.map((p, i) => (
                <ProjectCard key={p.id} presentation={p as Presentation} index={i} />
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Templates</h2>
            <TemplateGallery />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
