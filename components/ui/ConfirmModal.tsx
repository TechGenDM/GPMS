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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all translate-y-0 sm:scale-100">
        <div className="p-6">
          <div className="flex items-start">
            {isDestructive && (
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                />
              </div>
            )}
            <div
              className={`mt-3 sm:mt-0 ${isDestructive ? 'sm:ml-4' : ''} text-left`}
            >
              <h3
                className="text-xl font-semibold leading-6 text-slate-900"
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl sm:rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-semibold text-white rounded-xl sm:rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
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
