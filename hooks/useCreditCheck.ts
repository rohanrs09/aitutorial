'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CreditCheckResult {
  success: boolean;
  error?: string;
  requiredCredits?: number;
  remainingCredits?: number;
}

export function useCreditCheck() {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditError, setCreditError] = useState<{
    requiredCredits: number;
    remainingCredits: number;
    actionName: string;
  } | null>(null);
  const router = useRouter();

  const checkAndExecute = useCallback(async (
    apiCall: () => Promise<Response>,
    actionName: string = 'this action'
  ): Promise<CreditCheckResult> => {
    try {
      const response = await apiCall();
      
      if (response.status === 402) {
        // Payment Required - Insufficient Credits
        const data = await response.json();
        
        setCreditError({
          requiredCredits: data.requiredCredits || 0,
          remainingCredits: data.remainingCredits || 0,
          actionName
        });
        setShowCreditModal(true);
        
        return {
          success: false,
          error: data.error || 'Insufficient credits',
          requiredCredits: data.requiredCredits,
          remainingCredits: data.remainingCredits
        };
      }

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Request failed'
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }, []);

  const closeCreditModal = useCallback(() => {
    setShowCreditModal(false);
    setCreditError(null);
  }, []);

  // const goToUpgrade = useCallback(() => {
  //   closeCreditModal();
  //   router.push('/pricing');
  // }, [router, closeCreditModal]);

  return {
    checkAndExecute,
    showCreditModal,
    creditError,
    closeCreditModal,
    // goToUpgrade
  };
}
