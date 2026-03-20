import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articles as mockArticles, Article } from '@/data/mockData';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, User, Tag, Search, Grid3x3, List, Heart, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/utils';
import { articlesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageLoader from '@/components/PageLoader';
import { toast } from 'sonner';

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images.length) return null;

  return (
    <div className="relative aspect-[2/1] bg-black border-3 border-foreground overflow-hidden flex items-center justify-center" style={{ boxShadow: '4px 4px 0px #000' }}>
      <img src={getImageUrl(images[current])} alt="" className="w-full h-full object-contain" />
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
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'liked' | 'none'>('all');  const [dataLoaded, setDataLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // User interactions tracking
  const [userInteractions, setUserInteractions] = useState<Record<string, { isRead: boolean; isLiked: boolean }>>({});

  // Handle URL-based article selection
  useEffect(() => {
    if (dataLoaded && id) {
      const article = articles.find(a => a.id === id);
      if (article) {
        // Preload images before showing article
        if (article.images && article.images.length > 0) {
          setLoadingImages(true);
          setImagesLoaded(false);
          preloadImages(article.images);
        } else {
          setImagesLoaded(true);
          setSelectedArticle(article);
        }
      } else {
        // Article not found, go back to list
        setSelectedArticle(null);
      }
    } else if (!id) {
      setSelectedArticle(null);
    }
  }, [id, articles, dataLoaded]);

  // Preload all images before displaying article
  const preloadImages = async (imageUrls: string[]) => {
    try {
      const promises = imageUrls.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Still resolve on error
          img.src = getImageUrl(url);
        });
      });
      
      await Promise.all(promises);
      setImagesLoaded(true);
      setSelectedArticle(articles.find(a => a.id === id) || null);
    } catch (error) {
      setImagesLoaded(true);
      setSelectedArticle(articles.find(a => a.id === id) || null);
    } finally {
      setLoadingImages(false);
    }
  };

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
            likeCount: a.likeCount || 0,
            readCount: a.readCount || 0,
          }));
          setArticles(transformed.length > 0 ? transformed : mockArticles);
        }
      } catch (error) {
        console.log('Using mock data (API not available)');
        setArticles(mockArticles);
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    };

    fetchArticles();
  }, []);

  // Fetch user interactions with articles
  useEffect(() => {
    if (!user?.id) return;

    const fetchInteractions = async () => {
      try {
        const response = await articlesAPI.getInteractions();
        setUserInteractions(response.data);
      } catch (error) {
        console.log('Could not load user interactions');
      }
    };

    fetchInteractions();
  }, [user?.id]);

  // Handle mark as read - Simplified
  const handleMarkAsRead = async (articleId: string) => {
    if (!user?.id) {
      toast.error('Please login to mark articles as read');
      return;
    }

    const currentState = userInteractions[articleId]?.isRead || false;
    const newState = !currentState;

    try {
      // Make API call
      await articlesAPI.markAsRead(articleId, newState);

      // Update state after success
      setUserInteractions(prev => ({
        ...prev,
        [articleId]: { ...prev[articleId], isRead: newState }
      }));

      setArticles(prev => prev.map(a => 
        a.id === articleId 
          ? { 
              ...a, 
              readCount: (a.readCount || 0) + (newState ? 1 : -1)
            }
          : a
      ));

      toast.success(newState ? 'Marked as read' : 'Marked as unread');
    } catch (error) {
      console.error('Failed to update read status:', error);
      toast.error('Failed to update read status');
    }
  };

  // Handle like/unlike - Simplified
  const handleLike = async (articleId: string) => {
    if (!user?.id) {
      toast.error('Please login to like articles');
      return;
    }

    const currentState = userInteractions[articleId]?.isLiked || false;
    const newState = !currentState;

    try {
      // Make API call
      await articlesAPI.like(articleId, newState);

      // Update state after success
      setUserInteractions(prev => ({
        ...prev,
        [articleId]: { ...prev[articleId], isLiked: newState }
      }));

      setArticles(prev => prev.map(a => 
        a.id === articleId 
          ? { 
              ...a, 
              likeCount: (a.likeCount || 0) + (newState ? 1 : -1)
            }
          : a
      ));

      toast.success(newState ? '❤️ Article liked' : 'Like removed');
    } catch (error) {
      console.error('Failed to update like status:', error);
      toast.error('Failed to update like status');
    }
  };

  if (selectedArticle && dataLoaded) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/articles')}
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

          {/* Interaction Buttons */}
          <div className="flex gap-3 py-4 border-t-2 border-b-2 border-foreground">
            <button
              onClick={() => handleMarkAsRead(selectedArticle.id)}
              className={`flex items-center gap-2 px-4 py-2 font-bold border-2 transition-all cursor-pointer ${
                userInteractions[selectedArticle.id]?.isRead
                  ? 'bg-accent-cyan text-background border-accent-cyan'
                  : 'bg-secondary text-foreground border-foreground hover:bg-accent-cyan/20'
              }`}
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <CheckCircle className="w-5 h-5" />
              {userInteractions[selectedArticle.id]?.isRead ? 'Read' : 'Mark as Read'}
            </button>
            
            <button
              onClick={() => handleLike(selectedArticle.id)}
              className={`flex items-center gap-2 px-4 py-2 font-bold border-2 transition-all cursor-pointer ${
                userInteractions[selectedArticle.id]?.isLiked
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-secondary text-foreground border-foreground hover:bg-red-500/20'
              }`}
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <Heart className={`w-5 h-5 ${userInteractions[selectedArticle.id]?.isLiked ? 'fill-current' : ''}`} />
              {userInteractions[selectedArticle.id]?.isLiked ? 'Liked' : 'Like'}
            </button>
          </div>

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

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="neu-input flex-1 px-4 py-3 text-foreground border-2 border-foreground flex items-center gap-2" style={{ boxShadow: '2px 2px 0px #000' }}>
            <input
              type="text"
              placeholder="Search articles by title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
            />
          </div>
          {/* View Toggle */}
          <div className="flex gap-2 border-2 border-foreground bg-secondary" style={{ boxShadow: '2px 2px 0px #000' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary/20'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <div className="w-px bg-foreground" />
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary/20'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              selectedTag === null 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            All Tags
          </button>
          {Array.from(new Set(articles.flatMap(a => a.tags))).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
                selectedTag === tag 
                  ? 'bg-accent-cyan text-background border-accent-cyan' 
                  : 'bg-secondary text-foreground border-foreground hover:bg-accent-cyan/20'
              }`}
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              statusFilter === 'all' 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            All Articles
          </button>
          <button
            onClick={() => setStatusFilter('read')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all flex items-center gap-2 ${
              statusFilter === 'read' 
                ? 'bg-accent-cyan text-background border-accent-cyan' 
                : 'bg-secondary text-foreground border-foreground hover:bg-accent-cyan/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <CheckCircle className="w-4 h-4" /> Read
          </button>
          <button
            onClick={() => setStatusFilter('liked')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all flex items-center gap-2 ${
              statusFilter === 'liked' 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-secondary text-foreground border-foreground hover:bg-red-500/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <Heart className="w-4 h-4" /> Liked
          </button>
          <button
            onClick={() => setStatusFilter('none')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              statusFilter === 'none' 
                ? 'bg-accent-yellow text-background border-accent-yellow' 
                : 'bg-secondary text-foreground border-foreground hover:bg-accent-yellow/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            Not Interacted
          </button>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-mono">
          Showing {articles.filter(a => 
            (searchQuery === '' || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (selectedTag === null || a.tags.includes(selectedTag)) &&
            (statusFilter === 'all' || 
              (statusFilter === 'read' && userInteractions[a.id]?.isRead) ||
              (statusFilter === 'liked' && userInteractions[a.id]?.isLiked) ||
              (statusFilter === 'none' && !userInteractions[a.id]?.isRead && !userInteractions[a.id]?.isLiked))
          ).length} articles
        </p>
      </div>

      {/* Articles Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles
            .filter(a => 
              (searchQuery === '' || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
              (selectedTag === null || a.tags.includes(selectedTag)) &&
              (statusFilter === 'all' || 
                (statusFilter === 'read' && userInteractions[a.id]?.isRead) ||
                (statusFilter === 'liked' && userInteractions[a.id]?.isLiked) ||
                (statusFilter === 'none' && !userInteractions[a.id]?.isRead && !userInteractions[a.id]?.isLiked))
            )
            .map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <button
                onClick={() => navigate(`/articles/${article.id}`)}
                className="w-full text-left group cursor-pointer h-full"
              >
                <div className="neu-card overflow-hidden h-full flex flex-col relative">
                  {/* Viewed Badge */}
                  {userInteractions[article.id]?.isRead && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-sm border-2 border-green-600 z-10" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                      ✓ Viewed
                    </div>
                  )}
                  
                  {article.images[0] && (
                    <div className="aspect-video overflow-hidden shrink-0">
                      <img
                        src={getImageUrl(article.images[0])}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2 mb-3 h-6">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="neu-badge-blue px-2 py-0.5 text-[10px]">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-auto">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.createdAt}</span>
                    </div>
                    
                    {/* Like and Read Counts */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-foreground/30">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Heart className="w-3 h-3 text-red-500" /> {article.likeCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <CheckCircle className="w-3 h-3 text-accent-cyan" /> {article.readCount}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-foreground neu-card overflow-hidden" style={{ boxShadow: '2px 2px 0px #000' }}>
          <div className="max-h-96 overflow-y-auto">
            {articles
              .filter(a => 
                (searchQuery === '' || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (selectedTag === null || a.tags.includes(selectedTag)) &&
                (statusFilter === 'all' || 
                  (statusFilter === 'read' && userInteractions[a.id]?.isRead) ||
                  (statusFilter === 'liked' && userInteractions[a.id]?.isLiked) ||
                  (statusFilter === 'none' && !userInteractions[a.id]?.isRead && !userInteractions[a.id]?.isLiked))
              )
              .map((article) => (
              <button
                key={article.id}
                onClick={() => navigate(`/articles/${article.id}`)}
                className="w-full text-left p-4 border-b border-foreground hover:bg-primary/10 transition-colors group cursor-pointer flex items-center gap-4"
              >
                {/* Image Preview */}
                <div className="w-32 h-24 shrink-0 border-2 border-foreground overflow-hidden flex items-center justify-center bg-secondary" style={{ boxShadow: '2px 2px 0px #000' }}>
                  {article.images[0] ? (
                    <img
                      src={getImageUrl(article.images[0])}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs font-mono">No Image</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.createdAt}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.tags.map((tag) => (
                      <span key={tag} className="neu-badge-blue px-2 py-0.5 text-[10px]">{tag}</span>
                    ))}
                  </div>
                  
                  {/* Interaction Stats */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-foreground/30">
                    {/* Read Status Indicator */}
                    {userInteractions[article.id]?.isRead ? (
                      <span className="flex items-center gap-1 text-xs bg-accent-cyan text-background px-2 py-1 font-bold border border-accent-cyan">
                        <CheckCircle className="w-3 h-3" /> Read
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-orange-500/30 text-orange-300 px-2 py-1 font-bold border border-orange-500">
                        ◯ Unread
                      </span>
                    )}
                    
                    {/* Like Status */}
                    {userInteractions[article.id]?.isLiked && (
                      <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 font-bold border border-red-500">
                        <Heart className="w-3.5 h-3.5 fill-current" /> Liked
                      </span>
                    )}
                    
                    {/* Stats */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono ml-auto">
                      <Heart className="w-3 h-3 text-red-500" /> <span className="font-bold">{article.likeCount}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <CheckCircle className="w-3 h-3 text-accent-cyan" /> <span className="font-bold">{article.readCount}</span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <PageLoader isLoading={loading || loadingImages} message={loadingImages ? 'Loading articles...' : 'Fetching articles...'} />
    </div>
  );
}
