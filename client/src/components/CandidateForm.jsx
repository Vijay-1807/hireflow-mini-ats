import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesApi } from '../api/client';
import { STAGE_META, cn } from '../lib/utils';
import StarRating from './StarRating';

const EMPTY = {
  name: '', email: '', phone: '', role: '', stage: 'applied', source: 'careers-page',
  location: '', experience_years: '', expected_salary: '', resume_url: '', rating: 0, notes: '',
};

const ROLES = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'MERN Stack Developer',
  'React Developer', 'Node.js Developer', 'Software Engineer', 'DevOps Engineer',
  'Data Analyst', 'QA Engineer',
];

const SOURCES = ['careers-page', 'linkedin', 'referral', 'internshala', 'naukri', 'hackathon', 'cold-email'];

export default function CandidateForm({ candidate, onSaved, onCancel }) {
  const editing = Boolean(candidate?.id);
  const [form, setForm] = useState(EMPTY);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidate) {
      setForm({
        ...EMPTY,
        ...candidate,
        experience_years: candidate.experience_years ?? '',
        expected_salary: candidate.expected_salary ?? '',
        rating: candidate.rating ?? 0,
      });
      setSkills(Array.isArray(candidate.skills) ? candidate.skills : []);
    } else {
      setForm(EMPTY);
      setSkills([]);
    }
    setErrors({});
  }, [candidate]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const addSkill = (raw) => {
    const value = String(raw || skillInput).trim();
    if (!value) return;
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((s) => [...s, value]);
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills((s) => s.filter((x) => x !== skill));

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'Enter a valid email';
    if (!form.role.trim()) er.role = 'Role is required';
    if (form.experience_years !== '' && (Number(form.experience_years) < 0 || Number.isNaN(Number(form.experience_years)))) {
      er.experience_years = 'Must be 0 or more';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills,
        experience_years: form.experience_years === '' ? 0 : Number(form.experience_years),
        expected_salary: form.expected_salary === '' ? null : Number(form.expected_salary),
        rating: Number(form.rating) || 0,
        phone: form.phone || null,
        location: form.location || null,
        resume_url: form.resume_url || null,
        notes: form.notes || null,
      };
      const res = editing
        ? await candidatesApi.update(candidate.id, payload)
        : await candidatesApi.create(payload);
      toast.success(editing ? 'Candidate updated' : `${payload.name} added to pipeline`);
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name *" error={errors.name}>
          <input className="glass-input" value={form.name} onChange={set('name')} placeholder="Aarav Sharma" autoFocus />
        </Field>
        <Field label="Email *" error={errors.email}>
          <input className="glass-input" type="email" value={form.email} onChange={set('email')} placeholder="aarav@gmail.com" />
        </Field>
        <Field label="Phone">
          <input className="glass-input" value={form.phone || ''} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Location">
          <input className="glass-input" value={form.location || ''} onChange={set('location')} placeholder="Bengaluru" />
        </Field>
        <Field label="Role applied for *" error={errors.role}>
          <input className="glass-input" list="role-options" value={form.role} onChange={set('role')} placeholder="Full Stack Developer" />
          <datalist id="role-options">
            {ROLES.map((r) => <option key={r} value={r} />)}
          </datalist>
        </Field>
        <Field label="Stage">
          <select className="glass-select" value={form.stage} onChange={set('stage')}>
            {Object.entries(STAGE_META).map(([id, meta]) => (
              <option key={id} value={id} className="bg-ink-900">{meta.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select className="glass-select" value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => (
              <option key={s} value={s} className="bg-ink-900 capitalize">{s.replace('-', ' ')}</option>
            ))}
          </select>
        </Field>
        <Field label="Experience (years)" error={errors.experience_years}>
          <input className="glass-input" type="number" step="0.5" min="0" value={form.experience_years} onChange={set('experience_years')} placeholder="2.5" />
        </Field>
        <Field label="Expected salary (₹ / year)">
          <input className="glass-input" type="number" min="0" step="10000" value={form.expected_salary} onChange={set('expected_salary')} placeholder="600000" />
        </Field>
        <Field label="Resume URL">
          <input className="glass-input" value={form.resume_url || ''} onChange={set('resume_url')} placeholder="https://..." />
        </Field>
      </div>

      <Field label="Skills">
        <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2.5">
          <div className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {skills.map((skill) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="chip !bg-brand-500/15 !border-brand-400/30 !text-brand-200"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${skill}`}>
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <input
              className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-500"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addSkill();
                }
                if (e.key === 'Backspace' && !skillInput && skills.length) removeSkill(skills[skills.length - 1]);
              }}
              placeholder="Type a skill + Enter…"
            />
            {skillInput && (
              <button type="button" onClick={() => addSkill()} className="btn-icon !p-1" aria-label="Add skill">
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Field>

      <Field label={`Rating — ${form.rating || 0}/5`}>
        <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5">
          <StarRating value={Number(form.rating) || 0} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} size={18} />
        </div>
      </Field>

      <Field label="Notes">
        <textarea
          className="glass-input min-h-[88px] resize-y"
          value={form.notes || ''}
          onChange={set('notes')}
          placeholder="Interview observations, salary discussion, availability…"
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-5">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add candidate'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', error ? 'text-red-400' : 'text-zinc-400')}>
        {label}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 block text-[11px] text-red-400"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
