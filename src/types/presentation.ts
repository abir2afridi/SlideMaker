export type BlockType = 
  | 'heading1' | 'heading2' | 'heading3' 
  | 'paragraph' | 'bulletList' | 'orderedList' 
  | 'image' | 'video' | 'chart' | 'table' | 'quote' 
  | 'button' | 'code' | 'callout' | 'divider'
  | 'stat' | 'comparison' | 'timeline' | 'feature-grid';

export type BlockContent = 
  | string 
  | string[] 
  | Array<{ label: string; value: string }>
  | Array<{ title: string; description: string; icon: string }>
  | Record<string, unknown>;

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  metadata?: Record<string, unknown>;
}

export type SlideLayout = 
  | 'hero' | 'bullets' | 'image-text' | 'feature-grid' 
  | 'stats' | 'comparison' | 'timeline' | 'team' 
  | 'closing' | 'blank' | 'split-vertical' | 'split-horizontal';

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  blocks: Block[];
  speakerNotes?: string;
  bgColor?: string;
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface PresenceUser {
  user_id: string;
  email: string;
  online_at: string;
}

export interface PresentationTheme extends Record<string, string | undefined> {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
  style: 'modern' | 'minimal' | 'bold' | 'elegant' | 'glass';
  borderRadius: string;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
  theme: PresentationTheme;
  status: 'draft' | 'published' | 'shared';
  userId: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  views?: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: 'pitch-deck' | 'marketing' | 'business' | 'education' | 'portfolio' | 'report';
  thumbnail: string;
  slideCount: number;
  isPremium: boolean;
}
