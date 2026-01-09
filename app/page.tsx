'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Search, Filter, BookOpen, GraduationCap, TrendingUp, Clock, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CourseCard from '@/components/CourseCard';
import { getAllCourses, type Course } from '@/lib/course-data';

// Dynamically import Clerk components to avoid build errors when keys aren't configured
const SignedIn = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedIn), { ssr: false });
const SignedOut = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedOut), { ssr: false });
const SignInButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignInButton), { ssr: false });
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false });

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasClerk, setHasClerk] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  useEffect(() => {
    // Check if Clerk is configured (client-side only)
    setHasClerk(isClerkConfigured);
    // Load courses
    setCourses(getAllCourses());
  }, []);

  // Filter courses based on search and level
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white hidden sm:block">LearnAI Platform</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200">Courses</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200">My Learning</Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {hasClerk ? (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="text-gray-400 hover:text-white transition-colors hidden sm:block">
                        Sign In
                      </button>
                    </SignInButton>
                    <Link 
                      href="/sign-up"
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Get Started
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link 
                      href="/dashboard"
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Dashboard
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              ) : (
                <Link 
                  href="/learn"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Try Demo
                </Link>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-surface-light border-t border-white/5 px-4 py-4 space-y-3"
          >
            <a href="#features" className="block text-gray-300 hover:text-white py-2">Features</a>
            <a href="#topics" className="block text-gray-300 hover:text-white py-2">Topics</a>
            <a href="#pricing" className="block text-gray-300 hover:text-white py-2">Pricing</a>
          </motion.div>
        )}
      </nav>

      {/* Hero Section with Search */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Master Any Subject with AI-Powered Learning
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Choose from expert-curated courses and learn with an adaptive AI tutor that understands your pace
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                  />
                </div>

                {/* Level Filter */}
                <div className="flex gap-2">
                  {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLevel === level
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter border border-white/10'
                      }`}
                    >
                      {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="card p-4 text-center">
                <BookOpen className="text-primary-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{courses.length}</p>
                <p className="text-xs text-gray-500">Courses</p>
              </div>
              <div className="card p-4 text-center">
                <Clock className="text-blue-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">300+</p>
                <p className="text-xs text-gray-500">Hours</p>
              </div>
              <div className="card p-4 text-center">
                <GraduationCap className="text-green-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">50k+</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div className="card p-4 text-center">
                <TrendingUp className="text-pink-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">4.8</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-400 text-lg mb-2">No courses found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>


      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                  <Mic size={18} className="text-white" />
                </div>
                <span className="font-bold text-lg text-white">AI Voice Tutor</span>
              </div>
              <p className="text-gray-500 text-sm">
                AI-powered voice learning for the modern student.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</a></li>
                <li><a href="#topics" className="text-gray-400 hover:text-white text-sm">Topics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} AI Voice Tutor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
