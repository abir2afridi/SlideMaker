import { supabase } from '@/integrations/supabase/client';
import { Slide, Block, PresenceUser, PresentationTheme, BlockContent } from '@/types/presentation';
import { getCustomKey, isUsingCustomKey } from './handwriting/aiHelper';

function toId(prefix: string, idx: number) {
  return `${prefix}-${idx}-${Date.now()}`;
}

interface RawSlide {
  id?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  bullets?: string[];
  image_url?: string | null;
  speaker_notes?: string;
  visual_prompt?: string;
}

function normalizeToAppSlides(rawSlides: RawSlide[], fallbackTitle: string): Slide[] {
  if (!Array.isArray(rawSlides)) return [];

  return rawSlides.map((s, idx) => {
    const heading = s?.heading || '';
    const subheading = s?.subheading || '';
    const description = s?.description || '';
    const bullets = Array.isArray(s?.bullets) ? s.bullets.filter((b): b is string => typeof b === 'string') : [];
    const imageUrl = s?.image_url || null;

    const blocks: Block[] = [];
    
    // Add heading
    blocks.push({ 
      id: toId('b-h1', idx), 
      type: 'heading1', 
      content: heading || (idx === 0 ? fallbackTitle : `Slide ${idx + 1}`) 
    });

    // Add subheading / description
    if (subheading || description) {
      blocks.push({ 
        id: toId('b-p', idx), 
        type: 'paragraph', 
        content: description || subheading 
      });
    }

    // Add bullets
    if (bullets.length) {
      blocks.push({ 
        id: toId('b-bl', idx), 
        type: 'bulletList', 
        content: bullets 
      });
    }

    if (!blocks.length) {
      blocks.push({ id: toId('b-empty', idx), type: 'paragraph', content: 'No content' });
    }

    const slideId = typeof s?.id === 'string' && s.id.trim() ? s.id : toId('s', idx);

    // Initial layout selection
    let layout: Slide['layout'] = 'bullets';
    if (idx === 0) {
      layout = 'hero';
    } else if (imageUrl) {
      layout = 'image-text';
    }

    return {
      id: slideId,
      layout,
      title: heading || fallbackTitle || 'Untitled',
      blocks,
      speakerNotes: typeof s?.speaker_notes === 'string' ? s.speaker_notes : undefined,
      visual_prompt: typeof s?.visual_prompt === 'string' ? s.visual_prompt : undefined,
      image_url: imageUrl,
    };
  });
}

export async function generateSlidesFromAI(
  topic: string,
  language: string = "English",
  slideCount: number = 8
) {
  const apiKey = isUsingCustomKey() ? getCustomKey() : null;

  const { data, error } = await supabase.functions.invoke(
    "generate-slides",
    {
      body: {
        topic,
        language,
        slide_count: slideCount,
        api_key: apiKey,
      },
    }
  );

  if (error) {
    console.error("Supabase Invoke Error:", error);
    throw new Error(error.message || "Generation failed");
  }

  if (!data?.success) {
    console.error("AI Function Error:", data);
    const detailMsg = data?.details ? `: ${data.details}` : '';
    throw new Error(`${data?.error || "Invalid response"}${detailMsg}`);
  }

  if (data.slides) {
    data.slides = normalizeToAppSlides(data.slides, data.presentation_title || topic);
  }

  return data;
}

export async function regenerateSelectedText(
  selectedText: string,
  textType: "bullet" | "heading" | "description",
  slideHeading: string,
  slideContext: string,
  instruction: string = "improve and make more informative"
) {
  const { data, error } = await supabase.functions.invoke(
    "regenerate-text",
    {
      body: {
        mode: "selection",
        selected_text: selectedText,
        text_type: textType,
        slide_heading: slideHeading,
        slide_context: slideContext,
        instruction,
      },
    }
  );

  if (error) throw new Error(error.message || "Regeneration failed");
  if (!data?.improved_text) throw new Error("No improved text returned");
  return data.improved_text;
}

export async function regenerateWholeSlide(
  slideHeading: string,
  slideContext: string,
  instruction: string = "expand and improve"
) {
  const { data, error } = await supabase.functions.invoke(
    "regenerate-text",
    {
      body: {
        mode: "whole_slide",
        slide_heading: slideHeading,
        slide_context: slideContext,
        instruction,
      },
    }
  );

  if (error) throw new Error(error.message || "Regeneration failed");
  if (!data?.slide_data) throw new Error("No slide data returned");
  return data.slide_data;
}

export async function publishPresentation(id: string, isPublic: boolean) {
  const token = isPublic ? Math.random().toString(36).substring(2, 15) : null;
  const { data, error } = await supabase
    .from('presentations')
    .update({ 
      is_public: isPublic, 
      share_token: token,
      status: isPublic ? 'published' : 'draft'
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function savePresentation(
  title: string,
  description: string,
  slides: Slide[],
  theme: PresentationTheme,
  id?: string,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (id) {
    const { data, error } = await supabase
      .from('presentations')
      .update({ 
        title, 
        description, 
        slides: JSON.parse(JSON.stringify(slides)), 
        theme, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('presentations')
    .insert({ 
      title, 
      description, 
      slides: JSON.parse(JSON.stringify(slides)), 
      theme, 
      user_id: user.id 
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadPresentation(id: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function loadUserPresentations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deletePresentation(id: string) {
  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export function subscribeToPresentation(id: string, onUpdate: (data: { title: string; slides: Slide[] }) => void) {
  return supabase
    .channel(`presentation:${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'presentations', filter: `id=eq.${id}` },
      (payload) => {
        const newData = payload.new as { title: string; slides: Slide[] };
        onUpdate(newData);
      }
    )
    .subscribe();
}

export function subscribeToPresence(id: string, onSync: (users: PresenceUser[]) => void) {
  const channel = supabase.channel(`presence:${id}`, {
    config: { presence: { key: id } }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as unknown as PresenceUser[];
      onSync(users);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser();
        await channel.track({
          user_id: user?.id || 'anonymous',
          email: user?.email || 'Anonymous guest',
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

export async function loadPresentationByToken(token: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();
  if (error) throw error;
  return data;
}
