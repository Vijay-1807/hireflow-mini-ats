import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  useDroppable, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesApi } from '../api/client';
import { useCandidateList } from '../hooks/useApi';
import { STAGE_META, cn, formatSalary } from '../lib/utils';
import Avatar from '../components/Avatar';
import StageBadge from '../components/StageBadge';
import StarRating from '../components/StarRating';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import CandidateForm from '../components/CandidateForm';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

export default function Pipeline({ refreshToken }) {
  const { data, loading, execute, setData } = useCandidateList({ limit: 200 });
  const [activeId, setActiveId] = useState(null);
  const [moving, setMoving] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  useEffect(() => { execute().catch(() => {}); }, [refreshToken]);

  const rows = data?.data || [];

  const byStage = useMemo(() => {
    const map = Object.fromEntries(Object.keys(STAGE_META).map((s) => [s, []]));
    for (const c of rows) {
      if (map[c.stage]) map[c.stage].push(c);
      else map.applied.push(c);
    }
    return map;
  }, [rows]);

  const activeCandidate = activeId ? rows.find((r) => r.id === activeId) : null;

  const onDragStart = (event) => setActiveId(event.active.id);

  const onDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const candidate = rows.find((r) => r.id === active.id);
    if (!candidate) return;

    const overId = String(over.id);
    const stageMap = Object.fromEntries(
      Object.keys(STAGE_META).map((s) => [s, byStage[s].map((c) => c.id)]),
    );
    let targetStage = stageMap[overId] ? overId : null;

    if (!targetStage) {
      for (const [stage, ids] of Object.entries(stageMap)) {
        if (ids.includes(over.id)) { targetStage = stage; break; }
      }
    }

    if (!targetStage || targetStage === candidate.stage) return;

    const prev = candidate.stage;
    setMoving(candidate.id);

    setData((d) => ({
      ...d,
      data: d.data.map((c) => (c.id === candidate.id ? { ...c, stage: targetStage } : c)),
    }));

    try {
      await candidatesApi.update(candidate.id, { stage: targetStage });
      toast.success(`${candidate.name} → ${STAGE_META[targetStage].label}`);
    } catch (err) {
      setData((d) => ({
        ...d,
        data: d.data.map((c) => (c.id === candidate.id ? { ...c, stage: prev } : c)),
      }));
      toast.error(err.message);
    } finally {
      setMoving(null);
      execute().catch(() => {});
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Hiring pipeline</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Drag candidates between stages — changes save instantly.
          </p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add candidate
        </button>
      </motion.div>

      {loading ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3 2xl:grid-cols-6">
          {Object.keys(STAGE_META).map((s) => (
            <div key={s} className="glass w-[82vw] max-w-[320px] shrink-0 snap-start rounded-2xl p-4 md:w-auto md:max-w-none md:min-h-[320px]">
              <div className="skeleton h-4 w-24" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <motion.div variants={container} initial="hidden" animate="show" className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3 2xl:grid-cols-6">
            {Object.entries(STAGE_META).map(([stageId, meta]) => (
              <Column
                key={stageId}
                stageId={stageId}
                meta={meta}
                candidates={byStage[stageId]}
                moving={moving}
              />
            ))}
          </motion.div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.89,0.32,1.28)' }}>
            {activeCandidate ? <KanbanCard candidate={activeCandidate} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add candidate" subtitle="Drop them into the pipeline" size="lg">
        <CandidateForm
          onSaved={() => { setFormOpen(false); execute().catch(() => {}); }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}

function Column({ stageId, meta, candidates, moving }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const total = candidates.length;

  return (
    <motion.div variants={item} className="flex w-[82vw] max-w-[320px] shrink-0 snap-start flex-col md:w-auto md:max-w-none md:min-h-[420px]">
      <div
        className={cn(
          'glass mb-3 flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300',
          isOver && 'border-white/25 shadow-glow',
        )}
        style={isOver ? { boxShadow: `0 0 32px -10px ${meta.color}` } : undefined}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
          <h2 className="text-sm font-bold text-white">{meta.label}</h2>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          {total}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2.5 rounded-2xl border border-dashed p-2 transition-all duration-200',
          isOver ? 'border-white/25 bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.015]',
        )}
      >
        <SortableContext items={candidates.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {candidates.map((c) => (
              <SortableCard key={c.id} candidate={c} moving={moving === c.id} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {total === 0 && (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
            <p className="text-[11px] text-zinc-600">Drop candidates here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SortableCard({ candidate, moving }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <KanbanCard candidate={candidate} attributes={attributes} listeners={listeners} moving={moving} />
    </div>
  );
}

function KanbanCard({ candidate, attributes, listeners, dragging, moving }) {
  const meta = STAGE_META[candidate.stage] || STAGE_META.applied;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -3 }}
      {...attributes}
      {...listeners}
      className={cn(
        'glass group relative cursor-grab overflow-hidden rounded-xl p-3.5 transition-all active:cursor-grabbing',
        dragging && 'rotate-2 shadow-glow',
        moving && 'pointer-events-none',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.color}80, transparent)` }} />
      <div className="flex items-start gap-2.5">
        <Avatar name={candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white">{candidate.name}</p>
          <p className="truncate text-[11px] text-zinc-400">{candidate.role}</p>
        </div>
        <span className="shrink-0 rounded-md p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
          {moving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GripVertical className="h-3.5 w-3.5" />}
        </span>
      </div>

      {(candidate.skills || []).length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {candidate.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
              {s}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="rounded-md px-1.5 py-0.5 text-[9px] text-zinc-600">+{candidate.skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          {candidate.location && <span className="truncate max-w-[80px]">{candidate.location}</span>}
          {candidate.expected_salary && <span className="tabular-nums">{formatSalary(candidate.expected_salary)}</span>}
        </div>
        {(candidate.rating || 0) > 0 && <StarRating value={candidate.rating} readOnly size={10} />}
      </div>
    </motion.div>
  );
}
