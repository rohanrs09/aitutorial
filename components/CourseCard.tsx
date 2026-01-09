'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Users, Star, BookOpen, Play, BarChart } from 'lucide-react';
import type { Course } from '@/lib/course-data';

interface CourseCardProps {
  course: Course;
  index: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link href={`/course/${course.id}`}>
        <div className="card hover:border-primary-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative h-48 bg-gradient-to-br from-primary-500/20 to-pink-500/20 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen size={48} className="text-primary-400/50" />
            </div>
            {/* Level Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                course.level === 'beginner' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : course.level === 'intermediate'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
            </div>
            {/* Play Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                <Play size={24} className="text-white ml-1" fill="white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col">
            {/* Title */}
            <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {course.title}
            </h3>

            {/* Instructor */}
            <p className="text-sm text-gray-500 mb-3">
              by {course.instructor}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">
              {course.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={14} />
                <span>{course.lectureCount} lectures</span>
              </div>
              {course.enrollmentCount && (
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{(course.enrollmentCount / 1000).toFixed(0)}k students</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {course.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < Math.floor(course.rating!) 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-gray-600"
                      } 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-400">{course.rating}</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {course.tags.slice(0, 3).map((tag, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 text-xs bg-surface-lighter rounded-full text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <button className="w-full py-2 px-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg font-medium text-sm transition-all duration-200 border border-primary-500/20 hover:border-primary-500/30 group-hover:shadow-lg group-hover:shadow-primary-500/10">
              Start Learning
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}