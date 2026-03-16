import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Brain, ArrowRight, Server, Database, Globe, Layers, Cpu, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: BookOpen, title: 'Learn', desc: 'Curated video courses on HLD & LLD', to: '/learn', color: 'bg-primary' },
    { icon: FileText, title: 'Articles', desc: 'In-depth articles on system design concepts', to: '/articles', color: 'bg-accent-cyan' },
    { icon: Brain, title: 'Quizzes', desc: 'Test your knowledge with topic-wise quizzes', to: '/quizzes', color: 'bg-accent-indigo' },
  ];

  const stats = [
    { value: '5+', label: 'Courses' },
    { value: '15+', label: 'Lessons' },
    { value: '3+', label: 'Quizzes' },
    { value: '3+', label: 'Articles' },
  ];

  const topics = [
    { icon: Server, label: 'Load Balancing' },
    { icon: Database, label: 'Database Design' },
    { icon: Globe, label: 'CDN & Caching' },
    { icon: Layers, label: 'Microservices' },
    { icon: Cpu, label: 'Message Queues' },
    { icon: Network, label: 'API Design' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 neu-stripes"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-8">
            <span className="neu-badge-blue px-6 py-3 text-base font-semibold">
              Welcome back, {user?.username} 👋
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
            MASTER<br />
            <span className="text-primary">SYSTEM</span>{' '}
            <span className="relative inline-block">
              DESIGN
              <div className="absolute -bottom-2 left-0 right-0 h-5 bg-primary/30 -z-10" />
            </span>
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-mono">
            From fundamentals to advanced HLD/LLD — learn to design systems that scale to millions.
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link
              to="/learn"
              className="neu-btn-blue px-10 py-5 text-xl inline-flex items-center gap-3"
            >
              Start Learning <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              to="/quizzes"
              className="neu-btn px-10 py-5 text-xl bg-secondary text-foreground inline-flex items-center gap-3"
            >
              Take a Quiz <Brain className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Stats - Constrained Width */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="neu-card p-8 text-center">
            <p className="text-6xl font-bold text-primary mb-2">{stat.value}</p>
            <p className="text-base font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.section>

      {/* Feature Cards */}
      <section>
        <h2 className="text-4xl font-bold mb-10 uppercase tracking-tight">
          <span className="text-primary">»</span> Explore
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="h-96"
            >
              <Link to={f.to} className="block group h-full">
                <div className="neu-card-blue p-10 h-full flex flex-col">
                  <div className={`w-16 h-16 ${f.color} border-3 border-foreground flex items-center justify-center mb-8`} style={{ boxShadow: '4px 4px 0px #000' }}>
                    <f.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-lg text-muted-foreground flex-grow">{f.desc}</p>
                  <div className="mt-8 flex items-center gap-2 text-primary font-bold text-base uppercase tracking-wider">
                    Explore <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Topics */}
      <section>
        <h2 className="text-4xl font-bold mb-10 uppercase tracking-tight">
          <span className="text-primary">»</span> Topics Covered
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {topics.map((t) => (
            <div key={t.label} className="neu-card p-6 flex items-center gap-5">
              <t.icon className="w-7 h-7 text-primary shrink-0" />
              <span className="font-bold text-base uppercase tracking-wider">{t.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
