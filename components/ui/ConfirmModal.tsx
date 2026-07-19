'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-ink/40 backdrop-blur-[2px] transition-opacity">
      <div className="bg-white rounded-t-[20px] sm:rounded-[20px] shadow-xl w-full max-w-md overflow-hidden transform transition-all translate-y-0 sm:scale-100 border border-hair">
        <div className="p-[20px_24px_24px]">
          <div className="flex items-start">
            {isDestructive && (
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#F4E9EB] sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle
                  className="h-5 w-5 text-maroon"
                  aria-hidden="true"
                />
              </div>
            )}
            <div
              className={`mt-3 sm:mt-0 ${isDestructive ? 'sm:ml-4' : ''} text-left`}
            >
              <h3
                className="text-[18px] font-playfair font-bold text-ink tracking-[0.02em]"
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-[14px] text-muted-ink leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-cream-2 px-[24px] py-[16px] border-t border-hair flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-[10px] text-[14px] font-bold text-ink bg-white border border-hair rounded-[14px] shadow-sm hover:bg-hair/30 transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`w-full sm:w-auto px-6 py-[10px] text-[14px] font-bold text-white rounded-[14px] shadow-sm transition-opacity hover:opacity-90 ${
              isDestructive
                ? 'bg-maroon'
                : 'bg-ink'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
