import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { pushOverlay, popOverlay } from '../lib/overlay';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    pushOverlay(onClose);
    return () => popOverlay(onClose);
  }, [open, onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-3xl' };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`relative z-10 flex max-h-[92vh] w-full ${widths[size]} flex-col glass-strong overflow-hidden rounded-t-3xl sm:max-h-[90vh] sm:rounded-3xl`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="btn-icon -mr-2" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
