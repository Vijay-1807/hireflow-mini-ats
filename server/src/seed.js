import db from './db.js';

const NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Gupta', 'Ananya Iyer', 'Kabir Singh',
  'Meera Nair', 'Arjun Reddy', 'Ishita Verma', 'Vivaan Joshi', 'Sara Khan',
  'Aditya Rao', 'Priya Menon', 'Krishna Reddy', 'Tanvi Deshmukh', 'Neel Bhatt',
  'Riya Kapoor', 'Siddharth Pillai', 'Kavya Krishnan', 'Aryan Mehta', 'Nisha Chawla',
  'Dev Malhotra', 'Aisha Sheikh', 'Manav Kulkarni', 'Pooja Ramesh', 'Yash Thakur',
  'Lakshmi Prasad', 'Rahul Bose', 'Simran Kaur', 'Harsh Vardhan', 'Anjali Saxena',
  'Zara Merchant', 'Nikhil Bansal', 'Trisha Ghosh', 'Om Prakash', 'Sneha Dutta',
  'Karan Malhotra', 'Divya Balakrishnan', 'Aman Trivedi', 'Ritika Sharma', 'Vikram Sethi',
];

const ROLES = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'MERN Stack Developer', 'React Developer', 'Node.js Developer',
  'Software Engineer', 'DevOps Engineer', 'Data Analyst', 'QA Engineer',
];

const LOCATIONS = [
  'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi NCR',
  'Coimbatore', 'Jaipur', 'Kochi', 'Indore', 'Remote',
];

const SOURCES = ['careers-page', 'linkedin', 'referral', 'internshala', 'naukri', 'hackathon', 'cold-email'];

const SKILL_POOL = [
  'React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'PostgreSQL', 'TypeScript',
  'JavaScript', 'Next.js', 'Tailwind CSS', 'Redux', 'GraphQL', 'Docker',
  'AWS', 'Git', 'REST APIs', 'Python', 'Java', 'C++', 'Vue.js', 'Angular',
  'Redis', 'Kubernetes', 'Jest', 'CI/CD', 'Firebase', 'Prisma', 'Socket.io',
];

const STAGE_WEIGHTS = [
  ['applied', 30], ['screening', 22], ['interview', 18],
  ['offer', 8], ['hired', 10], ['rejected', 12],
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSkills() {
  const count = 2 + Math.floor(Math.random() * 5);
  const set = new Set();
  while (set.size < count) set.add(pick(SKILL_POOL));
  return [...set];
}

function weightedStage() {
  const total = STAGE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [stage, w] of STAGE_WEIGHTS) {
    r -= w;
    if (r <= 0) return stage;
  }
  return 'applied';
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const STAGE_MESSAGES = {
  applied: 'Application received via {source}.',
  screening: 'Resume shortlisted. Screening call scheduled.',
  interview: 'Technical interview round scheduled with the panel.',
  offer: 'Offer letter generated and sent to candidate.',
  hired: 'Candidate onboarding started. Welcome aboard!',
  rejected: 'Not moving forward this time — profile kept in talent pool.',
};

export function seed({ fresh = false } = {}) {
  if (fresh) {
    db.exec('DELETE FROM activities; DELETE FROM candidates; DELETE sqlite_sequence WHERE name IN ("candidates","activities");');
  }

  const count = db.prepare('SELECT COUNT(*) AS c FROM candidates').get().c;
  if (count > 0) {
    console.log(`Database already has ${count} candidates. Use --fresh to reseed.`);
    return;
  }

  const insertCandidate = db.prepare(`
    INSERT INTO candidates
      (name, email, phone, role, stage, source, location, experience_years, expected_salary, skills, resume_url, rating, notes, created_at, updated_at)
    VALUES
      (@name, @email, @phone, @role, @stage, @source, @location, @experience_years, @expected_salary, @skills, @resume_url, @rating, @notes, @created_at, @updated_at)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (candidate_id, type, message, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const usedEmails = new Set();

  const run = db.transaction(() => {
    for (let i = 0; i < 48; i++) {
      const name = NAMES[i % NAMES.length];
      const slug = name.toLowerCase().replace(/[^a-z]+/g, '.');
      let email = `${slug}${usedEmails.has(slug) ? i : ''}@gmail.com`;
      let n = 1;
      while (usedEmails.has(email)) email = `${slug}${n++}@gmail.com`;
      usedEmails.add(email);

      const stage = weightedStage();
      const source = pick(SOURCES);
      const daysBack = Math.floor(Math.random() * 60);
      const createdAt = daysAgo(daysBack);
      const rating = stage === 'applied' ? 0 : Math.floor(Math.random() * 4) + (Math.random() > 0.5 ? 1 : 0);

      const candidate = {
        name,
        email,
        phone: `+91 ${90000 + Math.floor(Math.random() * 99999)} ${10000 + Math.floor(Math.random() * 89999)}`,
        role: pick(ROLES),
        stage,
        source,
        location: pick(LOCATIONS),
        experience_years: Math.round(Math.random() * 60) / 10,
        expected_salary: (15 + Math.floor(Math.random() * 45)) * 1000 * 12,
        skills: JSON.stringify(pickSkills()),
        resume_url: `https://res.cloudinary.com/demo/${slug}.pdf`,
        rating,
        notes: Math.random() > 0.6 ? 'Strong communication. Keep warm.' : null,
        created_at: createdAt,
        updated_at: daysAgo(Math.max(0, daysBack - Math.floor(Math.random() * daysBack))),
      };

      const { lastInsertRowid } = insertCandidate.run(candidate);

      insertActivity.run(
        lastInsertRowid,
        'created',
        STAGE_MESSAGES.applied.replace('{source}', source.replace('-', ' ')),
        createdAt,
      );

      const stageOrder = { applied: 1, screening: 2, interview: 3, offer: 4, hired: 5, rejected: 3 };
      const target = stageOrder[stage];
      for (let s = 2; s <= target; s++) {
        const stageId = Object.keys(stageOrder).find((k) => stageOrder[k] === s && k !== 'rejected') || stage;
        if (s === target || Math.random() > 0.3) {
          insertActivity.run(
            lastInsertRowid,
            'stage_change',
            STAGE_MESSAGES[stageId === target ? stage : stageId] || `Moved to ${stageId}.`,
            daysAgo(Math.max(0, daysBack - s * 2)),
          );
        }
      }
    }
  });

  run();
  const total = db.prepare('SELECT COUNT(*) AS c FROM candidates').get().c;
  console.log(`Seeded ${total} candidates with activity timelines.`);
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed({ fresh: process.argv.includes('--fresh') });
}
