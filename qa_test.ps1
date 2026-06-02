$base = "http://localhost:5000/api"
$results = @()

function Test-API {
    param($Name, $Method, $Url, $Body, $Token)
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        
        if ($Body) {
            $json = $Body | ConvertTo-Json -Compress
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -Body $json -TimeoutSec 15 -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -TimeoutSec 15 -ErrorAction Stop
        }
        $data = $response.Content | ConvertFrom-Json
        return @{ Name=$Name; Status="PASS"; Code=$response.StatusCode; Data=$data }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $body = ""
        if ($_.Exception.Response) {
            try { $body = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
        }
        return @{ Name=$Name; Status="FAIL"; Code=$code; Error=$_.Exception.Message; Body=$body }
    }
}

# ─── 1. Health Check ─────────────────────────────────
$r = Test-API "Health Check" "GET" "$base/../health"
Write-Host "[$($r.Status)] Health Check (HTTP $($r.Code))"

# ─── 2. Auth: Register ───────────────────────────────
$r = Test-API "Register (new user)" "POST" "$base/auth/register" @{name="QA Tester";email="qa_test_$(Get-Date -Format 'mmss')@test.com";password="testpass123"}
Write-Host "[$($r.Status)] Register new user (HTTP $($r.Code)) $(if($r.Error){$r.Error})"

# ─── 3. Auth: Login Student ──────────────────────────
$r = Test-API "Login Student" "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="student123"}
$studentToken = $null
if ($r.Status -eq "PASS") {
    $studentToken = $r.Data.token
    Write-Host "[PASS] Student Login (HTTP $($r.Code)) - Token: $($studentToken.Substring(0,20))..."
} else {
    Write-Host "[FAIL] Student Login (HTTP $($r.Code)) - $($r.Error) - Body: $($r.Body)"
}

# ─── 4. Auth: Login Admin ────────────────────────────
$r = Test-API "Login Admin" "POST" "$base/auth/login" @{email="admin@pathpilot.dev";password="admin123456"}
$adminToken = $null
if ($r.Status -eq "PASS") {
    $adminToken = $r.Data.token
    Write-Host "[PASS] Admin Login (HTTP $($r.Code)) - Role: $($r.Data.user.role), Plan: $($r.Data.user.plan)"
} else {
    Write-Host "[FAIL] Admin Login (HTTP $($r.Code)) - $($r.Error)"
}

# ─── 5. Auth: Wrong Password ────────────────────────
$r = Test-API "Login Wrong Password" "POST" "$base/auth/login" @{email="student@pathpilot.dev";password="wrongpass"}
Write-Host "[$($r.Status)] Wrong Password (HTTP $($r.Code)) $(if($r.Code -eq 401){'[Expected 401 - CORRECT]'})"

# ─── 6. Auth: Get Me ────────────────────────────────
$r = Test-API "Get Me (student)" "GET" "$base/auth/me" $null $studentToken
Write-Host "[$($r.Status)] Get Me - User: $($r.Data.user.name), XP: $($r.Data.user.xp)"

# ─── 7. Auth: Unauthorized access ───────────────────
$r = Test-API "Protected Route (no token)" "GET" "$base/auth/me"
Write-Host "[$($r.Status)] No-Token Protection (HTTP $($r.Code)) $(if($r.Code -eq 401){'[CORRECT - 401]'})"

# ─── 8. Tracks: List ────────────────────────────────
$r = Test-API "Get All Tracks" "GET" "$base/tracks"
$trackId = $null
if ($r.Status -eq "PASS") {
    $trackId = $r.Data.tracks[0]._id
    Write-Host "[PASS] Get Tracks - Count: $($r.Data.tracks.Count)"
    foreach($t in $r.Data.tracks) {
        Write-Host "       Track: '$($t.title)' | Premium: $($t.isPremium) | Topics: N/A"
    }
} else {
    Write-Host "[FAIL] Get Tracks - $($r.Error)"
}

# ─── 9. Tracks: Filter ──────────────────────────────
$r = Test-API "Filter Tracks by Category" "GET" "$base/tracks?category=backend"
Write-Host "[$($r.Status)] Filter by Category (backend): $($r.Data.tracks.Count) results"

# ─── 10. Track Detail ───────────────────────────────
$r = Test-API "Get Track Detail" "GET" "$base/tracks/$trackId" $null $studentToken
$topicId = $null
if ($r.Status -eq "PASS") {
    $topicId = $r.Data.modules[0].topics[0]._id
    Write-Host "[PASS] Track Detail - Modules: $($r.Data.modules.Count), First topic: $($r.Data.modules[0].topics[0].title)"
} else {
    Write-Host "[FAIL] Track Detail - $($r.Error)"
}

