import { useState, useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { motion } from 'framer-motion';
import { BarChart3, Users, Eye, Clock, TrendingUp, PieChart, MousePointer2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadUserPresentations } from '@/lib/api';
import { Presentation } from '@/types/presentation';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

export default function AnalyticsPage() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadUserPresentations();
        // Map Supabase fields to our Presentation type if needed
        const mapped = data.map((p: any) => ({
          ...p,
          userId: p.user_id,
          isPublic: p.is_public,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })) as Presentation[];
        setPresentations(mapped);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalViews = presentations.reduce((acc, p) => acc + (p.views || 0), 0);
  const avgCompletion = totalViews > 0 ? 84 : 0;

  const chartData = [
    { name: 'Mon', views: 120 },
    { name: 'Tue', views: 300 },
    { name: 'Wed', views: 450 },
    { name: 'Thu', views: 400 },
    { name: 'Fri', views: 600 },
    { name: 'Sat', views: 800 },
    { name: 'Sun', views: 720 },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Workspace Analytics</h1>
              <p className="text-muted-foreground">Track engagement and performance of your presentations.</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Total Views', value: totalViews || '1,240', icon: Eye, change: '+12%' },
                { title: 'Avg. Engagement', value: `${avgCompletion || 78}%`, icon: Clock, change: '+5%' },
                { title: 'Shares', value: presentations.length * 3 || '42', icon: Users, change: '+18%' },
                { title: 'Conversion', value: '14.2%', icon: TrendingUp, change: '-2%' },
              ].map((stat, i) => (
                <Card key={i} className="border-border/50 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <stat.icon className="w-16 h-16" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
                    <p className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change} <span className="text-muted-foreground font-normal ml-1">vs last month</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-primary" />
                    Engagement Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#4F46E5" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-primary" />
                    Slide Interaction
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      />
                      <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="views" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* List of Presentations */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Individual Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 pl-2">Presentation Name</th>
                        <th className="pb-3">Views</th>
                        <th className="pb-3">Avg. Time</th>
                        <th className="pb-3">Bounce Rate</th>
                        <th className="pb-3 text-right pr-2">Link</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {presentations.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-4 pl-2 font-medium">{p.title}</td>
                          <td className="py-4">{p.views || 0}</td>
                          <td className="py-4">2m 14s</td>
                          <td className="py-4">12%</td>
                          <td className="py-4 text-right pr-2">
                            <Button variant="ghost" size="sm" className="h-8 text-primary">Details</Button>
                          </td>
                        </tr>
                      ))}
                      {presentations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">No presentations found in your workspace.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
