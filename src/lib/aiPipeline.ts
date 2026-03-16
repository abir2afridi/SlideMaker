import { Slide, Block, BlockType, SlideLayout } from '@/types/presentation';
import { supabase } from '@/integrations/supabase/client';

export interface GenerateOptions {
  prompt: string;
  type?: string;
  count?: number;
}

export async function generatePresentationAI({ prompt, type = 'pitch-deck', count = 10 }: GenerateOptions) {
  // Use Supabase Edge Function for the heavy lifting
  // The edge function will implement the multi-stage pipeline:
  // 1. Analyze prompt (intent, tone)
  // 2. Structure narrative (introduction -> problem -> solution -> ...)
  // 3. Generate content per slide (blocks)
  // 4. Assign layouts
  
  const { data, error } = await supabase.functions.invoke('generate-slides', {
    body: { prompt, type, count }
  });

  if (error) throw error;
  return data;
}

/**
 * Stage 1: Analyze Intent
 */
async function analyzeIntent(prompt: string) {
  // This would be an LLM call to classify the prompt
  // For now, we assume standard pitch deck or report
  return {
    type: 'pitch-deck',
    tone: 'professional',
    audience: 'investors'
  };
}

/**
 * Stage 2: Narrative Generation
 */
function getNarrativeStructure(type: string) {
  const structures: Record<string, SlideLayout[]> = {
    'pitch-deck': [
      'hero', 'bullets', 'image-text', 'feature-grid', 
      'stats', 'bullets', 'timeline', 'team', 'closing'
    ],
    'report': [
      'hero', 'bullets', 'stats', 'image-text', 'bullets', 'closing'
    ]
  };
  return structures[type] || structures['pitch-deck'];
}
