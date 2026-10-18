import { Router } from 'express';
import db, { STAGES } from '../db.js';

const router = Router();

const stageIds = STAGES.map((s) => s.id);

function parseSkills(row) {
  let skills = [];
  try { skills = JSON.parse(row.skills || '[]'); } catch { skills = []; }
  return { ...row, skills };
}

const SORTABLE = {
  name: 'name',
  email: 'email',
  role: 'role',
  stage: 'stage',
  experience: 'experience_years',
  rating: 'rating',
  created: 'created_at',
  updated: 'updated_at',
  salary: 'expected_salary',
};

router.get('/', (req, res) => {
  const {
    q = '',
    stage,
    role,
    source,
    location,
    sort = 'created',
    order = 'desc',
    page = 1,
    limit = 50,
  } = req.query;

  const where = [];
  const params = {};

  if (q.trim()) {
    where.push(`(name LIKE @q OR email LIKE @q OR role LIKE @q OR skills LIKE @q OR location LIKE @q OR phone LIKE @q)`);
    params.q = `%${q.trim()}%`;
  }
  if (stage && stageIds.includes(stage)) {
    where.push('stage = @stage');
    params.stage = stage;
  }
  if (role) { where.push('role = @role'); params.role = role; }
  if (source) { where.push('source = @source'); params.source = source; }
  if (location) { where.push('location = @location'); params.location = location; }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortCol = SORTABLE[sort] || 'created_at';
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM candidates ${whereSql}`).get(params).c;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const rows = db.prepare(
    `SELECT * FROM candidates ${whereSql} ORDER BY ${sortCol} ${dir} LIMIT @limit OFFSET @offset`,
  ).all({ ...params, limit: limitNum, offset });

  res.json({
    data: rows.map(parseSkills),
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get('/filters/options', (_req, res) => {
  const roles = db.prepare('SELECT DISTINCT role FROM candidates ORDER BY role').all().map((r) => r.role);
  const sources = db.prepare('SELECT DISTINCT source FROM candidates ORDER BY source').all().map((r) => r.source);
  const locations = db.prepare('SELECT DISTINCT location FROM candidates ORDER BY location').all().map((r) => r.location);
  const skills = db.prepare('SELECT skills FROM candidates').all()
    .flatMap((r) => { try { return JSON.parse(r.skills || '[]'); } catch { return []; } });
  res.json({
    data: { roles, sources, locations, skills: [...new Set(skills)].sort(), stages: STAGES },
  });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Candidate not found' });
  const activities = db.prepare(
    'SELECT * FROM activities WHERE candidate_id = ? ORDER BY created_at DESC, id DESC',
  ).all(row.id);
  res.json({ data: { ...parseSkills(row), activities } });
});

function validate(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.name !== undefined) {
    if (!body.name || !String(body.name).trim()) errors.push('Name is required');
  }
  if (!partial || body.email !== undefined) {
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) errors.push('A valid email is required');
  }
  if (!partial || body.role !== undefined) {
    if (!body.role || !String(body.role).trim()) errors.push('Role is required');
  }
  if (body.stage !== undefined && !stageIds.includes(body.stage)) {
    errors.push(`Stage must be one of: ${stageIds.join(', ')}`);
  }
  if (body.rating !== undefined && body.rating !== null) {
    const r = Number(body.rating);
    if (!Number.isInteger(r) || r < 0 || r > 5) errors.push('Rating must be an integer between 0 and 5');
  }
  return errors;
}

function toRow(body) {
  const row = {};
  const map = {
    name: 'name', email: 'email', phone: 'phone', role: 'role', stage: 'stage',
    source: 'source', location: 'location', experience_years: 'experience_years',
    expected_salary: 'expected_salary', resume_url: 'resume_url', rating: 'rating', notes: 'notes',
  };
  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) row[col] = body[key] === '' || body[key] === null ? null : body[key];
  }
  if (body.skills !== undefined) {
    row.skills = JSON.stringify(Array.isArray(body.skills) ? body.skills : []);
  }
  return row;
}

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const email = String(req.body.email).trim().toLowerCase();
  const dupe = db.prepare('SELECT id FROM candidates WHERE lower(email) = ?').get(email);
  if (dupe) return res.status(409).json({ error: 'A candidate with this email already exists' });

  const row = toRow(req.body);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const tx = db.transaction(() => {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO candidates (name, email, phone, role, stage, source, location, experience_years, expected_salary, skills, resume_url, rating, notes, created_at, updated_at)
      VALUES (@name, @email, @phone, @role, @stage, @source, @location, @experience_years, @expected_salary, @skills, @resume_url, @rating, @notes, @created_at, @updated_at)
    `).run({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      phone: null, role: String(req.body.role).trim(),
      stage: req.body.stage || 'applied',
      source: req.body.source || 'careers-page',
      location: null, experience_years: 0, expected_salary: null,
      skills: '[]', resume_url: null, rating: 0, notes: null,
      ...row,
      created_at: now,
      updated_at: now,
    });

    db.prepare('INSERT INTO activities (candidate_id, type, message, created_at) VALUES (?, ?, ?, ?)')
      .run(lastInsertRowid, 'created', `Candidate added to the pipeline as ${(req.body.stage || 'applied')}.`, now);

    return lastInsertRowid;
  });

  const id = tx();
  const created = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.status(201).json({ data: parseSkills(created) });
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });

  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();
    const dupe = db.prepare('SELECT id FROM candidates WHERE lower(email) = ? AND id != ?').get(email, existing.id);
    if (dupe) return res.status(409).json({ error: 'A candidate with this email already exists' });
  }

  const row = toRow(req.body);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const stageChanged = req.body.stage && req.body.stage !== existing.stage;

  const tx = db.transaction(() => {
    const cols = Object.keys(row);
    if (cols.length) {
      db.prepare(
        `UPDATE candidates SET ${cols.map((c) => `${c} = @${c}`).join(', ')}, updated_at = @updated_at WHERE id = @id`,
      ).run({ ...row, updated_at: now, id: existing.id });
    } else {
      db.prepare('UPDATE candidates SET updated_at = ? WHERE id = ?').run(now, existing.id);
    }
    if (stageChanged) {
      const label = STAGES.find((s) => s.id === req.body.stage)?.label || req.body.stage;
      db.prepare('INSERT INTO activities (candidate_id, type, message, created_at) VALUES (?, ?, ?, ?)')
        .run(existing.id, 'stage_change', `Moved from ${existing.stage} to ${label}.`, now);
    }
  });
  tx();

  const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(existing.id);
  res.json({ data: parseSkills(updated) });
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });
  db.prepare('DELETE FROM candidates WHERE id = ?').run(existing.id);
  res.json({ data: { id: existing.id, deleted: true } });
});

