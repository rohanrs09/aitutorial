"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Mic,
  Brain,
  BarChart3,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Play,
  Volume2,
  BookOpen,
  Target,
  Zap,
  Users,
  Star,
  Menu,
  X,
  Check,
  GraduationCap,
  Award,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  MessageSquare,
  Headphones,
  Eye,
  Lightbulb,
  Code,
  ChevronDown,
  Quote,
  Heart,
  Rocket,
  FileText,
  Video,
  PenTool,
  Layout,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ResumeSession from "@/components/ResumeSession";
import CourseCard from "@/components/CourseCard";
import { getAllCourses } from "@/lib/course-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/contexts/AuthContext";
import { UserButtonWithLogout as UserButton } from "@/components/LogoutConfirmModal";

// Auth-aware components using Supabase
function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}

// Auth is always available with Supabase
const hasAuth = true;

// Stats data
const stats = [
  { value: "1K+", label: "Active Learners", icon: Users },
  { value: "10K+", label: "Lessons Completed", icon: BookOpen },
  { value: "97%", label: "Satisfaction Rate", icon: Star },
  { value: "24/7", label: "AI Availability", icon: Clock },
];

// How it works steps - Accurate app flow
const howItWorksSteps = [
  {
    step: "01",
    title: "Select Your Course",
    description:
      "Browse curated courses like DSA, Economics, GRE Prep, or create a custom learning topic tailored to your needs.",
    icon: BookOpen,
    color: "from-orange-500 to-amber-500",
  },
  {
    step: "02",
    title: "Identify Learning Gaps",
    description:
      "Tell the AI what specific topic or concept you need help with. Our SLM understands your context and learning level.",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "03",
    title: "Learn with Voice AI",
    description:
      "Engage in natural voice conversations with our Small Language Model. Get explanations, ask follow-ups, and interact naturally.",
    icon: Mic,
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "04",
    title: "Interactive Learning",
    description:
      "AI generates slides, quizzes, and code examples. Emotion detection adapts explanations when you're confused or speeds up when confident.",
    icon: Sparkles,
    color: "from-green-500 to-emerald-500",
  },
];

// Extended features
const features = [
  {
    icon: Mic,
    title: "Voice-First Learning",
    description:
      "Simply speak your questions naturally. Our AI understands context and responds conversationally.",
    highlight: "Natural Conversation",
  },
  {
    icon: Brain,
    title: "Emotion-Aware Adaptation",
    description:
      "Real-time emotion detection adjusts explanations when you're confused or accelerates when you're confident.",
    highlight: "Smart Detection",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Visual dashboards track your learning journey with detailed analytics and mastery levels.",
    highlight: "Deep Analytics",
  },
  {
    icon: Sparkles,
    title: "Interactive Slides",
    description:
      "Auto-generated learning slides with diagrams, quizzes, and key takeaways synced with audio.",
    highlight: "Auto-Generated",
  },
  {
    icon: Code,
    title: "Code Examples",
    description:
      "Get runnable code snippets with syntax highlighting for programming topics.",
    highlight: "Copy & Run",
  },
  {
    icon: Award,
    title: "Achievement System",
    description:
      "Earn badges and track milestones as you progress through your learning journey.",
    highlight: "Gamified",
  },
];

// Technology stack
const techStack = [
  { name: "Next.js 14", description: "React Framework", icon: "⚡" },
  { name: "Own SLM", description: "Language Model", icon: "🧠" },
  { name: "Gemini Vision", description: "Emotion Detection", icon: "👁️" },
  { name: "ElevenLabs", description: "Voice Synthesis", icon: "🎙️" },
  { name: "Supabase", description: "Database & Auth", icon: "🗄️" },
  { name: "Tailwind CSS", description: "Styling", icon: "🎨" },
];

