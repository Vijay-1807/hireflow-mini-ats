import { motion } from 'framer-motion';
import { LayoutDashboard, Users, KanbanSquare, Terminal, Github, HeartHandshake } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Hiring metrics & insights' },
  { id: 'candidates', label: 'Candidates', icon: Users, hint: 'Search, filter & manage talent' },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare, hint: 'Drag candidates across stages' },
];

export default function Sidebar({ page, onNavigate, counts }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/[0.06] bg-ink-900/85 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 text-ink-950 shadow-[0_8px_24px_-10px_rgba(198,241,53,0.6)]">
          <Terminal className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-[15px] font-extrabold tracking-tight text-white">HireFlow</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Mini ATS</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Main navigation">
        {NAV.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200',
                active ? 'text-ink-950' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-brand-400 shadow-[0_10px_28px_-12px_rgba(198,241,53,0.65)]"
                />
              )}
              <span className="relative z-10 flex w-full items-center gap-3">
                <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200', active && 'scale-110')} />
                {item.label}
                {counts?.[item.id] !== undefined && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                      active ? 'bg-ink-950/15 text-ink-950' : 'bg-white/[0.06] text-zinc-500',
                    )}
                  >
                    {counts[item.id]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[11px] font-bold text-zinc-200">Built for EarlyJobs.ai</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Mini ATS assignment · Full Stack Developer Intern
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <HeartHandshake className="h-3 w-3 text-rose-400" /> by Bontha Vijay
          </span>
          <a
            className="inline-flex items-center gap-1 transition-colors hover:text-zinc-300"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-3 w-3" /> Repo
          </a>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ page, onNavigate }) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border border-white/[0.09] bg-ink-900/90 px-2 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,1)] backdrop-blur-2xl lg:hidden"
    >
      {NAV.map((item) => {
        const active = page === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[10px] font-bold transition-colors',
              active ? 'text-ink-950' : 'text-zinc-500',
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-brand-400"
              />
            )}
            <Icon className="relative z-10 h-[18px] w-[18px]" />
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
