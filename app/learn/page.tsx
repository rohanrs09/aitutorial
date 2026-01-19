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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Setting up your learning session...</p>
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
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to courses...</p>
      </div>
    </div>
  );
}
