import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Presentation, Slide } from '@/types/presentation';

export async function exportToPdf(presentation: Presentation, containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pdf = new jsPDF('l', 'px', [1920, 1080]);
  const slideElements = container.querySelectorAll('.slide-wrapper');

  for (let i = 0; i < slideElements.length; i++) {
    const canvas = await html2canvas(slideElements[i] as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    
    if (i > 0) pdf.addPage([1920, 1080], 'l');
    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
  }

  pdf.save(`${presentation.title.replace(/\s+/g, '_')}.pdf`);
}

export async function exportToPptx(presentation: Presentation) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = presentation.title;

  presentation.slides.forEach((slide: Slide) => {
    const pptSlide = pres.addSlide();
    
    // Set background based on theme or layout
    if (slide.layout === 'hero' || slide.layout === 'closing') {
      pptSlide.background = { color: '4F46E5' }; // Mock primary color
    }

    slide.blocks.forEach(block => {
      switch (block.type) {
        case 'heading1':
          pptSlide.addText(block.content as string, {
            x: '10%', y: '40%', w: '80%',
            fontSize: 44, bold: true, color: 'FFFFFF', align: 'center'
          });
          break;
        case 'heading2':
          pptSlide.addText(block.content as string, {
            x: '5%', y: '5%', w: '90%',
            fontSize: 32, bold: true, color: '333333'
          });
          break;
        case 'paragraph':
          pptSlide.addText(block.content as string, {
            x: '5%', y: '20%', w: '90%',
            fontSize: 18, color: '666666'
          });
          break;
        case 'bulletList':
          pptSlide.addText(
            (block.content as string[]).map(item => ({ text: item, options: { bullet: true } })),
            { x: '5%', y: '25%', w: '90%', fontSize: 20, color: '333333' }
          );
          break;
        case 'stat': {
          const stats = block.content as { label: string; value: string }[];
          stats.forEach((stat, idx) => {
            pptSlide.addText(stat.value, {
              x: `${10 + (idx * 22)}%`, y: '45%', w: '20%',
              fontSize: 36, bold: true, color: '4F46E5', align: 'center'
            });
            pptSlide.addText(stat.label, {
              x: `${10 + (idx * 22)}%`, y: '55%', w: '20%',
              fontSize: 12, color: '666666', align: 'center'
            });
          });
          break;
        }
      }
    });
  });

  pres.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}.pptx` });
}
