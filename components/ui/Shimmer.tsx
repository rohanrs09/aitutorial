'use client';

/**
 * SHIMMER UI COMPONENTS
 * 
 * Modern loading placeholders for better UX
 * Used for loading states across the app
 * 
 * Features:
 * - Smooth CSS-based shimmer animation (no JS overhead)
 * - Dark theme optimized
 * - Orange accent colors matching app theme
 */

interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export function Shimmer({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  rounded = 'rounded-md'
}: ShimmerProps) {
  return (
    <div 
      className={`shimmer-dark ${width} ${height} ${rounded} ${className}`}
    />
  );
}

export function ShimmerLine({ className = '' }: { className?: string }) {
  return <Shimmer className={className} height="h-4" />;
}

export function ShimmerText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          height="h-4" 
          width={i === lines - 1 ? 'w-3/4' : 'w-full'} 
        />
      ))}
    </div>
  );
}

export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/50 rounded-xl p-4 sm:p-6 border border-gray-200/50 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Shimmer width="w-10" height="h-10" className="rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer width="w-1/3" height="h-5" />
          <Shimmer width="w-1/4" height="h-3" />
        </div>
      </div>
      <ShimmerText lines={3} />
    </div>
  );
}

export function ShimmerSlide({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d8] rounded-xl p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shimmer width="w-20" height="h-6" rounded="rounded-lg" />
        <Shimmer width="w-16" height="h-5" rounded="rounded-full" />
      </div>
      
      {/* Title */}
      <Shimmer width="w-2/3" height="h-6" className="mb-4" />
      
      {/* Content paragraphs - shorter */}
      <div className="space-y-2.5 mb-5">
        <Shimmer height="h-3.5" />
        <Shimmer height="h-3.5" />
        <Shimmer width="w-11/12" height="h-3.5" />
      </div>
      
      {/* Code block placeholder - compact */}
      <div className="bg-gray-800/10 rounded-lg p-3 mb-4 border border-gray-300/30">
        <div className="flex items-center justify-between mb-2">
          <Shimmer width="w-14" height="h-3" />
          <Shimmer width="w-12" height="h-3" />
        </div>
        <div className="space-y-1.5">
          <Shimmer height="h-2.5" width="w-[65%]" />
          <Shimmer height="h-2.5" width="w-[80%]" />
          <Shimmer height="h-2.5" width="w-[55%]" />
        </div>
      </div>
      
      {/* Key points - compact */}
      <div className="space-y-2">
        <Shimmer width="w-24" height="h-4" className="mb-1" />
        <div className="flex items-center gap-2">
          <Shimmer width="w-4" height="h-4" rounded="rounded-full" />
          <Shimmer width="w-3/4" height="h-3" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer width="w-4" height="h-4" rounded="rounded-full" />
          <Shimmer width="w-2/3" height="h-3" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerCodeBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#1e1e1e] rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50">
        <Shimmer width="w-16" height="h-4" className="bg-gray-600/50" />
        <Shimmer width="w-12" height="h-4" className="bg-gray-600/50" />
      </div>
      
      {/* Code lines */}
      <div className="p-4 space-y-2">
        {['w-[60%]', 'w-[80%]', 'w-[50%]', 'w-[90%]', 'w-[40%]', 'w-[70%]', 'w-[50%]'].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer width="w-6" height="h-3" className="bg-gray-600/30" />
            <Shimmer width={w} height="h-3" className="bg-gray-600/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shimmer;
