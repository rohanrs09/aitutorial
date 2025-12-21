'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, AlertCircle, CheckCircle, Mic, Wifi, WifiOff } from 'lucide-react';

interface AudioQualityMetrics {
  noiseLevel: number; // 0-100 (0 = clean, 100 = very noisy)
  volumeLevel: number; // 0-100
  clippingDetected: boolean;
  sampleRate: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AudioQualityMonitorProps {
  isRecording: boolean;
  onQualityChange?: (metrics: AudioQualityMetrics) => void;
  position?: 'inline' | 'bottom' | 'corner';
}

export default function AudioQualityMonitor({
  isRecording,
  onQualityChange,
  position = 'inline'
}: AudioQualityMonitorProps) {
  const [metrics, setMetrics] = useState<AudioQualityMetrics>({
    noiseLevel: 0,
    volumeLevel: 0,
    clippingDetected: false,
    sampleRate: 0,
    quality: 'excellent'
  });

  const [showDetails, setShowDetails] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Initialize audio analysis
  useEffect(() => {
    if (!isRecording) return;

    const initializeAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        analyzeAudio();
      } catch (error) {
        console.error('Audio analysis initialization error:', error);
      }
    };

    initializeAudioAnalysis();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
    
    const data = dataArrayRef.current;
    
    // Calculate average frequency (volume level)
    const average = data.reduce((a, b) => a + b) / data.length;
    const volumeLevel = Math.min(100, (average / 255) * 150);

    // Detect clipping (very high frequency peaks)
    const maxFreq = Math.max(...data);
    const clippingDetected = maxFreq > 240;

    // Calculate noise level (variation in low frequencies indicates noise)
    const lowFreqData = data.slice(0, Math.floor(data.length * 0.1));
    const lowFreqVariation = Math.sqrt(
      lowFreqData.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / lowFreqData.length
    );
    const noiseLevel = Math.min(100, (lowFreqVariation / 40) * 100);

    // Determine quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    if (clippingDetected || noiseLevel > 70 || volumeLevel < 10) {
      quality = 'poor';
    } else if (noiseLevel > 50 || volumeLevel < 20) {
      quality = 'fair';
    } else if (noiseLevel > 30 || volumeLevel < 30) {
      quality = 'good';
    }

    const newMetrics: AudioQualityMetrics = {
      noiseLevel: Math.round(noiseLevel),
      volumeLevel: Math.round(volumeLevel),
      clippingDetected,
      sampleRate: analyserRef.current.context.sampleRate,
      quality
    };

    setMetrics(newMetrics);
    onQualityChange?.(newMetrics);

    animationIdRef.current = requestAnimationFrame(analyzeAudio);
  }, [onQualityChange]);

  const getQualityColor = () => {
    switch (metrics.quality) {
      case 'excellent': return 'from-green-500 to-emerald-500';
      case 'good': return 'from-blue-500 to-cyan-500';
      case 'fair': return 'from-yellow-500 to-orange-500';
      case 'poor': return 'from-red-500 to-rose-500';
    }
  };

  const getQualityIcon = () => {
    switch (metrics.quality) {
      case 'excellent': return <CheckCircle className="text-green-500" size={20} />;
      case 'good': return <CheckCircle className="text-blue-500" size={20} />;
      case 'fair': return <AlertCircle className="text-yellow-500" size={20} />;
      case 'poor': return <AlertCircle className="text-red-500" size={20} />;
    }
  };

  const getQualityText = () => {
    switch (metrics.quality) {
      case 'excellent': return 'Excellent audio quality';
      case 'good': return 'Good audio quality';
      case 'fair': return 'Fair audio quality - some background noise';
      case 'poor': return 'Poor audio quality - may affect transcription';
    }
  };

  if (!isRecording) return null;

  const positionClasses = {
    inline: 'w-full',
    bottom: 'fixed bottom-20 left-4 right-4 max-w-sm',
    corner: 'fixed bottom-4 right-4 max-w-xs'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`${positionClasses[position]} bg-white rounded-xl shadow-lg overflow-hidden`}
      >
        {/* Main Status Bar */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 bg-gradient-to-r ${getQualityColor()} rounded-lg text-white`}>
                {getQualityIcon()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Recording Quality</p>
                <p className="text-xs text-gray-500">{getQualityText()}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showDetails ? '↓' : '→'}
            </button>
          </div>

          {/* Quality Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getQualityColor()}`}
              initial={{ width: 0 }}
              animate={{ 
                width: `${metrics.quality === 'excellent' ? 100 : metrics.quality === 'good' ? 75 : metrics.quality === 'fair' ? 50 : 25}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Detailed Metrics */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 bg-gray-50 p-4 space-y-3"
            >
              {/* Volume Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Volume2 size={14} />
                    Volume Level
                  </span>
                  <span className="text-xs font-bold text-gray-800">{metrics.volumeLevel}%</span>
                </div>
                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.volumeLevel}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                {metrics.volumeLevel < 20 && (
                  <p className="text-xs text-yellow-600 mt-1">💡 Speak louder for better recognition</p>
                )}
              </div>

              {/* Noise Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <WifiOff size={14} />
                    Background Noise
                  </span>
                  <span className="text-xs font-bold text-gray-800">{metrics.noiseLevel}%</span>
                </div>
                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.noiseLevel}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                {metrics.noiseLevel > 50 && (
                  <p className="text-xs text-orange-600 mt-1">🔇 Move to a quieter area if possible</p>
                )}
              </div>

              {/* Clipping Detection */}
              {metrics.clippingDetected && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Audio clipping detected - speak more softly
                  </p>
                </div>
              )}

              {/* Sample Rate Info */}
              <div className="pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-600">
                  Sample Rate: <span className="font-semibold">{metrics.sampleRate / 1000}kHz</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
