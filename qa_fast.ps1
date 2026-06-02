$base = "http://localhost:5000/api"

function Test-API {
    param($Name, $Method, $Url, $Body, $Token)
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        $params = @{ Uri=$Url; Method=$Method; Headers=$headers; TimeoutSec=10; ErrorAction="Stop" }
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Compress) }
        $response = Invoke-WebRequest @params
        $data = $response.Content | ConvertFrom-Json
        return @{ Status="PASS"; Code=$response.StatusCode; Data=$data }
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        $bodyText = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $bodyText = [System.IO.StreamReader]::new($stream).ReadToEnd()
        } catch {}
        return @{ Status="FAIL"; Code=$code; Error=$_.Exception.Message; Body=$bodyText }
    }
}

Write-Host "=== PathPilot API QA AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. HEALTH ──────────────────────────────────────────────
Write-Host "[ AUTH & HEALTH ]" -ForegroundColor Yellow
$r = Test-API "Health" "GET" "http://localhost:5000/health"
Write-Host " [$($r.Status)] Health Check (HTTP $($r.Code))"

# ── 2. REGISTER ────────────────────────────────────────────
$ts = Get-Date -Format "HHmmss"
$r = Test-API "Register" "POST" "$base/auth/register" @{name="QA User $ts";email="qa$ts@test.com";password="testpass123"}
Write-Host " [$($r.Status)] Register new user (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){'token:'+$r.Data.token.Substring(0,15)+'...'})"
$newUserToken = if($r.Status -eq 'PASS'){$r.Data.token}

# ── 3. DUPLICATE REGISTER ──────────────────────────────────
$r = Test-API "DuplicateReg" "POST" "$base/auth/register" @{name="Dup";email="student@pathpilot.dev";password="abc"}
Write-Host " [$($r.Status)] Duplicate register blocked (HTTP $($r.Code)) $(if($r.Code -eq 400){'[CORRECT]'}else{'[BUG - should be 400]'})"

# ── 4. STUDENT LOGIN ───────────────────────────────────────
$r = Test-API "StudentLogin" "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="student123"}
$st = $null
if ($r.Status -eq "PASS") {
    $st = $r.Data.token
    Write-Host " [PASS] Student Login (HTTP $($r.Code)) name=$($r.Data.user.name) xp=$($r.Data.user.xp) level=$($r.Data.user.level) streak=$($r.Data.user.streak)"
} else {
    Write-Host " [FAIL] Student Login (HTTP $($r.Code)) $($r.Body)"
}

# ── 5. ADMIN LOGIN ─────────────────────────────────────────
$r = Test-API "AdminLogin" "POST" "$base/auth/login" @{email="admin@pathpilot.dev";password="admin123456"}
$at = $null
if ($r.Status -eq "PASS") {
    $at = $r.Data.token
    Write-Host " [PASS] Admin Login (HTTP $($r.Code)) role=$($r.Data.user.role) plan=$($r.Data.user.plan)"
} else {
    Write-Host " [FAIL] Admin Login (HTTP $($r.Code)) $($r.Body)"
}

# ── 6. WRONG PASSWORD ──────────────────────────────────────
$r = Test-API "WrongPass" "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="wrongpass"}
Write-Host " [$($r.Status)] Wrong password → 401 (HTTP $($r.Code)) $(if($r.Code -eq 401){'[CORRECT]'})"

# ── 7. NO TOKEN ────────────────────────────────────────────
$r = Test-API "NoToken" "GET" "$base/auth/me"
Write-Host " [$($r.Status)] No token → 401 (HTTP $($r.Code)) $(if($r.Code -eq 401){'[CORRECT]'})"

# ── 8. GET ME ──────────────────────────────────────────────
$r = Test-API "GetMe" "GET" "$base/auth/me" $null $st
Write-Host " [$($r.Status)] GET /me name=$($r.Data.user.name) plan=$($r.Data.user.plan)"

