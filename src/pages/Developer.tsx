import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Zap, Star, GitFork, Database, Users, Activity, Calendar, MapPin, Link as LinkIcon, Twitter, Mail, Terminal, Code2, BookOpen, Cpu } from 'lucide-react';
import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';

const GITHUB_USERNAME = 'abir2afridi';

interface GitHubUser {
  login: string; avatar_url: string; bio: string; html_url: string;
  public_repos: number; followers: number; following: number;
  location: string; blog: string; twitter_username: string; email: string; name: string;
  public_gists: number; created_at: string;
}

interface GitHubRepo {
  id: number; name: string; description: string; html_url: string;
  stargazers_count: number; forks_count: number; language: string;
  updated_at: string; topics: string[];
}

interface GitHubEvent {
  id: string; type: string; repo: { name: string };
  created_at: string; payload: { action?: string; ref?: string; ref_type?: string; commits?: { message: string }[] };
}

const FALLBACK_USER: GitHubUser = {
  login: 'abir2afridi', name: 'Abir Hasan Siam', avatar_url: '',
  bio: 'Full-stack developer crafting digital experiences with React, TypeScript & AI. Building the future one commit at a time.',
  html_url: 'https://github.com/abir2afridi', public_repos: 28, followers: 15, following: 22,
  location: 'Bangladesh', blog: '', twitter_username: '', email: '', public_gists: 3,
  created_at: '2021-01-15T00:00:00Z',
};

const FALLBACK_REPOS: GitHubRepo[] = [
  { id: 1, name: 'react-core-kit', description: 'Production-grade React component library with advanced state management patterns', html_url: '', stargazers_count: 47, forks_count: 12, language: 'TypeScript', updated_at: new Date().toISOString(), topics: ['react', 'typescript', 'library'] },
  { id: 2, name: 'neural-pipeline', description: 'AI-powered data processing pipeline with real-time inference capabilities', html_url: '', stargazers_count: 34, forks_count: 8, language: 'Python', updated_at: new Date().toISOString(), topics: ['ai', 'pipeline', 'machine-learning'] },
  { id: 3, name: 'flutter-dashboard', description: 'Cross-platform analytics dashboard built with Flutter and BLoC pattern', html_url: '', stargazers_count: 28, forks_count: 6, language: 'Dart', updated_at: new Date().toISOString(), topics: ['flutter', 'dashboard', 'cross-platform'] },
  { id: 4, name: 'go-microservices', description: 'Scalable microservices architecture in Go with gRPC and Kubernetes', html_url: '', stargazers_count: 52, forks_count: 15, language: 'Go', updated_at: new Date().toISOString(), topics: ['go', 'microservices', 'kubernetes'] },
  { id: 5, name: 'rust-cli-tools', description: 'High-performance CLI tools collection built with Rust', html_url: '', stargazers_count: 19, forks_count: 3, language: 'Rust', updated_at: new Date().toISOString(), topics: ['rust', 'cli', 'performance'] },
  { id: 6, name: 'slide-maker', description: 'AI-powered presentation and handwriting document creation platform', html_url: '', stargazers_count: 91, forks_count: 23, language: 'TypeScript', updated_at: new Date().toISOString(), topics: ['react', 'ai', 'presentation'] },
];

const FALLBACK_EVENTS: GitHubEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `evt-${i}`, type: ['PushEvent', 'CreateEvent', 'IssuesEvent', 'PullRequestEvent', 'WatchEvent', 'ForkEvent'][i % 6],
  repo: { name: ['abir2afridi/slide-maker', 'abir2afridi/react-core-kit', 'abir2afridi/neural-pipeline'][i % 3] },
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  payload: { ref: i % 2 === 0 ? 'main' : undefined, commits: i % 2 === 0 ? [{ message: `refactor: optimize core ${['rendering', 'state management', 'build pipeline', 'API layer', 'test suite', 'docs'][i % 6]}` }] : undefined, action: i % 2 === 1 ? 'opened' : undefined },
}));

const EVENT_COLORS: Record<string, string> = {
  PushEvent: '#0066FF', CreateEvent: '#00CC88', IssuesEvent: '#FF6600',
  PullRequestEvent: '#CC44FF', WatchEvent: '#FFCC00', ForkEvent: '#66DDFF',
};

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function eventSummary(e: GitHubEvent) {
  const repo = e.repo.name.split('/')[1];
  switch (e.type) {
    case 'PushEvent': return `pushed to ${repo}${e.payload.ref ? ` (${e.payload.ref})` : ''} — ${e.payload.commits?.[0]?.message || 'no message'}`;
    case 'CreateEvent': return `created ${e.payload.ref_type || 'repository'} ${e.payload.ref || ''} in ${repo}`;
    case 'IssuesEvent': return `${e.payload.action || 'updated'} issue in ${repo}`;
    case 'PullRequestEvent': return `${e.payload.action || 'updated'} PR in ${repo}`;
    case 'WatchEvent': return `starred ${repo}`;
    case 'ForkEvent': return `forked ${repo}`;
    default: return `${e.type} on ${repo}`;
  }
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6', JavaScript: '#F7DF1E', Python: '#3776AB', Go: '#00ADD8',
  Rust: '#DEA584', Dart: '#00B4AB', 'C++': '#00599C', HTML: '#E34F26',
  CSS: '#1572B6', Shell: '#89E051', Kotlin: '#7F52FF', Swift: '#F05138',
};

