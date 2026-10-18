import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 14 }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const Icon = Star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star === value ? 0 : star)}
            className={cn(
              'transition-all duration-150',
              readOnly ? 'cursor-default' : 'hover:scale-125 active:scale-95 cursor-pointer',
            )}
            aria-label={`Rate ${star} stars`}
          >
            <Icon
              size={size}
              className={cn(
                'transition-colors duration-150',
                active ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'text-zinc-600',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
