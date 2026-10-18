import { motion } from 'framer-motion';
import {
  Users, UserCheck, TrendingUp, Timer, Star, Briefcase,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import AnimatedCounter from '../components/AnimatedCounter';
import Avatar from '../components/Avatar';
import StageBadge from '../components/StageBadge';
import { MetricsSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../lib/utils';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export default function Dashboard({ metrics, loading, error, onNavigate }) {
  if (loading) return <MetricsSkeleton />;
  if (error) {
    return (
      <EmptyState
        icon={Activity}
        title="Could not load metrics"
        message={error.message}
        action={<button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>}
      />
    );
  }

  const m = metrics?.data;
  if (!m) return null;
  const { summary, byStage, funnel, applicationsByDay, bySource, skills, recent } = m;

  const cards = [
    {
      label: 'Total candidates', value: summary.total, icon: Users,
      sub: `${summary.last30} added in last 30 days`,
      gradient: 'from-sky-500/15 to-transparent', iconColor: 'text-sky-300',
    },
    {
      label: 'Active pipeline', value: summary.active, icon: Activity,
      sub: `${summary.openRoles} open roles in play`,
      gradient: 'from-purple-500/15 to-transparent', iconColor: 'text-purple-300',
    },
    {
      label: 'Hired', value: summary.hired, icon: UserCheck,
      sub: `${summary.conversionRate}% conversion rate`,
      gradient: 'from-brand-500/15 to-transparent', iconColor: 'text-brand-300',
    },
    {
      label: 'Avg. time to close', value: summary.avgTimeToHire, decimals: 1, suffix: 'd', icon: Timer,
      sub: 'from application to decision',
      gradient: 'from-amber-500/15 to-transparent', iconColor: 'text-amber-300',
    },
  ];

  const pieData = bySource.map((s, i) => ({ ...s, fill: ['#c6f135', '#60a5fa', '#c084fc', '#fb923c', '#fbbf24', '#f472b6', '#f87171'][i % 7] }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Hiring dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live overview of your talent pipeline and conversion health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendPill growth={summary.growth} />
          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <AnimatedCounter value={summary.avgRating} decimals={1} />
            <span className="text-zinc-500">avg rating</span>
          </div>
        </div>
      </motion.div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass group relative w-[74vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl p-5 sm:w-auto sm:max-w-none"
          >
            <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  <AnimatedCounter value={card.value} decimals={card.decimals || 0} suffix={card.suffix || ''} />
                </p>
                <p className="mt-2 text-xs text-zinc-500">{card.sub}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] ${card.iconColor}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <motion.div variants={item} className="glass rounded-2xl p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Applications - last 14 days</h2>
              <p className="text-xs text-zinc-500">New candidates entering the pipeline</p>
            </div>
            <span className="chip"><Briefcase className="h-3 w-3" /> {summary.last7} this week</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationsByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c6f135" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#c6f135" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#c6f135" strokeWidth={2.5} fill="url(#areaGrad)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white">By source</h2>
          <p className="text-xs text-zinc-500">Where your best talent comes from</p>
          <div className="mt-2 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="source" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none" animationDuration={1200}>
                  {pieData.map((entry) => <Cell key={entry.source} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
                <Legend formatter={(v) => <span className="text-[11px] text-zinc-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <motion.div variants={item} className="glass rounded-2xl p-5 xl:col-span-2">
          <h2 className="text-sm font-bold text-white">Stage funnel</h2>
          <p className="text-xs text-zinc-500">Candidate distribution across hiring stages</p>
          <div className="mt-5 space-y-3.5">
            {funnel.map((stage, i) => {
              const max = Math.max(...funnel.map((s) => s.count), 1);
              return (
                <div key={stage.stage}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300">{stage.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      <span className="font-bold text-white">{stage.count}</span> - {stage.conversion}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stage.count / max) * 100}%` }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                        boxShadow: `0 0 16px -2px ${stage.color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="space-y-5">
          <motion.div variants={item} className="glass rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white">Top skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.slice(0, 10).map((s, i) => (
                <motion.span
                  key={s.skill}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="chip hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-200"
                >
                  {s.skill}
                  <span className="text-zinc-500">{s.count}</span>
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Recent applicants</h2>
              <button onClick={() => onNavigate?.('candidates')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300 transition-colors hover:text-brand-200">
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <ul className="space-y-2.5">
              {recent.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-200">{c.name}</p>
                    <p className="truncate text-[10px] text-zinc-500">{c.role} - {formatDate(c.created_at)}</p>
                  </div>
                  <StageBadge stage={c.stage} size="sm" />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function TrendPill({ growth }) {
  const up = growth >= 0;
  return (
    <div className={`glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${up ? 'text-emerald-300' : 'text-rose-300'}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      <AnimatedCounter value={Math.abs(growth)} decimals={0} suffix="%" />
      <span className="text-zinc-500">vs last week</span>
    </div>
  );
}

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/90 px-3 py-2 shadow-xl backdrop-blur-xl">
      <p className="text-[11px] font-semibold text-zinc-300">{label ?? payload[0]?.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="mt-0.5 text-xs font-bold text-white">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}
