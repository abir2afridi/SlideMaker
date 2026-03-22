import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { StyleSelector } from '@/components/handwriting/StyleSelector';
import { useAppStore } from '@/lib/handwriting/store';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { WizardTools } from '@/components/handwriting/WizardTools';
import { motion } from 'framer-motion';

import { useState } from 'react';

const StylesPage = () => {
  const { globalStyleId, globalColorId, setGlobalStyle, setGlobalColor, pages, showMargin, showPageNumbers, inkSmudge } = useAppStore();
  const [applyStyleToAll, setApplyStyleToAll] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container py-8">
            <WizardTools />
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">Handwriting Styles & Colors</h1>
              <p className="text-sm text-muted-foreground">Choose a default style and ink color. You can also customize per section in the editor.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="bg-card border border-border/40 rounded-2xl p-6">
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
              </motion.div>
              
              <div className="flex justify-center">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="sticky top-24"
                >
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      Style Preview
                    </span>
                  </div>
                  <PagePreview
                    page={{
                      ...pages[0],
                      sections: [{
                        id: 'preview',
                        content: 'The quick brown fox jumps over the lazy dog.\nPack my box with five dozen liquor jugs.\nHow vexingly quick daft zebras jump!',
                        type: 'handwritten',
                        styleId: globalStyleId,
                        colorId: globalColorId,
                      }],
                    }}
                    showMargin={showMargin}
                    showPageNumber={showPageNumbers}
                    inkSmudge={inkSmudge}
                    scale={0.65}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StylesPage;
