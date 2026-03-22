import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { PagePreview } from '@/components/handwriting/PagePreview';
import { useAppStore } from '@/lib/handwriting/store';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, CheckCircle, FileSpreadsheet, Presentation } from 'lucide-react';
import { useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PAGE_SIZES } from '@/lib/handwriting/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { WizardTools } from '@/components/handwriting/WizardTools';

const ExportPage = () => {
  const { pages, showMargin, showPageNumbers, inkSmudge } = useAppStore();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  const setPageRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    pageRefs.current[index] = el;
  }, []);

  const capturePages = async () => {
    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < pages.length; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      canvases.push(canvas);
    }
    return canvases;
  };

  const exportAsPDF = async () => {
    setExporting('pdf');
    try {
      const size = PAGE_SIZES.find(s => s.id === pages[0].sizeId) || PAGE_SIZES[0];
      const pdf = new jsPDF({
        orientation: size.width > size.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [size.width, size.height],
      });
      const canvases = await capturePages();
      canvases.forEach((canvas, i) => {
        if (i > 0) pdf.addPage([size.width, size.height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, size.width, size.height);
      });
      pdf.save('assignment.pdf');
      toast.success('PDF exported successfully!');
    } catch (e) {
      toast.error('Export failed. Please try again.');
      console.error(e);
    }
    setExporting(null);
  };

  const exportAsImages = async () => {
    setExporting('png');
    try {
      const canvases = await capturePages();
      canvases.forEach((canvas, i) => {
        const link = document.createElement('a');
        link.download = `assignment-page-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
      toast.success('Images exported successfully!');
    } catch (e) {
      toast.error('Export failed.');
      console.error(e);
    }
    setExporting(null);
  };

  const exportAsJPG = async () => {
    setExporting('jpg');
    try {
      const canvases = await capturePages();
      canvases.forEach((canvas, i) => {
        const link = document.createElement('a');
        link.download = `assignment-page-${i + 1}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      });
      toast.success('JPG images exported!');
    } catch (e) {
      toast.error('Export failed.');
      console.error(e);
    }
    setExporting(null);
  };

  const exportFormats = [
    { id: 'pdf', label: 'PDF', icon: FileText, onClick: exportAsPDF, description: 'Multi-page document' },
    { id: 'png', label: 'PNG', icon: Image, onClick: exportAsImages, description: 'Lossless images' },
    { id: 'jpg', label: 'JPG', icon: Image, onClick: exportAsJPG, description: 'Compressed images' },
    { id: 'docx', label: 'DOCX', icon: FileSpreadsheet, onClick: () => toast.info('Word export coming soon!'), description: 'Word document (coming soon)' },
    { id: 'pptx', label: 'PPTX', icon: Presentation, onClick: () => toast.info('PowerPoint export coming soon!'), description: 'Slides (coming soon)' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container py-8">
            <WizardTools />
            
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl md:text-3xl text-foreground">Export & Download</h1>
          <p className="text-sm text-muted-foreground mt-1">{pages.length} page{pages.length !== 1 ? 's' : ''} ready to export</p>

          {/* Export format cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
            {exportFormats.map((fmt) => (
              <motion.button
                key={fmt.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={fmt.onClick}
                disabled={!!exporting}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <fmt.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{fmt.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">{fmt.description}</span>
                {exporting === fmt.id && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </motion.button>
            ))}
          </div>
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
                  Page {i + 1}
                </span>
              </div>
              <PagePreview
                ref={setPageRef(i)}
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

export default ExportPage;
