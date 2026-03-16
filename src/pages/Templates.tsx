import { motion } from 'framer-motion';
import { mockTemplates, templateCategories } from '@/data/mockData';
import { useState } from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { generatePitchDeck } from '@/lib/slideGenerator';

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  const filtered = activeCategory === 'All'
    ? mockTemplates
    : mockTemplates.filter(t => t.category === activeCategory);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Template Gallery</h1>
              <p className="text-muted-foreground">Start with a professionally designed template and customize it in seconds.</p>
            </header>

            {/* Category Pills */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
              {templateCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => {
                    const slides = generatePitchDeck(template.title);
                    navigate('/editor/new', { state: { slides, title: template.title, prompt: template.description } });
                  }}
                  className="group cursor-pointer rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-200 overflow-hidden"
                >
                  <div className="aspect-[16/10] bg-muted relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 group-hover:scale-110 transition-transform duration-500" />
                    <Layers className="w-12 h-12 text-primary/10 relative z-10 group-hover:scale-125 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200 flex items-center justify-center z-20">
                      <Button variant="surface" size="sm" className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                        Use Template
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors">{template.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{template.description}</p>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{template.slideCount} slides</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">{template.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
