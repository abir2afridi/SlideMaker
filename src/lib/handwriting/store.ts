import { create } from 'zustand';
import { PageConfig, TextSection } from './types';

interface Snapshot {
  pages: PageConfig[];
  globalStyleId: string;
  globalColorId: string;
  globalSizeId: string;
  globalLayoutId: string;
  showMargin: boolean;
  showPageNumbers: boolean;
  globalMargins: { top: number, bottom: number, left: number, right: number };
}

interface AppState {
  pages: PageConfig[];
  currentPageIndex: number;
  globalStyleId: string;
  globalColorId: string;
  globalSizeId: string;
  globalLayoutId: string;
  showMargin: boolean;
  showPageNumbers: boolean;
  inkSmudge: boolean;
  globalMargins: { top: number, bottom: number, left: number, right: number };
  notes: Array<{ 
    id: string, 
    title: string, 
    lastModified: number, 
    pages: PageConfig[], 
    sizeId: string, 
    margins?: { top: number, bottom: number, left: number, right: number } 
  }>;
  activeNoteId: string | null;
  
  past: Snapshot[];
  future: Snapshot[];
  
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  updateSectionGlobally: (updates: Partial<TextSection>) => void;
  
  setGlobalMargins: (m: Partial<{ top: number, bottom: number, left: number, right: number }>, applyToAll?: boolean) => void;

  setCurrentPage: (index: number) => void;
  setGlobalStyle: (id: string, applyToAll?: boolean) => void;
  setGlobalColor: (id: string, applyToAll?: boolean) => void;
  setGlobalSize: (id: string, applyToAll?: boolean) => void;
  setGlobalLayout: (id: string, applyToAll?: boolean) => void;
  setShowMargin: (v: boolean, applyToAll?: boolean) => void;
  setShowPageNumbers: (v: boolean, applyToAll?: boolean) => void;
  setInkSmudge: (v: boolean) => void;
  setPages: (pages: PageConfig[]) => void;
  updatePage: (index: number, page: Partial<PageConfig>) => void;
  addPage: () => void;
  removePage: (index: number) => void;
  updateSection: (pageIndex: number, sectionIndex: number, section: Partial<TextSection>) => void;
  addSection: (pageIndex: number) => void;
  removeSection: (pageIndex: number, sectionIndex: number) => void;
  setText: (text: string) => void;
  rebalancePages: () => void;
  
  // Note Management
  createNote: (sizeId: string, title: string) => void;
  loadNote: (id: string) => void;
  deleteNote: (id: string) => void;
  renameNote: (id: string, title: string) => void;
  persistActiveNote: () => void;
}

const getPageDimensions = (sizeId: string) => {
  switch (sizeId) {
    case 'a5': return { w: 148, h: 210 };
    case 'a4': return { w: 210, h: 297 };
    case 'a3': return { w: 297, h: 420 };
    case 'letter': return { w: 216, h: 279 };
    case 'legal': return { w: 216, h: 356 };
    case 'b5': return { w: 176, h: 250 };
    case 'postcard': return { w: 148, h: 105 };
    default: return { w: 210, h: 297 };
  }
};

const getLineLimit = (sizeId: string, margins: { top: number, bottom: number }): number => {
  const { h } = getPageDimensions(sizeId);
  const effectiveHeight = h - margins.top - margins.bottom;
  let buffer = 5;
  const lineHeightMm = 12.8;
  if (sizeId === 'a5') buffer = 2;
  return Math.max(1, Math.floor((effectiveHeight - buffer) / lineHeightMm));
};

const getCharsPerLine = (sizeId: string, margins: { left: number, right: number }): number => {
  const { w } = getPageDimensions(sizeId);
  const effectiveWidth = w - margins.left - margins.right;
  let charWidthMm = 4.4;
  let widthBuffer = 10;
  if (sizeId === 'a5') {
    charWidthMm = 4.2;
    widthBuffer = 4;
  }
  return Math.max(10, Math.floor((effectiveWidth - widthBuffer) / charWidthMm));
};

const createDefaultSection = (styleId: string, colorId: string): TextSection => ({
  id: crypto.randomUUID(),
  content: '',
  type: 'handwritten',
  styleId,
  colorId,
});

