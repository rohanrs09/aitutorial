'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export default function MermaidDiagram({ code, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Mermaid with version 10.x compatible config
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
    });

    const renderDiagram = async () => {
      if (containerRef.current && code) {
        try {
          // Clear previous content
          containerRef.current.innerHTML = '';
          
          // Generate unique ID
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          // Render diagram
          const { svg } = await mermaid.render(id, code);
          
          // Insert SVG
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          containerRef.current.innerHTML = `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-red-600 dark:text-red-400 text-sm">
                Failed to render diagram. The diagram syntax may have issues.
              </p>
              <details class="mt-2">
                <summary class="cursor-pointer text-xs text-red-500">Show code</summary>
                <pre class="mt-2 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto">${code}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className={`mermaid-container ${className}`}>
      <div ref={containerRef} className="flex justify-center items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" />
    </div>
  );
}
