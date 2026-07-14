'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type FeedbackStatus = 'idle' | 'loading' | 'success' | 'error';

interface FeedbackContextType {
  showLoading: (message?: string) => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
  clear: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [message, setMessage] = useState('');

  const showLoading = useCallback((msg = 'Saving...') => {
    setMessage(msg);
    setStatus('loading');
  }, []);

  const showSuccess = useCallback((msg = 'Success!') => {
    setMessage(msg);
    setStatus('success');
    setTimeout(() => {
      setStatus('idle');
    }, 3000);
  }, []);

  const showError = useCallback((msg = 'Action Failed') => {
    setMessage(msg);
    setStatus('error');
    setTimeout(() => {
      setStatus('idle');
    }, 4000);
  }, []);

  const clear = useCallback(() => {
    setStatus('idle');
  }, []);

  return (
    <FeedbackContext.Provider value={{ showLoading, showSuccess, showError, clear }}>
      {children}
      
      {/* Global Overlay */}
      {status !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center space-y-4 max-w-sm w-11/12 mx-auto transform transition-all duration-300 scale-100">
            
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            )}
            
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />
            )}
            
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-500 animate-pulse" />
            )}

            <p className="text-lg font-semibold text-slate-800 text-center">
              {message}
            </p>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