// FAQ data
const faqs = [
  {
    question: "How does the AI Voice Tutor work?",
    answer:
      "Our AI tutor uses advanced language models to understand your questions and provide personalized explanations. You can speak naturally or type, and the AI responds with structured learning content including slides, voice narration, and interactive quizzes.",
  },
  {
    question: "What subjects can I learn?",
    answer:
      "We offer courses in Data Structures & Algorithms, Economics, GRE Preparation, Programming Languages, Mathematics, and more. You can also enter any custom topic for personalized tutoring.",
  },
  {
    question: "How does emotion detection work?",
    answer:
      "With your permission, our system uses your camera to detect facial expressions indicating confusion or frustration. When detected, the AI automatically offers to simplify explanations or provide alternative approaches.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes, we take privacy seriously. Camera data is processed in real-time and never stored. Your learning progress is securely stored and only accessible to you. We use industry-standard encryption.",
  },
  {
    question: "Can I use this on mobile devices?",
    answer:
      "Yes! Our platform is fully responsive and works on smartphones, tablets, and desktops. Voice input works seamlessly across all devices with microphone access.",
  },
  {
    question: "Do I need any special equipment?",
    answer:
      "Just a device with internet access. A microphone enables voice interaction, and a camera enables emotion detection - both are optional but enhance the experience.",
  },
];

const topics = [
  "Economics",
  "Data Structures",
  "Algorithms",
  "GRE Prep",
  "Programming",
  "Mathematics",
  "Aptitude",
  "Custom Topics",
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "GRE Student",
    content:
      "The voice interaction feels so natural. It's like having a patient tutor available 24/7. My verbal score improved by 8 points!",
    rating: 5,
    avatar: "👩‍🎓",
    highlight: "+8 GRE Verbal",
  },
  {
    name: "Alex K.",
    role: "CS Student",
    content:
      "Finally understood recursion! The AI detected I was confused and simplified perfectly. Now I can solve dynamic programming problems.",
    rating: 5,
    avatar: "👨‍💻",
    highlight: "Mastered DSA",
  },
  {
    name: "Priya R.",
    role: "MBA Student",
    content:
      "Economics concepts became crystal clear. The adaptive teaching is incredible. Aced my microeconomics exam!",
    rating: 5,
    avatar: "👩‍💼",
    highlight: "Top 5% Class",
  },
  {
    name: "James L.",
    role: "Self-Learner",
    content:
      "Learning Python from scratch was daunting, but the voice tutor made it feel like chatting with a friend who happens to be an expert.",
    rating: 5,
    avatar: "🧑‍🔬",
    highlight: "Built 3 Projects",
  },
  {
    name: "Maria G.",
    role: "High School Teacher",
    content:
      "I use this to prep my lessons. The explanations are so clear that I adapt them for my students. Game changer!",
    rating: 5,
    avatar: "👩‍🏫",
    highlight: "Better Lessons",
  },
  {
    name: "David C.",
    role: "Working Professional",
    content:
      "Upskilling while working full-time is tough. 15-minute voice sessions during commute made all the difference.",
    rating: 5,
    avatar: "👨‍💼",
    highlight: "Got Promoted",
  },
];

// Credit-based pricing plans for SaaS model
const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    credits: 50,
    creditsLabel: "50 credits/month",
    features: [
      "50 AI credits per month",
      "~10 voice sessions",
      "3 course topics",
      "Basic progress tracking",
      "Email support",
    ],
    cta: "Start Free",
    highlighted: false,
    planId: null, // Free tier
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    credits: 500,
    creditsLabel: "500 credits/month",
    features: [
      "500 AI credits per month",
      "~100 voice sessions",
      "All topics + custom topics",
      "Emotion detection",
      "Advanced analytics",
      "Priority support",
      "Session history export",
    ],
    cta: "Get Pro",
    highlighted: true,
    planId: "plan_pro_monthly", // Stripe plan ID
  },
  {
    name: "Unlimited",
    price: "$49",
    period: "/month",
    credits: -1, // Unlimited
    creditsLabel: "Unlimited credits",
    features: [
      "Unlimited AI credits",
      "Unlimited voice sessions",
      "All Pro features",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "Early access to new features",
    ],
    cta: "Go Unlimited",
    highlighted: false,
    planId: "plan_unlimited_monthly", // Stripe plan ID
  },
];

