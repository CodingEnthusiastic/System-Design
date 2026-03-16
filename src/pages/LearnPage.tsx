import { useState, useEffect } from 'react';
import { courses as initialCourses, Course, Lesson } from '@/data/mockData';
import { Play, Clock, ChevronRight, ArrowLeft, CheckCircle, BookOpen, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LearnPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('All');
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(false);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/courses`);
        if (response.ok) {
          const data = await response.json();
          // Convert MongoDB _id to id for compatibility
          const transformed = data.map((c: any) => ({
            id: c._id,
            title: c.title,
            description: c.description,
            category: c.category,
            thumbnail: c.thumbnail,
            difficulty: c.difficulty,
            totalDuration: c.totalDuration,
            lessons: c.lessons.map((l: any) => ({
              id: l.id || l._id || '',
              title: l.title,
              youtubeId: l.youtubeId,
              duration: l.duration,
              description: l.description,
            })),
          }));
          if (transformed.length > 0) {
            setCourses(transformed);
          }
        }
      } catch (error) {
        console.log('Using mock data (API not available)');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = ['All', 'Fundamentals', 'HLD', 'LLD'];
  const filtered = filter === 'All' ? courses : courses.filter((c) => c.category === filter);

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId);
      return next;
    });
  };

  // Course detail + video player view
  if (selectedCourse) {
    const currentLesson = activeLesson || selectedCourse.lessons[0];
    const progress = selectedCourse.lessons.filter((l) => completedLessons.has(l.id)).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Back */}
        <button
          onClick={() => { setSelectedCourse(null); setActiveLesson(null); }}
          className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="neu-card-blue overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${currentLesson.youtubeId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentLesson.title}
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                <p className="text-muted-foreground">{currentLesson.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="font-mono text-sm text-primary flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {currentLesson.duration}
                  </span>
                  <button
                    onClick={() => toggleComplete(currentLesson.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border-3 cursor-pointer transition-all ${
                      completedLessons.has(currentLesson.id)
                        ? 'bg-accent-lime text-background border-foreground'
                        : 'bg-secondary text-foreground border-foreground'
                    }`}
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {completedLessons.has(currentLesson.id) ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Sidebar */}
          <div className="space-y-4">
            <div className="neu-card p-5">
              <h3 className="font-bold text-lg mb-1">{selectedCourse.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{selectedCourse.description}</p>
              {/* Progress bar */}
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Progress</span>
                <span>{progress}/{selectedCourse.lessons.length}</span>
              </div>
              <div className="w-full h-4 bg-secondary border-2 border-foreground" style={{ boxShadow: '2px 2px 0px #000' }}>
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(progress / selectedCourse.lessons.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="neu-card divide-y-2 divide-border">
              {selectedCourse.lessons.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-all cursor-pointer ${
                    currentLesson.id === lesson.id ? 'bg-primary/20' : 'hover:bg-secondary'
                  }`}
                >
                  <div className={`w-8 h-8 shrink-0 flex items-center justify-center border-2 font-bold text-sm ${
                    completedLessons.has(lesson.id)
                      ? 'bg-accent-lime text-background border-foreground'
                      : currentLesson.id === lesson.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-foreground border-foreground'
                  }`}>
                    {completedLessons.has(lesson.id) ? '✓' : i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{lesson.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Course list view
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> LEARN
        </h1>
        <p className="text-muted-foreground font-mono text-sm">CURATED VIDEO COURSES ON SYSTEM DESIGN</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 font-bold text-sm uppercase tracking-wider border-3 cursor-pointer transition-all ${
              filter === cat
                ? 'bg-primary text-primary-foreground border-foreground'
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={filter === cat ? { boxShadow: '3px 3px 0px #000' } : { boxShadow: '2px 2px 0px #000' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <button
                onClick={() => setSelectedCourse(course)}
                className="w-full text-left group cursor-pointer"
              >
                <div className="neu-card-blue overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-primary border-3 border-white flex items-center justify-center" style={{ boxShadow: '3px 3px 0px #000' }}>
                        <Play className="w-7 h-7 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="neu-badge-blue px-3 py-1">{course.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons.length} lessons</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.totalDuration}</span>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
                        course.difficulty === 'Beginner' ? 'bg-accent-lime/20 border-accent-lime text-accent-lime' :
                        course.difficulty === 'Intermediate' ? 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow' :
                        'bg-destructive/20 border-destructive text-destructive'
                      }`}>
                        {course.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
