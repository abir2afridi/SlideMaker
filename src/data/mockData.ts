import { Presentation, Template } from '@/types/presentation';

export const mockPresentations: Presentation[] = [
  {
    id: '1',
    title: 'AI Productivity Tool Pitch',
    description: 'Startup pitch deck for an AI-powered productivity platform',
    createdAt: '2026-03-10',
    updatedAt: '2026-03-12',
    theme: { primaryColor: '#4F46E5', accentColor: '#10B981', fontHeading: 'Inter', fontBody: 'Lora', style: 'modern' },
    slides: [],
  },
  {
    id: '2',
    title: 'Q1 Marketing Report',
    description: 'Quarterly marketing performance and analytics overview',
    createdAt: '2026-03-08',
    updatedAt: '2026-03-11',
    theme: { primaryColor: '#4F46E5', accentColor: '#10B981', fontHeading: 'Inter', fontBody: 'Lora', style: 'minimal' },
    slides: [],
  },
  {
    id: '3',
    title: 'Product Launch Deck',
    description: 'New feature announcement and product roadmap presentation',
    createdAt: '2026-03-05',
    updatedAt: '2026-03-09',
    theme: { primaryColor: '#4F46E5', accentColor: '#10B981', fontHeading: 'Inter', fontBody: 'Lora', style: 'bold' },
    slides: [],
  },
];

export const mockTemplates: Template[] = [
  { id: 't1', title: 'Startup Pitch Deck', description: 'Classic pitch deck structure for fundraising', category: 'Pitch Decks', thumbnail: '', slideCount: 12 },
  { id: 't2', title: 'Marketing Report', description: 'Data-driven marketing performance overview', category: 'Reports', thumbnail: '', slideCount: 10 },
  { id: 't3', title: 'Product Launch', description: 'Announce new products with impact', category: 'Product', thumbnail: '', slideCount: 8 },
  { id: 't4', title: 'Business Plan', description: 'Comprehensive business strategy document', category: 'Business', thumbnail: '', slideCount: 15 },
  { id: 't5', title: 'Team Introduction', description: 'Showcase your team and culture', category: 'Team', thumbnail: '', slideCount: 6 },
  { id: 't6', title: 'Portfolio Showcase', description: 'Present your best work beautifully', category: 'Portfolio', thumbnail: '', slideCount: 8 },
];

export const templateCategories = ['All', 'Pitch Decks', 'Reports', 'Product', 'Business', 'Team', 'Portfolio', 'Education'];
