'use client';

/**
 * IMPROVED Courses Page
 * 
 * UI/UX Improvements:
 * - Uses PageHeader for consistent navigation
 * - Better responsive grid (1/2/3 columns)
 * - Cleaner filter UI with badges
 * - Improved card design with shadcn Card
 * - Better hover states
 * - Proper loading and empty states
 * - Mobile-first approach
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  BookOpen, Clock, Users, Star, Search, X,
  TrendingUp, Code, Brain, Database, Palette, Globe
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Layout Components
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, PageSection } from '@/components/layout/PageContainer';

// UI Components
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

// Data (NO CHANGES)
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
  'DSA': Code,
  'Algorithms': Brain,
  'default': Brain
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses (NO LOGIC CHANGES)
  useEffect(() => {
    const allCourses = getAllCourses();
    setCourses(allCourses);
    setFilteredCourses(allCourses);
    
    const allTags = allCourses.flatMap(c => c.tags);
    const uniqueCategories = Array.from(new Set(allTags));
    setCategories(uniqueCategories);
    
    setIsLoading(false);
  }, []);

  // Filter courses (NO LOGIC CHANGES)
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
      case 'beginner': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header - Using PageHeader Component */}
      <PageHeader
        title="Courses"
        backHref="/dashboard"
        backLabel="Back"
        transparent
        actions={<UserButton />}
      />

      {/* Main Content - Using PageContainer */}
      <PageContainer maxWidth="xl">
        {/* Search and Filters Section */}
        <PageSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <Input
                type="text"
                placeholder="Search courses by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category Pills - Simplified */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              
              {categories.slice(0, 5).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>
        </PageSection>

        {/* Courses Grid */}
        <PageSection>
          {isLoading ? (
            // Loading State
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} variant="elevated" padding="none">
                  <div className="animate-pulse">
                    <div className="h-40 bg-surface-lighter rounded-t-2xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-surface-lighter rounded w-3/4" />
                      <div className="h-3 bg-surface-lighter rounded w-full" />
                      <div className="h-3 bg-surface-lighter rounded w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-lighter flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No courses found
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'No courses are available at the moment.'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </motion.div>
          ) : (
            // Courses Grid
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCourses.map((course, index) => {
                  const CategoryIcon = categoryIcons[course.tags[0]] || categoryIcons.default;
                  
                  return (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        delay: index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                    >
                      <Link href={`/course/${course.id}`}>
                        <Card 
                          variant="elevated" 
                          padding="none"
                          hover
                          className="h-full group overflow-hidden"
                        >
                          {/* Course Icon/Image */}
                          <div className="relative h-40 bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
                            <CategoryIcon 
                              size={64} 
                              className="text-primary-400 group-hover:scale-110 transition-transform duration-300" 
                            />
                            {/* Difficulty Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge 
                                variant="outline"
                                className={getDifficultyColor(course.level)}
                              >
                                {course.level}
                              </Badge>
                            </div>
                          </div>

                          {/* Course Info */}
                          <CardContent className="p-4 space-y-3">
                            {/* Title and Rating */}
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                                  {course.title}
                                </h3>
                                {course.rating && (
                                  <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-medium">{course.rating}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {course.description}
                              </p>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen size={12} />
                                <span>{course.lectureCount} lectures</span>
                              </div>
                              {course.enrollmentCount && (
                                <div className="flex items-center gap-1">
                                  <Users size={12} />
                                  <span>{course.enrollmentCount}</span>
                                </div>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {course.tags.slice(0, 3).map((tag) => (
                                <Badge 
                                  key={tag}
                                  variant="outline"
                                  className="text-xs bg-surface border-white/10 text-gray-400"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {course.tags.length > 3 && (
                                <Badge 
                                  variant="outline"
                                  className="text-xs bg-surface border-white/10 text-gray-400"
                                >
                                  +{course.tags.length - 3}
                                </Badge>
                              )}
                            </div>

                            {/* CTA */}
                            <div className="pt-2">
                              <div className="text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                Start Course
                                <span className="text-lg">→</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </PageSection>
      </PageContainer>
    </div>
  );
}
