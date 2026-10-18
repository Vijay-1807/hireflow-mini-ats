import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import Background from './components/Background';
import Sidebar, { MobileNav } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CandidatesPage from './pages/Candidates';
import Pipeline from './pages/Pipeline';
import { useMetrics } from './hooks/useApi';

const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [refreshToken] = useState(0);
  const metrics = useMetrics();

  const navigate = (next) => setPage(next);

  const total = metrics.data?.data?.summary?.total ?? 0;

  return (
    <div className="min-h-screen">
      <Background />

      <Sidebar page={page} onNavigate={navigate} counts={{ candidates: total, pipeline: total }} />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-950/50 px-4 py-3.5 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-ink-950">
                <Terminal className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-extrabold text-white">HireFlow</span>
            </div>
            <div className="hidden items-center gap-2 text-xs text-zinc-500 lg:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-400/10 px-2.5 py-1 font-bold text-brand-300">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-400" />
                API connected
              </span>
              <span>Mini Applicant Tracking System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:block">Built by Bontha Vijay</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-extrabold text-ink-950 ring-2 ring-white/10">
              BV
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <motion.div key={page} {...pageTransition}>
            {page === 'dashboard' && (
              <Dashboard metrics={metrics.data} loading={metrics.loading} error={metrics.error} onNavigate={navigate} />
            )}
            {page === 'candidates' && <CandidatesPage refreshToken={refreshToken} />}
            {page === 'pipeline' && <Pipeline refreshToken={refreshToken} />}
          </motion.div>
        </main>
      </div>

      <MobileNav page={page} onNavigate={navigate} />
    </div>
  );
}
