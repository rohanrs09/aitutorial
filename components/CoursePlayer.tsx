'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  CheckCircle2, Circle, Play, HelpCircle, BookOpen, Clock 
} from 'lucide-react';
import type { Course, CourseSection, Lecture } from '@/lib/course-data';
import { getYouTubeEmbedUrl } from '@/lib/course-data';

interface CoursePlayerProps {
  course: Course;
  initialLectureId?: string;
  onLectureChange?: (lectureId: string, sectionId: string) => void;
  onRequestHelp?: (lecture: Lecture, section: CourseSection) => void;
  completedLectures?: string[];
  onToggleComplete?: (lectureId: string) => void;
}

export default function CoursePlayer({
  course,
  initialLectureId,
  onLectureChange,
  onRequestHelp,
  completedLectures = [],
  onToggleComplete,
}: CoursePlayerProps) {
  const [currentSection, setCurrentSection] = useState<CourseSection | null>(null);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Initialize current lecture
  useEffect(() => {
    if (initialLectureId) {
      // Find lecture by ID
      for (const section of course.sections) {
        const lecture = section.lectures.find(l => l.id === initialLectureId);
        if (lecture) {
          setCurrentSection(section);
          setCurrentLecture(lecture);
          setExpandedSections(new Set([section.id]));
          return;
        }
      }
    }
    
    // Default to first lecture of first section
    if (course.sections.length > 0 && course.sections[0].lectures.length > 0) {
      const firstSection = course.sections[0];
      const firstLecture = firstSection.lectures[0];
      setCurrentSection(firstSection);
      setCurrentLecture(firstLecture);
      setExpandedSections(new Set([firstSection.id]));
    }
  }, [initialLectureId, course.sections]);

  // Notify parent of lecture changes
  useEffect(() => {
    if (currentLecture && currentSection) {
      onLectureChange?.(currentLecture.id, currentSection.id);
    }
  }, [currentLecture?.id, currentSection?.id, onLectureChange]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Select a lecture
  const selectLecture = (lecture: Lecture, section: CourseSection) => {
    setCurrentLecture(lecture);
    setCurrentSection(section);
    // Expand the section if not already expanded
    setExpandedSections(prev => new Set([...prev, section.id]));
  };

  // Navigate to next lecture
  const goToNextLecture = () => {
    if (!currentSection || !currentLecture) return;

    const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const currentLectureIndex = currentSection.lectures.findIndex(l => l.id === currentLecture.id);

    // Try next lecture in current section
    if (currentLectureIndex < currentSection.lectures.length - 1) {
      const nextLecture = currentSection.lectures[currentLectureIndex + 1];
      selectLecture(nextLecture, currentSection);
      return;
    }

    // Try first lecture of next section
    if (currentSectionIndex < course.sections.length - 1) {
      const nextSection = course.sections[currentSectionIndex + 1];
      if (nextSection.lectures.length > 0) {
        selectLecture(nextSection.lectures[0], nextSection);
      }
    }
  };

  // Navigate to previous lecture
  const goToPreviousLecture = () => {
    if (!currentSection || !currentLecture) return;

    const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const currentLectureIndex = currentSection.lectures.findIndex(l => l.id === currentLecture.id);

    // Try previous lecture in current section
    if (currentLectureIndex > 0) {
      const prevLecture = currentSection.lectures[currentLectureIndex - 1];
      selectLecture(prevLecture, currentSection);
      return;
    }

    // Try last lecture of previous section
    if (currentSectionIndex > 0) {
      const prevSection = course.sections[currentSectionIndex - 1];
      if (prevSection.lectures.length > 0) {
        selectLecture(prevSection.lectures[prevSection.lectures.length - 1], prevSection);
      }
    }
  };

  // Calculate progress
  const totalLectures = course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const completedCount = completedLectures.length;
  const progressPercentage = totalLectures > 0 ? (completedCount / totalLectures) * 100 : 0;

  const canGoNext = () => {
    if (!currentSection || !currentLecture) return false;
    const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const currentLectureIndex = currentSection.lectures.findIndex(l => l.id === currentLecture.id);
    return currentLectureIndex < currentSection.lectures.length - 1 || 
           currentSectionIndex < course.sections.length - 1;
  };

  const canGoPrevious = () => {
    if (!currentSection || !currentLecture) return false;
    const currentSectionIndex = course.sections.findIndex(s => s.id === currentSection.id);
    const currentLectureIndex = currentSection.lectures.findIndex(l => l.id === currentLecture.id);
    return currentLectureIndex > 0 || currentSectionIndex > 0;
  };

  const isLectureCompleted = (lectureId: string) => completedLectures.includes(lectureId);

  return (
    <div className="flex h-full bg-[#1a1a1f] overflow-hidden">
      {/* Sidebar - Always visible (Udemy-style) */}
      <div className="w-80 lg:w-96 flex-shrink-0 border-r border-white/5 bg-[#1e1e24] flex flex-col">
        {/* Course Title Header */}
        <div className="p-5 border-b border-white/5 bg-[#16161a]">
          <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-gray-500">
            {course.sections.length} sections • {totalLectures} lectures • {course.duration}
          </p>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto">
          {course.sections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.has(section.id);
            const sectionCompleted = section.lectures.every(l => isLectureCompleted(l.id));
            const sectionProgress = section.lectures.filter(l => isLectureCompleted(l.id)).length;

            return (
              <div key={section.id} className="border-b border-white/5">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    sectionCompleted 
                      ? 'bg-green-500/15 text-green-400' 
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    {sectionCompleted ? <CheckCircle2 size={14} /> : sectionIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-medium text-white text-sm leading-snug line-clamp-2">{section.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sectionProgress}/{section.lectures.length} completed
                    </p>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Lectures List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="overflow-hidden bg-[#16161a]/50"
                    >
                      <div className="py-1">
                        {section.lectures.map((lecture, lectureIdx) => {
                          const isActive = currentLecture?.id === lecture.id;
                          const isCompleted = isLectureCompleted(lecture.id);

                          return (
                            <button
                              key={lecture.id}
                              onClick={() => selectLecture(lecture, section)}
                              className={`w-full px-5 py-3 flex items-start gap-3 transition-colors text-left ${
                                isActive
                                  ? 'bg-primary-500/10 border-l-2 border-primary-500'
                                  : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 size={15} className="text-green-400" />
                                ) : isActive ? (
                                  <Play size={15} className="text-primary-400" fill="currentColor" />
                                ) : (
                                  <span className="w-[15px] h-[15px] rounded-full border border-gray-600 flex items-center justify-center text-[10px] text-gray-600">
                                    {lectureIdx + 1}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${
                                  isActive ? 'text-primary-400 font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-300'
                                }`}>
                                  {lecture.title}
                                </p>
                                <span className="text-xs text-gray-600 mt-1 block">
                                  {lecture.duration}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#1a1a1f]">
        {/* Video Player */}
        <div className="relative w-full bg-black aspect-video max-h-[65vh]">
          {currentLecture ? (
            <iframe
              ref={playerRef}
              src={`${getYouTubeEmbedUrl(currentLecture.videoId)}?autoplay=0&rel=0&modestbranding=1`}
              title={currentLecture.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0c]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Play size={28} className="text-gray-600 ml-1" />
                </div>
                <p className="text-gray-500 text-sm">Select a lecture to start learning</p>
              </div>
            </div>
          )}
        </div>

        {/* Lecture Info & Controls */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-8 py-5 border-b border-white/5">
            {/* Title & Help Button */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg lg:text-xl font-semibold text-white mb-1.5 leading-snug">
                  {currentLecture?.title || 'Select a lecture'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{currentSection?.title}</span>
                  {currentLecture?.duration && (
                    <>
                      <span className="text-gray-700">•</span>
                      <span>{currentLecture.duration}</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Need Help Button - Routes to /learn */}
              <button
                onClick={() => currentLecture && currentSection && onRequestHelp?.(currentLecture, currentSection)}
                disabled={!currentLecture}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm sm:text-base transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 w-full sm:w-auto"
                title="Get AI help with this lecture"
              >
                <HelpCircle size={18} />
                <span>Need Help with AI Tutor</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Your progress</span>
                <span className="text-gray-400">{Math.round(progressPercentage)}% complete</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousLecture}
                disabled={!canGoPrevious()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {currentLecture && (
                <button
                  onClick={() => onToggleComplete?.(currentLecture.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isLectureCompleted(currentLecture.id)
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {isLectureCompleted(currentLecture.id) ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span className="hidden sm:inline">Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle size={16} />
                      <span className="hidden sm:inline">Mark Complete</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={goToNextLecture}
                disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto text-sm font-medium"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Lecture Description */}
          <div className="px-6 lg:px-8 py-6">
            {currentLecture?.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">About this lecture</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {currentLecture.description}
                </p>
              </div>
            )}

            {/* Help Prompt Card */}
            <div className="p-4 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-purple-500/10 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={18} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Didn't understand something?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Click <strong className="text-purple-400">"Need Help?"</strong> and the AI tutor will explain this topic in simpler terms with examples and step-by-step breakdown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
