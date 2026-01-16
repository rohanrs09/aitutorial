'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, BarChart3, Sparkles, CheckCircle, ArrowRight, 
  Play, Volume2, BookOpen, Target, Zap, Users, Star, Menu, X, Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ResumeSession from '@/components/ResumeSession';
import CourseCard from '@/components/CourseCard';
import { getAllCourses } from '@/lib/course-data';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
                    {/* <a 
                      href="#courses"
                      className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                    >
                      Courses
                    </a> */}
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
                    {/* <a 
                      href="#courses"
                      className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                    >
                      Courses
                    </a> */}
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
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative">
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
              className="mb-8 inline-block"
            >
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium border-primary-500/20 bg-primary-500/10 text-primary-400">
                <Sparkles size={14} className="mr-2" />
                AI-Powered Adaptive Learning
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Learn Smarter with
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-pink-400 to-primary-400 bg-clip-text text-transparent">Voice AI Tutor</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
              Speak naturally, learn adaptively. Your AI tutor understands context, 
              detects emotions, and adapts to your learning style in real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
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

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Why AI Voice Tutor?</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need for effective, adaptive learning
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {features.slice(0, 3).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full hover:border-primary-500/30 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="text-primary-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                {index === 2 && (
                  <div className="mt-4">
                    <a href="#pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                      View Pricing
                      <ArrowRight size={16} />
                    </a>
                  </div>
                )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Featured Courses
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Start learning with structured courses. Get AI-powered tutoring support whenever you need it.
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
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-6">
              More courses coming soon. Each includes AI-powered tutoring support.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {topics.slice(0, 6).map((topic, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium hover:border-primary-500/30 transition-colors cursor-default"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section id="topics" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Popular Topics</h2>
            <p className="text-lg text-gray-400">Choose what you want to learn</p>
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


      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300">Simple, transparent pricing</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Choose Your{' '}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Learning Plan
                </span>
              </h2>
              
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Start free and upgrade when you are ready. All plans include our core AI tutoring features.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 lg:p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-violet-500/10 to-purple-500/5 border-2 border-violet-500/30'
                    : 'bg-white/[0.02] border border-white/5'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary-500/10 to-pink-500/10 border-primary-500/20">
              <CardContent className="p-12 sm:p-16 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                  Join thousands of learners mastering new skills with AI Voice Tutor.
                </p>
                <a href="#courses">
                  <Button size="lg" className="text-lg inline-flex items-center gap-2">
                    Browse Courses
                    <ArrowRight size={20} />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                  <Mic size={18} className="text-white" />
                </div>
                <span className="font-semibold text-white">AI Voice Tutor</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered voice learning for the modern student.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                <li><a href="#topics" className="text-gray-400 hover:text-white text-sm transition-colors">Topics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AI Voice Tutor. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">GitHub</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