export default function Developer() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [langData, setLangData] = useState<{ name: string; value: number }[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [totalForks, setTotalForks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers: Record<string, string> = {};
        const [userRes, reposRes, eventsRes] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, { headers }),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`, { headers }),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=12`, { headers }),
        ]);

        if (!userRes.ok) throw new Error('API limit');

        const userData: GitHubUser = await userRes.json();
        const reposData: GitHubRepo[] = await reposRes.json();
        const eventsData: GitHubEvent[] = await eventsRes.json();

        setUser(userData);
        setRepos(reposData.slice(0, 6));
        setEvents(eventsData.slice(0, 12));

        const allRepos = reposData;
        const stars = allRepos.reduce((s: number, r: GitHubRepo) => s + r.stargazers_count, 0);
        const forks = allRepos.reduce((f: number, r: GitHubRepo) => f + r.forks_count, 0);
        setTotalStars(stars);
        setTotalForks(forks);

        const langMap = new Map<string, number>();
        allRepos.forEach((r: GitHubRepo) => {
          if (r.language) langMap.set(r.language, (langMap.get(r.language) || 0) + 1);
        });
        setLangData(
          Array.from(langMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }))
        );
      } catch {
        setUser(FALLBACK_USER);
        setRepos(FALLBACK_REPOS);
        setEvents(FALLBACK_EVENTS);
        setTotalStars(271);
        setTotalForks(67);
        setLangData([
          { name: 'TypeScript', value: 8 }, { name: 'JavaScript', value: 5 },
          { name: 'Python', value: 4 }, { name: 'Go', value: 3 },
          { name: 'Dart', value: 2 }, { name: 'Rust', value: 2 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const contributionGrid = Array.from({ length: 70 }, () => Math.floor(Math.random() * 5));

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 flex items-center justify-center bg-background text-foreground">
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
              <Cpu className="h-5 w-5 animate-spin" />
              <span>SYNCING_NEURAL_STREAM...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        {/* Brutalist CSS — scoped via .dev-scope */}
        <style>{`
          .dev-scope *, .dev-scope *::before, .dev-scope *::after { border-radius: 0 !important; }
          .font-syne { font-family: 'Inter', system-ui, sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; }
          .font-tech { font-family: 'JetBrains Mono', 'Courier New', monospace; }
          @keyframes scanline {
            0% { top: 0; }
            100% { top: 100%; }
          }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scanline { animation: scanline 3s linear infinite; }
          .animate-marquee { animation: marquee 30s linear infinite; }
          .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        `}</style>
        <main className="flex-1 overflow-y-auto dev-scope bg-background text-foreground" style={{ fontFamily: 'system-ui, sans-serif' }}>
          {/* Noise Overlay */}
          <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

          {/* ===== TOP TICKER ===== */}
          <div className="h-8 bg-card border-b border-primary/30 flex items-center overflow-hidden font-tech text-[10px]">
            <div className="animate-marquee whitespace-nowrap flex gap-10 px-4 text-foreground/60">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> CORE_HEAT <strong className="text-foreground/90">42%</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00CC88]" /> NEURAL_LOAD <strong className="text-foreground/90">78%</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" /> PING <strong className="text-foreground/90">12ms</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#CC44FF]" /> MEMORY <strong className="text-foreground/90">2.4GB</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> CORE_HEAT <strong className="text-foreground/90">42%</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00CC88]" /> NEURAL_LOAD <strong className="text-foreground/90">78%</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" /> PING <strong className="text-foreground/90">12ms</strong></span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#CC44FF]" /> MEMORY <strong className="text-foreground/90">2.4GB</strong></span>
            </div>
          </div>
        {/* ===== HERO ===== */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-16 md:py-24 border-b border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          <div className="xl:grid xl:grid-cols-12 xl:gap-12 items-center">
            {/* Left: Text */}
            <div className="xl:col-span-7 relative z-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="flex items-center gap-2 text-primary font-tech text-xs mb-4 tracking-[0.2em] uppercase">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>System_Architect.exe</span>
                </div>
                <h1 className="font-syne text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[10rem] leading-[0.85] text-foreground mb-4 select-none">
                  {user?.name || GITHUB_USERNAME}
                </h1>
                <p className="font-tech text-sm text-foreground/40 mb-2 tracking-wider">
                  <span className="text-primary">$</span> cat /etc/profile.d/developer.sh
                </p>
                <p className="text-base md:text-lg text-foreground/70 max-w-xl leading-relaxed mb-8">
                  {user?.bio || 'Full-stack developer crafting digital experiences with React, TypeScript & AI.'}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <a href={user?.html_url || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-[4px_4px_0px_rgba(0,102,255,0.3)] hover:shadow-[6px_6px_0px_rgba(0,102,255,0.5)] active:translate-x-[2px] active:translate-y-[2px]">
                    <Github className="h-4 w-4" /> VIEW_PROFILE <ExternalLink className="h-3 w-3" />
                  </a>
                  <a href={`mailto:${user?.email || 'abir@siam.dev'}`} className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground/80 font-tech text-xs hover:bg-muted transition-all">
                    <Mail className="h-4 w-4" /> CONTACT
                  </a>
                </div>
                <div className="flex items-center gap-6 mt-8 font-tech text-xs text-foreground/30">
                  {user?.location && (
                    <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {user.location}</span>
                  )}
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Since {formatDate(user?.created_at || '2021-01-01')}</span>
                  {user?.blog && (
                    <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <LinkIcon className="h-3 w-3" /> {user.blog.replace('https://', '')}
                    </a>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right: Avatar with Scanline */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="xl:col-span-5 mt-12 xl:mt-0 relative">
              <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto border-2 border-primary/40 overflow-hidden bg-background">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                <div className="w-full h-full flex items-center justify-center bg-card">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Github className="h-20 w-20 text-foreground/20 mx-auto mb-2" />
                      <p className="font-tech text-xs text-foreground/30">AVATAR_SYNC</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-center font-tech text-[10px] text-foreground/20 tracking-[0.3em] uppercase">
                <span className="text-primary">●</span> Signal_Online
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== CONTRIBUTION PULSE ===== */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-16 border-b border-border/50">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-tech text-xs text-foreground/40 tracking-[0.2em] uppercase">Contribution_Pulse</h2>
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {contributionGrid.map((level, i) => (
              <div
                key={i}
                className="w-3 h-3 transition-all duration-300 hover:scale-150"
                style={{ backgroundColor: ['#1A1A1A', '#002255', '#0044AA', '#0066FF', '#3388FF'][level] }}
                title={`Level ${level}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 font-tech text-[10px] text-foreground/20">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className="w-3 h-3" style={{ backgroundColor: ['#1A1A1A', '#002255', '#0044AA', '#0066FF', '#3388FF'][l] }} />
            ))}
            <span>More</span>
          </div>
        </section>

        {/* ===== PERFORMANCE HUB ===== */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-16 border-b border-border/50">
          <div className="flex items-center gap-2 mb-8">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="font-tech text-xs text-foreground/40 tracking-[0.2em] uppercase">Performance_Hub</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Star, label: 'Star Impact', value: totalStars.toString(), accent: '#FFCC00', desc: 'Total stars across repos' },
              { icon: GitFork, label: 'Fork Density', value: totalForks.toString(), accent: '#00CC88', desc: 'Community fork count' },
              { icon: Database, label: 'Repos Node', value: (user?.public_repos || 28).toString(), accent: '#0066FF', desc: 'Active repositories' },
              { icon: Users, label: 'Followers', value: (user?.followers || 15).toString(), accent: '#CC44FF', desc: 'Network reach' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group border border-border bg-card p-6 hover:border-border transition-all cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="h-5 w-5 transition-all duration-300 group-hover:scale-125" style={{ color: stat.accent }} />
                  <span className="font-tech text-[10px] text-foreground/20">{stat.label.toUpperCase().replace(' ', '_')}</span>
                </div>
                <p className="font-syne text-4xl md:text-5xl mb-1" style={{ color: stat.accent }}>{stat.value}</p>
                <p className="font-tech text-[10px] text-foreground/30">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== MAIN GRID: LANG CHART + SIGNAL FEED ===== */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-16 border-b border-border/50">
          <div className="xl:grid xl:grid-cols-12 xl:gap-12">
            {/* Left: Language Chart */}
            <div className="xl:col-span-5 mb-12 xl:mb-0">
              <div className="flex items-center gap-2 mb-8">
                <Code2 className="h-4 w-4 text-primary" />
                <h2 className="font-tech text-xs text-foreground/40 tracking-[0.2em] uppercase">Visual_Intelligence</h2>
              </div>
              <div className="border border-border bg-card p-6">
                {langData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={langData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none">
                        {langData.map((entry) => (
                          <Cell key={entry.name} fill={LANG_COLORS[entry.name] || '#0066FF'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-foreground/20 font-tech text-xs">NO_DATA</div>
                )}
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {langData.map((l) => (
                    <div key={l.name} className="flex items-center gap-1.5 font-tech text-[10px] text-foreground/40">
                      <div className="w-2 h-2" style={{ backgroundColor: LANG_COLORS[l.name] || '#0066FF' }} />
                      {l.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Signal Feed */}
            <div className="xl:col-span-7">
              <div className="flex items-center gap-2 mb-8">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="font-tech text-xs text-foreground/40 tracking-[0.2em] uppercase">Live_Signal_Feed</h2>
              </div>
              <div className="border border-border bg-card max-h-[400px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-6 text-center font-tech text-xs text-foreground/20">SIGNAL_AWAITING</div>
                ) : (
                  events.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-3 px-5 py-3 border-b border-border/50 hover:bg-card transition-colors group">
                      <div className="mt-0.5 w-2 h-2 shrink-0" style={{ backgroundColor: EVENT_COLORS[evt.type] || '#0066FF' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-tech text-xs text-foreground/70 truncate">
                          <span className="text-foreground/40">$</span> {eventSummary(evt)}
                        </p>
                        <p className="font-tech text-[10px] text-foreground/20 mt-0.5">
                          {evt.repo.name} · {formatTimeAgo(evt.created_at)} ago
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== REPO GRID ===== */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-16 border-b border-border/50">
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-tech text-xs text-foreground/40 tracking-[0.2em] uppercase">Repository_Matrix</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.length === 0 ? (
              <div className="md:col-span-2 p-8 text-center font-tech text-xs text-foreground/20 border border-border">
                REPOSITORY_DATA_UNAVAILABLE
              </div>
            ) : (
              repos.map((repo, idx) => (
                <motion.a
                  key={repo.id}
                  href={repo.html_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * idx }}
                  className="group border border-border bg-card p-6 hover:border-primary/40 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent" />
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-tech text-[10px] text-primary tracking-widest">MODULE_{String(idx + 1).padStart(2, '0')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-foreground/20 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-syne text-lg md:text-xl text-foreground group-hover:text-primary transition-colors mb-2">{repo.name}</h3>
                  <p className="font-tech text-xs text-foreground/40 mb-4 line-clamp-2">{repo.description || 'No description available'}</p>
                  <div className="flex items-center gap-4 font-tech text-[10px]">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2" style={{ backgroundColor: LANG_COLORS[repo.language] || '#0066FF' }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-foreground/40">
                      <Star className="h-3 w-3" /> {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1 text-foreground/40">
                      <GitFork className="h-3 w-3" /> {repo.forks_count}
                    </span>
                  </div>
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {repo.topics.slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary font-tech text-[8px] tracking-wider">{t}</span>
                      ))}
                    </div>
                  )}
                </motion.a>
              ))
            )}
          </div>
        </section>

        {/* ===== NETWORK SYNC CTA ===== */}
        <section className="w-full border-t border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="w-full px-6 md:px-12 lg:px-20 py-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-tech text-xs mb-6 border border-primary/20">
                <Zap className="h-4 w-4" /> NETWORK_SYNC_READY
              </div>
              <h2 className="font-syne text-4xl md:text-6xl lg:text-7xl text-foreground mb-4">Let's Build Together</h2>
              <p className="font-tech text-sm text-foreground/40 mb-8 max-w-xl mx-auto">
                Open to collaborations, freelance projects, and innovative ideas. 
                Drop a message and let's create something extraordinary.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a href={user?.html_url || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-[6px_6px_0px_rgba(0,102,255,0.3)] hover:shadow-[8px_8px_0px_rgba(0,102,255,0.5)] active:translate-x-[2px] active:translate-y-[2px] group">
                  <Github className="h-5 w-5" /> TRANSMIT <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
                <a href={`mailto:${user?.email || 'abir@siam.dev'}`} className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground/80 font-tech text-xs hover:bg-muted transition-all">
                  <Mail className="h-4 w-4" /> SEND_SIGNAL
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-border/50 py-6 px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between font-tech text-[10px] text-foreground/20">
            <span>BUILD_VERSION 2.4.1 // {new Date().getFullYear()}</span>
            <div className="flex items-center gap-3">
              <a href={user?.html_url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-foreground/40 transition-colors flex items-center gap-1">
                <Github className="h-3 w-3" /> SRC
              </a>
              <span className="w-1 h-1 bg-border" />
              <span>CORE_TEMP <strong className="text-foreground/40">NOMINAL</strong></span>
            </div>
          </div>
        </footer>
        </main>
      </div>
    </div>
  );
}
