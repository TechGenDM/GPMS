import React, { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageProvider';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  title,
}: DocumentPreviewModalProps) {
  const { t } = useLanguage();
  const displayTitle = title || t('records.documentPreview');
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !documentUrl) return null;

  // Convert Drive /view link to /preview for iframe embedding
  const previewUrl = documentUrl.includes('drive.google.com')
    ? documentUrl.replace(/\/view.*/, '/preview')
    : documentUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[20px] shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-hair my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-[16px_20px] sm:p-[20px_24px] border-b border-hair bg-cream">
          <h2 className="font-playfair font-bold text-[18px] sm:text-[20px] text-ink tracking-[0.02em] truncate mr-4">
            {displayTitle}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-muted-ink hover:text-ink hover:bg-hair/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 p-4 bg-cream-2 border-b border-hair overflow-x-auto">
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-hair rounded-[10px] text-[13px] font-bold text-ink hover:bg-cream transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="whitespace-nowrap">
              {t('records.openInDrive')}
            </span>
          </a>
          <a
            href={documentUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-hair rounded-[10px] text-[13px] font-bold text-ink hover:bg-cream transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="whitespace-nowrap">{t('records.download')}</span>
          </a>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-cream/50 relative w-full min-h-[50vh] sm:min-h-[65vh]">
          <iframe
            src={previewUrl}
            className="absolute inset-0 w-full h-full border-0"
            title={displayTitle}
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
}
