'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, Brain, BarChart3, Target, Users, Star, ArrowRight, 
  GraduationCap, Award, Heart, Lightbulb, Zap, Globe, Shield,
  Code, Eye, Headphones, BookOpen, CheckCircle, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Team members data
const teamMembers = [
  {
    name: 'Development Team',
    role: 'Full Stack Engineers',
    description: 'Building the future of AI-powered education with cutting-edge technology.',
    avatar: '👨‍💻',
    skills: ['Next.js', 'React', 'AI/ML', 'TypeScript']
  },
  {
    name: 'AI Research Team',
    role: 'Machine Learning Engineers',
    description: 'Pioneering emotion detection and adaptive learning algorithms.',
    avatar: '🧠',
    skills: ['NLP', 'Computer Vision', 'LLMs', 'Python']
  },
  {
    name: 'UX Design Team',
    role: 'Product Designers',
    description: 'Creating intuitive and beautiful learning experiences.',
    avatar: '🎨',
    skills: ['UI/UX', 'Figma', 'User Research', 'Prototyping']
  },
  {
    name: 'Education Team',
    role: 'Learning Specialists',
    description: 'Ensuring pedagogically sound content and teaching methodologies.',
    avatar: '📚',
    skills: ['Curriculum Design', 'EdTech', 'Assessment', 'Pedagogy']
  }
];

// Mission values
const values = [
  {
    icon: Heart,
    title: 'Student-Centric',
    description: 'Every feature is designed with the learner in mind, prioritizing understanding over memorization.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We leverage cutting-edge AI to create learning experiences that were previously impossible.'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is yours. We process emotion data in real-time without storing sensitive information.'
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Quality education should be available to everyone, anywhere, anytime.'
  }
];

// Timeline milestones
const milestones = [
  { year: '2025', title: 'Project Inception', description: 'Started research on emotion-aware learning systems' },
  { year: '2025', title: 'MVP Launch', description: 'Released first version with voice tutoring and basic emotion detection' },
  { year: '2025', title: 'Course Expansion', description: 'Added DSA, Economics, GRE Prep, and custom topic support' },
  { year: '2026', title: 'Advanced Features', description: 'Launched quiz system, progress tracking, and achievement badges' },
];

