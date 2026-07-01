import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-50"
          />

          {/* Scroll container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Modal panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`relative w-full ${maxWidth} bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl shadow-2xl z-10`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-700">
                  <h2 className="text-dark-900 dark:text-white font-semibold text-base">{title}</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 dark:text-dark-500 hover:text-dark-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">{children}</div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
