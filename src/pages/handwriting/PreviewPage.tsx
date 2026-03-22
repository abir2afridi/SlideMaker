import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { useAppStore } from '@/lib/handwriting/store';
import { motion } from 'framer-motion';
import { WizardTools } from '@/components/handwriting/WizardTools';

const PreviewPage = () => {
  const { pages, showMargin, showPageNumbers, inkSmudge } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container py-8">
            <WizardTools />
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">Page Preview</h1>
              <p className="text-sm text-muted-foreground">Review all your pages before exporting. {pages.length} page{pages.length !== 1 ? 's' : ''} total.</p>
            </motion.div>

            <div className="flex flex-col items-center gap-10">
              {pages.map((page, i) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="text-center mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      Page {i + 1} of {pages.length}
                    </span>
                  </div>
                  <PagePreview
                    page={page}
                    showMargin={showMargin}
                    showPageNumber={showPageNumbers}
                    inkSmudge={inkSmudge}
                    scale={0.85}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PreviewPage;
