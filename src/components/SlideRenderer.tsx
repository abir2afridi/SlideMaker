import React from 'react';
import { Slide, Block, BlockContent, PresentationTheme } from '@/types/presentation';
import { Zap, BarChart3, Users, Shield, User, MessageSquare, Check, ArrowRight, Play, Layout, Info, AlertTriangle, Code, Terminal, Table as TableIcon, Video, AlertCircle } from 'lucide-react';
import BlockEditor from './BlockEditor';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, BarChart3, Users, Shield, User, MessageSquare, Check, ArrowRight, Play, Layout, Info, AlertTriangle, Code, Terminal, TableIcon, Video, AlertCircle
};

interface SlideRendererProps {
  slide: Slide;
  theme?: PresentationTheme;
  mode?: 'view' | 'edit';
  onUpdateBlock?: (blockId: string, content: BlockContent) => void;
}

interface StatItem {
  label: string;
  value: string;
}

interface ComparisonItem {
  title: string;
  description: string;
  icon: string;
}

interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
}

interface CalloutContent {
  text: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface TableContent {
  headers: string[];
  rows: string[][];
}

interface SemanticSlide extends Slide {
  subtitle?: string;
  stats?: StatItem[];
  features?: ComparisonItem[];
  content?: string[];
}

export default function SlideRenderer({ slide, theme, mode = 'view', onUpdateBlock }: SlideRendererProps) {
  if (!slide) return null;

  // Default theme if none provided
  const t = theme || {
    primaryColor: '#4F46E5',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    style: 'modern',
    borderRadius: '0.75rem'
  };

  const normalizedBlocks = (() => {
    let blocks: Block[] = [];
    
    if (slide.blocks && Array.isArray(slide.blocks)) {
      blocks = [...slide.blocks];
    }
    
    const s = slide as SemanticSlide;
    const hasHeading = blocks.length > 0 && blocks.some(b => b && ['heading1', 'heading2', 'heading3'].includes(b.type));
    if (!hasHeading && s.title) {
      blocks.unshift({ id: `title-${slide.id}`, type: 'heading1', content: s.title });
    }

    if (blocks.length <= 1) {
      if (s.subtitle && !blocks.some(b => b.type === 'heading2')) {
        blocks.push({ id: `sub-${slide.id}`, type: 'heading2', content: s.subtitle });
      }
      if (s.stats && Array.isArray(s.stats) && !blocks.some(b => b.type === 'stat')) {
        blocks.push({ id: `stats-${slide.id}`, type: 'stat', content: s.stats });
      }
      if (s.features && Array.isArray(s.features) && !blocks.some(b => b.type === 'comparison')) {
        blocks.push({ id: `features-${slide.id}`, type: 'comparison', content: s.features });
      }
    }

    if (blocks.length === 0) {
      blocks.push({ id: `empty-${slide.id}`, type: 'heading1', content: s.title || 'Untitled Slide' });
      blocks.push({ id: `para-${slide.id}`, type: 'paragraph', content: 'Add some content to this slide.' });
    }

    return blocks;
  })();

  const slideStyle: React.CSSProperties = {
    backgroundColor: t.backgroundColor,
    color: t.textColor,
    fontFamily: t.fontBody,
    borderRadius: t.borderRadius,
  };

  const renderBlocks = () => {
    return normalizedBlocks.map((block) => {
      if (!block) return null;
      const isEditable = mode === 'edit' && onUpdateBlock;

      switch (block.type) {
        case 'heading1': {
          const isHero = ['hero', 'closing'].includes(slide.layout);
          const alignment = isHero ? 'text-center' : 'text-left';
          return isEditable ? (
            <div key={block.id} className={`mb-8 w-full ${alignment}`}>
              <BlockEditor 
                content={block.content as string || ''} 
                onChange={(content) => onUpdateBlock(block.id, content)}
                className="text-7xl font-bold leading-tight"
                style={{ fontFamily: t.fontHeading, color: isHero ? '#FFFFFF' : t.primaryColor }}
              />
            </div>
          ) : (
            <h1 
              key={block.id} 
              className={`text-7xl font-bold mb-8 leading-tight w-full ${alignment}`} 
              style={{ fontFamily: t.fontHeading, color: isHero ? '#FFFFFF' : t.primaryColor }}
              dangerouslySetInnerHTML={{ __html: block.content as string || '' }} 
            />
          );
        }
        case 'heading2': {
          return isEditable ? (
            <div key={block.id} className="mb-6 w-full text-left">
              <BlockEditor 
                content={block.content as string || ''} 
                onChange={(content) => onUpdateBlock(block.id, content)}
                className="text-5xl font-bold"
                style={{ fontFamily: t.fontHeading, color: t.textColor }}
              />
            </div>
          ) : (
            <h2 
              key={block.id} 
              className="text-5xl font-bold mb-6 text-left" 
              style={{ fontFamily: t.fontHeading, color: t.textColor }}
              dangerouslySetInnerHTML={{ __html: block.content as string || '' }} 
            />
          );
        }
        case 'paragraph': {
          return isEditable ? (
            <div key={block.id} className="mb-6 w-full text-left">
              <BlockEditor 
                content={block.content as string || ''} 
                onChange={(content) => onUpdateBlock(block.id, content)}
                className="text-2xl leading-relaxed opacity-90"
                style={{ color: t.textColor }}
              />
            </div>
          ) : (
            <p 
              key={block.id} 
              className="text-2xl mb-6 leading-relaxed text-left opacity-90" 
              style={{ color: t.textColor }}
              dangerouslySetInnerHTML={{ __html: block.content as string || '' }} 
            />
          );
        }
        case 'bulletList': {
          const items = (block.content as string[]) || [];
          return (
            <ul key={block.id} className="space-y-6 my-8">
              {items.map((item, i) => (
                <li key={`${block.id}-${i}-${item}`} className="flex items-start gap-5">
                  <div className="w-3 h-3 rounded-full shrink-0 mt-3.5" style={{ backgroundColor: t.primaryColor }} />
                  {isEditable ? (
                    <BlockEditor 
                      content={item || ''} 
                      onChange={(val) => {
                        const newList = [...items];
                        newList[i] = val;
                        onUpdateBlock(block.id, newList as BlockContent);
                      }}
                      className="text-2xl font-medium flex-1 text-left"
                      style={{ color: t.textColor }}
                    />
                  ) : (
                    <div className="text-2xl font-medium flex-1 text-left" style={{ color: t.textColor }} dangerouslySetInnerHTML={{ __html: item || '' }} />
                  )}
                </li>
              ))}
            </ul>
          );
        }
        case 'stat': {
          const stats = (block.content as unknown as StatItem[]) || [];
          return (
            <div key={block.id} className="grid grid-cols-2 md:grid-cols-4 gap-8 my-10 w-full">
              {stats.map((stat, i) => (
                <div key={`${block.id}-${stat?.label || 'stat'}-${i}`} className="text-center p-8 rounded-3xl border border-white/10 shadow-lg backdrop-blur-sm" style={{ backgroundColor: `${t.primaryColor}08` }}>
                  {isEditable ? (
                    <>
                      <BlockEditor 
                        content={stat.value || ''} 
                        onChange={(val) => {
                          const newStats = [...stats];
                          newStats[i] = { ...newStats[i], value: val };
                          onUpdateBlock(block.id, newStats as BlockContent);
                        }}
                        className="text-5xl font-bold mb-2"
                        style={{ color: t.primaryColor, fontFamily: t.fontHeading }}
                      />
                      <BlockEditor 
                        content={stat.label || ''} 
                        onChange={(val) => {
                          const newStats = [...stats];
                          newStats[i] = { ...newStats[i], label: val };
                          onUpdateBlock(block.id, newStats as BlockContent);
                        }}
                        className="text-sm uppercase tracking-widest opacity-60"
                        style={{ color: t.textColor }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-5xl font-bold mb-2" style={{ color: t.primaryColor, fontFamily: t.fontHeading }} dangerouslySetInnerHTML={{ __html: stat.value || '' }} />
                      <div className="text-sm uppercase tracking-widest opacity-60 font-bold" style={{ color: t.textColor }} dangerouslySetInnerHTML={{ __html: stat.label || '' }} />
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        }
        case 'comparison': {
          const compareItems = (block.content as unknown as ComparisonItem[]) || [];
          return (
            <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 w-full">
              {compareItems.map((item, i) => {
                const Icon = iconMap[item.icon] || Zap;
                return (
                  <div key={`${block.id}-${item?.title || 'item'}-${i}`} className="flex gap-6 p-8 rounded-3xl border border-white/10 shadow-xl text-left bg-white/5 backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: `${t.primaryColor}20`, color: t.primaryColor }}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      {isEditable ? (
                        <>
                          <BlockEditor 
                            content={item.title || ''} 
                            onChange={(val) => {
                              const newItems = [...compareItems];
                              newItems[i] = { ...newItems[i], title: val };
                              onUpdateBlock(block.id, newItems as BlockContent);
                            }}
                            className="text-2xl font-bold mb-2"
                            style={{ color: t.textColor, fontFamily: t.fontHeading }}
                          />
                          <BlockEditor 
                            content={item.description || ''} 
                            onChange={(val) => {
                              const newItems = [...compareItems];
                              newItems[i] = { ...newItems[i], description: val };
                              onUpdateBlock(block.id, newItems as BlockContent);
                            }}
                            className="text-lg leading-relaxed opacity-70"
                            style={{ color: t.textColor }}
                          />
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold mb-2" style={{ color: t.textColor, fontFamily: t.fontHeading }} dangerouslySetInnerHTML={{ __html: item.title || '' }} />
                          <p className="text-lg leading-relaxed opacity-70" style={{ color: t.textColor }} dangerouslySetInnerHTML={{ __html: item.description || '' }} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        case 'image': {
          const content = typeof block.content === 'string' ? block.content : '';
          return (
            <div key={block.id} className="relative rounded-3xl overflow-hidden my-10 group shadow-2xl border-4 border-white/10">
              {content && content.startsWith('data:image') ? (
                <img 
                  src={content} 
                  alt="Slide content"
                  className="w-full h-auto object-cover max-h-[600px]"
                  loading="lazy"
                />
              ) : content ? (
                <img 
                  src={content} 
                  alt="Slide content"
                  className="w-full h-auto object-cover max-h-[600px]"
                  loading="lazy"
                  onError={(e) => {
                    // If image fails to load, show gradient fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
                      parent.innerHTML = '<div class="w-full h-[400px] flex items-center justify-center text-white/60 text-lg">Image unavailable</div>';
                    }
                  }}
                />
              ) : (
                <div 
                  className="w-full h-[400px] flex items-center justify-center text-white/60 text-lg"
                  style={{
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
                  }}
                >
                  No image available
                </div>
              )}
              {isEditable && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-white w-[90%]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-60">Image URL</p>
                    <BlockEditor 
                      content={content} 
                      onChange={(val) => onUpdateBlock(block.id, val as BlockContent)}
                      className="bg-transparent border-none text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }
        case 'timeline': {
          const timelineItems = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={block.id} className="relative py-10 w-full">
              <div className="absolute left-[27px] top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent rounded-full" />
              <div className="space-y-12">
                {timelineItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-10 group relative">
                    <div 
                      className="w-14 h-14 rounded-2xl shrink-0 shadow-xl border-4 border-white flex items-center justify-center transition-transform group-hover:scale-110" 
                      style={{ backgroundColor: t.primaryColor, color: '#FFFFFF' }}
                    >
                      <span className="text-xl font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 shadow-lg">
                      {isEditable ? (
                        <BlockEditor 
                          content={item as string || ''} 
                          onChange={(val) => {
                            const newTimeline = [...(timelineItems as string[])];
                            newTimeline[i] = val;
                            onUpdateBlock(block.id, newTimeline as BlockContent);
                          }}
                          className="text-2xl font-bold"
                          style={{ color: t.textColor, fontFamily: t.fontHeading }}
                        />
                      ) : (
                        <span className="text-2xl font-bold" style={{ color: t.textColor, fontFamily: t.fontHeading }} dangerouslySetInnerHTML={{ __html: item as string || '' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        case 'feature-grid': {
          const items = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={block.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 w-full">
              {items.map((item: unknown, i) => {
                const feature = item as { title?: string; description?: string; icon?: string };
                const IconComp = feature.icon && iconMap[feature.icon] ? iconMap[feature.icon] : Zap;
                return (
                  <div key={i} className="flex flex-col p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shrink-0" style={{ backgroundColor: `${t.primaryColor}20`, color: t.primaryColor }}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-bold mb-3 tracking-tight" style={{ color: t.textColor }}>{feature.title || String(item)}</h4>
                    <p className="text-sm opacity-80 leading-relaxed font-medium" style={{ color: t.textColor }}>{feature.description || 'Professional detail and analytical breakdown of this specific point.'}</p>
                  </div>
                );
              })}
            </div>
          );
        }
        default:
          return null;
      }
    }).filter(Boolean);
  };

  const renderedBlocks = renderBlocks();

  const getLayoutContent = () => {
    switch (slide.layout) {
      case 'hero': {
        const imageBlock = normalizedBlocks.find(b => b.type === 'image');
        const textBlocks = normalizedBlocks.filter(b => b.type !== 'image');
        const bgImg = imageBlock?.content as string || '';
        
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-32 text-center relative overflow-hidden">
            <div className="absolute inset-0 z-0">
               {bgImg ? (
                 <img 
                   src={bgImg} 
                   className="w-full h-full object-cover" 
                   alt="Hero background"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     const parent = target.parentElement;
                     if (parent) {
                       parent.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
                     }
                   }}
                 />
               ) : (
                 <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }} className="w-full h-full" />
               )}
               <div className="absolute inset-0 bg-slate-950/70" />
            </div>
            <div className="z-10 relative flex flex-col items-center max-w-6xl">
              {textBlocks.map(block => {
                if (!Array.isArray(renderedBlocks)) return null;
                return renderedBlocks.find((v) => React.isValidElement(v) && v.key === block.id);
              })}
            </div>
          </div>
        );
      }

      case 'image-text': {
        const imageBlock = normalizedBlocks.find(b => b.type === 'image');
        const otherBlocks = normalizedBlocks.filter(b => b.type !== 'image');
        const img = imageBlock?.content as string || '';
        
        return (
          <div className="w-full h-full flex">
            <div className="flex-1 flex flex-col justify-center px-24 py-32 relative z-10" style={{ backgroundColor: t.backgroundColor }}>
               <div className="w-full max-w-2xl mx-auto flex flex-col items-start text-left">
                 {otherBlocks.map(block => {
                   if (!Array.isArray(renderedBlocks)) return null;
                   return renderedBlocks.find((v) => React.isValidElement(v) && v.key === block.id);
                 })}
               </div>
            </div>
            <div className="flex-1 relative overflow-hidden shadow-2xl skew-x-[-2deg] translate-x-10">
              {img ? (
                <img 
                  src={img} 
                  className="w-full h-full object-cover skew-x-[2deg]" 
                  alt="Slide visual"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
                    }
                  }}
                />
              ) : (
                <div 
                  className="w-full h-full skew-x-[2deg]" 
                  style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
                />
              )}
              <div className="absolute inset-0 ring-inset ring-1 ring-white/10" />
            </div>
          </div>
        );
      }

      case 'bullets':
      case 'timeline':
        return (
          <div className="w-full h-full flex flex-col justify-center px-24 md:px-40 py-32 relative" style={{ backgroundColor: t.backgroundColor }}>
            <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col">
              {renderedBlocks}
            </div>
          </div>
        );

      case 'feature-grid':
        return (
          <div className="w-full h-full flex flex-col justify-center px-24 py-32 relative overflow-hidden" style={{ backgroundColor: t.backgroundColor }}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="w-full max-w-7xl mx-auto relative z-10">
              {renderedBlocks}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="w-full h-full flex flex-col justify-center px-24 py-32 relative" style={{ backgroundColor: t.backgroundColor }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
            <div className="w-full max-w-7xl mx-auto relative z-10 grid gap-12">
              {renderedBlocks}
            </div>
          </div>
        );

      case 'closing':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-32 text-center relative" style={{ backgroundColor: t.backgroundColor }}>
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center relative z-10">
              {renderedBlocks}
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center p-32" style={{ backgroundColor: t.backgroundColor }}>
            <div className="flex flex-col items-center text-center w-full max-w-5xl">
               {renderedBlocks}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full select-none" style={slideStyle}>
      {getLayoutContent()}
    </div>
  );
}

