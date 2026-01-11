'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

interface SpacebarVoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export default function SpacebarVoiceInput({
  onTranscript,
  isProcessing,
  disabled = false
}: SpacebarVoiceInputProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef(false); // Lock to prevent duplicate starts

  const startRecording = useCallback(async () => {
    // Prevent duplicate recording starts
    if (isStartingRef.current || isRecording || mediaRecorderRef.current) {
      return;
    }
    
    isStartingRef.current = true;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current = null; // Clear the ref
        isStartingRef.current = false; // Reset the lock
        await sendToSTT(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error starting recording:', error);
      isStartingRef.current = false; // Reset on error
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        console.error('Recording error:', error.message || error);
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const sendToSTT = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.text && data.text.trim()) {
        onTranscript(data.text);
      } else if (data.error) {
        console.error('STT Error:', data.error);
        // Show user-friendly error
        if (data.error.includes('API key') || data.error.includes('401')) {
          alert('Speech-to-text is not configured. Please add OPENAI_API_KEY to your environment.');
        } else if (data.error.includes('rate limit') || data.error.includes('429')) {
          alert('Rate limited. Please wait a moment and try again.');
        } else {
          console.error('STT failed:', data.error);
        }
      }
    } catch (error: any) {
      console.error('STT Error:', error);
      // Network errors etc.
      if (error.message) {
        console.error('STT request failed:', error.message);
      }
    }
  };

  // Spacebar handling - DISABLED
  // Global spacebar listeners removed to allow normal space input in text fields
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-full px-2 sm:px-0">
      {/* Main Button - Touch-friendly with responsive sizing */}
      <motion.button
        className={`
          flex items-center justify-center gap-2 sm:gap-3
          px-4 sm:px-6 py-3 sm:py-4 rounded-full font-medium
          min-h-touch w-full sm:w-auto max-w-sm
          transition-all duration-200
          ${isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : isProcessing
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-lg'
          }
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface
          active:scale-95
        `}
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.95 }}
        onMouseDown={() => {
          if (!disabled && !isProcessing) {
            setIsHolding(true);
            startRecording();
          }
        }}
        onMouseUp={() => {
          setIsHolding(false);
          if (isRecording) {
            stopRecording();
          }
        }}
        onMouseLeave={() => {
          if (isHolding) {
            setIsHolding(false);
            if (isRecording) {
              stopRecording();
            }
          }
        }}
        // Touch event handlers for mobile
        onTouchStart={() => {
          if (!disabled && !isProcessing) {
            setIsHolding(true);
            startRecording();
          }
        }}
        onTouchEnd={() => {
          setIsHolding(false);
          if (isRecording) {
            stopRecording();
          }
        }}
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Processing...</span>
          </>
        ) : isRecording ? (
          <>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
            <span className="text-sm sm:text-base">Recording {formatDuration(recordingDuration)}...</span>
            <span className="hidden sm:inline text-xs sm:text-sm opacity-75">Release to send</span>
          </>
        ) : (
          <>
            <Mic size={18} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">
              <span className="sm:hidden">Hold to speak</span>
              <span className="hidden sm:inline">Press & hold to speak</span>
            </span>
          </>
        )}
      </motion.button>

      {/* Visual feedback for recording */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {/* Audio waveform visualization */}
            <div className="flex items-center gap-0.5 sm:gap-1 h-6 sm:h-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 sm:w-1 bg-red-400 rounded-full"
                  animate={{
                    height: [6, 18, 6],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-400">Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
