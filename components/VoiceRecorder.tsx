'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  showControls?: boolean;
}

export interface VoiceRecorderRef {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
}

const VoiceRecorder = forwardRef<VoiceRecorderRef, VoiceRecorderProps>(
  function VoiceRecorder({ onTranscript, isProcessing, onRecordingChange, showControls = true }, ref) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingChange?.(false);
    }
  }, [onRecordingChange]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Send to STT API
        await sendToSTT(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange?.(true);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  }, [onRecordingChange]);

  // Expose methods via ref for external control
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    isRecording
  }), [isRecording, startRecording, stopRecording]);

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
      } else {
        setError('Failed to transcribe audio');
      }
    } catch (err: any) {
      console.error('STT Error:', err);
      setError('Failed to process audio');
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Record Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-2xl relative
          ${isRecording 
            ? 'bg-gradient-to-br from-red-500 to-pink-500 recording-animation' 
            : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-110'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          text-white
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <MicOff size={28} />
        ) : (
          <Mic size={28} />
        )}
        
        {/* Pulsing ring animation */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></span>
        )}
      </button>

      {/* Status Text */}
      <div className="text-sm text-gray-400 text-center font-medium">
        {isRecording && '🔴 Recording... Click to stop'}
        {!isRecording && !isProcessing && '🎤 Click to speak'}
        {isProcessing && '⏳ Processing...'}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-400 text-center max-w-xs bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      {/* Playback Button */}
      {audioUrl && !isRecording && (
        <button
          onClick={isPlaying ? stopAudio : playAudio}
          className="flex items-center gap-2 px-4 py-2 glass glass-hover rounded-lg transition-all shadow-lg text-white"
          aria-label={isPlaying ? 'Stop playback' : 'Play recording'}
        >
          {isPlaying ? (
            <>
              <VolumeX size={18} className="text-red-400" />
              <span className="text-sm">Stop</span>
            </>
          ) : (
            <>
              <Volume2 size={18} className="text-purple-400" />
              <span className="text-sm">Play Recording</span>
            </>
          )}
        </button>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
});

export default VoiceRecorder;
