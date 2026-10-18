import { motion } from 'framer-motion';
import { cn, STAGE_META } from '../lib/utils';

export default function StageBadge({ stage, size = 'md' }) {
  const meta = STAGE_META[stage] || STAGE_META.applied;

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        'border-white/10 bg-white/[0.05]',
        meta.text,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
      {meta.label}
    </motion.span>
  );
}
