'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, BarChart3, Sparkles, CheckCircle, ArrowRight, 
  Play, Volume2, BookOpen, Target, Zap, Users, Star, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ResumeSession from '@/components/ResumeSession';
import CourseCard from '@/components/CourseCard';
import { getAllCourses } from '@/lib/course-data';

// Dynamically import Clerk components to avoid build errors when keys aren't configured
const SignedIn = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedIn), { ssr: false });
const SignedOut = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedOut), { ssr: false });
const SignInButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignInButton), { ssr: false });
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false });

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const features = [
  {
    icon: Mic,
    title: 'Voice-First Learning',
    description: 'Simply speak your questions naturally. Our AI understands context and responds conversationally.'
  },
  {
    icon: Brain,
    title: 'Emotion-Aware Adaptation',
    description: 'Real-time emotion detection adjusts explanations when you\'re confused or accelerates when you\'re confident.'
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Visual dashboards track your learning journey with detailed analytics and mastery levels.'
  },
  {
    icon: Sparkles,
    title: 'Interactive Slides',
    description: 'Auto-generated learning slides with diagrams, quizzes, and key takeaways synced with audio.'
  },
];

const topics = [
  'Economics', 'Data Structures', 'Algorithms', 'GRE Prep', 
  'Programming', 'Mathematics', 'Aptitude', 'Custom Topics'
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'GRE Student',
    content: 'The voice interaction feels so natural. It\'s like having a patient tutor available 24/7.',
    rating: 5
  },
  {
    name: 'Alex K.',
    role: 'CS Student',
    content: 'Finally understood recursion! The AI detected I was confused and simplified perfectly.',
    rating: 5
  },
  {
    name: 'Priya R.',
    role: 'MBA Student',
    content: 'Economics concepts became crystal clear. The adaptive teaching is incredible.',
    rating: 5
  }
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '10 voice sessions/month',
      '3 topics available',
      'Basic progress tracking',
      'Community support'
    ],
    cta: 'Start Free',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: [
      'Unlimited voice sessions',
      'All topics + custom topics',
      'Advanced analytics',
      'Emotion detection',
      'Priority support',
      'Session history'
    ],
    cta: 'Start Pro Trial',
    highlighted: true
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Admin dashboard',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasClerk, setHasClerk] = useState(false);
  const courses = getAllCourses();

  useEffect(() => {
    // Check if Clerk is configured (client-side only)
    setHasClerk(isClerkConfigured);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <Mic size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white hidden sm:block">AI Voice Tutor</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#courses" className="text-gray-400 hover:text-white transition-colors duration-200 animated-underline">Courses</a>
              <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200 animated-underline">Features</a>
              <a href="#topics" className="text-gray-400 hover:text-white transition-colors duration-200 animated-underline">Topics</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200 animated-underline">Pricing</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {hasClerk ? (
                <>
                  <SignedOut>
                    <a 
                      href="#courses"
                      className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                    >
                      Courses
                    </a>
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
                    <a 
                      href="#courses"
                      className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                    >
                      Courses
                    </a>
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
                <a 
                  href="#courses"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Browse Courses
                </a>
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
            <a href="#courses" className="block text-gray-300 hover:text-white py-2">Courses</a>
            <a href="#features" className="block text-gray-300 hover:text-white py-2">Features</a>
            <a href="#topics" className="block text-gray-300 hover:text-white py-2">Topics</a>
            <a href="#pricing" className="block text-gray-300 hover:text-white py-2">Pricing</a>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6 hover:bg-primary-500/15 hover:border-primary-500/30 transition-all duration-300 cursor-default"
            >
              <Sparkles size={16} className="animate-pulse-slow" />
              <span>AI-Powered Adaptive Learning</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Learn Smarter with
              <span className="gradient-text"> Voice AI</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Experience the future of education. Speak naturally, learn adaptively, 
              and master any subject with an AI tutor that understands you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {hasClerk ? (
                <>
                  <SignedOut>
                    <a 
                      href="#courses"
                      className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
                    >
                      <Play size={20} className="mr-2" />
                      Browse Courses
                    </a>
                    <Link 
                      href="/sign-up"
                      className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
                    >
                      <BookOpen size={20} className="mr-2" />
                      Get Started
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <a 
                      href="#courses"
                      className="btn-primary text-lg px-8 py-4"
                    >
                      <Play size={20} className="mr-2" />
                      Browse Courses
                    </a>
                  </SignedIn>
                </>
              ) : (
                <a 
                  href="#courses"
                  className="btn-primary text-lg px-8 py-4"
                >
                  <Play size={20} className="mr-2" />
                  Browse Courses
                </a>
              )}
            </div>

            {/* Resume Session Component */}
            <div className="max-w-2xl mx-auto mb-12">
              {hasClerk && (
                <SignedIn>
                  <ResumeSession />
                </SignedIn>
              )}
            </div>

            {/* Hero Visual */}
            <div className="relative max-w-4xl mx-auto">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-surface-light to-surface overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center animate-pulse">
                      <Mic size={40} className="text-white sm:w-14 sm:h-14" />
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base">&ldquo;Explain binary search to me...&rdquo;</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Live Demo
                </div>
              </div>
              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -left-4 sm:left-0 top-1/4 bg-surface-light border border-white/10 rounded-xl p-3 sm:p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Brain className="text-primary-400" size={20} />
                  <div>
                    <p className="text-white font-medium text-sm">Emotion Detected</p>
                    <p className="text-green-400 text-xs">Engaged & Curious</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -right-4 sm:right-0 bottom-1/4 bg-surface-light border border-white/10 rounded-xl p-3 sm:p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Target className="text-pink-400" size={20} />
                  <div>
                    <p className="text-white font-medium text-sm">Mastery Level</p>
                    <p className="text-pink-400 text-xs">85% Complete</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Simplified to 3 */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Why AI Voice Tutor?</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Learning that adapts to you
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.slice(0, 3).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="text-primary-400" size={24} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section - Udemy Style */}
      <section id="courses" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Featured Courses
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Start learning with structured video courses from top educators. 
                Get AI help whenever you need it.
              </p>
            </motion.div>
          </div>

          {/* Course Cards Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>

          {/* Browse More CTA */}
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              More courses coming soon! Each course includes AI-powered tutoring support.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {topics.slice(0, 6).map((topic, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-surface-light rounded-full text-gray-300 border border-white/10 text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section - Removed, integrated into courses */}
      <section id="topics" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Popular Topics</h2>
            <p className="text-gray-400">Choose what you want to learn</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {topics.map((topic, index) => (
              <a key={index} href="#courses">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-surface-light rounded-full text-gray-300 border border-white/10 hover:border-primary-500/50 hover:text-white hover:bg-primary-500/10 transition-all duration-200 cursor-pointer text-sm sm:text-base select-none inline-block"
                >
                  {topic}
                </motion.span>
              </a>
            ))}
          </div>

          <div className="text-center">
            <a href="#courses" className="btn-primary inline-flex items-center gap-2">
              Browse All Courses
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card bg-gradient-to-br from-primary-500/10 to-pink-500/10 border-primary-500/20 py-12 sm:py-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of learners who are mastering new skills with AI Voice Tutor.
            </p>
            <a 
              href="#courses"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            >
              Browse Courses
              <ArrowRight size={20} />
            </a>
          </motion.div>
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
