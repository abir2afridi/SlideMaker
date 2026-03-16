import { motion } from 'framer-motion';
import { mockTemplates, templateCategories } from '@/data/mockData';
import { useState } from 'react';
import { Layers, ArrowRight } from 'lucide-react';

export default function TemplateGallery() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? mockTemplates
    : mockTemplates.filter(t => t.category === activeCategory);

  return (
    <div>
      {/* Category Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {templateCategories.slice(0, 6).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="group cursor-pointer rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-150 overflow-hidden"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
              <Layers className="w-8 h-8 text-primary/30" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-150 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold text-foreground truncate">{template.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{template.slideCount} slides</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
