'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TutorSession from '@/components/TutorSession';

export default function LearnPage() {
  const router = useRouter();
  const [hasValidContext, setHasValidContext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has selected a topic or course context
    const checkTopicSelection = () => {
      // Check for help context from course page (sessionStorage)
      if (typeof window !== 'undefined') {
        const helpContext = sessionStorage.getItem('helpContext');
        if (helpContext) {
          try {
            const parsed = JSON.parse(helpContext);
            console.log('[Learn Page] Found help context:', parsed);
            return parsed && (parsed.lectureTitle || parsed.topicName);
          } catch {
            // Invalid context, remove it
            console.log('[Learn Page] Invalid help context, removing');
            sessionStorage.removeItem('helpContext');
          }
        }
        
        // Check for course context in localStorage
        const courseContext = localStorage.getItem('courseContext');
        if (courseContext) {
          try {
            const parsed = JSON.parse(courseContext);
            console.log('[Learn Page] Found course context:', parsed);
            return parsed && (parsed.lectureTitle || parsed.topicName);
          } catch {
            localStorage.removeItem('courseContext');
          }
        }
        
        // Check for direct topic selection
        const selectedTopic = localStorage.getItem('selectedTopic');
        if (selectedTopic) {
          console.log('[Learn Page] Found selected topic:', selectedTopic);
          return true;
        }
      }
      
      return false;
    };

    const isValid = checkTopicSelection();
    console.log('[Learn Page] Context validation result:', isValid);
    
    setIsLoading(false);
    
    if (!isValid) {
      console.log('[Learn Page] No valid context, redirecting to courses');
      router.push('/courses');
    } else {
      setHasValidContext(true);
    }
  }, [router]);

  // Show loading while checking context
  if (isLoading) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[80px]" />
        <div className="text-center relative z-10">
          <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-orange-500/30"></div>
          <p className="text-gray-300 font-medium">Setting up your learning session...</p>
        </div>
      </div>
    );
  }

  // Show TutorSession when context is valid
  if (hasValidContext) {
    return <TutorSession />;
  }

  // Fallback (should redirect quickly)
  return (
    <div className="min-h-screen bg-atmospheric flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]" />
      <div className="text-center relative z-10">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-orange-500/30"></div>
        <p className="text-gray-300 font-medium">Redirecting to courses...</p>
      </div>
    </div>
  );
}
