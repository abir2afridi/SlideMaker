import { Palette, LayoutTemplate, Eye, Download, Sparkles, PenTool, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type WizardTab = 'editor' | 'styles' | 'layout' | 'preview' | 'export';

interface WizardToolsProps {
  activeTab: WizardTab;
  onTabChange: (tab: WizardTab) => void;
  completedTabs: WizardTab[];
}

export const WizardTools = ({ activeTab, onTabChange, completedTabs }: WizardToolsProps) => {
  const tools = [
    { id: 'editor' as const, icon: PenTool, label: 'Editor', color: 'text-purple-500', bg: 'bg-purple-500/10', step: 1 },
    { id: 'styles' as const, icon: Palette, label: 'Styles', color: 'text-pink-500', bg: 'bg-pink-500/10', step: 2 },
    { id: 'layout' as const, icon: LayoutTemplate, label: 'Layout', color: 'text-blue-500', bg: 'bg-blue-500/10', step: 3 },
    { id: 'preview' as const, icon: Eye, label: 'Preview', color: 'text-indigo-500', bg: 'bg-indigo-500/10', step: 4 },
    { id: 'export' as const, icon: Download, label: 'Export', color: 'text-green-500', bg: 'bg-green-500/10', step: 5 },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm mb-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Wizard Workflow</h3>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {tools.map((tool) => {
          const isActive = activeTab === tool.id;
          const isFinished = completedTabs.includes(tool.id) && !isActive;

          return (
            <button
              key={tool.id}
              onClick={() => onTabChange(tool.id)}
              className={cn(
                "group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all text-center",
                isActive 
                  ? "bg-primary/[0.03] ring-1 ring-primary/20" 
                  : "hover:bg-muted/50"
              )}
            >
              {isFinished && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 fill-green-500/10" />
                </div>
              )}
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                tool.bg,
                isActive ? "scale-105" : "opacity-80 group-hover:opacity-100"
              )}>
                <tool.icon className={cn("h-5 w-5", tool.color)} />
              </div>
              
              <span className={cn(
                "text-[10px] font-semibold transition-colors block",
                isActive ? "text-primary px-1" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {tool.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
};
