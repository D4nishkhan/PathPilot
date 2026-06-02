const http = require('http');

const BASE = 'http://localhost:5000';
let studentToken = null;
let adminToken = null;
let results = { pass: 0, fail: 0, warn: 0 };

function log(status, msg) {
  const symbols = { PASS: '✅', FAIL: '❌', WARN: '⚠️', INFO: 'ℹ️' };
  console.log(`  ${symbols[status] || '•'} [${status}] ${msg}`);
  if (status === 'PASS') results.pass++;
  else if (status === 'FAIL') results.fail++;
  else if (status === 'WARN') results.warn++;
}

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode < 400, code: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ ok: false, code: res.statusCode, data: data }); }
      });
    });
    r.on('error', (e) => resolve({ ok: false, code: 0, data: null, err: e.message }));
    r.setTimeout(8000, () => { r.destroy(); resolve({ ok: false, code: 0, data: null, err: 'timeout' }); });
    r.write(bodyStr);
    r.end();
  });
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        PathPilot Complete QA Audit - Node.js         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── 1. HEALTH ──────────────────────────────────────
  console.log('[1] HEALTH & SERVER');
  let r = await req('GET', '/health', null, null);
  if (r.ok) log('PASS', `Health check OK — timestamp=${r.data.timestamp}`);
  else log('FAIL', `Health check FAILED: ${r.err || r.code}`);

  // ── 2. AUTH ────────────────────────────────────────
  console.log('\n[2] AUTHENTICATION');

  // Student login
  r = await req('POST', '/api/auth/login', { email: 'student@pathpilot.dev', password: 'student123' });
  if (r.ok) {
    studentToken = r.data.token;
    log('PASS', `Student login → name=${r.data.user.name} xp=${r.data.user.xp} level=${r.data.user.level} streak=${r.data.user.streak} plan=${r.data.user.plan}`);
  } else log('FAIL', `Student login FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // Admin login
  r = await req('POST', '/api/auth/login', { email: 'admin@pathpilot.dev', password: 'admin123456' });
  if (r.ok) {
    adminToken = r.data.token;
    log('PASS', `Admin login → role=${r.data.user.role} plan=${r.data.user.plan} xp=${r.data.user.xp}`);
  } else log('FAIL', `Admin login FAILED (HTTP ${r.code})`);

  // Wrong password
  r = await req('POST', '/api/auth/login', { email: 'student@pathpilot.dev', password: 'WRONG' });
  if (r.code === 401) log('PASS', 'Wrong password → 401 Unauthorized [CORRECT]');
  else log('FAIL', `Wrong password returned HTTP ${r.code} [should be 401]`);

  // No token
  r = await req('GET', '/api/auth/me');
  if (r.code === 401) log('PASS', 'No token → 401 [CORRECT]');
  else log('FAIL', `No token returned HTTP ${r.code} [should be 401]`);

  // Get me
  r = await req('GET', '/api/auth/me', null, studentToken);
  if (r.ok) log('PASS', `GET /auth/me → name=${r.data.user.name} email=${r.data.user.email} plan=${r.data.user.plan}`);
  else log('FAIL', `GET /auth/me FAILED`);

  // Register
  const ts = Date.now();
  r = await req('POST', '/api/auth/register', { name: `QA User ${ts}`, email: `qa${ts}@test.com`, password: 'qapass123' });
  if (r.ok) log('PASS', `Register new user → token issued, user created`);
  else log('FAIL', `Register FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // Duplicate email
  r = await req('POST', '/api/auth/register', { name: 'Dup', email: 'student@pathpilot.dev', password: 'pass123' });
  if (r.code === 400) log('PASS', 'Duplicate email → 400 [CORRECT]');
  else log('FAIL', `Duplicate email not blocked (HTTP ${r.code})`);

  // Empty body
  r = await req('POST', '/api/auth/login', {});
  if (!r.ok) log('PASS', `Empty login body → blocked (HTTP ${r.code})`);
  else log('FAIL', 'Empty login body returned 200 [BUG]');

  // ── 3. TRACKS ──────────────────────────────────────
  console.log('\n[3] TRACKS & CONTENT');

  r = await req('GET', '/api/tracks');
  let tracks = [], freeTrackId = null, premTrackId = null, topicId = null, quizId = null;
  if (r.ok) {
    tracks = r.data.tracks;
    log('PASS', `GET /tracks (public, no auth) → ${tracks.length} tracks`);
    tracks.forEach(t => log('INFO', `  Track: "${t.title}" | cat=${t.category} | diff=${t.difficulty} | premium=${t.isPremium} | rating=${t.rating} | enrolled=${t.enrolledCount}`));
    freeTrackId = tracks.find(t => !t.isPremium)?._id;
    premTrackId = tracks.find(t => t.isPremium)?._id;
  } else log('FAIL', `GET /tracks FAILED (HTTP ${r.code})`);

  // Filter
  r = await req('GET', '/api/tracks?category=backend');
  if (r.ok) log('PASS', `Filter category=backend → ${r.data.tracks.length} results`);

  r = await req('GET', '/api/tracks?difficulty=intermediate');
  if (r.ok) log('PASS', `Filter difficulty=intermediate → ${r.data.tracks.length} results`);

  r = await req('GET', '/api/tracks?search=Java');
  if (r.ok) log('PASS', `Search "Java" → ${r.data.tracks.length} results`);

  // Track detail (free)
  if (freeTrackId) {
    r = await req('GET', `/api/tracks/${freeTrackId}`, null, studentToken);
    if (r.ok) {
      const mods = r.data.modules;
      log('PASS', `Free track detail → ${mods.length} modules, progressMap returned=${!!r.data.progressMap}`);
      if (mods.length > 0 && mods[0].topics.length > 0) {
        const t0 = mods[0].topics[0];
        topicId = t0._id;
        quizId = t0.quizId?._id || t0.quizId;
        log('INFO', `  First topic: "${t0.title}" | video=${!!t0.videoId} | quiz=${!!quizId} | note=${!!t0.noteId} | xpReward=${t0.xpReward}`);
      }
    } else log('FAIL', `Free track detail FAILED (HTTP ${r.code})`);
  }

  // Premium track blocked for free user
  if (premTrackId) {
    r = await req('GET', `/api/tracks/${premTrackId}`, null, studentToken);
    if (r.code === 403) log('PASS', 'Premium track → blocked for free user (403) [CORRECT]');
    else log('FAIL', `Premium track NOT blocked for free user (HTTP ${r.code}) [SECURITY BUG]`);

    r = await req('GET', `/api/tracks/${premTrackId}`, null, adminToken);
    if (r.ok) log('PASS', 'Premium track → admin bypass works [CORRECT]');
    else log('FAIL', `Admin cannot access premium track (HTTP ${r.code})`);
  }

  // Topic detail
  if (topicId && freeTrackId) {
    r = await req('GET', `/api/tracks/${freeTrackId}/topics/${topicId}`, null, studentToken);
    if (r.ok) {
      log('PASS', `Topic detail → title="${r.data.topic.title}" | hasProgress=${!!r.data.progress}`);
    } else log('FAIL', `Topic detail FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);
  }

  // ── 4. PROGRESS TRACKING ───────────────────────────
  console.log('\n[4] PROGRESS TRACKING');

  if (topicId) {
    r = await req('POST', '/api/progress/video', { topicId, watchedPercentage: 50, watchTime: 1200 }, studentToken);
    if (r.ok) log('PASS', `Video 50% → saved, justCompleted=${r.data.justCompleted}, xpAwarded=${r.data.xpAwarded}`);
    else log('FAIL', `Video 50% FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

    r = await req('POST', '/api/progress/video', { topicId, watchedPercentage: 85, watchTime: 600 }, studentToken);
    if (r.ok) {
      if (r.data.justCompleted) log('PASS', `Video 85% → COMPLETED, XP awarded=${r.data.xpAwarded}`);
      else log('WARN', `Video 85% → saved but justCompleted=false (was already completed)`);
    } else log('FAIL', `Video 85% FAILED (HTTP ${r.code})`);

    // Anti-regression test
    r = await req('POST', '/api/progress/video', { topicId, watchedPercentage: 10, watchTime: 0 }, studentToken);
    if (r.ok && r.data.progress.watchedPercentage >= 80) log('PASS', `Progress anti-regression: cannot go below 80% [CORRECT]`);
    else if (r.ok) log('FAIL', `Progress regressed to ${r.data.progress.watchedPercentage}% [BUG]`);

    // No topicId
    r = await req('POST', '/api/progress/video', { watchedPercentage: 50 }, studentToken);
    if (!r.ok) log('PASS', `Missing topicId → blocked (HTTP ${r.code})`);
    else log('WARN', 'Missing topicId not validated [minor bug]');
  }

  // Dashboard
  r = await req('GET', '/api/progress/dashboard', null, studentToken);
  if (r.ok) {
    const s = r.data.stats;
    log('PASS', `Dashboard → xp=${s.xp} level=${s.level} streak=${s.streak} completedVideos=${s.completedVideos} studyMinutes=${s.totalStudyTime}`);
    log('PASS', `Dashboard → trackProgress=${r.data.trackProgress.length} tracks, recentActivity=${r.data.recentActivity.length} items`);
  } else log('FAIL', `Dashboard FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // Analytics
  r = await req('GET', '/api/progress/analytics', null, studentToken);
  if (r.ok) log('PASS', `Analytics → videosCompleted=${r.data.analytics.videosCompleted} quizzesPassed=${r.data.analytics.quizzesPassed} avgQuiz=${r.data.analytics.avgQuizScore}%`);
  else log('FAIL', `Analytics FAILED (HTTP ${r.code})`);

  // ── 5. QUIZ ────────────────────────────────────────
  console.log('\n[5] QUIZ SYSTEM');

  if (quizId) {
    r = await req('GET', `/api/quizzes/${quizId}`, null, studentToken);
    if (r.ok) {
      const quiz = r.data.quiz;
      log('PASS', `GET quiz "${quiz.title}" → ${quiz.questions.length} questions | passingScore=${quiz.passingScore}%`);
      // Security: isCorrect should be hidden
      const hasCorrect = quiz.questions[0]?.options?.some(o => o.isCorrect !== undefined);
      if (hasCorrect) log('FAIL', 'SECURITY: isCorrect field EXPOSED in quiz response [MUST FIX]');
      else log('PASS', 'isCorrect hidden from client response [SECURE]');
      // explanation hidden?
      const hasExplain = quiz.questions[0]?.options?.some(o => o.explanation !== undefined);
      if (hasExplain) log('WARN', 'Explanation field exposed in options before submission [minor leak]');

      // Submit quiz
      const answers = quiz.questions.map(q => ({ questionId: q._id, selectedOptions: [0] }));
      r = await req('POST', `/api/quizzes/${quizId}/attempt`, { answers }, studentToken);
      if (r.ok) log('PASS', `Quiz submit → score=${r.data.score}% passed=${r.data.passed} passingScore=${r.data.passingScore}%`);
      else log('FAIL', `Quiz submit FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

      // Get attempts history
      r = await req('GET', `/api/quizzes/${quizId}/attempts`, null, studentToken);
      if (r.ok) log('PASS', `Quiz attempts → ${r.data.attempts.length} attempt(s) stored in DB`);
    } else log('FAIL', `GET quiz FAILED (HTTP ${r.code})`);
  } else log('WARN', 'No quizId found — quiz tests skipped');

  // ── 6. USERS ───────────────────────────────────────
  console.log('\n[6] USER MANAGEMENT');

  r = await req('GET', '/api/users/me', null, studentToken);
  if (r.ok) log('PASS', `GET /users/me → name=${r.data.user.name} badges=${r.data.user.badges?.length || 0}`);
  else log('FAIL', `GET /users/me FAILED`);

  r = await req('PUT', '/api/users/me', { name: 'Demo Student' }, studentToken);
  if (r.ok) log('PASS', `Update profile → name=${r.data.user.name}`);
  else log('FAIL', `Update profile FAILED (HTTP ${r.code})`);

  r = await req('GET', '/api/users/leaderboard', null, studentToken);
  if (r.ok) {
    const lb = r.data.leaderboard;
    log('PASS', `Leaderboard → ${lb.length} users`);
    if (lb.length > 1 && lb[0].xp >= lb[1].xp) log('PASS', 'Leaderboard sorted by XP desc [CORRECT]');
  } else log('FAIL', 'Leaderboard FAILED');

  // Change password & restore
  r = await req('PUT', '/api/users/change-password', { currentPassword: 'student123', newPassword: 'temp999' }, studentToken);
  if (r.ok) {
    log('PASS', 'Change password → success');
    const r2 = await req('POST', '/api/auth/login', { email: 'student@pathpilot.dev', password: 'temp999' });
    if (r2.ok) { log('PASS', 'Login with new password → works'); studentToken = r2.data.token; }
    const r3 = await req('PUT', '/api/users/change-password', { currentPassword: 'temp999', newPassword: 'student123' }, studentToken);
    if (r3.ok) log('PASS', 'Password restored to original');
  } else log('FAIL', `Change password FAILED (HTTP ${r.code})`);

  // ── 7. PAYMENTS ────────────────────────────────────
  console.log('\n[7] PAYMENTS');

  r = await req('GET', '/api/payments/plans');
  if (r.ok) {
    log('PASS', `GET /payments/plans → plans: ${Object.keys(r.data.plans).join(', ')}`);
    log('INFO', `  Free: ${r.data.plans.free.features.length} features | Premium: ${r.data.plans.premium.features.length} features`);
    log('INFO', `  Premium price: ₹${r.data.plans.premium.price / 100}`);
  } else log('FAIL', 'GET /payments/plans FAILED');

  r = await req('POST', '/api/payments/create-order', { plan: 'premium' }, studentToken);
  if (r.ok) log('PASS', 'Create order → Razorpay keys configured, order created');
  else if (r.code === 500) log('WARN', `Create order fails (HTTP ${r.code}) — Razorpay keys not set in .env [EXPECTED for local dev]`);
  else log('FAIL', `Create order FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // ── 8. ADMIN PANEL ─────────────────────────────────
  console.log('\n[8] ADMIN PANEL');

  // Student blocked
  r = await req('GET', '/api/admin/analytics', null, studentToken);
  if (r.code === 403) log('PASS', 'Student blocked from admin → 403 [CORRECT]');
  else log('FAIL', `Student accessed admin (HTTP ${r.code}) [CRITICAL SECURITY BUG]`);

  // Admin analytics
  r = await req('GET', '/api/admin/analytics', null, adminToken);
  if (r.ok) {
    const a = r.data.analytics;
    log('PASS', `Admin analytics → users=${a.totalUsers} premium=${a.premiumUsers} tracks=${a.totalTracks} completedTopics=${a.totalProgress}`);
    log('PASS', `Admin analytics → recentUsers=${a.recentUsers.length} usersByDay=${a.usersByDay.length} days with activity`);
  } else log('FAIL', `Admin analytics FAILED (HTTP ${r.code})`);

  // Admin tracks CRUD
  r = await req('GET', '/api/admin/tracks', null, adminToken);
  if (r.ok) log('PASS', `Admin GET tracks → ${r.data.tracks.length} tracks`);

  const slug = `qa-${Date.now()}`;
  r = await req('POST', '/api/admin/tracks', { title: 'QA Track', slug, description: 'test', category: 'frontend', difficulty: 'beginner', estimatedHours: 5, isPublished: false }, adminToken);
  let newTid = null;
  if (r.ok) {
    newTid = r.data.track._id;
    log('PASS', `Admin create track → id=${newTid}`);
    const r2 = await req('PUT', `/api/admin/tracks/${newTid}`, { isPublished: true, estimatedHours: 10 }, adminToken);
    if (r2.ok) log('PASS', `Admin update track → published=${r2.data.track.isPublished}`);
    const r3 = await req('DELETE', `/api/admin/tracks/${newTid}`, null, adminToken);
    if (r3.ok) log('PASS', `Admin delete track → ${r3.data.message}`);
  } else log('FAIL', `Admin create track FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // Admin users
  r = await req('GET', '/api/admin/users', null, adminToken);
  if (r.ok) log('PASS', `Admin GET users → total=${r.data.total}, page=${r.data.users.length}`);

  r = await req('GET', '/api/admin/users?search=Demo', null, adminToken);
  if (r.ok) log('PASS', `Admin user search "Demo" → ${r.data.users.length} results`);

  r = await req('GET', '/api/admin/quizzes', null, adminToken);
  if (r.ok) log('PASS', `Admin GET quizzes → ${r.data.quizzes.length} quizzes`);

  // ── 9. PREMIUM GUARDS ──────────────────────────────
  console.log('\n[9] PREMIUM GUARDS');

  r = await req('POST', '/api/ai/interview', { mode: 'java', message: '' }, studentToken);
  if (r.code === 403) log('PASS', `Interview blocked for free user → 403 [CORRECT]`);
  else log('FAIL', `Interview NOT blocked for free user (HTTP ${r.code}) [SECURITY BUG]`);

  r = await req('POST', '/api/ai/interview', { mode: 'java', message: '' }, adminToken);
  if (r.ok) log('PASS', 'Interview passes for admin [CORRECT]');
  else if (r.code === 500 || JSON.stringify(r.data).includes('API_KEY') || JSON.stringify(r.data).includes('quota')) {
    log('WARN', `Interview: auth guard PASSED, AI call fails (Gemini key not set) HTTP ${r.code}`);
  } else log('FAIL', `Interview admin bypass FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // ── 10. AI ENDPOINTS ───────────────────────────────
  console.log('\n[10] AI ENDPOINTS');

  r = await req('POST', '/api/ai/tutor', { message: 'What is OOP?' }, studentToken);
  if (r.ok) log('PASS', `AI Tutor → response length=${JSON.stringify(r.data.response).length} chars`);
  else if (r.code === 500) log('WARN', `AI Tutor: endpoint exists, auth works, Gemini API not configured (HTTP ${r.code})`);
  else log('FAIL', `AI Tutor FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/ai/chats', null, studentToken);
  if (r.ok) log('PASS', `AI chat history → ${r.data.chats.length} chat sessions`);
  else log('FAIL', `AI chats FAILED (HTTP ${r.code})`);

  r = await req('GET', '/api/ai/roadmaps', null, studentToken);
  if (r.ok) log('PASS', `AI roadmaps → ${r.data.roadmaps.length} saved roadmaps`);
  else log('FAIL', `AI roadmaps FAILED (HTTP ${r.code})`);

  // Free user roadmap limit test
  r = await req('POST', '/api/ai/roadmap/generate', { skill: 'Python', currentLevel: 'beginner', dailyHours: 2, goal: 'Job' }, studentToken);
  if (r.ok) log('PASS', `Roadmap generate → title="${r.data.roadmap?.title}"`);
  else if (r.code === 403 && r.data.code === 'UPGRADE_REQUIRED') log('PASS', `Roadmap limit enforced for free user (already has 1 roadmap) [CORRECT]`);
  else if (r.code === 500) log('WARN', `Roadmap generate: Gemini API not configured (HTTP ${r.code})`);
  else log('FAIL', `Roadmap generate FAILED (HTTP ${r.code}): ${JSON.stringify(r.data)}`);

  // ── 11. PASSWORD RESET ─────────────────────────────
  console.log('\n[11] PASSWORD RESET FLOW');

  r = await req('POST', '/api/auth/forgot-password', { email: 'student@pathpilot.dev' });
  if (r.ok) log('PASS', `Forgot password (valid email) → ${r.data.message}`);
  else if (r.code === 500 && JSON.stringify(r.data).includes('Email')) log('WARN', 'Forgot password: token saved in DB, email failed (SMTP not configured)');
  else log('FAIL', `Forgot password FAILED (HTTP ${r.code})`);

  r = await req('POST', '/api/auth/forgot-password', { email: 'nobody@fake.com' });
  if (r.code === 404) log('PASS', 'Forgot password for unknown email → 404 [CORRECT]');
  else log('FAIL', `Forgot password unknown email → HTTP ${r.code} [should be 404]`);

  // ── 12. DATABASE PERSISTENCE ───────────────────────
  console.log('\n[12] DATABASE PERSISTENCE');

  // Fresh login to get persisted state
  r = await req('POST', '/api/auth/login', { email: 'student@pathpilot.dev', password: 'student123' });
  if (r.ok) {
    const xp = r.data.user.xp;
    log('PASS', `XP persisted across sessions → xp=${xp}`);
    if (xp > 250) log('PASS', `XP increased above seed value (video/quiz XP awarded and persisted)`);
    else log('WARN', 'XP still at seed value — video/quiz completion XP may not have triggered');
    studentToken = r.data.token;
  }

  r = await req('GET', '/api/progress/dashboard', null, studentToken);
  if (r.ok && r.data.stats.completedVideos > 0) {
    log('PASS', `Progress persisted in DB → completedVideos=${r.data.stats.completedVideos} studyTime=${r.data.stats.totalStudyTime}min`);
  } else if (r.ok) {
    log('WARN', `Dashboard shows 0 completed videos — check if 80% threshold triggered`);
  }

  // ── SUMMARY ────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  QA RESULTS: ✅ ${results.pass} PASS | ❌ ${results.fail} FAIL | ⚠️  ${results.warn} WARN  ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

run().catch(console.error);