// FAQ Accordion Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-orange-500/20 rounded-xl overflow-hidden bg-gray-900/50 hover:border-orange-500/40 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <ChevronDown
          size={20}
          className={`text-orange-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

// Modern Testimonial Slider Component
interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  highlight: string;
}

function TestimonialSlider({ testimonials }: { testimonials: Testimonial[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Get visible testimonials (current + neighbors for desktop)
  const getVisibleTestimonials = () => {
    const items = [];
    for (let i = -1; i <= 1; i++) {
      const index =
        (currentIndex + i + testimonials.length) % testimonials.length;
      items.push({ ...testimonials[index], position: i });
    }
    return items;
  };

  return (
    <section
      id="testimonials"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge
              variant="outline"
              className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
            >
              <Heart size={14} className="mr-2" />
              Loved by Learners
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              What Our <span className="text-orange-400">Students</span> Say
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
              Real stories from learners who transformed their education
            </p>
          </motion.div>
        </div>

        {/* Slider Container */}
        <div className="relative" ref={sliderRef}>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-gray-900/90 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 shadow-lg hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronDown className="rotate-90" size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-gray-900/90 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 shadow-lg hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronDown className="-rotate-90" size={24} />
          </button>

          {/* Cards Container */}
          <div className="flex justify-center items-center gap-6 px-8">
            {getVisibleTestimonials().map((testimonial, idx) => (
              <motion.div
                key={`${testimonial.name}-${idx}`}
                initial={false}
                animate={{
                  scale: testimonial.position === 0 ? 1 : 0.85,
                  opacity: testimonial.position === 0 ? 1 : 0.5,
                  x: testimonial.position * 20,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`${testimonial.position === 0 ? "z-20" : "z-10 hidden lg:block"} w-full max-w-lg`}
              >
                <Card
                  className={`bg-gray-900/90 backdrop-blur-sm transition-all duration-300 ${
                    testimonial.position === 0
                      ? "border-orange-500/40 shadow-2xl shadow-orange-500/20"
                      : "border-orange-500/20"
                  }`}
                >
                  <CardContent className="p-8">
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className="text-orange-400 fill-orange-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <Quote className="text-orange-500/30 mb-4" size={32} />
                    <p className="text-gray-200 leading-relaxed mb-6 text-base min-h-[80px]">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-between pt-4 border-t border-orange-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-2xl border-2 border-orange-500/40 shadow-lg">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {testimonial.name}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-green-500/40 text-green-400 bg-green-500/10 px-3 py-1"
                      >
                        {testimonial.highlight}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-3 bg-orange-500"
                    : "w-3 h-3 bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full ${isAutoPlaying ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
              />
              {isAutoPlaying ? "Auto-playing" : "Paused"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const courses = getAllCourses();

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface scroll-smooth">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/5"
            : "bg-surface/80 backdrop-blur-lg border-b border-white/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                <Mic size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-white hidden sm:block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI Voice Tutor
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-gray-400 hover:text-orange-400 transition-all duration-200 text-sm font-medium relative group"
              >
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-400 hover:text-orange-400 transition-all duration-200 text-sm font-medium relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection("courses")}
                className="text-gray-400 hover:text-orange-400 transition-all duration-200 text-sm font-medium relative group"
              >
                Courses
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gray-400 hover:text-orange-400 transition-all duration-200 text-sm font-medium relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-400 hover:text-orange-400 transition-all duration-200 text-sm font-medium relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {hasAuth ? (
                <>
                  <SignedOut>
                    {/* <a 
                      href="#courses"
                      className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                    >
                      Courses
                    </a> */}
                    <Link
                      href="/auth/login"
                      className="text-gray-400 hover:text-orange-400 transition-all duration-200 hidden sm:block font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 text-sm"
                    >
                      Get Started Free
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
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 text-sm"
                    >
                      Dashboard
                    </Link>
                    <UserButton />
                  </SignedIn>
                </>
              ) : (
                <button
                  onClick={() => scrollToSection("courses")}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 text-sm"
                >
                  Browse Courses
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-surface-light/95 backdrop-blur-xl border-t border-orange-500/20 px-4 py-6 space-y-1"
          >
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 py-3 px-4 rounded-lg transition-all duration-200"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 py-3 px-4 rounded-lg transition-all duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("courses")}
              className="block w-full text-left text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 py-3 px-4 rounded-lg transition-all duration-200"
            >
              Courses
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 py-3 px-4 rounded-lg transition-all duration-200"
            >
              FAQ
            </button>

            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 py-3 px-4 rounded-lg transition-all duration-200"
            >
              Pricing
            </button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Modern orange gradient orbs */}
        <div
          className="absolute top-20 left-10 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[80px] animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            {/* Badge - Staggered animation */}
            <motion.div
              className="mb-8 inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Badge
                variant="outline"
                className="px-4 py-2 text-sm font-bold border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300 backdrop-blur-sm shadow-lg shadow-orange-500/20"
              >
                <Sparkles size={14} className="mr-2" />
                AI-Powered Adaptive Learning
              </Badge>
            </motion.div>

            {/* Headline - Staggered animation */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Learn Smarter with
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300 bg-clip-text text-transparent font-extrabold neon-text">
                Voice AI Tutor
              </span>
            </motion.h1>

            {/* Subheadline - Staggered animation */}
            <motion.p
              className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Speak naturally, learn adaptively. Your AI tutor understands
              context, detects emotions, and adapts to your learning style in
              real-time.
            </motion.p>

            {/* CTA Buttons - Staggered animation */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {hasAuth ? (
                <>
                  <SignedOut>
                    <button
                      onClick={() => scrollToSection("courses")}
                      className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300 text-lg w-full sm:w-auto overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Play size={20} className="mr-2" />
                        Start Learning Now
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <Link
                      href="/sign-up"
                      className="px-8 py-4 bg-gray-900/80 hover:bg-gray-800 text-white font-semibold rounded-xl border-2 border-orange-500/30 hover:border-orange-500/60 shadow-lg hover:shadow-orange-500/20 transition-all duration-300 text-lg w-full sm:w-auto inline-flex items-center justify-center"
                    >
                      <Sparkles size={20} className="mr-2" />
                      Get Started Free
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <button
                      onClick={() => scrollToSection("courses")}
                      className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300 text-lg overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Play size={20} className="mr-2" />
                        Browse Courses
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </SignedIn>
                </>
              ) : (
                <button
                  onClick={() => scrollToSection("courses")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300 text-lg overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <Play size={20} className="mr-2" />
                    Browse Courses
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
            </motion.div>

            {/* Resume Session Component */}
            <div className="max-w-2xl mx-auto mb-12">
              {hasAuth && (
                <SignedIn>
                  <ResumeSession />
                </SignedIn>
              )}
            </div>

            {/* Hero Visual */}
            <motion.div
              className="relative max-w-4xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/80 overflow-hidden border border-orange-500/30 shadow-2xl shadow-orange-500/20 backdrop-blur-sm relative neon-card">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5" />
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255, 107, 53, 0.1) 40px, rgba(255, 107, 53, 0.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255, 107, 53, 0.1) 40px, rgba(255, 107, 53, 0.1) 41px)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center p-8">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/50 animate-pulse"
                      style={{ animationDuration: "2s" }}
                    >
                      <Mic
                        size={32}
                        className="text-gray-900 sm:w-12 sm:h-12"
                      />
                    </div>
                    <p className="text-gray-300 text-sm sm:text-base font-medium">
                      &ldquo;Explain binary search to me...&rdquo;
                    </p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/40 backdrop-blur-sm shadow-lg shadow-orange-500/20">
                  ● Live Demo
                </div>
              </div>
              {/* Floating stats - neon cards */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -left-4 sm:left-0 top-1/4 bg-gray-900/95 backdrop-blur-md border border-orange-500/40 rounded-xl p-3 sm:p-4 shadow-xl shadow-orange-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center border border-orange-500/50">
                    <Brain className="text-orange-400" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      Emotion Detected
                    </p>
                    <p className="text-orange-400 text-xs font-semibold">
                      Engaged & Curious
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute -right-4 sm:right-0 bottom-1/4 bg-gray-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 sm:p-4 shadow-xl shadow-amber-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center border border-amber-500/50">
                    <Target className="text-amber-400" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      Mastery Level
                    </p>
                    <p className="text-amber-400 text-xs font-semibold">
                      85% Complete
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 bg-gradient-to-b from-surface to-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-2xl bg-gray-900/50 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30">
                  <stat.icon className="text-orange-400" size={24} />
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section
        id="how-it-works"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div
          className="absolute top-1/4 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: "8s", animationDelay: "2s" }}
        />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
              >
                <Rocket size={14} className="mr-2" />
                Simple 4-Step Process
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                How It{" "}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
                Start learning in minutes with our intuitive voice-first
                platform
              </p>
            </motion.div>
          </div>

          {/* Timeline-style layout */}
          <div className="relative">
            {/* Center line for desktop */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-amber-500/50 to-orange-500/50" />

            <div className="space-y-8 lg:space-y-0">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true, margin: "-50px" }}
                  className={`relative lg:flex lg:items-center lg:gap-8 ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Card */}
                  <div
                    className={`lg:w-[calc(50%-2rem)] ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="group"
                    >
                      <Card className="bg-gray-900/90 border-orange-500/20 hover:border-orange-500/50 transition-all duration-500 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 overflow-hidden">
                        <CardContent className="p-6 sm:p-8 relative">
                          {/* Glow effect on hover */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                          />

                          <div
                            className={`flex items-start gap-4 ${index % 2 === 0 ? "lg:flex-row-reverse lg:text-right" : ""}`}
                          >
                            <div
                              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0`}
                            >
                              <step.icon className="text-white" size={32} />
                            </div>
                            <div className="flex-1">
                              <div
                                className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? "lg:justify-end" : ""}`}
                              >
                                <span
                                  className={`text-5xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30`}
                                >
                                  {step.step}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors duration-300">
                                {step.title}
                              </h3>
                              <p className="text-gray-400 leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>

                          {/* Progress indicator */}
                          <div className="mt-4 pt-4 border-t border-orange-500/10">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{
                                    width: `${(index + 1) * 25}%`,
                                  }}
                                  transition={{
                                    delay: 0.5 + index * 0.1,
                                    duration: 0.8,
                                  }}
                                  viewport={{ once: true }}
                                  className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                                />
                              </div>
                              <span className="text-xs text-gray-500 font-medium">
                                {(index + 1) * 25}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{
                        delay: index * 0.15 + 0.2,
                        duration: 0.4,
                        type: "spring",
                      }}
                      viewport={{ once: true }}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${step.color} shadow-lg shadow-orange-500/50 ring-4 ring-surface`}
                    />
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="hidden lg:block lg:w-[calc(50%-2rem)]" />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-16"
          >
            <a
              href="#pricing"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 group"
            >
              <Play
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              Start Learning Now
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section
        id="features"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
              >
                <Sparkles size={14} className="mr-2" />
                Powerful Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Why Choose{" "}
                <span className="text-orange-400">AI Voice Tutor</span>?
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
                Everything you need for effective, personalized learning
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full bg-gray-900/80 border-orange-500/20 hover:border-orange-500/50 hover:bg-gray-900/90 transition-all duration-300 backdrop-blur-sm group neon-card">
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/40 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                        <feature.icon className="text-orange-400" size={24} />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-500/30 text-orange-400 bg-orange-500/10"
                      >
                        {feature.highlight}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section
        id="courses"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30"
      >
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
                Start learning with structured courses. Get AI-powered tutoring
                support whenever you need it.
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
              More courses coming soon. Each includes AI-powered tutoring
              support.
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
      <section
        id="topics"
        className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Popular <span className="text-orange-400">Topics</span>
            </h2>
            <p className="text-lg text-gray-400 font-light">
              Choose what you want to learn
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {topics.map((topic, index) => (
              <a key={index} href="#courses">
                <span className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-900/80 rounded-full text-gray-300 border border-orange-500/20 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer text-sm sm:text-base select-none inline-block font-medium backdrop-blur-sm">
                  {topic}
                </span>
              </a>
            ))}
          </div>

          <div className="text-center">
            <a
              href="#courses"
              className="neon-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg"
            >
              Browse All Courses
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Modern Slider */}
      <TestimonialSlider testimonials={testimonials} />

      {/* Technology Section */}
      <section
        id="technology"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
              >
                <Code size={14} className="mr-2" />
                Cutting-Edge Tech
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                Powered by <span className="text-orange-400">Advanced AI</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Our platform leverages the latest advancements in artificial
                intelligence to deliver a truly personalized learning
                experience. From natural language understanding to emotion
                detection, every component is designed to help you learn
                effectively.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900/50 border border-orange-500/20">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30 flex-shrink-0">
                    <Brain className="text-orange-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      Multi-Model AI Orchestration
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Intelligent routing between Own SLM, Gemini, and
                      specialized models for optimal responses.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900/50 border border-orange-500/20">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <Eye className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      Real-Time Emotion Detection
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Computer vision analyzes facial cues to detect confusion
                      and adapt explanations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900/50 border border-orange-500/20">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                    <Headphones className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      Natural Voice Synthesis
                    </h4>
                    <p className="text-gray-400 text-sm">
                      ElevenLabs powers lifelike voice responses that feel like
                      talking to a real tutor.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-gray-900/80 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 text-center group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {tech.icon}
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {tech.name}
                  </p>
                  <p className="text-gray-500 text-xs">{tech.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
              >
                <HelpCircle size={14} className="mr-2" />
                Got Questions?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Frequently Asked{" "}
                <span className="text-orange-400">Questions</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
                Everything you need to know about AI Voice Tutor
              </p>
            </motion.div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 p-6 rounded-xl bg-gray-900/50 border border-orange-500/20"
          >
            <p className="text-gray-300 mb-4">Still have questions?</p>
            <a
              href="mailto:shelkerohan7309@gmail.com"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <MessageSquare size={18} />
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section
        id="pricing"
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-surface-light/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px]" />

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400"
            >
              <Zap size={14} className="mr-2" />
              Flexible Pricing
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Start{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Learning?
              </span>
            </h2>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Choose from our flexible credit-based plans. Start free with 50 credits,
              or upgrade for unlimited learning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                View Pricing Plans
                <ArrowRight size={20} />
              </Link>
              
              <SignedOut>
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </SignedOut>
            </div>

            {/* Quick pricing overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
              <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-orange-500/20">
                <div className="text-2xl font-bold text-white mb-2">$0</div>
                <div className="text-orange-400 font-semibold mb-1">Starter</div>
                <div className="text-sm text-gray-400">50 credits/month</div>
              </div>
              <div className="p-6 bg-gradient-to-b from-orange-500/10 to-amber-500/5 backdrop-blur-sm rounded-xl border-2 border-orange-500/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-bold rounded-full text-gray-900">
                    Popular
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">$19</div>
                <div className="text-orange-400 font-semibold mb-1">Pro</div>
                <div className="text-sm text-gray-400">500 credits/month</div>
              </div>
              <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-orange-500/20">
                <div className="text-2xl font-bold text-white mb-2">$49</div>
                <div className="text-orange-400 font-semibold mb-1">Unlimited</div>
                <div className="text-sm text-gray-400">Unlimited credits</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gray-900/90 border-orange-500/30 backdrop-blur-md shadow-2xl shadow-orange-500/20 neon-card overflow-hidden">
              <CardContent className="p-10 sm:p-14 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10" />
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255, 107, 53, 0.1) 30px, rgba(255, 107, 53, 0.1) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255, 107, 53, 0.1) 30px, rgba(255, 107, 53, 0.1) 31px)",
                  }}
                />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight relative">
                  Ready to <span className="text-orange-400">Transform</span>{" "}
                  Your Learning?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto font-light relative">
                  Join thousands of learners mastering new skills with AI Voice
                  Tutor.
                </p>
                <a href="#courses" className="relative inline-block">
                  <Button
                    size="lg"
                    className="text-base inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-gray-900 font-bold shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300"
                  >
                    Browse Courses
                    <ArrowRight size={18} />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10 bg-surface-light/30 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          {/* Main Footer Content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Mic size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl text-white">
                  AI Voice Tutor
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                Transform your learning experience with AI-powered voice
                tutoring. Speak naturally, learn adaptively, and track your
                progress with emotion-aware technology.
              </p>
              {/* Newsletter */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-900/80 border border-orange-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-semibold rounded-lg text-sm hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/30">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#courses"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Courses
                  </a>
                </li>
                <li>
                  <a
                    href="#technology"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Technology
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Reviews
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#faq"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    FAQ
                  </a>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    About Us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:shelkerohan7309@gmail.com"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:shelkerohan7309@gmail.com"
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={12} />
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-orange-500/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} AI Voice Tutor -layfirto. All
                rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400 text-xs">
                  All systems operational
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/rohanrs09/aitutorial.git"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-900/80 border border-orange-500/20 flex items-center justify-center text-gray-400 hover:text-orange-400 hover:border-orange-500/50 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/rohan-shelke-bba43b22b"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-900/80 border border-orange-500/20 flex items-center justify-center text-gray-400 hover:text-orange-400 hover:border-orange-500/50 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
