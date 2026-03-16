import { motion } from 'framer-motion';
import { MoreHorizontal, Clock, Layers } from 'lucide-react';
import { Presentation } from '@/types/presentation';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';
import { deletePresentation } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardProps {
  presentation: Presentation;
  index: number;
}

const styleColors: Record<string, string> = {
  modern: 'from-primary to-secondary',
  minimal: 'from-muted-foreground/30 to-muted-foreground/10',
  bold: 'from-accent to-success',
  elegant: 'from-primary/80 to-accent/60',
};

export default function ProjectCard({ presentation, index }: ProjectCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const gradient = styleColors[presentation.theme.style] || styleColors.modern;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.05 }}
      onClick={() => navigate(`/editor/${presentation.id}`)}
      className="group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-150"
    >
      {/* Thumbnail */}
      <div className={`aspect-[16/10] rounded-t-xl bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 w-3/4">
            <div className="h-2 w-2/3 bg-background/40 rounded mb-2" />
            <div className="h-1.5 w-full bg-background/20 rounded mb-1" />
            <div className="h-1.5 w-4/5 bg-background/20 rounded" />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-background/20 backdrop-blur text-primary-foreground transition-opacity duration-150"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={async (e) => { 
                e.stopPropagation();
                try {
                  await deletePresentation(presentation.id);
                  toast({ title: 'Deleted', description: 'Presentation removed.' });
                  window.location.reload(); // Simple refresh for dashboard update
                } catch (err) {
                  toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Presentation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground truncate">{presentation.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">{presentation.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {presentation.updatedAt}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {presentation.slides.length || 9} slides
          </span>
        </div>
      </div>
    </motion.div>
  );
}