Write-Host ""
Write-Host "[ TRACKS ]" -ForegroundColor Yellow

# ── 9. GET TRACKS (public) ─────────────────────────────────
$r = Test-API "GetTracks" "GET" "$base/tracks"
$tracks = @()
if ($r.Status -eq "PASS") {
    $tracks = $r.Data.tracks
    Write-Host " [PASS] GET /tracks → $($tracks.Count) tracks"
    $tracks | ForEach-Object { Write-Host "        '$($_.title)' | cat=$($_.category) | premium=$($_.isPremium) | published=$($_.isPublished)" }
} else {
    Write-Host " [FAIL] GET /tracks $($r.Error)"
}

# ── 10. FILTER TRACKS ──────────────────────────────────────
$r = Test-API "FilterTracks" "GET" "$base/tracks?category=backend"
Write-Host " [$($r.Status)] Filter backend tracks → $($r.Data.tracks.Count) results"

$r2 = Test-API "FilterDiff" "GET" "$base/tracks?difficulty=intermediate"
Write-Host " [$($r2.Status)] Filter intermediate → $($r2.Data.tracks.Count) results"

# ── 11. TRACK DETAIL ───────────────────────────────────────
$trackId = if ($tracks.Count -gt 0) { $tracks[0]._id } else { $null }
$topicId = $null
$quizId = $null
if ($trackId) {
    $r = Test-API "TrackDetail" "GET" "$base/tracks/$trackId" $null $st
    if ($r.Status -eq "PASS") {
        $mods = $r.Data.modules
        Write-Host " [PASS] Track detail '$($r.Data.track.title)' → $($mods.Count) modules"
        if ($mods.Count -gt 0 -and $mods[0].topics.Count -gt 0) {
            $topicId = $mods[0].topics[0]._id
            $quizId  = $mods[0].topics[0].quizId._id
            Write-Host "        First topic: '$($mods[0].topics[0].title)' | videoId=$($mods[0].topics[0].videoId -ne $null) | quizId=$($quizId -ne $null)"
        }
    } else {
        Write-Host " [FAIL] Track detail (HTTP $($r.Code)) $($r.Body)"
    }
}

# ── 12. PREMIUM TRACK (free user) ──────────────────────────
$premTrack = $tracks | Where-Object { $_.isPremium -eq $true } | Select-Object -First 1
if ($premTrack) {
    $r = Test-API "PremiumBlock" "GET" "$base/tracks/$($premTrack._id)" $null $st
    Write-Host " [$($r.Status)] Premium track blocked for free user (HTTP $($r.Code)) $(if($r.Code -eq 403){'[CORRECT]'}else{'[BUG - should be 403]'})"
}

# ── 13. TOPIC DETAIL ───────────────────────────────────────
if ($topicId) {
    $r = Test-API "TopicDetail" "GET" "$base/tracks/$trackId/topics/$topicId" $null $st
    if ($r.Status -eq "PASS") {
        Write-Host " [PASS] Topic detail '$($r.Data.topic.title)' | video=$($r.Data.topic.videoId -ne $null) | progress=$($r.Data.progress -ne $null)"
    } else {
        Write-Host " [FAIL] Topic detail (HTTP $($r.Code)) $($r.Body)"
    }
}

Write-Host ""
Write-Host "[ PROGRESS ]" -ForegroundColor Yellow

# ── 14. UPDATE VIDEO PROGRESS ──────────────────────────────
if ($topicId) {
    $r = Test-API "VideoProgress50" "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=50;watchTime=1200} $st
    Write-Host " [$($r.Status)] Video 50% progress (HTTP $($r.Code)) justCompleted=$($r.Data.justCompleted)"

    $r = Test-API "VideoProgress85" "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=85;watchTime=600} $st
    Write-Host " [$($r.Status)] Video 85% progress (HTTP $($r.Code)) justCompleted=$($r.Data.justCompleted) xpAwarded=$($r.Data.xpAwarded)"
}

