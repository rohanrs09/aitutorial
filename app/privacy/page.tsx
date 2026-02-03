'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mic, Shield, Eye, Lock, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function PrivacyPage() {
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
            <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-orange-500/40 bg-orange-500/10 text-orange-400">
              <Shield size={14} className="mr-2" />
              Your Privacy Matters
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <Card className="bg-gray-900/80 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Camera Data</p>
                <p className="text-gray-400 text-xs">Processed locally, never stored</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/80 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Lock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Encryption</p>
                <p className="text-gray-400 text-xs">Industry-standard security</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/80 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <UserCheck className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Your Control</p>
                <p className="text-gray-400 text-xs">Delete anytime</p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-invert max-w-none">
            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Database className="text-orange-400" size={24} />
                  Information We Collect
                </h2>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                    <p className="text-sm leading-relaxed">
                      When you create an account, we collect your email address and name through our authentication 
                      provider (Clerk). This information is used to personalize your learning experience and 
                      maintain your progress across sessions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Learning Data</h3>
                    <p className="text-sm leading-relaxed">
                      We store your learning progress, quiz results, session history, and topic preferences to 
                      provide personalized recommendations and track your educational journey.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Emotion Detection Data</h3>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-orange-400">Important:</strong> When you enable the camera feature, 
                      images are processed in real-time to detect emotions (confusion, frustration, engagement). 
                      <strong> We do NOT store any camera images or video.</strong> Only emotion labels and 
                      confidence scores are temporarily used to adapt the tutoring experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Voice Data</h3>
                    <p className="text-sm leading-relaxed">
                      Voice input is transcribed to text for processing your questions. Audio recordings are 
                      not stored after transcription is complete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Lock className="text-orange-400" size={24} />
                  How We Use Your Information
                </h2>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Provide personalized AI tutoring based on your learning style and progress</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Adapt explanations in real-time when emotion detection indicates confusion</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Track your progress and generate learning analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Improve our AI models and educational content (aggregated, anonymized data only)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Send important updates about your account or our services</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Shield className="text-orange-400" size={24} />
                  Data Security
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>All data transmitted over HTTPS with TLS encryption</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Database encryption at rest using Supabase security features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Secure authentication through Clerk with optional 2FA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Regular security audits and vulnerability assessments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <UserCheck className="text-orange-400" size={24} />
                  Your Rights
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span><strong>Access:</strong> Request a copy of your personal data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span><strong>Correction:</strong> Update or correct inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span><strong>Deletion:</strong> Request deletion of your account and associated data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span><strong>Opt-out:</strong> Disable emotion detection at any time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span><strong>Export:</strong> Download your learning data in a portable format</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Mail className="text-orange-400" size={24} />
                  Contact Us
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/20">
                  <p className="text-white font-semibold">AI Voice Tutor Privacy Team</p>
                  <a href="mailto:shelkerohan7309@gmail.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                    shelkerohan7309@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-orange-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AI Voice Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
