'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mic, FileText, CheckCircle, AlertTriangle, Scale, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function TermsPage() {
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
              <Scale size={14} className="mr-2" />
              Legal Agreement
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Terms of Service
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
          <div className="prose prose-invert max-w-none">
            
            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FileText className="text-orange-400" size={24} />
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  By accessing or using AI Voice Tutor ("the Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our Service. We reserve the right to update 
                  these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  2. Description of Service
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  AI Voice Tutor is an AI-powered educational platform that provides:
                </p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Voice-interactive tutoring sessions with AI-generated explanations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Structured learning content including slides, examples, and quizzes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Optional emotion detection to adapt teaching style (requires camera permission)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Progress tracking and learning analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  3. User Accounts
                </h2>
                <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">3.1 Account Creation:</strong> You may need to create an account to access 
                    certain features. You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                  <p>
                    <strong className="text-white">3.2 Accurate Information:</strong> You agree to provide accurate, current, 
                    and complete information during registration and to update such information as necessary.
                  </p>
                  <p>
                    <strong className="text-white">3.3 Account Security:</strong> You are responsible for all activities that 
                    occur under your account. Notify us immediately of any unauthorized use.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  4. Acceptable Use
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  You agree to use the Service only for lawful, educational purposes. You shall not:
                </p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Use the Service for any illegal or unauthorized purpose</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Attempt to gain unauthorized access to any part of the Service</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Interfere with or disrupt the Service or servers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Use automated systems to access the Service without permission</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Share your account credentials with others</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  5. Intellectual Property
                </h2>
                <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">5.1 Our Content:</strong> The Service and its original content, features, 
                    and functionality are owned by AI Voice Tutor and are protected by international copyright, trademark, 
                    and other intellectual property laws.
                  </p>
                  <p>
                    <strong className="text-white">5.2 AI-Generated Content:</strong> Educational content generated by our AI 
                    is provided for your personal, non-commercial educational use. You may not redistribute, sell, or 
                    commercially exploit AI-generated content without permission.
                  </p>
                  <p>
                    <strong className="text-white">5.3 Your Content:</strong> You retain ownership of any content you submit 
                    (questions, feedback). By submitting content, you grant us a license to use it for improving the Service.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <AlertTriangle className="text-orange-400" size={24} />
                  6. Disclaimers
                </h2>
                <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">6.1 Educational Purpose:</strong> The Service is designed to supplement, 
                    not replace, traditional education. AI-generated content should not be considered professional academic advice.
                  </p>
                  <p>
                    <strong className="text-white">6.2 Accuracy:</strong> While we strive for accuracy, AI-generated content 
                    may contain errors. We encourage users to verify important information from authoritative sources.
                  </p>
                  <p>
                    <strong className="text-white">6.3 Availability:</strong> We do not guarantee uninterrupted access to the 
                    Service. Maintenance, updates, or technical issues may temporarily affect availability.
                  </p>
                  <p>
                    <strong className="text-white">6.4 Emotion Detection:</strong> Our emotion detection feature is designed 
                    to enhance learning but is not a diagnostic tool. It should not be used for medical or psychological assessment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Scale className="text-orange-400" size={24} />
                  7. Limitation of Liability
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  To the maximum extent permitted by law, AI Voice Tutor shall not be liable for any indirect, incidental, 
                  special, consequential, or punitive damages, including but not limited to loss of profits, data, or 
                  other intangible losses, resulting from your use of the Service. Our total liability shall not exceed 
                  the amount you paid us in the twelve months preceding the claim.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  8. Termination
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                  for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
                  or for any other reason at our sole discretion. Upon termination, your right to use the Service will 
                  immediately cease.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="text-orange-400" size={24} />
                  9. Changes to Terms
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of significant changes 
                  via email or through the Service. Your continued use of the Service after changes become effective 
                  constitutes acceptance of the revised Terms.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/20">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FileText className="text-orange-400" size={24} />
                  10. Contact Information
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/20">
                  <p className="text-white font-semibold">AI Voice Tutor Legal Team</p>
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