# ── 15. DASHBOARD ──────────────────────────────────────────
$r = Test-API "Dashboard" "GET" "$base/progress/dashboard" $null $st
if ($r.Status -eq "PASS") {
    $s = $r.Data.stats
    Write-Host " [PASS] Dashboard → XP=$($s.xp) level=$($s.level) streak=$($s.streak) completedVideos=$($s.completedVideos) studyTime=$($s.totalStudyTime)min"
} else {
    Write-Host " [FAIL] Dashboard (HTTP $($r.Code)) $($r.Error)"
}

# ── 16. ANALYTICS ──────────────────────────────────────────
$r = Test-API "Analytics" "GET" "$base/progress/analytics" $null $st
Write-Host " [$($r.Status)] Analytics → videosCompleted=$($r.Data.analytics.videosCompleted) avgQuiz=$($r.Data.analytics.avgQuizScore)"

Write-Host ""
Write-Host "[ QUIZ ]" -ForegroundColor Yellow

# ── 17. GET QUIZ (no answers) ──────────────────────────────
if ($quizId) {
    $r = Test-API "GetQuiz" "GET" "$base/quizzes/$quizId" $null $st
    if ($r.Status -eq "PASS") {
        $quiz = $r.Data.quiz
        Write-Host " [PASS] Quiz '$($quiz.title)' → $($quiz.questions.Count) questions | passingScore=$($quiz.passingScore)%"
        # Check answers are hidden
        $hasCorrect = $quiz.questions[0].options | Where-Object { $_.isCorrect -ne $null } | Measure-Object
        Write-Host " $(if($hasCorrect.Count -gt 0){'[BUG] isCorrect EXPOSED to client'}else{'[PASS] isCorrect hidden from client'})"
    } else {
        Write-Host " [FAIL] Get Quiz (HTTP $($r.Code)) $($r.Body)"
    }

    # Submit quiz - all first option
    $answers = @()
    if ($r.Status -eq "PASS") {
        foreach ($q in $r.Data.quiz.questions) { $answers += @{questionId=$q._id;selectedOptions=@(0)} }
    }
    if ($answers.Count -gt 0) {
        $r2 = Test-API "SubmitQuiz" "POST" "$base/quizzes/$quizId/attempt" @{answers=$answers} $st
        Write-Host " [$($r2.Status)] Submit Quiz → score=$($r2.Data.score)% passed=$($r2.Data.passed) passingScore=$($r2.Data.passingScore)%"
    }
}

Write-Host ""
Write-Host "[ USERS ]" -ForegroundColor Yellow

$r = Test-API "GetProfile" "GET" "$base/users/me" $null $st
Write-Host " [$($r.Status)] GET /users/me → name=$($r.Data.user.name)"

$r = Test-API "Leaderboard" "GET" "$base/users/leaderboard" $null $st
Write-Host " [$($r.Status)] Leaderboard → $($r.Data.leaderboard.Count) users"

$r = Test-API "UpdateProfile" "PUT" "$base/users/me" @{name="Demo Student"} $st
Write-Host " [$($r.Status)] Update Profile → name=$($r.Data.user.name)"

Write-Host ""
Write-Host "[ PAYMENTS ]" -ForegroundColor Yellow

$r = Test-API "GetPlans" "GET" "$base/payments/plans"
Write-Host " [$($r.Status)] GET /payments/plans → plans=$($r.Data.plans.PSObject.Properties.Name -join ',')"