const createDefaultPage = (
  pageNumber: number, 
  styleId: string, 
  colorId: string, 
  sizeId: string, 
  layoutId: string,
  margins: { top: number, bottom: number, left: number, right: number }
): PageConfig => ({
  id: crypto.randomUUID(),
  sections: [createDefaultSection(styleId, colorId)],
  sizeId,
  layoutId,
  margins,
  showMargin: true,
  showPageNumber: true,
  pageNumber,
  locked: false,
});

const STORAGE_KEY = 'handwriting-notes';

const loadNotesFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

const getSnapshot = (state: AppState) => ({
  pages: JSON.parse(JSON.stringify(state.pages)),
  globalStyleId: state.globalStyleId,
  globalColorId: state.globalColorId,
  globalSizeId: state.globalSizeId,
  globalLayoutId: state.globalLayoutId,
  showMargin: state.showMargin,
  showPageNumbers: state.showPageNumbers,
  globalMargins: { ...state.globalMargins },
});

export const useAppStore = create<AppState>((set, get) => ({
  pages: [],
  currentPageIndex: 0,
  globalStyleId: 'caveat',
  globalColorId: 'blue',
  globalSizeId: 'a4',
  globalLayoutId: 'ruled',
  showMargin: true,
  showPageNumbers: true,
  inkSmudge: false,
  globalMargins: { top: 20, bottom: 20, left: 20, right: 20 },
  notes: loadNotesFromStorage(),
  activeNoteId: null,
  past: [],
  future: [],

  saveHistory: () => {
    const snapshot = getSnapshot(get());
    set((state) => ({
      past: [...state.past.slice(-50), snapshot],
      future: []
    }));
  },

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    const current = getSnapshot(state);
    return {
      ...previous,
      past: newPast,
      future: [current, ...state.future]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    const current = getSnapshot(state);
    return {
      ...next,
      past: [...state.past, current],
      future: newFuture
    };
  }),

  setGlobalMargins: (m, applyToAll = true) => {
    get().saveHistory();
    set((state) => {
      const newMargins = { ...state.globalMargins, ...m };
      return { 
        globalMargins: applyToAll ? newMargins : state.globalMargins,
        pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? { ...p, margins: { ...(p.margins || state.globalMargins), ...m } } : p)
      };
    });
  },

  setCurrentPage: (index) => set({ currentPageIndex: index }),
  
  setGlobalStyle: (id, applyToAll = true) => {
    get().saveHistory();
    set((state) => ({
      globalStyleId: applyToAll ? id : state.globalStyleId,
      pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? {
        ...p,
        sections: p.sections.map(s => ({ ...s, styleId: id })),
      } : p),
    }));
  },

  setGlobalColor: (id, applyToAll = true) => {
    get().saveHistory();
    set((state) => ({
      globalColorId: applyToAll ? id : state.globalColorId,
      pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? {
        ...p,
        sections: p.sections.map(s => ({ ...s, colorId: id })),
      } : p),
    }));
  },

  setGlobalSize: (id, applyToAll = true) => {
    get().saveHistory();
    set((state) => {
      const limit = getLineLimit(id, state.globalMargins);
      const charsPerLine = getCharsPerLine(id, state.globalMargins);
      let pages = JSON.parse(JSON.stringify(state.pages));

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        if (!applyToAll && pIdx !== state.currentPageIndex) continue;
        pages[pIdx].sizeId = id;

        if (pIdx < pages.length - 1) {
          const currentSections = pages[pIdx].sections;
          const lastSection = currentSections[currentSections.length - 1];
          let currentTotalLines = 0;
          currentSections.forEach((s: TextSection) => {
            const lines = (s.content || "").split('\n');
            lines.forEach((l: string) => {
               currentTotalLines += Math.max(1, Math.ceil(l.length / charsPerLine));
            });
          });
          if (currentTotalLines < limit && lastSection && !lastSection.isHeading) {
            const spaceLeft = limit - currentTotalLines;
            const nextSections = pages[pIdx+1].sections;
            const firstNextSection = nextSections[0];
            if (firstNextSection && !firstNextSection.isHeading && firstNextSection.content) {
              const nextLines = firstNextSection.content.split('\n');
              let linesToPull = 0;
              let visualLinesPulled = 0;
              let pullIndex = 0;
              for (let i = 0; i < nextLines.length; i++) {
                const line = nextLines[i];
                const lineRows = Math.max(1, Math.ceil(line.length / charsPerLine));
                if (visualLinesPulled + lineRows > spaceLeft) break;
                visualLinesPulled += lineRows;
                linesToPull++;
                pullIndex += line.length + (i < nextLines.length - 1 ? 1 : 0);
              }
              if (linesToPull > 0) {
                const contentToPull = firstNextSection.content.substring(0, pullIndex).trimEnd();
                const contentRemaining = firstNextSection.content.substring(pullIndex).trimStart();
                pages[pIdx].sections[currentSections.length - 1].content += (lastSection.content ? '\n' : '') + contentToPull;
                pages[pIdx+1].sections[0].content = contentRemaining;
              }
            }
          }
        }
        const currentPageSections = pages[pIdx].sections;
        for (let sIdx = 0; sIdx < currentPageSections.length; sIdx++) {
          const section = currentPageSections[sIdx];
          if (section.isHeading || !section.content) continue;
          const rawLines = section.content.split('\n');
          let visualLineCount = 0;
          let splitIndex = -1;
          let currentTotalProcessed = 0;
          let heightBefore = 0;
          for (let prevIdx = 0; prevIdx < sIdx; prevIdx++) {
             const prevS = currentPageSections[prevIdx];
             (prevS.content || "").split('\n').forEach((l: string) => {
                heightBefore += Math.max(1, Math.ceil(l.length / charsPerLine));
             });
          }
          for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i];
            const lineVisualRows = Math.max(1, Math.ceil(line.length / charsPerLine));
            if (heightBefore + visualLineCount + lineVisualRows > limit) {
              splitIndex = currentTotalProcessed;
              break;
            }
            visualLineCount += lineVisualRows;
            currentTotalProcessed += line.length + (i < rawLines.length - 1 ? 1 : 0);
          }
          if (splitIndex !== -1) {
            const mainContent = section.content.substring(0, splitIndex).trimEnd();
            const overflow = section.content.substring(splitIndex).trimStart();
            pages[pIdx].sections[sIdx].content = mainContent;
            if (pIdx < pages.length - 1) {
              pages[pIdx+1].sections[0].content = overflow + (pages[pIdx+1].sections[0].content ? '\n' + pages[pIdx+1].sections[0].content : '');
            } else {
              const newPage = createDefaultPage(pages.length + 1, state.globalStyleId, state.globalColorId, id, state.globalLayoutId, state.globalMargins);
              newPage.sections[0].content = overflow;
              pages.push(newPage);
            }
          }
        }
      }
      pages = pages.filter((p: PageConfig, i: number) => i === 0 || p.sections.some((s: TextSection) => (s.content && s.content.trim().length > 0) || (s.images && s.images.length > 0) || s.imageUrl));
      pages = pages.map((p: PageConfig, i: number) => ({ ...p, pageNumber: i + 1 }));
      return { globalSizeId: applyToAll ? id : state.globalSizeId, pages, currentPageIndex: Math.min(state.currentPageIndex, pages.length - 1) };
    });
  },

  setGlobalLayout: (id, applyToAll = true) => {
    get().saveHistory();
    set((state) => ({ 
      globalLayoutId: applyToAll ? id : state.globalLayoutId,
      showMargin: id === 'plain' ? false : (applyToAll ? state.showMargin : state.showMargin),
      pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? ({ 
        ...p, 
        layoutId: id,
        showMargin: id === 'plain' ? false : (applyToAll ? p.showMargin : p.showMargin)
      }) : p)
    }));
  },

  setShowMargin: (v, applyToAll = true) => {
    get().saveHistory();
    set((state) => ({ 
      showMargin: applyToAll ? v : state.showMargin,
      pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? ({ ...p, showMargin: v }) : p)
    }));
  },

  setShowPageNumbers: (v, applyToAll = true) => {
    get().saveHistory();
    set((state) => ({ 
      showPageNumbers: applyToAll ? v : state.showPageNumbers,
      pages: state.pages.map((p, i) => (applyToAll || i === state.currentPageIndex) ? ({ ...p, showPageNumber: v }) : p)
    }));
  },

  setInkSmudge: (v) => set({ inkSmudge: v }),
  
  setPages: (pages) => {
    get().saveHistory();
    set({ pages });
  },

  updatePage: (index, partial) => {
    get().saveHistory();
    set((state) => {
      const pages = [...state.pages];
      pages[index] = { ...pages[index], ...partial };
      return { pages };
    });
  },

  addPage: () => {
    get().saveHistory();
    set((state) => {
      const newPage = createDefaultPage(
        state.pages.length + 1,
        state.globalStyleId,
        state.globalColorId,
        state.globalSizeId,
        state.globalLayoutId,
        state.globalMargins
      );
      return { pages: [...state.pages, newPage] };
    });
  },

  removePage: (index) => {
    get().saveHistory();
    set((state) => {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { pages, currentPageIndex: Math.min(state.currentPageIndex, pages.length - 1) };
    });
  },

  updateSection: (pageIndex, sectionIndex, partial) => {
    if ('type' in partial || 'styleId' in partial || 'colorId' in partial || 'images' in partial || 'imageUrl' in partial) {
      get().saveHistory();
    }
    set((state) => {
      const pages = JSON.parse(JSON.stringify(state.pages));
      if (!pages[pageIndex] || !pages[pageIndex].sections[sectionIndex]) return state;
      pages[pageIndex].sections[sectionIndex] = { ...pages[pageIndex].sections[sectionIndex], ...partial };
      let currentPage = pageIndex;
      let currentSection = sectionIndex;
      let didSplit = false;
      while (true) {
          const section = pages[currentPage].sections[currentSection];
          if (section.isHeading || !section.content.length) break;
          const limit = getLineLimit(pages[currentPage].sizeId, pages[currentPage].margins || state.globalMargins);
          const charsPerLine = getCharsPerLine(pages[currentPage].sizeId, pages[currentPage].margins || state.globalMargins);
          const rawLines = section.content.split('\n');
          let visualLineCount = 0;
          let splitCharIndex = -1;
          let runningContent = "";
          for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i];
            const lineVisualRows = Math.max(1, Math.ceil(line.length / charsPerLine));
            if (visualLineCount + lineVisualRows > limit) {
              splitCharIndex = runningContent.length;
              break;
            }
            visualLineCount += lineVisualRows;
            runningContent += line + (i < rawLines.length - 1 ? '\n' : '');
          }
          if (splitCharIndex === -1) break;
          const mainContent = section.content.substring(0, splitCharIndex).trimEnd();
          const overflow = section.content.substring(splitCharIndex).trimStart();
          pages[currentPage].sections[currentSection].content = mainContent;
          didSplit = true;
          if (currentPage < pages.length - 1) {
              pages[currentPage + 1].sections[0].content = overflow + (pages[currentPage + 1].sections[0].content ? '\n' + pages[currentPage + 1].sections[0].content : '');
              currentPage++;
              currentSection = 0;
          } else {
              const newPage = createDefaultPage(pages.length + 1, state.globalStyleId, state.globalColorId, state.globalSizeId, state.globalLayoutId, state.globalMargins);
              newPage.sections[0].content = overflow;
              pages.push(newPage);
              currentPage++;
              currentSection = 0;
          }
      }
      return { pages, currentPageIndex: didSplit ? pages.length - 1 : state.currentPageIndex };
    });
  },

  updateSectionGlobally: (partial) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map(p => ({
        ...p,
        sections: p.sections.map(s => ({ ...s, ...partial }))
      }))
    }));
  },

  addSection: (pageIndex) => {
    get().saveHistory();
    set((state) => {
      const pages = [...state.pages];
      const newSection = createDefaultSection(state.globalStyleId, state.globalColorId);
      pages[pageIndex] = { ...pages[pageIndex], sections: [...pages[pageIndex].sections, newSection] };
      return { pages };
    });
  },

  removeSection: (pageIndex, sectionIndex) => {
    get().saveHistory();
    set((state) => {
      const pages = [...state.pages];
      if (pages[pageIndex].sections.length <= 1) return state;
      pages[pageIndex] = {
        ...pages[pageIndex],
        sections: pages[pageIndex].sections.filter((_, i) => i !== sectionIndex),
      };
      return { pages };
    });
  },

  setText: (text) => {
    get().saveHistory();
    set((state) => {
      const rawLines = text.split('\n');
      const limit = getLineLimit(state.globalSizeId, state.globalMargins);
      const charsPerLine = getCharsPerLine(state.globalSizeId, state.globalMargins);
      const pages: PageConfig[] = [];
      let currentLines: string[] = [];
      let currentVisualRows = 0;
      for (const line of rawLines) {
        const lineVisualRows = Math.max(1, Math.ceil(line.length / charsPerLine));
        if (currentVisualRows + lineVisualRows > limit && currentLines.length > 0) {
          const page = createDefaultPage(pages.length + 1, state.globalStyleId, state.globalColorId, state.globalSizeId, state.globalLayoutId, state.globalMargins);
          page.sections[0].content = currentLines.join('\n');
          pages.push(page);
          currentLines = [line];
          currentVisualRows = lineVisualRows;
        } else {
          currentLines.push(line);
          currentVisualRows += lineVisualRows;
        }
      }
      if (currentLines.length > 0 || pages.length === 0) {
        const page = createDefaultPage(pages.length + 1, state.globalStyleId, state.globalColorId, state.globalSizeId, state.globalLayoutId, state.globalMargins);
        page.sections[0].content = currentLines.join('\n');
        pages.push(page);
      }
      return { pages, currentPageIndex: 0 };
    });
  },

  rebalancePages: () => {
    get().saveHistory();
    set((state) => {
      const allText = state.pages.flatMap(p => p.sections.map(s => s.content)).join('\n');
      const rawLines = allText.split('\n');
      const limit = getLineLimit(state.globalSizeId, state.globalMargins);
      const charsPerLine = getCharsPerLine(state.globalSizeId, state.globalMargins);
      const newPages: PageConfig[] = [];
      let currentLines: string[] = [];
      let currentVisualRows = 0;
      for (const line of rawLines) {
        const lineVisualRows = Math.max(1, Math.ceil(line.length / charsPerLine));
        if (currentVisualRows + lineVisualRows > limit && currentLines.length > 0) {
          const page = createDefaultPage(newPages.length + 1, state.globalStyleId, state.globalColorId, state.globalSizeId, state.globalLayoutId, state.globalMargins);
          page.sections[0].content = currentLines.join('\n');
          newPages.push(page);
          currentLines = [line];
          currentVisualRows = lineVisualRows;
        } else {
          currentLines.push(line);
          currentVisualRows += lineVisualRows;
        }
      }
      if (currentLines.length > 0 || newPages.length === 0) {
        const page = createDefaultPage(newPages.length + 1, state.globalStyleId, state.globalColorId, state.globalSizeId, state.globalLayoutId, state.globalMargins);
        page.sections[0].content = currentLines.join('\n');
        newPages.push(page);
      }
      return { pages: newPages, currentPageIndex: 0 };
    });
  },

  persistActiveNote: () => {
    const { activeNoteId, pages, notes, globalSizeId } = get();
    if (!activeNoteId) return;
    const updatedNotes = notes.map(n => n.id === activeNoteId ? { ...n, pages, sizeId: globalSizeId, lastModified: Date.now() } : n);
    set({ notes: updatedNotes });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
  },

  createNote: (sizeId, title) => set((state) => {
    const newNote = {
      id: crypto.randomUUID(),
      title,
      sizeId,
      lastModified: Date.now(),
      pages: [createDefaultPage(1, state.globalStyleId, state.globalColorId, sizeId, state.globalLayoutId, state.globalMargins)]
    };
    const updatedNotes = [newNote, ...state.notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return {
      notes: updatedNotes,
      activeNoteId: newNote.id,
      pages: newNote.pages,
      globalSizeId: sizeId,
      currentPageIndex: 0,
      past: [],
      future: []
    };
  }),

  loadNote: (id) => set((state) => {
    const note = state.notes.find(n => n.id === id);
    if (!note) return state;
    return {
      activeNoteId: id,
      pages: note.pages,
      globalSizeId: note.sizeId,
      currentPageIndex: 0,
      past: [],
      future: []
    };
  }),

  deleteNote: (id) => set((state) => {
    const updatedNotes = state.notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return {
      notes: updatedNotes,
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      pages: state.activeNoteId === id ? [] : state.pages
    };
  }),

  renameNote: (id, title) => set((state) => {
    const updatedNotes = state.notes.map(n => n.id === id ? { ...n, title } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return { notes: updatedNotes };
  }),
}));
