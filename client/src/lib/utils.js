export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const STAGE_META = {
  applied: { label: 'Applied', color: '#60a5fa', ring: 'ring-sky-400/30', bg: 'bg-sky-400/10', text: 'text-sky-300' },
  screening: { label: 'Screening', color: '#c084fc', ring: 'ring-purple-400/30', bg: 'bg-purple-400/10', text: 'text-purple-300' },
  interview: { label: 'Interview', color: '#fbbf24', ring: 'ring-amber-400/30', bg: 'bg-amber-400/10', text: 'text-amber-300' },
  offer: { label: 'Offer', color: '#fb923c', ring: 'ring-orange-400/30', bg: 'bg-orange-400/10', text: 'text-orange-300' },
  hired: { label: 'Hired', color: '#c6f135', ring: 'ring-brand-400/30', bg: 'bg-brand-400/10', text: 'text-brand-300' },
  rejected: { label: 'Rejected', color: '#f87171', ring: 'ring-red-400/30', bg: 'bg-red-400/10', text: 'text-red-300' },
};

export const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export const AVATAR_GRADIENTS = [
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
];

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

export const gradientFor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

export const formatSalary = (n) => {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

export const formatDate = (s) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
