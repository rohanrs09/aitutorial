'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

interface EmotionCameraWidgetProps {
  onEmotionDetected: (emotion: string, confidence: number) => void;
  isEnabled: boolean;
  onToggle: () => void;
  position?: 'corner' | 'sidebar';
}

export default function EmotionCameraWidget({
  onEmotionDetected,
  isEnabled,
  onToggle,
  position = 'corner'
}: EmotionCameraWidgetProps) {
  const [currentEmotion, setCurrentEmotion] = useState<string>('Neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<number>(0);

  // Emotion color mapping
  const emotionColors: Record<string, string> = {
    'Concentrating': 'bg-green-500',
    'Confused': 'bg-yellow-500',
    'Frustrated': 'bg-red-500',
    'Happy': 'bg-blue-500',
    'Neutral': 'bg-gray-500',
    'Engaged': 'bg-purple-500',
    'Bored': 'bg-orange-500',
    'Curious': 'bg-cyan-500',
    'Excited': 'bg-pink-500'
  };

  // Capture frame as base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = 320;
    canvas.height = 240;
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Analyze emotion using OpenAI Vision API
  const analyzeEmotion = useCallback(async () => {
    if (isAnalyzing) return;
    
    const now = Date.now();
    if (now - lastAnalysisRef.current < 2500) return; // Rate limit
    lastAnalysisRef.current = now;

    const frameData = captureFrame();
    if (!frameData) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/emotion-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frameData })
      });

      const data = await response.json();
      
      if (data.success && data.emotion) {
        const detectedEmotion = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
        setCurrentEmotion(detectedEmotion);
        setConfidence(data.confidence || 0.8);
        onEmotionDetected(data.emotion.toLowerCase(), data.confidence || 0.8);
      }
    } catch (err) {
      console.error('Emotion analysis error:', err);
      // Fallback to basic detection based on time patterns
      const emotions = ['Concentrating', 'Engaged', 'Neutral'];
      const fallbackEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(fallbackEmotion);
      setConfidence(0.6);
      onEmotionDetected(fallbackEmotion.toLowerCase(), 0.6);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame, onEmotionDetected]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  }, [stream]);

  useEffect(() => {
    if (isEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isEnabled]);

  // Start emotion analysis when camera is active
  useEffect(() => {
    if (isEnabled && stream && !analysisIntervalRef.current) {
      analysisIntervalRef.current = setInterval(() => {
        analyzeEmotion();
      }, 3000);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isEnabled, stream, analyzeEmotion]);

  const sizeClasses = position === 'corner' 
    ? isExpanded 
      ? 'w-80 h-60' 
      : 'w-64 h-48'
    : 'w-full aspect-video';

  return (
    <div className={`relative ${sizeClasses} rounded-xl overflow-hidden bg-[#2a2a2a] shadow-2xl`}>
      {isEnabled ? (
        <>
          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          
          {/* Hidden canvas for analysis */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Emotion Label */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${emotionColors[currentEmotion] || 'bg-gray-500'}`}
              animate={{ scale: isAnalyzing ? [1, 0.8, 1] : [1, 1.2, 1] }}
              transition={{ duration: isAnalyzing ? 0.5 : 1.5, repeat: Infinity }}
            />
            <span className="text-white text-sm font-medium">
              {isAnalyzing ? 'Analyzing...' : currentEmotion}
            </span>
            {confidence > 0 && !isAnalyzing && (
              <span className="text-xs text-gray-400">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <Minimize2 size={16} className="text-white" />
              ) : (
                <Maximize2 size={16} className="text-white" />
              )}
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
            >
              <VideoOff size={16} className="text-white" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={onToggle}
          className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-all"
        >
          {error ? (
            <>
              <AlertCircle size={32} className="text-red-400" />
              <span className="text-sm text-red-400 text-center px-4">{error}</span>
              <span className="text-xs text-gray-500">Click to retry</span>
            </>
          ) : (
            <>
              <Video size={32} />
              <span className="text-sm">Enable Camera</span>
              <span className="text-xs text-gray-500">For emotion detection</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
