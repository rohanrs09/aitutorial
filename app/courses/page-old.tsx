'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Clock, Users, Star, ArrowLeft, Search, Filter,
  TrendingUp, Code, Brain, Database, Palette, Globe
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { getAllCourses, type Course } from '@/lib/course-data';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function FallbackUserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
      <span className="text-primary-400 text-sm">👤</span>
    </div>
  );
}

const ClerkUserButton = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserButton).catch(() => FallbackUserButton),
  { ssr: false, loading: () => <FallbackUserButton /> }
);

function UserButton() {
  return isClerkConfigured ? <ClerkUserButton /> : <FallbackUserButton />;
}

const categoryIcons: Record<string, any> = {
  'Programming': Code,
  'Data Science': Database,
  'Design': Palette,
  'Business': TrendingUp,
  'Languages': Globe,
  'default': Brain
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const allCourses = getAllCourses();
    setCourses(allCourses);
    setFilteredCourses(allCourses);
    
    // Extract unique tags from all courses
    const allTags = allCourses.flatMap(c => c.tags);
    const uniqueCategories = Array.from(new Set(allTags));
    setCategories(uniqueCategories);
  }, []);

  useEffect(() => {
    let filtered = courses;
    
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.tags.includes(selectedCategory));
    }
    
    setFilteredCourses(filtered);
  }, [searchQuery, selectedCategory, courses]);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-400 bg-green-500/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-500/10';
      case 'Advanced': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Choose Your Course
          </h1>
          <p className="text-gray-400 text-lg">
            Select a course to start your learning journey with AI-powered guidance
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="text-gray-400 flex-shrink-0" size={20} />
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-light text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Courses
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-light text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No courses found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredCourses.map((course, index) => {
              const CategoryIcon = categoryIcons[course.tags[0]] || categoryIcons.default;
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Link href={`/course/${course.id}`}>
                    <div className="card hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer group h-full">
                      {/* Course Image/Icon */}
                      <div className="w-full h-40 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CategoryIcon size={48} className="text-primary-400" />
                      </div>

                      {/* Course Info */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm">{course.rating}</span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Course Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{course.enrollmentCount || 0}</span>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          Start Course →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Quick Start Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Want to practice with a custom topic?</p>
          <Link href="/learn">
            <button className="btn-secondary">
              <Brain size={18} />
              Start Free Practice Session
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