// Technology stack
const techStack = [
  { name: 'Next.js 14', category: 'Frontend', icon: '⚡' },
  { name: 'React 18', category: 'UI Library', icon: '⚛️' },
  { name: 'TypeScript', category: 'Language', icon: '📘' },
  { name: 'Tailwind CSS', category: 'Styling', icon: '🎨' },
  { name: 'Own SLM', category: 'Language Model', icon: '🧠' },
  { name: 'Gemini Vision', category: 'Emotion AI', icon: '👁️' },
  { name: 'ElevenLabs', category: 'Voice Synthesis', icon: '🎙️' },
  { name: 'Supabase', category: 'Database', icon: '🗄️' },
  { name: 'Clerk', category: 'Authentication', icon: '🔐' },
  { name: 'Framer Motion', category: 'Animations', icon: '✨' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Mic size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white">AI Voice Tutor</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link href="/#courses" className="btn-primary text-sm px-4 py-2">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
              <Heart size={14} className="mr-2" />
              Our Story
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Reimagining Education with{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                AI & Empathy
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              We believe learning should adapt to you, not the other way around. 
              AI Voice Tutor combines advanced AI with emotional intelligence to create 
              a truly personalized learning experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Target size={14} className="mr-2" />
                Our Mission
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Making Quality Education <span className="text-orange-400">Accessible</span> to Everyone
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Traditional education often fails to meet individual learning needs. Students get left behind 
                when they don't understand, and there's no one to notice their confusion. We're changing that.
              </p>
              <p className="text-gray-400 leading-relaxed mb-8">
                Our AI tutor doesn't just answer questions—it watches for signs of confusion, 
                adapts its teaching style, and ensures every learner gets the support they need to succeed.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-orange-500/20">
                  <Users className="text-orange-400" size={20} />
                  <span className="text-white font-semibold">10K+ Learners</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-orange-500/20">
                  <BookOpen className="text-orange-400" size={20} />
                  <span className="text-white font-semibold">50K+ Lessons</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-orange-500/20">
                  <Star className="text-orange-400" size={20} />
                  <span className="text-white font-semibold">95% Satisfaction</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {values.map((value, index) => (
                <Card key={index} className="bg-gray-900/80 border-orange-500/20 hover:border-orange-500/40 transition-all">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-3 border border-orange-500/30">
                      <value.icon className="text-orange-400" size={20} />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Deep Dive */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Zap size={14} className="mr-2" />
                The Technology
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                How Our <span className="text-orange-400">AI</span> Works
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                A deep dive into the technology powering personalized learning
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gray-900/80 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                    <Brain className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Multi-Model AI</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    We orchestrate multiple AI models (GPT-4, Gemini, specialized SLMs) to provide 
                    the best response for each situation. Complex explanations use powerful models, 
                    while quick answers use efficient ones.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Intelligent model routing
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Fallback reliability
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Cost optimization
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gray-900/80 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <Eye className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Emotion Detection</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Using Gemini Vision, we analyze facial expressions to detect confusion, 
                    frustration, or engagement. This enables proactive support before students 
                    even ask for help.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Real-time analysis
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Privacy-preserving
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Consent-based
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gray-900/80 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                    <Headphones className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Voice Synthesis</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    ElevenLabs powers our natural voice responses, making interactions feel like 
                    talking to a real tutor. Voice-first design reduces friction and improves retention.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Natural sounding
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Low latency
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      Smart caching
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Code size={14} className="mr-2" />
                Built With
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-4">
                Our <span className="text-orange-400">Tech Stack</span>
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-4 rounded-xl bg-gray-900/80 border border-orange-500/20 hover:border-orange-500/40 transition-all text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tech.icon}</div>
                <p className="text-white font-semibold text-sm">{tech.name}</p>
                <p className="text-gray-500 text-xs">{tech.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Users size={14} className="mr-2" />
                The Team
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-4">
                Meet Our <span className="text-orange-400">Teams</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Passionate experts working together to revolutionize education
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-gray-900/80 border-orange-500/20 hover:border-orange-500/40 transition-all group">
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-4xl mb-4 border border-orange-500/30 group-hover:scale-110 transition-transform">
                      {member.avatar}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-orange-400 text-sm mb-3">{member.role}</p>
                    <p className="text-gray-400 text-sm mb-4">{member.description}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Sparkles size={14} className="mr-2" />
                Our Journey
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-4">
                Project <span className="text-orange-400">Timeline</span>
              </h2>
            </motion.div>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-orange-500 to-amber-500" />
            
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="p-4 rounded-xl bg-gray-900/80 border border-orange-500/20">
                    <span className="text-orange-400 font-bold">{milestone.year}</span>
                    <h3 className="text-white font-semibold mt-1">{milestone.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-orange-500 border-4 border-surface" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-light/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/90 border-orange-500/30 overflow-hidden">
              <CardContent className="p-10 sm:p-14 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">
                  Ready to Start <span className="text-orange-400">Learning</span>?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto relative">
                  Join thousands of learners who are already experiencing the future of education.
                </p>
                <Link href="/#courses" className="relative inline-block">
                  <Button size="lg" className="text-base inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-gray-900 font-bold shadow-lg shadow-orange-500/40">
                    Browse Courses
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-orange-500/10">
        <div className="max-w-6xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Mic size={18} className="text-white" />
            </div>
            <span className="font-bold text-white">AI Voice Tutor</span>
          </Link>
          <p className="text-gray-400 text-sm mb-4">
            Transforming education with AI-powered voice tutoring
          </p>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} AI Voice Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
