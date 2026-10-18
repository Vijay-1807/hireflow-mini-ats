import { motion, AnimatePresence } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center"
      >
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="relative mb-5"
        >
          <div className="absolute inset-0 rounded-full bg-brand-500/30 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Icon className="h-7 w-7 text-zinc-400" />
          </div>
        </motion.div>
        <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
        {message && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">{message}</p>}
        {action && <div className="mt-5">{action}</div>}
      </motion.div>
    </AnimatePresence>
  );
}
