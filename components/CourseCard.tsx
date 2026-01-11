/**
 * Course Card Component - Udemy-style course display
 * Shows course thumbnail, title, instructor, rating, and enrollment count
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Clock, Star, Users, Play } from 'lucide-react';
import type { Course } from '@/lib/course-data';

interface CourseCardProps {
  course: Course;
  index?: number;
}

export default function CourseCard({ course, index = 0 }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group h-full"
    >
      <Link href={`/course/${course.id}`} className="block h-full">
        <div className="bg-surface-light border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-primary-500/20 to-pink-500/20 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <BookOpen size={40} className="text-white" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  <Play size={16} fill="white" />
                  <span>{course.lectureCount} lectures</span>
                </div>
              </div>
            </div>
            
            {/* Level Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                course.level === 'beginner' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : course.level === 'intermediate'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {course.level}
              </span>
            </div>

            {/* Hover Play Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            {/* Title */}
            <h3 className="font-bold text-base sm:text-lg text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {course.title}
            </h3>

            {/* Instructor */}
            <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-1">
              {course.instructor}
            </p>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-2 leading-relaxed flex-1">
              {course.description}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-400 mb-3 sm:mb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={14} />
                <span>{course.sections.length} sections</span>
              </div>
              {course.enrollmentCount && (
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{(course.enrollmentCount / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>

            {/* Rating & Tags */}
            <div className="flex items-center justify-between">
              {course.rating && (
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="font-semibold text-white">{course.rating}</span>
                  <span className="text-gray-500 text-xs">({(course.enrollmentCount || 0) / 1000}K)</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap">
                {course.tags.slice(0, 2).map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-surface text-gray-400 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-primary-400 font-medium text-sm group-hover:text-primary-300 transition-colors">
                <span>Start Learning</span>
                <svg 
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
