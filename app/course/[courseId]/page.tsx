'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Users, Star, Play } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import CoursePlayer from '@/components/CoursePlayer';
import AITutorPanel from '@/components/AITutorPanel';
import { getCourseById, type Course, type Lecture, type CourseSection } from '@/lib/course-data';

// Dynamically import Clerk components
const SignedIn = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedIn), { ssr: false });
const SignedOut = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedOut), { ssr: false });
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false });
const SignInButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignInButton), { ssr: false });

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Course Page - Main Learning Interface
 * 
 * DESIGN PRINCIPLES:
 * - Course content is the PRIMARY focus
 * - AI Tutor panel is CLOSED by default
 * - AI opens ONLY when user clicks "Need Help"
 * - Video playback is never interrupted by AI
 * - Progress is tracked and persisted
 */
export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  // Course state
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current lecture context (for AI tutor)
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [currentSection, setCurrentSection] = useState<CourseSection | null>(null);
  
  // AI Tutor panel state - CLOSED by default
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  
  // Progress tracking
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [lastLectureId, setLastLectureId] = useState<string | undefined>();
  const [hasClerk, setHasClerk] = useState(false);

  // Check Clerk configuration
  useEffect(() => {
    setHasClerk(isClerkConfigured);
  }, []);

  // Load course data
  useEffect(() => {
    if (!courseId) return;
    
    const courseData = getCourseById(courseId);
    if (courseData) {
      setCourse(courseData);
      // Load saved progress from localStorage
      loadProgress(courseId);
    } else {
      setError('Course not found');
    }
    setLoading(false);
  }, [courseId]);

  // Load progress from localStorage
  const loadProgress = (courseId: string) => {
    try {
      const savedProgress = localStorage.getItem(`course-progress-${courseId}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setCompletedLectures(parsed.completedLectures || []);
        setLastLectureId(parsed.lastLectureId);
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  };

  // Save progress to localStorage
  const saveProgress = useCallback((completed: string[], lastId?: string) => {
    try {
      localStorage.setItem(`course-progress-${courseId}`, JSON.stringify({
        completedLectures: completed,
        lastLectureId: lastId,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [courseId]);

  // Handle lecture change
  const handleLectureChange = useCallback((lectureId: string, sectionId: string) => {
    if (!course) return;
    
    // Find the lecture and section
    const section = course.sections.find(s => s.id === sectionId);
    const lecture = section?.lectures.find(l => l.id === lectureId);
    
    if (lecture && section) {
      setCurrentLecture(lecture);
      setCurrentSection(section);
      setLastLectureId(lectureId);
      saveProgress(completedLectures, lectureId);
    }
  }, [course, completedLectures, saveProgress]);

  // Handle help request - routes to /learn page with course context
  const handleRequestHelp = useCallback((lecture: Lecture, section: CourseSection) => {
    // Pass COMPLETE lecture data for AI context
    const context = {
      courseId,
      courseTitle: course?.title,
      courseTags: course?.tags || [],
      lectureId: lecture.id,
      lectureTitle: lecture.title,
      lectureDescription: lecture.description || '',
      lectureVideoId: lecture.videoId,
      lectureDuration: lecture.duration,
      sectionId: section.id,
      sectionTitle: section.title,
      topic: lecture.title,
      source: 'course',
      timestamp: Date.now()
    };
    
    // Store complete context in sessionStorage for /learn route
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('helpContext', JSON.stringify(context));
      // Store return path
      sessionStorage.setItem('returnPath', `/course/${courseId}?lecture=${lecture.id}`);
    }
    
    // Route to /learn for AI tutor with emotion detection (main flow)
    router.push('/learn');
  }, [courseId, course, router]);

  // Close tutor panel handler - closes side panel (no page refresh)
  const handleCloseTutor = useCallback(() => {
    setIsTutorOpen(false);
    // Course video continues as-is, no state change needed
  }, []);

  // Toggle lecture completion
  const handleToggleComplete = useCallback((lectureId: string) => {
    setCompletedLectures(prev => {
      const newCompleted = prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId];
      saveProgress(newCompleted, lastLectureId);
      return newCompleted;
    });
  }, [saveProgress, lastLectureId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[80px]" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-orange-500/30" />
          <span className="text-gray-400 font-medium">Loading course...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-atmospheric flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="w-20 h-20 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-4 relative z-10">
          <BookOpen size={40} className="text-orange-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2 relative z-10">Course Not Found</h1>
        <p className="text-gray-400 mb-6 relative z-10">{error || 'The course you\'re looking for doesn\'t exist.'}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 relative z-10"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atmospheric flex flex-col relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Header - Mobile Optimized */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/5">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Back Button & Course Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all flex-shrink-0 border border-transparent hover:border-orange-500/30"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="min-w-0">
                <h1 className="font-bold text-white truncate">{course.title}</h1>
                <p className="text-xs text-gray-500 truncate hidden sm:block">
                  {course.instructor}
                </p>
              </div>
            </div>

            {/* Course Stats & User */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  <span>{course.lectureCount} lectures</span>
                </div>
                {course.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                )}
              </div>

              {/* User Button */}
              {hasClerk && (
                <>
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Udemy-style Layout */}
      <div className="flex h-[calc(100vh-56px)] relative">
        {/* Course Player - Full Width on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <CoursePlayer
            course={course}
            initialLectureId={lastLectureId}
            onLectureChange={handleLectureChange}
            onRequestHelp={handleRequestHelp}
            completedLectures={completedLectures}
            onToggleComplete={handleToggleComplete}
          />
        </motion.div>

        {/* AI Tutor Panel - Overlays on right side */}
        <AITutorPanel
          isOpen={isTutorOpen}
          onClose={handleCloseTutor}
          lecture={currentLecture}
          section={currentSection}
          courseTopic={course.tags[0] || course.title}
        />
      </div>
    </div>
  );
}
