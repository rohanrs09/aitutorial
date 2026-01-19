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
  const [faceVisible, setFaceVisible] = useState<boolean>(true);
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

  // Analyze emotion using API
  const analyzeEmotion = useCallback(async () => {
    if (isAnalyzing) return;
    const now = Date.now();
    
    // RATE LIMITING: Minimum 4 seconds between emotion API calls (increased for reliability)
    const timeSinceLastAnalysis = now - lastAnalysisRef.current;
    if (timeSinceLastAnalysis < 4000) {
      console.log(`[Emotion] Throttled - wait ${Math.ceil((4000 - timeSinceLastAnalysis) / 1000)}s`);
      return;
    }
    
    lastAnalysisRef.current = now;

    const frameData = captureFrame();
    if (!frameData) {
      console.warn('[Emotion] No frame data captured');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('[Emotion] Sending frame for analysis...');
      const response = await fetch('/api/emotion-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frameData })
      });

      const data = await response.json();
      
      console.log('[Emotion] API Response:', data);
      
      if (!response.ok) {
        console.error('[Emotion] API Error:', data.error || 'Unknown error');
        setError(data.error || 'Emotion detection failed');
        // Don't set fallback emotion on API error
      } else if (data.success && data.emotion) {
        const detectedEmotion = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
        const emotionConfidence = data.confidence || 0.7;
        const isFaceVisible = data.face_visible !== false; // Default to true
        
        console.log('[Emotion] ✅ Detected:', {
          emotion: detectedEmotion,
          confidence: emotionConfidence,
          faceVisible: isFaceVisible,
          indicators: data.indicators
        });
        
        // Update face visibility
        setFaceVisible(isFaceVisible);
        
        // If no face visible, show warning
        if (!isFaceVisible) {
          setError('No face detected - please position yourself in camera view');
          setCurrentEmotion('Neutral');
          setConfidence(0.3);
          return;
        }
        
        // Only update if confidence is reasonable (> 0.4)
        if (emotionConfidence > 0.4) {
          setCurrentEmotion(detectedEmotion);
          setConfidence(emotionConfidence);
          setError(null);
          
          // Only trigger help for confused/frustrated with high confidence
          if ((data.emotion.toLowerCase() === 'confused' || data.emotion.toLowerCase() === 'frustrated') && emotionConfidence > 0.6) {
            console.log('[Emotion] 🎯 Triggering help for:', data.emotion.toLowerCase(), 'with confidence:', emotionConfidence);
            onEmotionDetected(data.emotion.toLowerCase(), emotionConfidence);
          }
        } else {
          console.log('[Emotion] ⚠️ Low confidence, ignoring:', emotionConfidence);
        }
      } else {
        console.warn('[Emotion] No emotion detected in response');
      }
    } catch (err) {
      console.error('[Emotion] Analysis error:', err);
      setError('Connection error - retrying...');
      // Don't set fallback emotion on network error
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame, onEmotionDetected]);

  const startCamera = useCallback(async () => {
    // Prevent re-initialization if already active
    if (stream) {
      console.log('[Camera] Already active, skipping initialization');
      return;
    }
    
    try {
      setError(null);
      console.log('[Camera] Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('[Camera] Camera initialized successfully');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions in your browser settings.'
        : err.name === 'NotFoundError'
        ? 'No camera found. Please connect a camera to use emotion detection.'
        : 'Camera error. Please check your camera and try again.';
      setError(errorMessage);
      onToggle(); // Auto-disable if camera fails
    }
  }, [stream, onToggle]);

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

  // Camera lifecycle - only start/stop when enabled changes
  useEffect(() => {
    if (isEnabled && !stream) {
      startCamera();
    } else if (!isEnabled && stream) {
      stopCamera();
    }

    return () => {
      // Cleanup only on unmount
      if (stream) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  // Start emotion analysis when camera is active
  useEffect(() => {
    if (isEnabled && stream && !analysisIntervalRef.current) {
      console.log('[Emotion] Starting analysis interval (every 4 seconds)');
      analysisIntervalRef.current = setInterval(() => {
        analyzeEmotion();
      }, 4000); // Increased to 4 seconds for better reliability
    } else if (!isEnabled && analysisIntervalRef.current) {
      console.log('[Emotion] Stopping analysis interval');
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, stream]);

  const sizeClasses = position === 'corner' 
    ? isExpanded 
      ? 'w-full sm:w-80 h-48 sm:h-60' 
      : 'w-full sm:w-64 h-36 sm:h-48'
    : 'w-full aspect-video max-h-48 sm:max-h-60';

  return (
    <div className={`relative ${sizeClasses} rounded-lg sm:rounded-xl overflow-hidden bg-[#2a2a2a] shadow-2xl`}>
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
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 bg-black/70 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg">
            <motion.div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${emotionColors[currentEmotion] || 'bg-gray-500'}`}
              animate={{ scale: isAnalyzing ? [1, 0.8, 1] : [1, 1.2, 1] }}
              transition={{ duration: isAnalyzing ? 0.5 : 1.5, repeat: Infinity }}
            />
            <span className="text-white text-xs sm:text-sm font-medium">
              {isAnalyzing ? 'Analyzing...' : currentEmotion}
            </span>
            {confidence > 0 && !isAnalyzing && (
              <span className="text-[10px] sm:text-xs text-gray-400">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 sm:p-2 min-h-touch min-w-touch flex items-center justify-center bg-black/50 hover:bg-black/70 active:bg-black/80 rounded-md sm:rounded-lg transition-colors"
            >
              {isExpanded ? (
                <Minimize2 size={14} className="sm:w-4 sm:h-4 text-white" />
              ) : (
                <Maximize2 size={14} className="sm:w-4 sm:h-4 text-white" />
              )}
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 sm:p-2 min-h-touch min-w-touch flex items-center justify-center bg-red-500/80 hover:bg-red-500 active:bg-red-600 rounded-md sm:rounded-lg transition-colors"
            >
              <VideoOff size={14} className="sm:w-4 sm:h-4 text-white" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={onToggle}
          className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3 text-gray-400 hover:text-white hover:bg-[#3a3a3a] active:bg-[#4a4a4a] transition-all min-h-[120px] sm:min-h-[160px]"
        >
          {error ? (
            <>
              <AlertCircle size={24} className="sm:w-8 sm:h-8 text-red-400" />
              <span className="text-xs sm:text-sm text-red-400 text-center px-3 sm:px-4">{error}</span>
              <span className="text-[10px] sm:text-xs text-gray-500">Tap to retry</span>
            </>
          ) : (
            <>
              <Video size={24} className="sm:w-8 sm:h-8" />
              <span className="text-xs sm:text-sm">Enable Camera</span>
              <span className="text-[10px] sm:text-xs text-gray-500">For emotion detection</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
