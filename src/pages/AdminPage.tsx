import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Article, Quiz, Lesson, QuizQuestion } from '@/data/mockData';
import { Plus, Trash2, Edit3, BookOpen, FileText, Brain, Users, X, Save, Loader, Link2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { RichTextEditor } from '@/components/RichTextEditor';
import { articlesAPI, quizzesAPI, coursesAPI, usersAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

type Tab = 'courses' | 'articles' | 'quizzes' | 'users';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  // Initialize with empty state - will load from DB
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [quizzesList, setQuizzesList] = useState<Quiz[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Article editor state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState({ title: '', content: '', tags: '', images: [] as string[] });
  const [imageUrl, setImageUrl] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const articleImageInputRef = useRef<HTMLInputElement>(null);

  // Course editor state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: '', difficulty: '', thumbnail: '', lessons: [] as any[] });
  const [editingLesson, setEditingLesson] = useState<{ title: string; youtubeId: string; duration: string; description: string } | null>(null);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Quiz editor state
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', topic: '', questions: [] as QuizQuestion[] });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0 });

  if (!isAdmin) return <Navigate to="/" replace />;

  const loadArticles = async () => {
    try {
      const articlesRes = await articlesAPI.getAll();
      const transformedArticles = articlesRes.data.map((a: any) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        images: a.images || [],
        author: a.author || 'Admin',
        createdAt: a.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        tags: a.tags || [],
      }));
      setArticlesList(transformedArticles);
    } catch (error) {
      setArticlesList([]);
    }
  };

  const refreshArticles = async () => {
    setIsLoading(true);
    try {
      await loadArticles();
      alert('✅ Articles refreshed successfully');
    } catch (error) {
      alert('❌ Failed to refresh articles');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load courses from DB
        const coursesRes = await coursesAPI.getAll();
        const transformedCourses = coursesRes.data.map((c: any) => ({
          id: c._id,
          title: c.title,
          description: c.description,
          category: c.category,
          difficulty: c.difficulty,
          thumbnail: c.thumbnail,
          lessons: c.lessons || [],
          totalDuration: c.totalDuration || '',
        }));
        setCoursesList(transformedCourses);
      } catch (error) {
        setCoursesList([]);
      }

      // Load articles
      await loadArticles();

      try {
        // Load quizzes from DB
        const quizzesRes = await quizzesAPI.getAll();
        const transformedQuizzes = quizzesRes.data.map((q: any) => ({
          id: q._id,
          title: q.title,
          topic: q.topic,
          questions: q.questions || [],
        }));
        setQuizzesList(transformedQuizzes);
      } catch (error) {
        setQuizzesList([]);
      }

      try {
        // Load users from DB
        const usersRes = await usersAPI.getAll();
        const transformedUsers = usersRes.data.map((u: any) => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role || 'user',
          createdAt: u.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));
        setUsersList(transformedUsers);
      } catch (error) {
        setUsersList([]);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Auto-refresh articles when switching to articles tab
  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles();
    }
  }, [activeTab]);

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'quizzes', label: 'Quizzes', icon: Brain },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const deleteCourse = async (id: string) => {
    try {
      await coursesAPI.delete(id);
      setCoursesList((p) => p.filter((c) => c.id !== id));
    } catch (error) {
      alert('Failed to delete course');
    }
  };
  
  const deleteArticle = async (id: string) => {
    try {
      await articlesAPI.delete(id);
      setArticlesList((p) => p.filter((a) => a.id !== id));
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      await quizzesAPI.delete(id);
      setQuizzesList((p) => p.filter((q) => q.id !== id));
    } catch (error) {
      alert('Failed to delete quiz');
    }
  };

  const cleanupBrokenImages = async () => {
    const confirmCleanup = window.confirm(
      'This will remove ALL broken server image URLs (/uploads/...) from ALL articles in the database. This cannot be undone. Continue?'
    );
    if (!confirmCleanup) return;

    try {
      setIsLoading(true);
      const response = await articlesAPI.cleanupBrokenImages();
      const { cleanedCount } = response.data;
      
      if (cleanedCount > 0) {
        alert(`✅ Cleaned database! Removed broken images from ${cleanedCount} article(s).`);
        // Reload articles
        await loadArticles();
      } else {
        alert('ℹ️ No broken images found in database.');
      }
    } catch (error) {
      alert('Failed to cleanup broken images');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ ARTICLE FUNCTIONS ============
  const openArticleEditor = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        title: article.title,
        content: article.content,
        tags: article.tags.join(', '),
        images: article.images,
      });
    } else {
      setEditingArticle({ id: '', title: '', content: '', tags: [], images: [], author: 'Admin User', createdAt: new Date().toISOString().split('T')[0] });
      setArticleForm({ title: '', content: '', tags: '', images: [] });
    }
  };

  const normalizeGoogleDriveUrl = (url: string): string => {
    // Extract file ID from various Google Drive URL formats
    let fileId = '';
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view or variations
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match1) {
      fileId = match1[1];
    }
    
    // Format 2: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }
    
    // Format 3: Already in uc?export=view format
    if (url.includes('uc?export=view')) {
      return url;
    }
    
    if (fileId) {
      // Convert to direct view URL that works in img tags
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // If we couldn't extract ID, return original URL
    return url;
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('URL must start with http:// or https://');
      return;
    }

    // Normalize Google Drive URLs to direct view format
    const normalizedUrl = url.includes('drive.google.com') ? normalizeGoogleDriveUrl(url) : url;
    
    setArticleForm((p) => ({ ...p, images: [...p.images, normalizedUrl] }));
    setImageUrl('');
  };

  const removeArticleImage = (index: number) => {
    setArticleForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const saveArticle = async () => {
    if (!editingArticle || !articleForm.title || !articleForm.content) {
      alert('Title and content are required');
      return;
    }

    const article: Article = {
      ...editingArticle,
      id: editingArticle.id || String(Date.now()),
      title: articleForm.title,
      content: articleForm.content,
      tags: articleForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: articleForm.images,
    };

    try {
      if (editingArticle.id) {
        // Update existing article
        await articlesAPI.update(article.id, {
          title: article.title,
          content: article.content,
          tags: article.tags,
          images: article.images,
        });
        setArticlesList((p) => p.map((a) => (a.id === article.id ? article : a)));
      } else {
        // Create new article
        const response = await articlesAPI.create({
          title: article.title,
          content: article.content,
          tags: article.tags,
          images: article.images,
        });
        setArticlesList((p) => [...p, { ...article, id: response.data._id }]);
      }
      setEditingArticle(null);
    } catch (error) {
      alert('Failed to save article');
    }
  };

  // ============ COURSE FUNCTIONS ============
  const openCourseEditor = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        thumbnail: course.thumbnail,
        lessons: course.lessons,
      });
    } else {
      setEditingCourse({ id: '', title: '', description: '', category: 'HLD', difficulty: 'Beginner', thumbnail: '', lessons: [], totalDuration: '' });
      setCourseForm({ title: '', description: '', category: 'HLD', difficulty: 'Beginner', thumbnail: '', lessons: [] });
    }
    setEditingLesson(null);
    setEditingLessonIndex(null);
  };

  const addOrUpdateLesson = () => {
    if (!editingLesson || !editingLesson.title || !editingLesson.youtubeId || !editingLesson.duration) {
      alert('Title, YouTube URL, and duration are required');
      return;
    }

    if (editingLessonIndex !== null) {
      // Update existing lesson
      setCourseForm((p) => ({
        ...p,
        lessons: p.lessons.map((l, idx) => (idx === editingLessonIndex ? { ...l, ...editingLesson } : l)),
      }));
    } else {
      // Add new lesson
      setCourseForm((p) => ({
        ...p,
        lessons: [...p.lessons, { id: String(Date.now()), ...editingLesson }],
      }));
    }
    setEditingLesson(null);
    setEditingLessonIndex(null);
  };

  const removeLesson = (index: number) => {
    setCourseForm((p) => ({
      ...p,
      lessons: p.lessons.filter((_, i) => i !== index),
    }));
  };

  const saveCourse = async () => {
    if (!editingCourse || !courseForm.title) {
      alert('Title is required');
      return;
    }

    // Normalize thumbnail URL if it's a Google Drive URL
    const normalizedThumbnail = courseForm.thumbnail.includes('drive.google.com') 
      ? normalizeGoogleDriveUrl(courseForm.thumbnail) 
      : courseForm.thumbnail;

    const course: Course = {
      ...editingCourse,
      id: editingCourse.id || String(Date.now()),
      title: courseForm.title,
      description: courseForm.description,
      category: courseForm.category as 'HLD' | 'LLD' | 'Fundamentals',
      difficulty: courseForm.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      thumbnail: normalizedThumbnail,
      lessons: courseForm.lessons,
      totalDuration: `${courseForm.lessons.length}h`,
    };

    try {
      if (editingCourse.id) {
        // Update existing course
        await coursesAPI.update(course.id, {
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          thumbnail: course.thumbnail,
          lessons: course.lessons,
          totalDuration: course.totalDuration,
        });
        setCoursesList((p) => p.map((c) => (c.id === course.id ? course : c)));
      } else {
        // Create new course
        const response = await coursesAPI.create({
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          thumbnail: course.thumbnail,
          lessons: course.lessons,
          totalDuration: course.totalDuration,
        });
        setCoursesList((p) => [...p, { ...course, id: response.data._id }]);
      }
      setEditingCourse(null);
    } catch (error) {
      alert('Failed to save course');
    }
  };

  // ============ QUIZ FUNCTIONS ============
  const openQuizEditor = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        topic: quiz.topic,
        questions: quiz.questions || [],
      });
    } else {
      setEditingQuiz({ id: '', title: '', topic: '', questions: [] });
      setQuizForm({ title: '', topic: '', questions: [] });
    }
    setEditingQuestionIndex(null);
    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const saveQuiz = async () => {
    if (!editingQuiz || !quizForm.title || !quizForm.topic) {
      alert('Title and topic are required');
      return;
    }

    if (quizForm.questions.length === 0) {
      alert('Add at least one question');
      return;
    }

    const quiz: Quiz = {
      ...editingQuiz,
      id: editingQuiz.id || String(Date.now()),
      title: quizForm.title,
      topic: quizForm.topic,
      questions: quizForm.questions,
    };

    try {
      if (editingQuiz.id) {
        // Update existing quiz
        await quizzesAPI.update(quiz.id, {
          title: quiz.title,
          topic: quiz.topic,
          questions: quiz.questions,
        });
        setQuizzesList((p) => p.map((q) => (q.id === quiz.id ? quiz : q)));
      } else {
        // Create new quiz
        const response = await quizzesAPI.create({
          title: quiz.title,
          topic: quiz.topic,
          questions: quiz.questions,
        });
        setQuizzesList((p) => [...p, { ...quiz, id: response.data._id }]);
      }
      setEditingQuiz(null);
      setQuizForm({ title: '', topic: '', questions: [] });
      setEditingQuestionIndex(null);
    } catch (error) {
      alert('Failed to save quiz');
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: String(Date.now()),
      question: questionForm.question,
      options: questionForm.options.filter(o => o.trim() !== ''),
      correctAnswer: questionForm.correctAnswer,
    };

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updated = [...quizForm.questions];
      updated[editingQuestionIndex] = newQuestion;
      setQuizForm((p) => ({ ...p, questions: updated }));
      setEditingQuestionIndex(null);
    } else {
      // Add new question
      setQuizForm((p) => ({ ...p, questions: [...p.questions, newQuestion] }));
    }
    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const removeQuestion = (index: number) => {
    setQuizForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== index) }));
  };

  const editQuestion = (index: number) => {
    const q = quizForm.questions[index];
    setQuestionForm({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    });
    setEditingQuestionIndex(index);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> MANAGE
        </h1>
        <p className="text-muted-foreground font-mono text-sm">ADMIN PANEL — MANAGE APPLICATION CONTENT</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-bold text-sm uppercase tracking-wider border-3 inline-flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-foreground'
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={activeTab === tab.id ? { boxShadow: '3px 3px 0px #000' } : { boxShadow: '2px 2px 0px #000' }}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Article Editor Modal */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingArticle.id ? 'Edit Article' : 'New Article'}
              </h3>
              <button onClick={() => setEditingArticle(null)} className="p-2 hover:bg-secondary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input
                  value={articleForm.title}
                  onChange={(e) => setArticleForm((p) => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Content</label>
                <RichTextEditor
                  value={articleForm.content}
                  onChange={(content) => setArticleForm((p) => ({ ...p, content }))}
                  placeholder="Write your article content here..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Tags (comma separated)</label>
                <input
                  value={articleForm.tags}
                  onChange={(e) => setArticleForm((p) => ({ ...p, tags: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URLs (Google Drive)</label>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste Google Drive image URL here..."
                    className="neu-input flex-1 px-4 py-2 text-sm text-foreground font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && addImageUrl()}
                  />
                  <button
                    onClick={addImageUrl}
                    className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" />
                    Add URL
                  </button>
                </div>
                {articleForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {articleForm.images.map((img, idx) => {
                      const imageUrl = getImageUrl(img);
                      return imageUrl ? (
                        <div key={idx} className="relative">
                          <img src={imageUrl} alt={`Article ${idx}`} className="w-full h-24 object-cover border-3 border-border" onError={(e) => {e.currentTarget.style.display = 'none';}} />
                          <button
                            onClick={() => removeArticleImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 border border-white cursor-pointer hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div key={idx} className="relative h-24 bg-secondary border-3 border-border flex items-center justify-center text-xs text-muted-foreground">
                          <span>Broken: {img.substring(0, 20)}...</span>
                          <button
                            onClick={() => removeArticleImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 border border-white cursor-pointer hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No images added yet</div>
                )}
              </div>

              {/* Rich text preview */}
              {articleForm.content && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Preview</label>
                  <div
                    className="p-4 bg-secondary border-3 border-border prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: articleForm.content }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={saveArticle} className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4" /> Save Article
                </button>
                <button onClick={() => setEditingArticle(null)} className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Course Editor Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingCourse.id ? 'Edit Course' : 'New Course'}
              </h3>
              <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-secondary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm((p) => ({ ...p, category: e.target.value }))}
                    className="neu-input w-full px-4 py-3 text-foreground"
                  >
                    <option value="HLD">HLD</option>
                    <option value="LLD">LLD</option>
                    <option value="Fundamentals">Fundamentals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Difficulty</label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm((p) => ({ ...p, difficulty: e.target.value }))}
                    className="neu-input w-full px-4 py-3 text-foreground"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Thumbnail URL (Google Drive)</label>
                <input
                  value={courseForm.thumbnail}
                  onChange={(e) => setCourseForm((p) => ({ ...p, thumbnail: e.target.value }))}
                  placeholder="Paste Google Drive image URL..."
                  className="neu-input w-full px-4 py-3 text-foreground font-mono text-sm"
                />
              </div>

              {/* Lessons Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold uppercase tracking-wider">Lessons ({courseForm.lessons.length})</label>
                  <button
                    onClick={() => {
                      setEditingLesson({ title: '', youtubeId: '', duration: '', description: '' });
                      setEditingLessonIndex(null);
                    }}
                    className="neu-btn px-2 py-1 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Lesson
                  </button>
                </div>

                {/* Lessons List */}
                {courseForm.lessons.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {courseForm.lessons.map((lesson, idx) => (
                      <div key={lesson.id || idx} className="p-3 bg-secondary border-2 border-border flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{lesson.duration} • {lesson.youtubeId}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <button
                            onClick={() => {
                              setEditingLesson(lesson);
                              setEditingLessonIndex(idx);
                            }}
                            className="p-1 hover:bg-primary/20 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeLesson(idx)} className="p-1 hover:bg-red-600/20 cursor-pointer">
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lesson Form */}
                {editingLesson !== null && (
                  <div className="p-4 bg-secondary border-2 border-accent-indigo space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Lesson Title</label>
                      <input
                        type="text"
                        value={editingLesson.title}
                        onChange={(e) => setEditingLesson((p) => ({ ...p!, title: e.target.value }))}
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="e.g., What is System Design?"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">YouTube Video ID</label>
                      <input
                        type="text"
                        value={editingLesson.youtubeId}
                        onChange={(e) => setEditingLesson((p) => ({ ...p!, youtubeId: e.target.value }))}
                        className="neu-input w-full px-3 py-2 text-sm text-foreground font-mono"
                        placeholder="e.g., dQw4w9WgXcQ"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Duration</label>
                      <input
                        type="text"
                        value={editingLesson.duration}
                        onChange={(e) => setEditingLesson((p) => ({ ...p!, duration: e.target.value }))}
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="e.g., 15:30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Description</label>
                      <input
                        type="text"
                        value={editingLesson.description}
                        onChange={(e) => setEditingLesson((p) => ({ ...p!, description: e.target.value }))}
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="Brief description of this lesson"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={addOrUpdateLesson}
                        className="neu-btn-blue px-3 py-2 text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> {editingLessonIndex !== null ? 'Update' : 'Add'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLesson(null);
                          setEditingLessonIndex(null);
                        }}
                        className="neu-btn px-3 py-2 text-xs bg-secondary text-foreground cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={saveCourse} className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer">
                <Save className="w-4 h-4" /> Save Course
              </button>
              <button onClick={() => setEditingCourse(null)} className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quiz Editor Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingQuiz.id ? 'Edit Quiz' : 'New Quiz'}
              </h3>
              <button onClick={() => { setEditingQuiz(null); setQuizForm({ title: '', topic: '', questions: [] }); }} className="p-2 hover:bg-secondary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Topic</label>
                <input
                  value={quizForm.topic}
                  onChange={(e) => setQuizForm((p) => ({ ...p, topic: e.target.value }))}
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="border-t border-primary/20 pt-6">
              <h4 className="font-bold uppercase tracking-wider mb-4">Questions ({quizForm.questions.length})</h4>

              {/* Question Editor */}
              <div className="neu-card p-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Question Text</label>
                    <textarea
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm((p) => ({ ...p, question: e.target.value }))}
                      className="neu-input w-full px-4 py-3 text-foreground min-h-20"
                      placeholder="Enter question text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Options</label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <input
                            value={option}
                            onChange={(e) => {
                              const updated = [...questionForm.options];
                              updated[idx] = e.target.value;
                              setQuestionForm((p) => ({ ...p, options: updated }));
                            }}
                            className="neu-input flex-1 px-4 py-2 text-foreground"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={questionForm.correctAnswer === idx}
                            onChange={() => setQuestionForm((p) => ({ ...p, correctAnswer: idx }))}
                            className="cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={addQuestion}
                      disabled={!questionForm.question || questionForm.options.filter(o => o.trim()).length < 2}
                      className="neu-btn-blue px-4 py-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                    </button>
                    {editingQuestionIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingQuestionIndex(null);
                          setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
                        }}
                        className="neu-btn px-4 py-2 text-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {quizForm.questions.length > 0 && (
                <div className="space-y-2 mb-6">
                  {quizForm.questions.map((q, idx) => (
                    <div key={q.id} className="neu-card p-3 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold">Q{idx + 1}: {q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Options: {q.options.length} | Correct: {String.fromCharCode(65 + q.correctAnswer)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => editQuestion(idx)}
                          className="p-2 hover:bg-secondary cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="p-2 hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t border-primary/20">
              <button onClick={saveQuiz} className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer">
                <Save className="w-4 h-4" /> Save Quiz
              </button>
              <button onClick={() => { setEditingQuiz(null); setQuizForm({ title: '', topic: '', questions: [] }); }} className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-wider">{coursesList.length} Courses</h3>
              <button onClick={() => openCourseEditor()} className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            </div>
            {coursesList.map((course) => {
              const thumbUrl = getImageUrl(course.thumbnail);
              const imageFailedToLoad = failedImages.has(course.thumbnail || '');
              return (
              <div key={course.id} className="neu-card p-5 flex items-center gap-4">
                {thumbUrl && !imageFailedToLoad ? (
                  <img 
                    src={thumbUrl} 
                    alt="" 
                    className="w-20 h-14 object-cover border-2 border-foreground shrink-0" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setFailedImages(prev => new Set([...prev, course.thumbnail || '']));
                    }} 
                  />
                ) : (
                  <div className="w-20 h-14 bg-secondary border-2 border-foreground flex items-center justify-center shrink-0 text-xs text-muted-foreground">No Image</div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{course.title}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{course.lessons.length} lessons · {course.category} · {course.difficulty}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openCourseEditor(course)} className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCourse(course.id)} className="p-2 border-2 border-foreground bg-destructive/20 hover:bg-destructive/40 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold uppercase tracking-wider">{articlesList.length} Articles</h3>
                <button onClick={refreshArticles} disabled={isLoading} className="p-1 border border-foreground hover:bg-primary/20 cursor-pointer disabled:opacity-50" title="Refresh articles from database">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={cleanupBrokenImages} className="neu-btn px-3 py-2 text-xs inline-flex items-center gap-1 cursor-pointer" style={{ background: '#FCA50030', boxShadow: '1px 1px 0px #FCA500' }}>
                  🧹 Cleanup Old Images
                </button>
                <button onClick={() => openArticleEditor()} className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Article
                </button>
              </div>
            </div>
            {articlesList.map((article) => {
              const articleThumbUrl = article.images && article.images.length > 0 ? getImageUrl(article.images[0]) : '';
              const imageFailedToLoad = failedImages.has(article.images?.[0] || '');
              
              return (
              <div key={article.id} className="neu-card p-5 flex items-center gap-4">
                {articleThumbUrl && !imageFailedToLoad ? (
                  <img 
                    src={articleThumbUrl} 
                    alt="" 
                    className="w-20 h-14 object-cover border-2 border-foreground shrink-0" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setFailedImages(prev => new Set([...prev, article.images?.[0] || '']));
                    }} 
                  />
                ) : (
                  <div className="w-20 h-14 bg-secondary border-2 border-foreground flex items-center justify-center shrink-0 text-xs text-muted-foreground">No Image</div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{article.title}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{article.tags.join(', ')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openArticleEditor(article)} className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteArticle(article.id)} className="p-2 border-2 border-foreground bg-destructive/20 hover:bg-destructive/40 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-wider">{quizzesList.length} Quizzes</h3>
              <button onClick={() => openQuizEditor()} className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Quiz
              </button>
            </div>
            {quizzesList.map((quiz) => (
              <div key={quiz.id} className="neu-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-indigo border-2 border-foreground flex items-center justify-center shrink-0" style={{ boxShadow: '2px 2px 0px #000' }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{quiz.title}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{quiz.questions.length} questions · {quiz.topic}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openQuizEditor(quiz)} className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteQuiz(quiz.id)} className="p-2 border-2 border-foreground bg-destructive/20 hover:bg-destructive/40 cursor-pointer" style={{ boxShadow: '2px 2px 0px #000' }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold uppercase tracking-wider">{usersList.length} Users</h3>
            {usersList.length === 0 ? (
              <div className="neu-card p-8 text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              usersList.map((u) => (
                <div key={u.id} className="neu-card p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary border-2 border-foreground flex items-center justify-center shrink-0" style={{ boxShadow: '2px 2px 0px #000' }}>
                      <span className="text-primary-foreground font-bold">{u.username[0]?.toUpperCase() || u.email[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold">{u.username}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{u.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Joined: {u.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
                      u.role === 'admin' ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent-cyan text-background border-accent-cyan'
                    }`} style={{ boxShadow: '2px 2px 0px #000' }}>
                      {u.role}
                    </span>
                    {u.role !== 'admin' && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete user ${u.username}?`)) {
                            try {
                              await usersAPI.delete(u.id);
                              setUsersList((p) => p.filter((user) => user.id !== u.id));
                            } catch (error) {
                              alert('Failed to delete user');
                            }
                          }
                        }}
                        className="p-2 hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
