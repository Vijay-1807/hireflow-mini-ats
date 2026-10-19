# HireFlow Mini ATS — Video Demo Script & Render Deployment Guide

> **Applicant:** Bontha Vijay  
> **Role:** Full Stack Developer Intern — EarlyJobs.ai (Bengaluru)  
> **Repository:** [https://github.com/Vijay-1807/hireflow-mini-ats](https://github.com/Vijay-1807/hireflow-mini-ats)  
> **Assignment Deadline:** Due Oct 20  
> **Test Status:** 34 / 34 E2E Test Cases Passed (0 Issues)

---

## PART 1: RENDER DEPLOYMENT INSTRUCTIONS (Step-by-Step)

Follow these exact steps to deploy HireFlow on Render in less than 5 minutes for free:

### Method A: Blueprint Deployment (Fastest & Recommended)
1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and log in with your GitHub account.
2. Click the blue **"New +"** button at the top right, then select **"Blueprint"**.
3. Select your repository: **`Vijay-1807/hireflow-mini-ats`** (grant access if prompted).
4. Render will read the included `render.yaml` automatically:
   - **Service Name:** `hireflow-mini-ats`
   - **Runtime:** `Node`
   - **Build Command:** `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
   - **Start Command:** `npm start --prefix server`
   - **Health Check Path:** `/api/health`
5. Click **"Apply"**.
6. Wait 2–3 minutes for the build to finish. Once you see `Mini ATS API listening on http://localhost:10000`, your app is live!
7. Copy the public URL at the top (e.g. `https://hireflow-mini-ats.onrender.com`).

### Method B: Manual Web Service (Alternative)
If you prefer manual setup:
1. On Render, click **"New +"** &rarr; **"Web Service"**.
2. Connect `https://github.com/Vijay-1807/hireflow-mini-ats`.
3. Configure the settings:
   - **Name:** `hireflow-mini-ats`
   - **Region:** Singapore or Frankfurt
   - **Branch:** `master`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
   - **Start Command:** `npm start --prefix server`
   - **Instance Type:** `Free`
4. Under **Advanced**, add Environment Variable:
   - `NODE_ENV` = `production`
5. Click **"Create Web Service"**.

---

## PART 2: WORD-FOR-WORD DEMO VIDEO SCRIPT (Start to End)

**Target Duration:** ~2.5 to 3 minutes  
**Screen Setup:** Open `http://localhost:4000` (or your deployed Render URL) in full screen at 1080p, and have your microphone clear.

---

### [0:00 – 0:25] INTRO & PROJECT OVERVIEW
> *(Screen shows: Dashboard page with glassmorphism UI, stats cards, and charts)*

**What to Say:**
"Hi Saurav and the EarlyJobs.ai engineering team! My name is **Bontha Vijay**, a 2026 B.Tech graduate in Artificial Intelligence & Data Science.

This is **HireFlow**, my submission for the Full Stack Developer Intern assignment. HireFlow is a production-grade Mini Applicant Tracking System designed to manage candidates, track hiring pipelines, enable instant discovery through search, and provide actionable dashboard metrics.

On the tech stack:
- On the **frontend**, I used **React 18 with Vite**, **Tailwind CSS**, **Framer Motion** for spring animations, **@dnd-kit** for the drag-and-drop pipeline, and **Recharts** for visualizations.
- On the **backend**, it runs on **Node.js with Express** and an embedded **SQLite database using WAL mode** for ultra-fast, transactional reads and writes with zero external database dependencies.

Let's dive into the live walkthrough!"

---

### [0:25 – 0:55] FEATURE 1: HIRING DASHBOARD & METRICS
> *(Action: Mouse moves over KPI cards, then hover over the 14-day trend line and source donut chart)*

**What to Say:**
"Starting here on the **Dashboard**, hiring managers get an instant executive pulse of their recruiting pipeline:
- At the top, we have **animated KPI cards** showing Total Candidates, Active Pipeline count, Hired talent, and Average Time to Close—with real-time week-over-week growth indicators.
- Below that, the **14-day application trend line** visualizes candidate influx over time.
- Next to it, the **Source Distribution donut chart** shows which acquisition channels—like LinkedIn, referrals, or campus drives—yield the highest volume.
- Further down, we have a **Stage Funnel** showing percentage conversion through each stage, a **Top Skills cloud** highlighting in-demand talent tags, and a **Recent Applicants feed** for rapid review.

All metrics are computed via aggregated SQL queries on the backend with millisecond response times."

---

### [0:55 – 1:30] FEATURE 2: CANDIDATE MANAGEMENT, INSTANT SEARCH & FILTERS
> *(Action: Click "Candidates" in sidebar. Type "React" in search. Then filter by stage "Interview". Switch to Grid view and back to Table view)*

**What to Say:**
"Moving to the **Candidates module**:
- Here we have 48 seeded realistic candidates. I built an **instant, debounced search** across multiple fields simultaneously—matching candidate name, email, role, skills, location, and phone number without bogging down the database.
- We can filter specifically by **Hiring Stage**, **Job Role**, or **Source**, and sort ascending or descending by any column—name, experience, rating, or date applied.
- For different recruiter workflows, I implemented a **Table View** for compact data density, and a **Card Grid View** for visual candidate scanning.
- We also support **Bulk Selection**—let me select these three candidates and bulk-move them directly to 'Interview' in a single transactional API call with feedback toasts."

---

### [1:30 – 2:05] FEATURE 3: KANBAN PIPELINE & OPTIMISTIC DRAG-AND-DROP
> *(Action: Click "Pipeline" in sidebar. Drag a candidate card from "Screening" to "Interview", then another to "Offer")*

**What to Say:**
"Next is the heart of any modern ATS: the **Hiring Pipeline**.
- The pipeline represents the 6 key stages: *Applied, Screening, Interview, Offer, Hired, and Rejected*.
- Each column shows live candidate counters, color accents, salary expectations, and top skill chips.
- I implemented **Drag-and-Drop using @dnd-kit**. When I pick up a candidate—for example, moving Diya from *Screening* into *Interview*—the UI responds **optimistically with spring physics**. The candidate instantly docks, column counters update immediately, and the backend updates the database in the background. If any network failure occurs, the state gracefully rolls back with an error toast."

---

### [2:05 – 2:35] FEATURE 4: CANDIDATE DRAWER & ACTIVITY AUDIT TRAIL
> *(Action: Click on any candidate card. The slide-over drawer opens. Add a note: "Strong system design skills, recommend for next round", hit Enter. Show the timeline. Click a stage button to change stage)*

**What to Say:**
"Clicking any candidate opens a comprehensive **Slide-Over Profile Drawer**:
- Here we see their full contact details, years of experience, expected CTC, resume links, and an interactive **Star Rating component**.
- Most importantly, we have a complete **Activity Audit Trail**:
  - Every time a candidate moves between stages—whether via Kanban drag-and-drop or quick stage buttons—an automated audit log is written with a timestamp.
  - Recruiters can also add interview feedback or notes right here. Let me type *'Strong system design skills, recommend for next round'* and press Enter—it immediately posts to the backend and appends to the timeline."

---

### [2:35 – 3:00] FEATURE 5: ENGINEERING, EDGE CASES & TESTS
> *(Action: Click "+ Add candidate" button, trigger empty validation, fill a quick sample candidate, show toast. If desired, briefly show terminal showing 34 passing tests)*

**What to Say:**
"From an engineering standpoint, I paid close attention to edge cases:
- Clicking **'Add Candidate'** triggers client and server-side validation against empty fields, invalid emails, and duplicate submissions.
- Search queries are parameter-bound to prevent SQL injection vulnerabilities.
- The UI is fully **responsive** with dedicated mobile bottom-navigation tested on iPhone/Android viewports.
- And to verify system stability, I wrote an automated **Playwright end-to-end test suite covering 34 test cases** across dashboard rendering, search, filters, drag-and-drop, audit logs, and API failure modes—with a **100% pass rate**."

---

### [3:00 – 3:15] CONCLUSION
> *(Action: Return to Dashboard with camera / mic focused)*

**What to Say:**
"HireFlow was built from the ground up to reflect how modern recruitment platforms operate: fast, fluid, and intuitive.

I am very excited about the **Full Stack Developer Intern role at EarlyJobs.ai**, working directly from your Bengaluru office and shipping real-world product features under the guidance of your CTO.

The repository, live deployment, and documentation are all linked in my submission. Thank you for your time and consideration!"

---

## PART 3: SCREENING FORM QUICK-FILL CHEAT SHEET
*(Keep this ready when opening https://forms.gle/XcpXbf6ZS9WoHBzKA)*

1. **Full Name:** Bontha Vijay
2. **Email:** your-email@gmail.com
3. **Phone:** +91-XXXXXXXXXX
4. **Graduation Year & Degree:** 2026 — B.Tech in Artificial Intelligence and Data Science
5. **Location / Availability:** Ready to work from the Bengaluru office for the 6-month internship
6. **GitHub Repository URL:** `https://github.com/Vijay-1807/hireflow-mini-ats`
7. **Deployed App URL:** `https://hireflow-mini-ats.onrender.com` *(use your live link from Render)*
8. **Demo Video Link:** *(Your Loom or Google Drive link)*
9. **Why EarlyJobs.ai / Summary of Project:**
   *"Built HireFlow, a full-stack Mini ATS in React, Node.js, and SQLite. Delivered complete CRUD candidate management, multi-field search and filters, a 6-stage Kanban board with optimistic drag-and-drop, candidate detail drawers with an activity audit trail, and an analytics dashboard with live KPI metrics and trend charts. Thoroughly tested with 34 automated Playwright e2e test cases. Eager to bring this product-first execution mindset to EarlyJobs.ai in Bengaluru."*
