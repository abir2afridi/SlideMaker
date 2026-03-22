import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { LayoutSelector } from '@/components/handwriting/LayoutSelector';
import { useAppStore } from '@/lib/handwriting/store';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { WizardTools } from '@/components/handwriting/WizardTools';
import { motion } from 'framer-motion';

import { useState } from 'react';

const LayoutPage = () => {
  const {
    globalLayoutId, globalSizeId, showMargin, showPageNumbers, inkSmudge,
    setGlobalLayout, setGlobalSize, setShowMargin, setShowPageNumbers, setInkSmudge,
    pages, globalStyleId, globalColorId,
  } = useAppStore();
  const [applyLayoutToAll, setApplyLayoutToAll] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container py-8">
            <WizardTools />
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">Page Layout & Customization</h1>
              <p className="text-sm text-muted-foreground">Configure page size, paper style, margins, and visual options.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="bg-card border border-border/40 rounded-2xl p-6">
                  <LayoutSelector
                    selectedLayoutId={globalLayoutId}
                    selectedSizeId={globalSizeId}
                    showMargin={showMargin}
                    showPageNumbers={showPageNumbers}
                    inkSmudge={inkSmudge}
                    onLayoutChange={(id) => setGlobalLayout(id, applyLayoutToAll)}
                    onSizeChange={(id) => setGlobalSize(id, applyLayoutToAll)}
                    onMarginChange={(v) => setShowMargin(v, applyLayoutToAll)}
                    onPageNumbersChange={(v) => setShowPageNumbers(v, applyLayoutToAll)}
                    onInkSmudgeChange={setInkSmudge}
                  />

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
                      Layout Preview
                    </span>
                  </div>
                  <PagePreview
                    page={{
                      id: 'layout-preview',
                      sections: [{
                        id: 'lp',
                        content: 'This is how your page will look with the selected layout, paper style, and options.\n\nAdjust the settings on the left to see changes in real-time.',
                        type: 'handwritten',
                        styleId: globalStyleId,
                        colorId: globalColorId,
                      }],
                      sizeId: globalSizeId,
                      layoutId: globalLayoutId,
                      showMargin,
                      showPageNumber: showPageNumbers,
                      pageNumber: 1,
                      locked: false,
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

export default LayoutPage;
