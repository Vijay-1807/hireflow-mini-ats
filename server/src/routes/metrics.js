import { Router } from 'express';
import db, { STAGES } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM candidates').get().c;

  const byStage = Object.fromEntries(STAGES.map((s) => [s.id, 0]));
  for (const row of db.prepare('SELECT stage, COUNT(*) AS c FROM candidates GROUP BY stage').all()) {
    byStage[row.stage] = row.c;
  }

  const now = new Date();
  const iso = (d) => d.toISOString().replace('T', ' ').slice(0, 19);
  const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return iso(d); };

  const last7 = db.prepare("SELECT COUNT(*) AS c FROM candidates WHERE created_at >= ?").get(daysAgo(7)).c;
  const prev7 = db.prepare("SELECT COUNT(*) AS c FROM candidates WHERE created_at >= ? AND created_at < ?").get(daysAgo(14), daysAgo(7)).c;
  const last30 = db.prepare("SELECT COUNT(*) AS c FROM candidates WHERE created_at >= ?").get(daysAgo(30)).c;

  const pipelineStages = ['applied', 'screening', 'interview', 'offer'];
  const active = pipelineStages.reduce((sum, s) => sum + (byStage[s] || 0), 0);
  const hired = byStage.hired || 0;
  const rejected = byStage.rejected || 0;
  const decided = hired + rejected;
  const conversionRate = decided ? Math.round((hired / decided) * 1000) / 10 : 0;
  const avgTimeToHire = db.prepare(`
    SELECT AVG(julianday(updated_at) - julianday(created_at)) AS days
    FROM candidates WHERE stage IN ('hired','rejected')
  `).get().days;

  const funnel = STAGES
    .filter((s) => s.id !== 'rejected')
    .map((s) => ({
      stage: s.id,
      label: s.label,
      color: s.color,
      count: byStage[s.id] || 0,
      conversion: total ? Math.round(((byStage[s.id] || 0) / total) * 1000) / 10 : 0,
    }));

  const applicationsByDay = [];
  for (let i = 13; i >= 0; i--) {
    const start = daysAgo(i);
    const end = daysAgo(i - 1);
    const count = db.prepare(
      'SELECT COUNT(*) AS c FROM candidates WHERE created_at >= ? AND created_at < ?',
    ).get(start, end).c;
    applicationsByDay.push({
      day: new Date(now.getTime() - i * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count,
    });
  }

  const bySource = db.prepare(
    'SELECT source, COUNT(*) AS c FROM candidates GROUP BY source ORDER BY c DESC',
  ).all().map((r) => ({ source: r.source.replace('-', ' '), count: r.c }));

  const byRole = db.prepare(
    'SELECT role, COUNT(*) AS c FROM candidates GROUP BY role ORDER BY c DESC LIMIT 8',
  ).all().map((r) => ({ role: r.role, count: r.c }));

  const topSkills = db.prepare('SELECT skills FROM candidates').all()
    .flatMap((r) => { try { return JSON.parse(r.skills || '[]'); } catch { return []; } })
    .reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const skills = Object.entries(topSkills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([skill, count]) => ({ skill, count }));

  const recent = db.prepare(
    'SELECT id, name, role, stage, created_at FROM candidates ORDER BY created_at DESC, id DESC LIMIT 6',
  ).all();

  const avgRating = db.prepare(
    'SELECT AVG(rating) AS r FROM candidates WHERE rating > 0',
  ).get().r;

  const openRoles = db.prepare('SELECT COUNT(DISTINCT role) AS c FROM candidates WHERE stage NOT IN (?, ?)')
    .get('hired', 'rejected').c;

  res.json({
    data: {
      summary: {
        total,
        active,
        hired,
        rejected,
        conversionRate,
        avgTimeToHire: avgTimeToHire ? Math.round(avgTimeToHire * 10) / 10 : 0,
        last7,
        growth: prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 ? 100 : 0,
        last30,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : 0,
        openRoles,
      },
      byStage: STAGES.map((s) => ({ ...s, count: byStage[s.id] || 0 })),
      funnel,
      applicationsByDay,
      bySource,
      byRole,
      skills,
      recent,
    },
  });
});

export default router;
