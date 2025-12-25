import { useState, useCallback, useEffect } from 'react';
import {
  saveProgress,
  loadProgress,
  resumeSession,
  completeSession,
  updateContentPosition,
  getProgressSummary,
  getUserLearningHistory,
} from '@/lib/progress-tracking';

export function useProgressTracking(userId?: string) {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and resume session
  useEffect(() => {
    if (!userId) return;

    const initSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await resumeSession(userId);
        if (result.session) {
          setCurrentSession(result.session);
          const sessionId =
            result.session.session_id ||
            result.session.sessionId ||
            result.session.sessionID ||
            result.session.session_id;
          if (sessionId) {
            const progressData = await loadProgress(sessionId);
            setProgress(progressData.data);
          } else {
            setProgress(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resume session');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [userId]);

  // Load learning history
  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const historyData = await getUserLearningHistory(userId);
      setHistory(historyData.data || []);
      
      const summaryData = await getProgressSummary(userId);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save current progress
  const saveCurrentProgress = useCallback(
    async (progressData: Partial<any>) => {
      if (!userId || !currentSession) {
        setError('No active session');
        return false;
      }

      try {
        const result = await saveProgress(
          userId,
          currentSession.session_id || currentSession.sessionId,
          currentSession.topic_name || currentSession.topic,
          progressData
        );

        if (result.success) {
          setProgress(result.data || progressData);
          return true;
        } else {
          setError(result.error || 'Failed to save progress');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save progress');
        return false;
      }
    },
    [userId, currentSession]
  );

  // Update content position
  const updatePosition = useCallback(
    async (currentStep: number, totalSteps: number) => {
      if (!currentSession) {
        setError('No active session');
        return false;
      }

      try {
        const result = await updateContentPosition(
          currentSession.session_id || currentSession.sessionId,
          currentStep,
          totalSteps
        );
        return result.success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update position');
        return false;
      }
    },
    [currentSession]
  );

  // Complete session
  const completeCurrentSession = useCallback(async () => {
    if (!userId || !currentSession) {
      setError('No active session');
      return false;
    }

    try {
      const result = await completeSession(
        currentSession.session_id || currentSession.sessionId,
        userId
      );
      if (result.success) {
        setCurrentSession(null);
        setProgress(null);
        return true;
      } else {
        setError(result.error || 'Failed to complete session');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
      return false;
    }
  }, [userId, currentSession]);

  return {
    // State
    currentSession,
    progress,
    history,
    summary,
    isLoading,
    error,

    // Methods
    loadHistory,
    saveCurrentProgress,
    updatePosition,
    completeCurrentSession,
    setError,
  };
}
