'use client';

import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ErrorBanner({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-red-800"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-white" />
          <span className="font-medium">{message}</span>
          <button
            onClick={onClose}
            className="ml-4 p-1 rounded hover:bg-red-700 transition"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}