import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MapPin, Briefcase, CalendarDays, ExternalLink,
  UserPlus, FileText, ArrowRightLeft, MessageSquare, Loader2, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesApi } from '../api/client';
import { STAGE_META, STAGE_ORDER, cn, formatDate, formatSalary } from '../lib/utils';
import Avatar from './Avatar';
import StageBadge from './StageBadge';
import StarRating from './StarRating';

const ICONS = { created: UserPlus, stage_change: ArrowRightLeft, note: MessageSquare };

export default function CandidateDetail({ candidate, onUpdated, onDeleted, onEdit }) {
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!candidate) return null;

  const changeStage = async (stage) => {
    if (stage === candidate.stage) return;
    setBusy(true);
    try {
      await candidatesApi.update(candidate.id, { stage });
      const res = await candidatesApi.get(candidate.id);
      toast.success(`Moved to ${STAGE_META[stage].label}`);
      onUpdated?.(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setAdding(true);
    try {
      await candidatesApi.addActivity(candidate.id, { message: note.trim(), type: 'note' });
      setNote('');
      const res = await candidatesApi.get(candidate.id);
      toast.success('Note added');
      onUpdated?.(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${candidate.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await candidatesApi.remove(candidate.id);
      toast.success('Candidate deleted');
      onDeleted?.(candidate.id);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const setRating = async (rating) => {
    try {
      await candidatesApi.update(candidate.id, { rating });
      const res = await candidatesApi.get(candidate.id);
      onUpdated?.(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="pb-10">
      <div className="relative overflow-hidden border-b border-white/[0.07] px-6 pb-6 pt-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-400/[0.09] to-transparent" />
        <div className="relative flex items-start gap-4">
          <Avatar name={candidate.name} size="lg" />
          <div className="min-w-0 flex-1 pr-10">
            <h2 className="truncate text-xl font-bold text-white">{candidate.name}</h2>
            <p className="mt-0.5 truncate text-sm text-zinc-400">{candidate.role}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StageBadge stage={candidate.stage} />
              <span className="chip !py-0.5 !text-[10px] capitalize">{(candidate.source || '').replace('-', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          <button onClick={() => onEdit?.(candidate)} className="btn-primary flex-1 !py-2">
            <FileText className="h-4 w-4" /> Edit profile
          </button>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
            <StarRating value={candidate.rating || 0} onChange={setRating} size={15} />
          </div>
          <button onClick={remove} disabled={busy} className="btn-icon !text-red-400 hover:!bg-red-500/10" aria-label="Delete candidate">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <section>
          <SectionTitle>Move stage</SectionTitle>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STAGE_ORDER.map((stage) => {
              const meta = STAGE_META[stage];
              const active = candidate.stage === stage;
              return (
                <motion.button
                  key={stage}
                  whileTap={{ scale: 0.96 }}
                  disabled={busy || active}
                  onClick={() => changeStage(stage)}
                  className={cn(
                    'rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-all duration-200',
                    active
                      ? 'border-white/20 bg-white/[0.1] text-white shadow-glow'
                      : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white',
                  )}
                  style={active ? { boxShadow: `0 0 24px -8px ${meta.color}` } : undefined}
                >
                  <span className="mx-auto mb-1.5 block h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </motion.button>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle>Contact & details</SectionTitle>
          <div className="mt-3 space-y-2.5">
            <DetailRow icon={Mail} value={candidate.email} href={`mailto:${candidate.email}`} />
            <DetailRow icon={Phone} value={candidate.phone || 'Not provided'} />
            <DetailRow icon={MapPin} value={candidate.location || 'Not provided'} />
            <DetailRow icon={Briefcase} value={`${candidate.experience_years ?? 0} yrs experience · expects ${formatSalary(candidate.expected_salary)}`} />
            <DetailRow icon={CalendarDays} value={`Applied ${formatDate(candidate.created_at)}`} />
            {candidate.resume_url && (
              <DetailRow icon={ExternalLink} value="View resume" href={candidate.resume_url} />
            )}
          </div>
        </section>

        <section>
          <SectionTitle>Skills</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(candidate.skills || []).length ? (
              candidate.skills.map((s) => (
                <motion.span key={s} whileHover={{ scale: 1.06 }} className="chip !bg-white/[0.06] !border-white/[0.1] !text-zinc-300">
                  {s}
                </motion.span>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No skills tagged yet.</p>
            )}
          </div>
        </section>

        {candidate.notes && (
          <section>
            <SectionTitle>Notes</SectionTitle>
            <p className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-sm leading-relaxed text-zinc-300">
              {candidate.notes}
            </p>
          </section>
        )}

        <section>
          <SectionTitle>Activity timeline</SectionTitle>
          <form onSubmit={addNote} className="mt-3 flex gap-2">
            <input
              className="glass-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
            />
            <button type="submit" disabled={adding || !note.trim()} className="btn-primary !px-3.5">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            </button>
          </form>

          <ol className="relative mt-4 space-y-4 border-l border-white/[0.1] pl-5">
            {(candidate.activities || []).map((a, i) => {
              const Icon = ICONS[a.type] || FileText;
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <span className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-ink-900">
                    <Icon className="h-2.5 w-2.5 text-brand-400" />
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-300">{a.message}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{formatDate(a.created_at)}</p>
                </motion.li>
              );
            })}
            {!(candidate.activities || []).length && (
              <li className="text-sm text-zinc-500">No activity recorded yet.</li>
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{children}</h3>;
}

function DetailRow({ icon: Icon, value, href }) {
  const content = (
    <span className="flex items-center gap-3 text-sm text-zinc-300">
      <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
      <span className="truncate">{value}</span>
    </span>
  );
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/[0.12]">
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block hover:text-white">
          {content}
        </a>
      ) : content}
    </div>
  );
}
