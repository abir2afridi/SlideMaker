import { Link } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { PenTool, FileText, Layout, Eye, Download, Sparkles, Palette, Image, Zap, ArrowRight, Star, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import heroImage from '@/assets/handwriting/hero-desk.jpg';

const features = [
  { icon: PenTool, title: '15+ Handwriting Styles', desc: 'From neat student writing to messy exam scrawls, cursive elegance to marker bold.' },
  { icon: Palette, title: 'Ink Colors & Smudge', desc: 'Blue, black, red, green, purple inks with optional realistic smudge effects.' },
  { icon: Layout, title: 'Custom Page Layouts', desc: 'Ruled, dotted, grid paper with margins, page numbers, A4/Letter/Legal.' },
  { icon: Sparkles, title: 'Mix Handwritten & Typed', desc: 'Combine handwriting and typed text sections on the same page.' },
  { icon: Image, title: 'Image & Diagram Upload', desc: 'Upload images and diagrams that render alongside your handwritten text.' },
  { icon: Download, title: 'Export PDF, PNG, JPG', desc: 'Download realistic multi-page assignments in multiple formats.' },
];

const steps = [
  { num: '01', title: 'Write or Paste', desc: 'Type your assignment text or paste it in bulk. Add headings, bullets, and formatting.' },
  { num: '02', title: 'Choose Style & Color', desc: 'Pick from 15+ handwriting styles. Select ink color per section. Toggle smudge effects.' },
  { num: '03', title: 'Customize Layout', desc: 'Set page size, paper style (ruled/grid/dotted), margins, and page numbers.' },
  { num: '04', title: 'Export & Download', desc: 'Preview your pages and export as high-quality PDF, PNG, or JPG images.' },
];

const stats = [
  { icon: Star, value: '15+', label: 'Handwriting Styles' },
  { icon: Shield, value: '5', label: 'Export Formats' },
  { icon: Clock, value: 'Instant', label: 'Live Preview' },
];

const Landing = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="relative">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover opacity-15 dark:opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative z-10 py-24 md:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20 backdrop-blur-sm"
            >
              <Zap className="h-4 w-4" />
              AI-Powered Handwriting Generator
            </motion.div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-[1.1] tracking-tight">
              Turn Your Text Into{' '}
              <span className="text-primary relative">
                Realistic Handwriting
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                  className="absolute -bottom-1 left-0 h-1 bg-accent/60 rounded-full"
                />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Create stunning handwritten assignments with multiple styles, custom ink colors,
              notebook layouts, and export to PDF — all in seconds.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg" className="font-semibold text-base px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link to="/editor-handwriting">
                  <PenTool className="h-5 w-5 mr-2" />
                  Start Writing
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold text-base px-8 h-12 backdrop-blur-sm">
                <Link to="/editor-handwriting">
                  <Eye className="h-5 w-5 mr-2" />
                  See Preview
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-8 md:gap-14 mt-14"
          >
            {stats.map((stat) => ( stat.icon && 
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon className="h-5 w-5 text-accent mb-1" />
                <span className="text-2xl font-display text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Handwriting showcase */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <div className="bg-paper-white rounded-2xl shadow-2xl p-8 md:p-10 paper-ruled paper-margin text-left border border-border/50 relative backdrop-blur-sm">
              <div className="absolute top-3 right-4 text-xs text-muted-foreground font-body">Page 1</div>
              <p className="font-handwriting-caveat text-xl md:text-2xl leading-[32px]" style={{ color: '#1a5276' }}>
                The quick brown fox jumps over the lazy dog.
                This is what your handwritten assignment will look like.
              </p>
              <p className="font-handwriting-kalam text-lg md:text-xl leading-[32px] mt-3" style={{ color: '#1c2526' }}>
                Switch between 15+ realistic handwriting styles.
              </p>
              <p className="font-handwriting-dancing text-xl md:text-2xl leading-[32px] mt-3" style={{ color: '#922b21' }}>
                Change ink color per section — blue, black, red and more!
              </p>
              <p className="font-body text-sm leading-[32px] mt-3 text-foreground">
                You can also mix in typed text like this paragraph, perfect for headings and labels.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Four simple steps to create realistic handwritten assignments</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="relative bg-card rounded-2xl border p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <span className="text-5xl font-display text-primary/10 absolute top-4 right-4 group-hover:text-primary/20 transition-colors">{step.num}</span>
              <h3 className="font-display text-lg text-foreground mb-2 mt-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Everything you need for perfect handwritten assignments</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i }}
                className="bg-card rounded-2xl border p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-accent/25 transition-all">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl border p-12">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">Ready to Write?</h2>
            <p className="text-muted-foreground text-lg mb-8">Start creating realistic handwritten assignments in minutes.</p>
            <Button asChild size="lg" className="font-semibold text-base px-10 h-12 shadow-lg shadow-primary/25">
              <Link to="/editor-handwriting">
                <PenTool className="h-5 w-5 mr-2" />
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AI Assignment Writer Master — Transform text into realistic handwriting.</p>
        </div>
      </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;
