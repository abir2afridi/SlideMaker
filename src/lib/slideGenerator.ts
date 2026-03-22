import { Slide, Block, BlockType, BlockContent } from '@/types/presentation';

const createBlock = (type: string, content: BlockContent): Block => ({
  id: `b${Math.random().toString(36).substr(2, 9)}`,
  type: type as BlockType,
  content
});

export function generatePitchDeck(topic: string): Slide[] {
  return [
    {
      id: 's1',
      layout: 'hero',
      title: topic,
      blocks: [
        createBlock('heading1', topic),
        createBlock('paragraph', 'Reimagining the future with intelligent solutions')
      ],
      speakerNotes: 'Open with a bold statement. Set the tone.',
      bgColor: 'from-primary to-secondary',
    },
    {
      id: 's2',
      layout: 'bullets',
      title: 'The Problem',
      blocks: [
        createBlock('heading2', 'What\'s broken today'),
        createBlock('bulletList', [
          'Current solutions are fragmented and slow',
          'Teams waste 40% of time on repetitive tasks',
          'No unified intelligent automation exists',
          'The gap between data and decisions is widening',
        ])
      ],
      speakerNotes: 'Paint the pain clearly. Use specific numbers.',
    },
    {
      id: 's3',
      layout: 'image-text',
      title: 'Our Solution',
      blocks: [
        createBlock('heading2', 'AI-powered intelligence that works'),
        createBlock('paragraph', 'One platform to automate, analyze, and accelerate every workflow.'),
        createBlock('paragraph', 'Built on cutting-edge large language models with enterprise-grade security.'),
      ],
      speakerNotes: 'This is your hero moment. Show the product vision.',
    },
    {
      id: 's4',
      layout: 'feature-grid',
      title: 'Key Features',
      blocks: [
        createBlock('heading2', 'Key Features'),
        createBlock('comparison', [
          { title: 'Smart Automation', description: 'Automate complex workflows with natural language', icon: 'Zap' },
          { title: 'Real-time Analytics', description: 'Instant insights from your data streams', icon: 'BarChart3' },
          { title: 'Team Collaboration', description: 'Work together seamlessly with AI assistance', icon: 'Users' },
          { title: 'Enterprise Security', description: 'SOC2 compliant with end-to-end encryption', icon: 'Shield' },
        ])
      ],
      speakerNotes: 'Walk through each feature briefly. 30 seconds each.',
    },
    {
      id: 's5',
      layout: 'stats',
      title: 'Market Opportunity',
      blocks: [
        createBlock('heading2', 'A massive and growing market'),
        createBlock('stat', [
          { label: 'Total Addressable Market', value: '$240B' },
          { label: 'Annual Growth Rate', value: '34%' },
          { label: 'Enterprise Adoption', value: '67%' },
          { label: 'Time Saved per User', value: '12hrs/wk' },
        ])
      ],
      speakerNotes: 'Let the numbers speak. Emphasize the TAM.',
    },
    {
      id: 's6',
      layout: 'bullets',
      title: 'Business Model',
      blocks: [
        createBlock('heading2', 'Proven SaaS economics'),
        createBlock('bulletList', [
          'Freemium model with self-serve onboarding',
          'Pro tier at $29/user/month',
          'Enterprise custom pricing with dedicated support',
          'Net revenue retention of 140%',
        ])
      ],
      speakerNotes: 'Show that the business model works and scales.',
    },
    {
      id: 's7',
      layout: 'timeline',
      title: 'Roadmap',
      blocks: [
        createBlock('heading2', 'Our journey ahead'),
        createBlock('timeline', [
          'Q1 2026 — Beta launch with 50 design partners',
          'Q2 2026 — Public launch and Series A',
          'Q3 2026 — Enterprise features and API',
          'Q4 2026 — International expansion',
        ])
      ],
      speakerNotes: 'Show clear milestones and timelines.',
    },
    {
      id: 's8',
      layout: 'team',
      title: 'Our Team',
      blocks: [
        createBlock('heading2', 'Built by experts who\'ve been there'),
        createBlock('comparison', [
          { title: 'Alex Chen', description: 'CEO — Ex-Google AI Lead', icon: 'User' },
          { title: 'Sarah Kim', description: 'CTO — Ex-Stripe Engineering', icon: 'User' },
          { title: 'James Wright', description: 'CPO — Ex-Figma Design', icon: 'User' },
          { title: 'Maria Lopez', description: 'VP Sales — Ex-Salesforce', icon: 'User' },
        ])
      ],
      speakerNotes: 'Highlight relevant experience. Build credibility.',
    },
    {
      id: 's9',
      layout: 'closing',
      title: 'Let\'s Build the Future',
      blocks: [
        createBlock('heading1', 'Let\'s Build the Future'),
        createBlock('paragraph', 'Raising $5M to scale our vision'),
        createBlock('paragraph', 'hello@company.com | www.company.com'),
      ],
      speakerNotes: 'End strong. Clear call to action.',
    },
  ];
}