router.post('/bulk-stage', (req, res) => {
  const { ids, stage } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids must be a non-empty array' });
  if (!stageIds.includes(stage)) return res.status(400).json({ error: `Invalid stage: ${stage}` });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const label = STAGES.find((s) => s.id === stage).label;
  const update = db.prepare('UPDATE candidates SET stage = ?, updated_at = ? WHERE id = ?');
  const log = db.prepare('INSERT INTO activities (candidate_id, type, message, created_at) VALUES (?, ?, ?, ?)');

  const tx = db.transaction(() => {
    let updated = 0;
    for (const id of ids) {
      const c = db.prepare('SELECT id, stage FROM candidates WHERE id = ?').get(id);
      if (!c) continue;
      update.run(stage, now, id);
      log.run(id, 'stage_change', `Moved from ${c.stage} to ${label}.`, now);
      updated++;
    }
    return updated;
  });

  const updated = tx();
  res.json({ data: { updated, stage } });
});

router.post('/:id/activities', (req, res) => {
  const existing = db.prepare('SELECT id FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare('INSERT INTO activities (candidate_id, type, message, created_at) VALUES (?, ?, ?, ?)')
    .run(existing.id, req.body.type || 'note', message, now);
  const activities = db.prepare('SELECT * FROM activities WHERE candidate_id = ? ORDER BY created_at DESC, id DESC').all(existing.id);
  res.status(201).json({ data: activities });
});

export default router;
