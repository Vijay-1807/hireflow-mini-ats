import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { pushOverlay, popOverlay } from '../lib/overlay';

export default function Drawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    pushOverlay(onClose);
    return () => popOverlay(onClose);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/[0.1] bg-ink-900/85 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-brand-400/50 via-brand-400/15 to-transparent" />
            <button
              onClick={onClose}
              className="btn-icon absolute right-4 top-4 z-10 bg-white/[0.06]"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
