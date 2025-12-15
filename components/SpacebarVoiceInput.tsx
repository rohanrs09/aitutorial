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
    } catch (error) {
      console.error('Error starting recording:', error);
      isStartingRef.current = false; // Reset on error
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
      if (data.success && data.text) {
        onTranscript(data.text);
      }
    } catch (error) {
      console.error('STT Error:', error);
    }
  };

  // Spacebar handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !disabled && !isProcessing) {
        e.preventDefault();
        setIsHolding(true);
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsHolding(false);
        if (isRecording) {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, isProcessing, isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
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
    <div className="flex flex-col items-center gap-3">
      {/* Main Button */}
      <motion.button
        className={`
          flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all
          ${isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : isProcessing
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-[#8b7355] hover:bg-[#7a6349] text-white shadow-lg'
          }
        `}
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
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
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Processing...</span>
          </>
        ) : isRecording ? (
          <>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span>Recording {formatDuration(recordingDuration)}...</span>
            <span className="text-sm opacity-75">Release to send</span>
          </>
        ) : (
          <>
            <Mic size={20} />
            <span>Press & hold [Spacebar] to speak</span>
          </>
        )}
      </motion.button>

      {/* Visual feedback for spacebar holding */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {/* Audio waveform visualization */}
            <div className="flex items-center gap-1 h-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-400 rounded-full"
                  animate={{
                    height: [8, 24, 8],
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
            <span className="text-sm text-gray-400">Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
