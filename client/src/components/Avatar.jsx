import { motion } from 'framer-motion';
import { cn, initials, gradientFor } from '../lib/utils';

export default function Avatar({ name, size = 'md', className }) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.06, rotate: -2 }}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-lg',
        gradientFor(name),
        sizes[size],
        className,
      )}
    >
      <span className="relative z-10">{initials(name)}</span>
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
    </motion.div>
  );
}