$r = Test-API "CreateOrder_NoKey" "POST" "$base/payments/create-order" @{plan="premium"} $st
Write-Host " [$($r.Status)] Create Order (HTTP $($r.Code)) $(if($r.Status -eq 'FAIL'){"Expected failure (no Razorpay keys): $(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

Write-Host ""
Write-Host "[ ADMIN ]" -ForegroundColor Yellow

$r = Test-API "AdminBlock" "GET" "$base/admin/analytics" $null $st
Write-Host " [$($r.Status)] Student blocked from admin (HTTP $($r.Code)) $(if($r.Code -eq 403){'[CORRECT]'})"

$r = Test-API "AdminAnalytics" "GET" "$base/admin/analytics" $null $at
if ($r.Status -eq "PASS") {
    $a = $r.Data.analytics
    Write-Host " [PASS] Admin Analytics → users=$($a.totalUsers) premium=$($a.premiumUsers) tracks=$($a.totalTracks) progressDocs=$($a.totalProgress)"
}

$r = Test-API "AdminTracks" "GET" "$base/admin/tracks" $null $at
Write-Host " [$($r.Status)] Admin GET tracks → $($r.Data.tracks.Count)"

$r = Test-API "AdminUsers" "GET" "$base/admin/users" $null $at
Write-Host " [$($r.Status)] Admin GET users → $($r.Data.users.Count) total=$($r.Data.total)"

$r = Test-API "AdminUserSearch" "GET" "$base/admin/users?search=student" $null $at
Write-Host " [$($r.Status)] Admin user search 'student' → $($r.Data.users.Count) results"

# Create+Delete track
$ts2 = Get-Date -Format "HHmmss"
$r = Test-API "AdminCreateTrack" "POST" "$base/admin/tracks" @{title="QA Track $ts2";slug="qa-$ts2";description="QA test";category="frontend";difficulty="beginner";estimatedHours=5;isPublished=$false} $at
Write-Host " [$($r.Status)] Admin create track (HTTP $($r.Code)) id=$($r.Data.track._id)"
if ($r.Status -eq "PASS") {
    $newId = $r.Data.track._id
    $r2 = Test-API "AdminUpdateTrack" "PUT" "$base/admin/tracks/$newId" @{isPublished=$true} $at
    Write-Host " [$($r2.Status)] Admin update track published=$($r2.Data.track.isPublished)"
    $r3 = Test-API "AdminDeleteTrack" "DELETE" "$base/admin/tracks/$newId" $null $at
    Write-Host " [$($r3.Status)] Admin delete track → $($r3.Data.message)"
}

Write-Host ""
Write-Host "[ PREMIUM GUARD ]" -ForegroundColor Yellow

$r = Test-API "InterviewBlock" "POST" "$base/ai/interview" @{mode="java";message=""} $st
Write-Host " [$($r.Status)] Interview blocked free user (HTTP $($r.Code)) $(if($r.Code -eq 403){'[CORRECT]'})"

$r = Test-API "InterviewAdminPass" "POST" "$base/ai/interview" @{mode="java";message=""} $at
Write-Host " [$($r.Status)] Interview admin bypass (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){'[CORRECT]'})"

Write-Host ""
Write-Host "[ FORGOT PASSWORD ]" -ForegroundColor Yellow
$r = Test-API "ForgotPass" "POST" "$base/auth/forgot-password" @{email="student@pathpilot.dev"}
Write-Host " [$($r.Status)] Forgot password (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){$r.Data.message}else{"$(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

$r = Test-API "ForgotPassFake" "POST" "$base/auth/forgot-password" @{email="nobody@nowhere.com"}
Write-Host " [$($r.Status)] Forgot pass nonexistent (HTTP $($r.Code)) $(if($r.Code -eq 404){'[CORRECT 404]'})"

Write-Host ""
Write-Host "[ DATABASE PERSISTENCE ]" -ForegroundColor Yellow
# Check progress was persisted
if ($topicId) {
    $r = Test-API "CheckPersist" "GET" "$base/progress/dashboard" $null $st
    Write-Host " [$($r.Status)] Progress persisted after video → completedVideos=$($r.Data.stats.completedVideos)"
}

Write-Host ""
Write-Host "=== QA AUDIT COMPLETE ===" -ForegroundColor Green
