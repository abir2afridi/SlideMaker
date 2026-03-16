import { supabase } from '@/integrations/supabase/client';
import { Slide, Block, PresenceUser, PresentationTheme } from '@/types/presentation';

export async function generateSlidesFromAI(prompt: string, type: string = 'pitch-deck', mode: string = 'full', currentContent?: Block[] | string) {
  const { data, error } = await supabase.functions.invoke('generate-slides', {
    body: { prompt, type, mode, currentContent },
  });

  if (error) throw new Error(error.message || 'Failed to generate slides');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function rewriteSlideAI(blocks: Block[]): Promise<Block[]> {
  const result = await generateSlidesFromAI('', '', 'rewrite', blocks);
  return result as Block[];
}

export async function narrateSlideAI(blocks: Block[]): Promise<{ script: string }> {
  const result = await generateSlidesFromAI('', '', 'narrate', blocks);
  return result as { script: string };
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
      .update({ title, description, slides: JSON.parse(JSON.stringify(slides)), theme, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('presentations')
    .insert({ title, description, slides: JSON.parse(JSON.stringify(slides)), theme, user_id: user.id })
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
