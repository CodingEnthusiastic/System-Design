import { useState, useEffect } from 'react';
import { articles as mockArticles, Article } from '@/data/mockData';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, User, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images.length) return null;

  return (
    <div className="relative aspect-[2/1] bg-black border-3 border-foreground overflow-hidden" style={{ boxShadow: '4px 4px 0px #000' }}>
      <img src={images[current]} alt="" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background border-3 border-foreground flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background border-3 border-foreground flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 border-2 border-foreground cursor-pointer ${i === current ? 'bg-primary' : 'bg-background'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [loading, setLoading] = useState(false);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/articles`);
        if (response.ok) {
          const data = await response.json();
          // Convert MongoDB _id to id for compatibility
          const transformed = data.map((a: any) => ({
            id: a._id,
            title: a.title,
            content: a.content,
            images: a.images || [],
            author: a.author,
            createdAt: a.createdAt.split('T')[0],
            tags: a.tags || [],
          }));
          if (transformed.length > 0) {
            setArticles(transformed);
          }
        }
      } catch (error) {
        console.log('Using mock data (API not available)');
        // Use mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (selectedArticle) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedArticle(null)}
          className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>

        <article className="neu-card-blue p-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedArticle.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedArticle.author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedArticle.createdAt}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="neu-badge px-3 py-1 bg-secondary text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {selectedArticle.images.length > 0 && (
            <ImageCarousel images={selectedArticle.images} />
          )}

          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:text-primary prose-h2:border-b-3 prose-h2:border-primary prose-h2:pb-2 prose-h2:mb-4
              prose-h3:text-xl prose-h3:text-accent-cyan
              prose-strong:text-foreground
              prose-code:bg-secondary prose-code:px-2 prose-code:py-1 prose-code:border-2 prose-code:border-border prose-code:font-mono prose-code:text-primary
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-secondary prose-blockquote:p-4 prose-blockquote:not-italic
              prose-li:marker:text-primary
              prose-a:text-primary prose-a:underline
            "
            dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
          />
        </article>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> ARTICLES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">IN-DEPTH SYSTEM DESIGN ARTICLES</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <button
              onClick={() => setSelectedArticle(article)}
              className="w-full text-left group cursor-pointer"
            >
              <div className="neu-card overflow-hidden h-full">
                {article.images[0] && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.images[0]}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="neu-badge-blue px-2 py-0.5 text-[10px]">{tag}</span>
                    ))}
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.createdAt}</span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
