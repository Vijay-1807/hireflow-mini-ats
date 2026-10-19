import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, LayoutGrid, List, SlidersHorizontal, X, ChevronUp, ChevronDown,
  Trash2, UserRound, ArrowLeft, ArrowRight, Loader2, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesApi } from '../api/client';
import { useCandidateList, useDebounced, useFilterOptions } from '../hooks/useApi';
import { STAGE_META, STAGE_ORDER, cn, formatDate } from '../lib/utils';
import Avatar from '../components/Avatar';
import StageBadge from '../components/StageBadge';
import StarRating from '../components/StarRating';
import EmptyState from '../components/EmptyState';
import { TableSkeleton, CardsSkeleton } from '../components/Skeletons';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import CandidateForm from '../components/CandidateForm';
import CandidateDetail from '../components/CandidateDetail';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

export default function CandidatesPage({ onOpenCandidate, refreshToken }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 350);
  const [stage, setStage] = useState('');
  const [role, setRole] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('created');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'grid' : 'table'));
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const params = useMemo(() => ({
    q: debouncedSearch, stage, role, source, sort, order, page, limit: 50,
  }), [debouncedSearch, stage, role, source, sort, order, page]);

  const { data, loading, execute } = useCandidateList(params);
  const { data: options } = useFilterOptions();

  useEffect(() => { setPage(1); }, [debouncedSearch, stage, role, source, sort, order]);
  useEffect(() => { execute().catch(() => {}); }, [refreshToken]);

  const rows = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };
  const activeFilters = [stage, role, source].filter(Boolean).length;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setFormOpen(false); setDetail(null); setEditing(c); };

  const openDetail = async (candidate) => {
    setDetail({ ...candidate, activities: candidate.activities || [] });
    setDetailId(candidate.id);
    onOpenCandidate?.(candidate);
    try {
      const res = await candidatesApi.get(candidate.id);
      setDetail((d) => {
        if (!d || d.id !== res.data.id) return d;
        const currentActivities = d.activities || [];
        const fetchedActivities = res.data.activities || [];
        const activities = currentActivities.length > fetchedActivities.length
          ? currentActivities
          : fetchedActivities;
        return { ...res.data, activities };
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSaved = (saved) => {
    setFormOpen(false);
    setEditing(null);
    execute().catch(() => {});
    if (detailId === saved.id) setDetail((d) => ({ ...d, ...saved, activities: d?.activities || [] }));
  };

  const onDetailUpdated = (updated) => {
    setDetail((d) => {
      if (!d || d.id !== updated.id) return d;
      const merged = { ...d, ...updated };
      if (!Array.isArray(updated.activities)) merged.activities = d.activities;
      return merged;
    });
    execute().catch(() => {});
  };

  const toggleSelect = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleAll = () => {
    setSelected((s) => (s.length === rows.length ? [] : rows.map((r) => r.id)));
  };

  const bulkMove = async (newStage) => {
    if (!selected.length) return;
    setBulkBusy(true);
    try {
      const res = await candidatesApi.bulkStage(selected, newStage);
      toast.success(`${res.data.updated} candidate(s) moved to ${STAGE_META[newStage].label}`);
      setSelected([]);
      execute().catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const sortBy = (key) => {
    if (sort === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setOrder(key === 'name' || key === 'role' ? 'asc' : 'desc'); }
  };

  const clearFilters = () => { setStage(''); setRole(''); setSource(''); setSearch(''); };

  const columns = [
    { key: 'name', label: 'Candidate', sortable: true },
    { key: 'role', label: 'Role', sortable: true, className: 'hidden md:table-cell' },
    { key: 'stage', label: 'Stage', sortable: true },
    { key: 'experience_years', label: 'Exp', sortable: true, className: 'hidden lg:table-cell' },
    { key: 'rating', label: 'Rating', sortable: true, className: 'hidden sm:table-cell' },
    { key: 'created', label: 'Applied', sortable: true, className: 'hidden xl:table-cell' },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Candidates</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {meta.total} {meta.total === 1 ? 'candidate' : 'candidates'} found
            {activeFilters ? ` - ${activeFilters} filter${activeFilters > 1 ? 's' : ''} active` : ''}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Add candidate
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="glass-input !pl-10"
              placeholder="Search name, email, skill, role, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="btn-icon absolute right-2 top-1/2 -translate-y-1/2 !p-1" aria-label="Clear search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn('btn-ghost relative', showFilters && '!bg-brand-500/15 !border-brand-400/40 !text-brand-200')}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{activeFilters}</span>
            )}
          </button>

          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {[
              { id: 'table', icon: List, label: 'Table' },
              { id: 'grid', icon: LayoutGrid, label: 'Grid' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-label={v.label}
                className={cn(
                  'relative rounded-lg px-3 py-2 transition-colors',
                  view === v.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {view === v.id && (
                  <motion.span layoutId="view-pill" className="absolute inset-0 rounded-lg bg-white/[0.1]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <v.icon className="relative z-10 h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-white/[0.07] pt-3 sm:grid-cols-4">
                <select className="glass-select" value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage">
                  <option value="" className="bg-ink-900">All stages</option>
                  {STAGE_ORDER.map((s) => <option key={s} value={s} className="bg-ink-900">{STAGE_META[s].label}</option>)}
                </select>
                <select className="glass-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
                  <option value="" className="bg-ink-900">All roles</option>
                  {(options?.data?.roles || []).map((r) => <option key={r} value={r} className="bg-ink-900">{r}</option>)}
                </select>
                <select className="glass-select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
                  <option value="" className="bg-ink-900">All sources</option>
                  {(options?.data?.sources || []).map((s) => <option key={s} value={s} className="bg-ink-900 capitalize">{s.replace('-', ' ')}</option>)}
                </select>
                <div className="flex items-center justify-between gap-2">
                  <select className="glass-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
                    <option value="created" className="bg-ink-900">Newest first</option>
                    <option value="name" className="bg-ink-900">Name</option>
                    <option value="rating" className="bg-ink-900">Rating</option>
                    <option value="experience_years" className="bg-ink-900">Experience</option>
                    <option value="updated" className="bg-ink-900">Recently updated</option>
                  </select>
                  <button
                    onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                    className="btn-icon border border-white/[0.08] bg-white/[0.03]"
                    aria-label="Toggle sort direction"
                  >
                    {order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="mt-2.5 text-[11px] font-semibold text-brand-300 hover:text-brand-200">
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-400/30 bg-brand-500/10 p-2.5">
                <span className="px-1 text-xs font-semibold text-brand-200">
                  {selected.length} selected
                </span>
                <span className="text-[11px] text-zinc-400">Move to:</span>
                {STAGE_ORDER.map((s) => (
                  <button
                    key={s}
                    disabled={bulkBusy}
                    onClick={() => bulkMove(s)}
                    className="chip transition-all hover:scale-105 disabled:opacity-50"
                    style={{ borderColor: `${STAGE_META[s].color}40`, color: STAGE_META[s].color }}
                  >
                    {bulkBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                    {STAGE_META[s].label}
                  </button>
                ))}
                <button onClick={() => setSelected([])} className="btn-icon ml-auto !p-1.5" aria-label="Clear selection">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {loading ? (
        view === 'table' ? <div className="glass rounded-2xl"><TableSkeleton /></div> : <CardsSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates match"
          message={search || activeFilters ? 'Try adjusting your search or clearing filters.' : 'Add your first candidate to start building the pipeline.'}
          action={
            search || activeFilters
              ? <button onClick={clearFilters} className="btn-ghost">Clear filters</button>
              : <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add candidate</button>
          }
        />
      ) : view === 'table' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selected.length === rows.length}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer accent-brand-500"
                      aria-label="Select all"
                    />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className={cn('px-4 py-3', col.className)}>
                      {col.sortable ? (
                        <button onClick={() => sortBy(col.key)} className="inline-flex items-center gap-1 uppercase tracking-[0.14em] transition-colors hover:text-zinc-300">
                          {col.label}
                          {sort === col.key && (order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => openDetail(c)}
                    className="table-row-hover cursor-pointer border-b border-white/[0.04] last:border-0"
                  >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="h-4 w-4 cursor-pointer accent-brand-500"
                          aria-label={`Select ${c.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-100">{c.name}</p>
                            <p className="truncate text-xs text-zinc-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-300 md:table-cell">{c.role}</td>
                      <td className="px-4 py-3"><StageBadge stage={c.stage} size="sm" /></td>
                      <td className="hidden px-4 py-3 tabular-nums text-zinc-400 lg:table-cell">{c.experience_years ?? 0}y</td>
                      <td className="hidden px-4 py-3 sm:table-cell"><StarRating value={c.rating || 0} readOnly size={12} /></td>
                      <td className="hidden px-4 py-3 text-xs text-zinc-500 xl:table-cell">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete ${c.name}?`)) return;
                            try {
                              await candidatesApi.remove(c.id);
                              toast.success('Deleted');
                              setSelected((s) => s.filter((x) => x !== c.id));
                              execute().catch(() => {});
                            } catch (err) { toast.error(err.message); }
                          }}
                          className="btn-icon !p-2 !text-zinc-500 hover:!text-red-400"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} page={page} setPage={setPage} />
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((c) => (
              <motion.button
                key={c.id}
                variants={item}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => openDetail(c)}
                className="glass glass-hover group relative overflow-hidden rounded-2xl p-5 text-left"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `${STAGE_META[c.stage]?.color}40` }}
                />
                <div className="relative flex items-start gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{c.name}</p>
                    <p className="truncate text-xs text-zinc-400">{c.role}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-600">{c.location || '-'} - {(c.source || '').replace('-', ' ')}</p>
                  </div>
                </div>
                <div className="relative mt-4 flex items-center justify-between">
                  <StageBadge stage={c.stage} size="sm" />
                  <StarRating value={c.rating || 0} readOnly size={12} />
                </div>
                <div className="relative mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                  {(c.skills || []).slice(0, 3).map((s) => (
                    <span key={s} className="chip !py-0.5 !text-[10px]">{s}</span>
                  ))}
                  {(c.skills || []).length > 3 && (
                    <span className="chip !py-0.5 !text-[10px] !bg-white/[0.03]">+{c.skills.length - 3}</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
          <div className="mt-4"><Pagination meta={meta} page={page} setPage={setPage} /></div>
        </motion.div>
      )}

      <Modal
        open={formOpen || Boolean(editing)}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : 'Add candidate'}
        subtitle={editing ? 'Update profile, stage and notes' : 'New talent entering your pipeline'}
        size="lg"
      >
        <CandidateForm candidate={editing} onSaved={onSaved} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>

      <Drawer open={Boolean(detail)} onClose={() => { setDetail(null); setDetailId(null); }}>
        <AnimatePresence>
          {detail && (
            <motion.div key={detail.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <CandidateDetail
                candidate={detail}
                onUpdated={onDetailUpdated}
                onDeleted={() => { setDetail(null); setDetailId(null); execute().catch(() => {}); }}
                onEdit={openEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>
    </div>
  );
}

function Pagination({ meta, page, setPage }) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3">
      <p className="text-xs text-zinc-500">
        Page {meta.page} of {meta.totalPages} - {meta.total} total
      </p>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !px-3 !py-1.5 !text-xs disabled:opacity-30">
          <ArrowLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !px-3 !py-1.5 !text-xs disabled:opacity-30">
          Next <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