# ─── 11. Topic Detail ───────────────────────────────
$r = Test-API "Get Topic Detail" "GET" "$base/tracks/$trackId/topics/$topicId" $null $studentToken
if ($r.Status -eq "PASS") {
    Write-Host "[PASS] Topic Detail - '$($r.Data.topic.title)' | Video: $($r.Data.topic.videoId -ne $null)"
} else {
    Write-Host "[FAIL] Topic Detail - $($r.Error) (HTTP $($r.Code))"
}

# ─── 12. Progress: Update Video ─────────────────────
$r = Test-API "Update Video Progress" "POST" "$base/progress/video" @{topicId=$topicId;watchedPercentage=50;watchTime=1800} $studentToken
Write-Host "[$($r.Status)] Video Progress Update (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){"Completed: $($r.Data.justCompleted)"}else{$r.Error})"

# ─── 13. Progress: Dashboard ────────────────────────
$r = Test-API "Dashboard Stats" "GET" "$base/progress/dashboard" $null $studentToken
if ($r.Status -eq "PASS") {
    Write-Host "[PASS] Dashboard - XP: $($r.Data.stats.xp), Streak: $($r.Data.stats.streak), Topics: $($r.Data.stats.completedTopics)"
} else {
    Write-Host "[FAIL] Dashboard - $($r.Error)"
}

# ─── 14. Progress: Analytics ────────────────────────
$r = Test-API "Analytics Data" "GET" "$base/progress/analytics" $null $studentToken
Write-Host "[$($r.Status)] Analytics (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){"Videos: $($r.Data.analytics.videosCompleted)"}else{$r.Error})"

# ─── 15. Users: Leaderboard ─────────────────────────
$r = Test-API "Leaderboard" "GET" "$base/users/leaderboard" $null $studentToken
Write-Host "[$($r.Status)] Leaderboard - Users: $($r.Data.leaderboard.Count)"

# ─── 16. Users: Profile ─────────────────────────────
$r = Test-API "Get Profile" "GET" "$base/users/me" $null $studentToken
Write-Host "[$($r.Status)] User Profile - Name: $($r.Data.user.name)"

# ─── 17. Users: Update Profile ──────────────────────
$r = Test-API "Update Profile" "PUT" "$base/users/me" @{name="Demo Student Updated"} $studentToken
Write-Host "[$($r.Status)] Update Profile (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){"New name: $($r.Data.user.name)"})"

# ─── 18. Quiz: Get Quiz ─────────────────────────────
$quizId = $r = $null
$trackDetail = Test-API "Track for Quiz" "GET" "$base/tracks/$trackId" $null $studentToken
if ($trackDetail.Status -eq "PASS") {
    $firstTopic = $trackDetail.Data.modules[0].topics[0]
    if ($firstTopic.quizId) {
        $qid = if ($firstTopic.quizId._id) { $firstTopic.quizId._id } else { $firstTopic.quizId }
        $r = Test-API "Get Quiz" "GET" "$base/quizzes/$qid" $null $studentToken
        Write-Host "[$($r.Status)] Get Quiz - '$($r.Data.quiz.title)' | Questions: $($r.Data.quiz.questions.Count)"
        $quizId = $qid
    } else {
        Write-Host "[SKIP] Quiz - No quiz attached to first topic"
    }
}

# ─── 19. Quiz: Submit ───────────────────────────────
if ($quizId) {
    $quizData = (Test-API "Quiz Data" "GET" "$base/quizzes/$quizId" $null $studentToken).Data.quiz
    $answers = @()
    foreach ($q in $quizData.questions) {
        $answers += @{questionId=$q._id;selectedOptions=@(0)}
    }
    $r = Test-API "Submit Quiz" "POST" "$base/quizzes/$quizId/attempt" @{answers=$answers} $studentToken
    Write-Host "[$($r.Status)] Submit Quiz - Score: $($r.Data.score)%, Passed: $($r.Data.passed)"
}

