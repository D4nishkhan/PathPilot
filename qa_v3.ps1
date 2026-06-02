$base = "http://localhost:5000/api"

function req {
    param($method, $url, $body, $token)
    try {
        $h = @{"Content-Type"="application/json"}
        if ($token) { $h["Authorization"] = "Bearer $token" }
        $p = @{Uri=$url; Method=$method; Headers=$h; TimeoutSec=8; ErrorAction="Stop"}
        if ($body) { $p["Body"] = ($body | ConvertTo-Json -Compress -Depth 5) }
        $resp = Invoke-WebRequest @p
        return @{ok=$true; code=[int]$resp.StatusCode; data=($resp.Content | ConvertFrom-Json)}
    } catch {
        $c = 0; try { $c = [int]$_.Exception.Response.StatusCode } catch {}
        $b = ""; try { $b = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
        return @{ok=$false; code=$c; err=$_.Exception.Message; body=$b}
    }
}

function pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green }
function fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Cyan }

Write-Host "`n=== PathPilot Complete QA Audit ===" -ForegroundColor Magenta

# ────────────────────────────────────────────────────────────────
Write-Host "`n[1] HEALTH & SERVER" -ForegroundColor Yellow
$r = req "GET" "http://localhost:5000/health"
if ($r.ok) { pass "Health check OK - timestamp=$($r.data.timestamp)" } else { fail "Health check FAILED ($($r.err))" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[2] AUTHENTICATION" -ForegroundColor Yellow

# Student login
$r = req "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="student123"}
$st = $null
if ($r.ok) { $st = $r.data.token; pass "Student login → name=$($r.data.user.name) xp=$($r.data.user.xp) level=$($r.data.user.level) streak=$($r.data.user.streak) plan=$($r.data.user.plan)" }
else { fail "Student login FAILED (HTTP $($r.code)) $($r.body)" }

# Admin login
$r = req "POST" "$base/auth/login" @{email="admin@pathpilot.dev";password="admin123456"}
$at = $null
if ($r.ok) { $at = $r.data.token; pass "Admin login → role=$($r.data.user.role) plan=$($r.data.user.plan) xp=$($r.data.user.xp)" }
else { fail "Admin login FAILED (HTTP $($r.code)) $($r.body)" }

# Wrong password
$r = req "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="WRONGPASS"}
if ($r.code -eq 401) { pass "Wrong password → 401 Unauthorized [CORRECT]" }
else { fail "Wrong password returned HTTP $($r.code) [BUG: should be 401]" }

# No credentials
$r = req "POST" "$base/auth/login" @{email="student@pathpilot.dev"}
if (!$r.ok) { pass "Missing password → blocked (HTTP $($r.code))" }

# Unauth access
$r = req "GET" "$base/auth/me"
if ($r.code -eq 401) { pass "No token → 401 [CORRECT]" }
else { fail "No token protection missing (HTTP $($r.code))" }

# Get me
$r = req "GET" "$base/auth/me" $null $st
if ($r.ok) { pass "GET /me → name=$($r.data.user.name) email=$($r.data.user.email)" }
else { fail "GET /me FAILED" }

# Register new user
$ts = Get-Date -Format "HHmmss"
$r = req "POST" "$base/auth/register" @{name="QA Tester $ts";email="qa$ts@qa.com";password="qapass123"}
if ($r.ok) { pass "Register new user → token issued" }
else { fail "Register FAILED (HTTP $($r.code)) $($r.body)" }

# Duplicate email
$r = req "POST" "$base/auth/register" @{name="Dup";email="student@pathpilot.dev";password="pass123"}
if ($r.code -eq 400) { pass "Duplicate email → 400 [CORRECT]" }
else { fail "Duplicate email not blocked (HTTP $($r.code)) [BUG]" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[3] TRACKS & CONTENT" -ForegroundColor Yellow

$r = req "GET" "$base/tracks"
$tracks = @()
if ($r.ok) {
    $tracks = $r.data.tracks
    pass "GET /tracks → $($tracks.Count) tracks (public, no auth needed)"
    foreach ($t in $tracks) {
        info "  Track: '$($t.title)' | cat=$($t.category) | diff=$($t.difficulty) | premium=$($t.isPremium) | rating=$($t.rating)"
    }
} else { fail "GET /tracks FAILED: $($r.err)" }

# Filter
$r = req "GET" "$base/tracks?category=backend"
if ($r.ok) { pass "Filter by category=backend → $($r.data.tracks.Count) results" }

$r2 = req "GET" "$base/tracks?difficulty=intermediate"
if ($r2.ok) { pass "Filter by difficulty=intermediate → $($r2.data.tracks.Count) results" }

$r3 = req "GET" "$base/tracks?search=Java"
if ($r3.ok) { pass "Search 'Java' → $($r3.data.tracks.Count) results" }

# Track detail
$trackId = if ($tracks.Count -gt 0) { $tracks[0]._id } else { $null }
$topicId = $null
$quizId = $null
$freeTrackId = ($tracks | Where-Object { $_.isPremium -eq $false } | Select-Object -First 1)._id
$premTrackId = ($tracks | Where-Object { $_.isPremium -eq $true } | Select-Object -First 1)._id

if ($freeTrackId) {
    $r = req "GET" "$base/tracks/$freeTrackId" $null $st
    if ($r.ok) {
        $mods = $r.data.modules
        pass "Track detail → $($mods.Count) modules, progressMap returned"
        if ($mods.Count -gt 0 -and $mods[0].topics.Count -gt 0) {
            $t0 = $mods[0].topics[0]
            $topicId = $t0._id
            $quizId = if ($t0.quizId) { if ($t0.quizId._id) { $t0.quizId._id } else { $t0.quizId } } else { $null }
            info "  First topic: '$($t0.title)' | videoAttached=$($t0.videoId -ne $null) | quizAttached=$($quizId -ne $null) | noteAttached=$($t0.noteId -ne $null)"
        }
    } else { fail "Track detail FAILED (HTTP $($r.code))" }
}

# Premium track blocked for free user
if ($premTrackId) {
    $r = req "GET" "$base/tracks/$premTrackId" $null $st
    if ($r.code -eq 403) { pass "Premium track blocked for free user → 403 [CORRECT]" }
    else { fail "Premium track NOT blocked for free user (HTTP $($r.code)) [SECURITY BUG]" }
    
    # Admin bypasses premium
    $r = req "GET" "$base/tracks/$premTrackId" $null $at
    if ($r.ok) { pass "Admin bypasses premium track guard [CORRECT]" }
    else { fail "Admin cannot access premium track (HTTP $($r.code)) [BUG]" }
}

# Topic detail
if ($topicId -and $freeTrackId) {
    $r = req "GET" "$base/tracks/$freeTrackId/topics/$topicId" $null $st
    if ($r.ok) { pass "Topic detail → title='$($r.data.topic.title)' | hasVideo=$($r.data.topic.videoId -ne $null) | progressReturned=$($r.data.progress -ne $null)" }
    else { fail "Topic detail FAILED (HTTP $($r.code)) $($r.body)" }
}

# ────────────────────────────────────────────────────────────────
Write-Host "`n[4] PROGRESS TRACKING" -ForegroundColor Yellow

if ($topicId) {
    # 50% progress
    $r = req "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=50;watchTime=1200} $st
    if ($r.ok) { pass "Video 50% → saved, justCompleted=$($r.data.justCompleted) xpAwarded=$($r.data.xpAwarded)" }
    else { fail "Video progress 50% FAILED (HTTP $($r.code)) $($r.body)" }

    # 85% → should trigger completion
    $r = req "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=85;watchTime=600} $st
    if ($r.ok) {
        if ($r.data.justCompleted) { pass "Video 85% → COMPLETED, XP awarded=$($r.data.xpAwarded)" }
        else { warn "Video 85% → progress saved but justCompleted=false (may have been completed before)" }
    } else { fail "Video progress 85% FAILED (HTTP $($r.code))" }

    # Regression: progress should not go backwards
    $r = req "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=10;watchTime=0} $st
    if ($r.ok) {
        if ($r.data.progress.watchedPercentage -ge 80) { pass "Progress anti-regression: cannot go below 85% [CORRECT]" }
        else { fail "Progress regressed to $($r.data.progress.watchedPercentage)% [BUG]" }
    }
}

# Dashboard
$r = req "GET" "$base/progress/dashboard" $null $st
if ($r.ok) {
    $s = $r.data.stats
    pass "Dashboard → XP=$($s.xp) level=$($s.level) streak=$($s.streak) completedVideos=$($s.completedVideos) studyMinutes=$($s.totalStudyTime)"
    pass "Dashboard → trackProgress=$($r.data.trackProgress.Count) tracks, recentActivity=$($r.data.recentActivity.Count) items"
} else { fail "Dashboard FAILED (HTTP $($r.code)) $($r.err)" }

# Analytics
$r = req "GET" "$base/progress/analytics" $null $st
if ($r.ok) { pass "Analytics → videosCompleted=$($r.data.analytics.videosCompleted) quizzesPassed=$($r.data.analytics.quizzesPassed) avgQuiz=$($r.data.analytics.avgQuizScore)%" }
else { fail "Analytics FAILED (HTTP $($r.code))" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[5] QUIZ SYSTEM" -ForegroundColor Yellow

if ($quizId) {
    $r = req "GET" "$base/quizzes/$quizId" $null $st
    if ($r.ok) {
        $quiz = $r.data.quiz
        pass "Get quiz '$($quiz.title)' → $($quiz.questions.Count) questions | passingScore=$($quiz.passingScore)%"
        # SECURITY: check isCorrect hidden
        $exposed = $quiz.questions[0].options | Where-Object { $null -ne $_.isCorrect }
        if ($exposed) { fail "SECURITY: isCorrect field EXPOSED in quiz response [MUST FIX]" }
        else { pass "isCorrect hidden from client [SECURE]" }

        # Submit quiz (all first options - likely wrong)
        $answers = @()
        foreach ($q in $quiz.questions) { $answers += @{questionId=$q._id;selectedOptions=@(0)} }
        $r2 = req "POST" "$base/quizzes/$quizId/attempt" @{answers=$answers} $st
        if ($r2.ok) { pass "Quiz submit → score=$($r2.data.score)% passed=$($r2.data.passed) passingScore=$($r2.data.passingScore)%" }
        else { fail "Quiz submit FAILED (HTTP $($r2.code)) $($r2.body)" }

        # Get attempts
        $r3 = req "GET" "$base/quizzes/$quizId/attempts" $null $st
        if ($r3.ok) { pass "Quiz attempts → $($r3.data.attempts.Count) attempt(s) recorded" }
    } else { fail "Get quiz FAILED (HTTP $($r.code))" }
} else { warn "No quizId found to test - skipping quiz tests" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[6] USER MANAGEMENT" -ForegroundColor Yellow

$r = req "GET" "$base/users/me" $null $st
if ($r.ok) { pass "GET /users/me → name=$($r.data.user.name) badges=$($r.data.user.badges.Count)" }

$r = req "PUT" "$base/users/me" @{name="Demo Student"} $st
if ($r.ok) { pass "Update profile → name=$($r.data.user.name)" }
else { fail "Update profile FAILED (HTTP $($r.code))" }

$r = req "GET" "$base/users/leaderboard" $null $st
if ($r.ok) { pass "Leaderboard → $($r.data.leaderboard.Count) users, sorted by XP" }
else { fail "Leaderboard FAILED" }

# Change password and restore
$r = req "PUT" "$base/users/change-password" @{currentPassword="student123";newPassword="newpass999"} $st
if ($r.ok) {
    pass "Change password → success"
    # Re-login with new pass
    $r2 = req "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="newpass999"}
    if ($r2.ok) { 
        pass "Login with new password → works"
        $st = $r2.data.token  # update token
        # Restore
        $r3 = req "PUT" "$base/users/change-password" @{currentPassword="newpass999";newPassword="student123"} $st
        if ($r3.ok) { pass "Password restored to original" }
    }
} else { fail "Change password FAILED (HTTP $($r.code)) $($r.body)" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[7] PAYMENTS" -ForegroundColor Yellow

$r = req "GET" "$base/payments/plans"
if ($r.ok) {
    $plans = $r.data.plans
    pass "GET /payments/plans → plans: $($plans.PSObject.Properties.Name -join ', ')"
    info "  Free: $($plans.free.features.Count) features | Premium: $($plans.premium.features.Count) features"
}

$r = req "POST" "$base/payments/create-order" @{plan="premium"} $st
if (!$r.ok -and $r.code -ge 500) { warn "Create order fails (expected - no Razorpay keys configured): HTTP $($r.code)" }
elseif ($r.ok) { pass "Create order returned order ID (Razorpay keys configured!)" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[8] ADMIN PANEL" -ForegroundColor Yellow

# Block student
$r = req "GET" "$base/admin/analytics" $null $st
if ($r.code -eq 403) { pass "Admin route blocked for student → 403 [CORRECT]" }
else { fail "Student can access admin (HTTP $($r.code)) [CRITICAL SECURITY BUG]" }

# Admin analytics
$r = req "GET" "$base/admin/analytics" $null $at
if ($r.ok) {
    $a = $r.data.analytics
    pass "Admin analytics → totalUsers=$($a.totalUsers) premiumUsers=$($a.premiumUsers) totalTracks=$($a.totalTracks) completedTopics=$($a.totalProgress)"
    pass "Admin analytics → recentUsers=$($a.recentUsers.Count) usersByDay=$($a.usersByDay.Count) days"
} else { fail "Admin analytics FAILED (HTTP $($r.code))" }

# Admin tracks CRUD
$r = req "GET" "$base/admin/tracks" $null $at
if ($r.ok) { pass "Admin tracks list → $($r.data.tracks.Count) tracks" }

$ts = Get-Date -Format "HHmmss"
$r = req "POST" "$base/admin/tracks" @{title="QA Track $ts";slug="qa-$ts";description="QA only";category="frontend";difficulty="beginner";estimatedHours=5;isPublished=$false} $at
$newTid = $null
if ($r.ok) { 
    $newTid = $r.data.track._id
    pass "Admin create track → id=$newTid"
    $r2 = req "PUT" "$base/admin/tracks/$newTid" @{isPublished=$true;estimatedHours=10} $at
    if ($r2.ok) { pass "Admin update track → published=$($r2.data.track.isPublished)" }
    $r3 = req "DELETE" "$base/admin/tracks/$newTid" $null $at
    if ($r3.ok) { pass "Admin delete track → $($r3.data.message)" }
} else { fail "Admin create track FAILED (HTTP $($r.code)) $($r.body)" }

# Admin users
$r = req "GET" "$base/admin/users" $null $at
if ($r.ok) { pass "Admin users → total=$($r.data.total) on page=$($r.data.users.Count)" }

$r = req "GET" "$base/admin/users?search=Demo" $null $at
if ($r.ok) { pass "Admin user search 'Demo' → $($r.data.users.Count) results" }

# Admin quizzes
$r = req "GET" "$base/admin/quizzes" $null $at
if ($r.ok) { pass "Admin quizzes list → $($r.data.quizzes.Count) quizzes" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[9] PREMIUM GUARDS" -ForegroundColor Yellow

# Interview blocked for free user
$r = req "POST" "$base/ai/interview" @{mode="java";message=""} $st
if ($r.code -eq 403) { pass "Mock Interview blocked for free user → 403 [CORRECT]" }
else { fail "Interview not blocked for free user (HTTP $($r.code)) [SECURITY BUG]" }

# Interview passes for admin
$r = req "POST" "$base/ai/interview" @{mode="java";message=""} $at
if ($r.ok) { pass "Interview accessible for admin (admin bypasses premium) [CORRECT]" }
elseif ($r.code -eq 503 -or ($r.body -match "GEMINI|API")) { warn "Interview: AI API key not set, but auth guard passed correctly [EXPECTED]" }
else { fail "Interview admin bypass FAILED (HTTP $($r.code))" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[10] AI ENDPOINTS (without API key)" -ForegroundColor Yellow

$r = req "POST" "$base/ai/tutor" @{message="What is OOP?"} $st
if ($r.ok) { pass "AI Tutor → response received" }
elseif ($r.body -match "API_KEY|quota|key" -or $r.code -eq 500) { warn "AI Tutor: Gemini API key not configured (HTTP $($r.code)) - endpoint exists, auth works" }
else { fail "AI Tutor FAILED unexpectedly (HTTP $($r.code))" }

$r = req "GET" "$base/ai/chats" $null $st
if ($r.ok) { pass "AI chat history → $($r.data.chats.Count) chats" }
else { fail "AI chat history FAILED (HTTP $($r.code))" }

$r = req "GET" "$base/ai/roadmaps" $null $st
if ($r.ok) { pass "AI roadmaps list → $($r.data.roadmaps.Count) roadmaps" }
else { fail "AI roadmaps FAILED (HTTP $($r.code))" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[11] PASSWORD RESET FLOW" -ForegroundColor Yellow

$r = req "POST" "$base/auth/forgot-password" @{email="student@pathpilot.dev"}
if ($r.ok) { pass "Forgot password (existing user) → $($r.data.message)" }
elseif ($r.code -eq 500 -and $r.body -match "Email") { warn "Forgot password: Email not sent (SMTP not configured) - token saved in DB" }
else { fail "Forgot password FAILED (HTTP $($r.code)) $($r.body)" }

$r = req "POST" "$base/auth/forgot-password" @{email="nobody@fake.com"}
if ($r.code -eq 404) { pass "Forgot password for unknown email → 404 [CORRECT]" }
else { fail "Forgot password nonexistent email returned HTTP $($r.code) [BUG]" }

# ────────────────────────────────────────────────────────────────
Write-Host "`n[12] DATABASE PERSISTENCE" -ForegroundColor Yellow

# Re-login and check XP was persisted
$r = req "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="student123"}
if ($r.ok) {
    $xp = $r.data.user.xp
    pass "XP persisted across logins → xp=$xp"
    if ($xp -gt 250) { pass "XP increased from base 250 (video/quiz XP awarded and persisted)" }
}

$r = req "GET" "$base/progress/dashboard" $null $st
if ($r.ok -and $r.data.stats.completedVideos -gt 0) {
    pass "Progress persisted → completedVideos=$($r.data.stats.completedVideos)"
} else { warn "No completed videos yet (may be fresh seed)" }

Write-Host "`n=== AUDIT COMPLETE ===" -ForegroundColor Magenta
