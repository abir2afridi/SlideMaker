import { Presentation, Template, PresentationTheme } from '@/types/presentation';

const defaultTheme: PresentationTheme = {
  name: 'Default',
  primaryColor: '#4F46E5',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontHeading: 'Inter',
  fontBody: 'Lora',
  style: 'modern',
  borderRadius: '0.75rem'
};

export const mockPresentations: Presentation[] = [
  {
    id: 'd198d000-0000-0000-0000-000000000001',
    title: 'AI Productivity Tool Pitch',
    description: 'Startup pitch deck for an AI-powered productivity platform',
    createdAt: '2026-03-10',
    updatedAt: '2026-03-12',
    theme: defaultTheme,
    slides: [],
    status: 'draft',
    userId: 'user1',
    isPublic: false
  },
  {
    id: 'd198d000-0000-0000-0000-000000000002',
    title: 'Q1 Marketing Report',
    description: 'Quarterly marketing performance and analytics overview',
    createdAt: '2026-03-08',
    updatedAt: '2026-03-11',
    theme: { ...defaultTheme, style: 'minimal' },
    slides: [],
    status: 'draft',
    userId: 'user1',
    isPublic: false
  },
  {
    id: 'd198d000-0000-0000-0000-000000000003',
    title: 'Product Launch Deck',
    description: 'New feature announcement and product roadmap presentation',
    createdAt: '2026-03-05',
    updatedAt: '2026-03-09',
    theme: { ...defaultTheme, style: 'bold' },
    slides: [],
    status: 'draft',
    userId: 'user1',
    isPublic: false
  },
];

export const mockTemplates: Template[] = [
  { id: 't1', title: 'Startup Pitch Deck', description: 'Classic pitch deck structure for fundraising', category: 'pitch-deck', thumbnail: '', slideCount: 12, isPremium: false },
  { id: 't2', title: 'Marketing Report', description: 'Data-driven marketing performance overview', category: 'report', thumbnail: '', slideCount: 10, isPremium: false },
  { id: 't3', title: 'Product Launch', description: 'Announce new products with impact', category: 'marketing', thumbnail: '', slideCount: 8, isPremium: false },
  { id: 't4', title: 'Business Plan', description: 'Comprehensive business strategy document', category: 'business', thumbnail: '', slideCount: 15, isPremium: false },
  { id: 't5', title: 'Team Introduction', description: 'Showcase your team and culture', category: 'business', thumbnail: '', slideCount: 6, isPremium: false },
  { id: 't6', title: 'Portfolio Showcase', description: 'Present your best work beautifully', category: 'portfolio', thumbnail: '', slideCount: 8, isPremium: false },
];

export const templateCategories = ['All', 'Pitch Decks', 'Reports', 'Product', 'Business', 'Team', 'Portfolio', 'Education'];