# ─── 20. AI: Tutor (no key needed to test endpoint) ─
$r = Test-API "AI Tutor Message" "POST" "$base/ai/tutor" @{message="What is OOP?"} $studentToken
Write-Host "[$($r.Status)] AI Tutor (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){'Response received'}else{"Error: $(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

# ─── 21. AI: Roadmap ────────────────────────────────
$r = Test-API "AI Roadmap Generate" "POST" "$base/ai/roadmap/generate" @{skill="Python";currentLevel="beginner";dailyHours=2;goal="Get a job"} $studentToken
Write-Host "[$($r.Status)] AI Roadmap (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){"Title: $($r.Data.roadmap.title)"}else{"Error: $(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

# ─── 22. AI: Chat History ───────────────────────────
$r = Test-API "AI Chat History" "GET" "$base/ai/chats" $null $studentToken
Write-Host "[$($r.Status)] Chat History - Chats: $($r.Data.chats.Count)"

# ─── 23. AI: Roadmap List ───────────────────────────
$r = Test-API "AI Roadmap List" "GET" "$base/ai/roadmaps" $null $studentToken
Write-Host "[$($r.Status)] Roadmap List - Count: $($r.Data.roadmaps.Count)"

# ─── 24. Payments: Get Plans ────────────────────────
$r = Test-API "Payment Plans" "GET" "$base/payments/plans"
Write-Host "[$($r.Status)] Payment Plans - Plans: $($r.Data.plans.PSObject.Properties.Name -join ', ')"

# ─── 25. Payments: Create Order (no key) ────────────
$r = Test-API "Create Payment Order" "POST" "$base/payments/create-order" @{plan="premium"} $studentToken
Write-Host "[$($r.Status)] Create Order (HTTP $($r.Code)) $(if($r.Status -eq 'FAIL'){"Error: $(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

# ─── 26. Admin: Analytics (student token) ───────────
$r = Test-API "Admin Analytics (student - should fail)" "GET" "$base/admin/analytics" $null $studentToken
Write-Host "[$($r.Status)] Admin Block Student (HTTP $($r.Code)) $(if($r.Code -eq 403){'[CORRECT - 403 Forbidden]'})"

# ─── 27. Admin: Analytics (admin token) ─────────────
$r = Test-API "Admin Analytics" "GET" "$base/admin/analytics" $null $adminToken
if ($r.Status -eq "PASS") {
    Write-Host "[PASS] Admin Analytics - Users: $($r.Data.analytics.totalUsers), Premium: $($r.Data.analytics.premiumUsers), Tracks: $($r.Data.analytics.totalTracks)"
} else {
    Write-Host "[FAIL] Admin Analytics - $($r.Error)"
}

# ─── 28. Admin: Get All Tracks ──────────────────────
$r = Test-API "Admin Get Tracks" "GET" "$base/admin/tracks" $null $adminToken
Write-Host "[$($r.Status)] Admin Tracks - Count: $($r.Data.tracks.Count)"

# ─── 29. Admin: Get All Users ───────────────────────
$r = Test-API "Admin Get Users" "GET" "$base/admin/users" $null $adminToken
Write-Host "[$($r.Status)] Admin Users - Count: $($r.Data.users.Count)"

# ─── 30. Premium Guard: Interview (student = free) ──
$r = Test-API "Interview (free user - should fail)" "POST" "$base/ai/interview" @{mode="java";message=""} $studentToken
Write-Host "[$($r.Status)] Premium Guard - Interview (HTTP $($r.Code)) $(if($r.Code -eq 403){'[CORRECT - 403 UPGRADE_REQUIRED]'})"

# ─── 31. Interview (admin = bypass) ─────────────────
$r = Test-API "Interview (admin bypass)" "POST" "$base/ai/interview" @{mode="java";message=""} $adminToken
Write-Host "[$($r.Status)] Interview Admin Bypass (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){'Response received'}else{"$(($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message)"})"

# ─── 32. Forgot Password ────────────────────────────
$r = Test-API "Forgot Password" "POST" "$base/auth/forgot-password" @{email="student@pathpilot.dev"}
Write-Host "[$($r.Status)] Forgot Password (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){$r.Data.message}else{($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message})"

# ─── 33. Forgot Password (nonexistent) ──────────────
$r = Test-API "Forgot Password (no user)" "POST" "$base/auth/forgot-password" @{email="nobody@nowhere.com"}
Write-Host "[$($r.Status)] Forgot Password NonExistent (HTTP $($r.Code))"

# ─── 34. Rate Limit Check ────────────────────────────
Write-Host "`n[INFO] Rate limit: 100 req/15min on /api/, 20 req/min on /api/ai/"

# ─── 35. Admin: Create Track ────────────────────────
$r = Test-API "Admin Create Track" "POST" "$base/admin/tracks" @{title="QA Test Track";slug="qa-test-$(Get-Date -Format 'mmss')";description="Test track for QA";category="frontend";difficulty="beginner";estimatedHours=10;isPublished=$false} $adminToken
Write-Host "[$($r.Status)] Admin Create Track (HTTP $($r.Code)) $(if($r.Status -eq 'PASS'){"ID: $($r.Data.track._id)"}else{($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message})"
$newTrackId = $r.Data.track._id

# ─── 36. Admin: Delete Track ────────────────────────
if ($newTrackId) {
    $r = Test-API "Admin Delete Track" "DELETE" "$base/admin/tracks/$newTrackId" $null $adminToken
    Write-Host "[$($r.Status)] Admin Delete Track - $($r.Data.message)"
}

# ─── 37. Change Password ────────────────────────────
$r = Test-API "Change Password" "PUT" "$base/users/change-password" @{currentPassword="student123";newPassword="newpass123"} $studentToken
Write-Host "[$($r.Status)] Change Password (HTTP $($r.Code))"
# Restore original password
if ($r.Status -eq "PASS") {
    $r2 = Test-API "Restore Password" "PUT" "$base/users/change-password" @{currentPassword="newpass123";newPassword="student123"} $studentToken
    Write-Host "[$($r2.Status)] Restore Password"
}

Write-Host "`n===== QA AUDIT COMPLETE ====="
