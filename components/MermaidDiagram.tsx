'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import { AlertCircle, RefreshCw, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeMermaidCode, validateMermaidCode } from '@/lib/utils';

interface MermaidDiagramProps {
  code: string;
  className?: string;
  onError?: (error: string) => void;
  showCodeOnError?: boolean;
}

// Skeleton loader for diagram
function DiagramSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 animate-pulse">
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-center gap-4">
          <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="flex justify-center">
          <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex justify-center gap-4">
          <div className="w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="flex justify-center gap-2">
          <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
          <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex justify-center gap-4">
          <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-400">Loading diagram...</p>
    </div>
  );
}

// Error state component
function DiagramError({ 
  error, 
  code, 
  onRetry, 
  showCode 
}: { 
  error: string; 
  code: string; 
  onRetry: () => void;
  showCode: boolean;
}) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg flex-shrink-0">
          <AlertCircle size={20} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-700 dark:text-red-300 text-sm sm:text-base">
            Diagram Rendering Error
          </p>
          <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">
            {error}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
            
            {showCode && (
              <button
                onClick={() => setIsCodeVisible(!isCodeVisible)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Code size={14} />
                {isCodeVisible ? 'Hide' : 'Show'} Code
                {isCodeVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCodeVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="mt-3 p-3 text-xs bg-gray-900 text-gray-300 rounded-lg overflow-x-auto max-h-48 scrollbar-hide">
                  <code>{code}</code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MermaidDiagram({ 
  code, 
  className = '',
  onError,
  showCodeOnError = true 
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderDiagram = async () => {
    if (!containerRef.current || !code) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize Mermaid with version 10.x compatible config
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, Arial, sans-serif',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        themeVariables: {
          primaryColor: '#8b5cf6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#7c3aed',
          lineColor: '#6366f1',
          secondaryColor: '#f3e8ff',
          tertiaryColor: '#faf5ff'
        }
      });

      // Sanitize the code before rendering
      const sanitizedCode = sanitizeMermaidCode(code);
      
      // Validate the sanitized code
      const validation = validateMermaidCode(sanitizedCode);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid diagram syntax');
      }

      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Generate unique ID
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Render diagram
      const { svg } = await mermaid.render(id, sanitizedCode);
      
      // Insert SVG with fade-in animation
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        containerRef.current.classList.add('animate-fadeIn');
        
        // Make SVG responsive
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
      console.error('Mermaid rendering error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    if (isMounted) {
      renderDiagram();
    }
  }, [code, retryCount, isMounted]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Don't render anything on the server
  if (!isMounted) {
    return (
      <div className={`mermaid-container ${className}`}>
        <DiagramSkeleton />
      </div>
    );
  }

  return (
    <div className={`mermaid-container ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DiagramSkeleton />
          </motion.div>
        )}
        
        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DiagramError
              error={error}
              code={code}
              onRetry={handleRetry}
              showCode={showCodeOnError}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading || error ? 0 : 1 }}
        className={`flex justify-center items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto transition-all duration-300 ${
          isLoading || error ? 'absolute opacity-0 pointer-events-none' : ''
        }`}
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MermaidDiagram);
