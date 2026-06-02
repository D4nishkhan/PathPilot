# Security and code quality audit
Write-Host "=== SECURITY AUDIT ==="

$backendSrc = "C:\Users\hp\.gemini\antigravity\scratch\pathpilot\backend\src"
$files = Get-ChildItem $backendSrc -Recurse -Filter "*.js"

# 1. express-validator usage
$valUsage = $files | Select-String -Pattern "express-validator" | Measure-Object
Write-Host "1. express-validator usage: $($valUsage.Count) occurrences (0 = NO INPUT VALIDATION)"

# 2. Password hash
$bcrypt = $files | Select-String -Pattern "bcrypt" | Measure-Object
Write-Host "2. bcrypt password hashing: $($bcrypt.Count) refs"

# 3. password select false
$selFalse = $files | Select-String -Pattern "select: false" | Measure-Object
Write-Host "3. Password hidden from queries: $($selFalse.Count) refs"

# 4. rate limiting
$rate = Select-String -Path "$backendSrc\server.js" -Pattern "rateLimit" | Measure-Object
Write-Host "4. Rate limiting configured: $($rate.Count -gt 0)"

# 5. helmet
$helmet = Select-String -Path "$backendSrc\server.js" -Pattern "helmet" | Measure-Object
Write-Host "5. Helmet security headers: $($helmet.Count -gt 0)"

# 6. JWT expiry
$jwtExp = Select-String -Path "$backendSrc\middleware\auth.js" -Pattern "expiresIn" | Measure-Object
Write-Host "6. JWT expiry set: $($jwtExp.Count -gt 0)"

# 7. Admin middleware
$adminMw = Select-String -Path "$backendSrc\routes\admin.js" -Pattern "adminOnly" | Measure-Object
Write-Host "7. Admin routes protected: $($adminMw.Count -gt 0)"

# 8. MongoDB regex injection (unsanitized)
$regexRisk = $files | Select-String -Pattern "regex.*req\." | Measure-Object
Write-Host "8. Unsanitized regex in queries: $($regexRisk.Count) (risk if unescaped)"

# 9. .env file exists but not in repo
$envExists = Test-Path "C:\Users\hp\.gemini\antigravity\scratch\pathpilot\backend\.env"
Write-Host "9. .env file exists: $envExists"

# 10. Check for process.env usage
$processEnv = $files | Select-String -Pattern "process.env" | Measure-Object
Write-Host "10. Environment variables used: $($processEnv.Count) refs"

# 11. Check password in JSON response
$passInRes = $files | Select-String -Pattern "password" | Where-Object { $_.Line -match "res\.json|success.*password" } | Measure-Object
Write-Host "11. Password-in-response risk: $($passInRes.Count)"

# 12. Check premiumOnly middleware
$premOnly = $files | Select-String -Pattern "premiumOnly" | Measure-Object
Write-Host "12. premiumOnly middleware refs: $($premOnly.Count)"

Write-Host ""
Write-Host "=== FRONTEND CODE AUDIT ==="

$frontSrc = "C:\Users\hp\.gemini\antigravity\scratch\pathpilot\frontend\src"
$tsFiles = Get-ChildItem $frontSrc -Recurse -Filter "*.tsx"

# Check token storage
$localToken = $tsFiles | Select-String -Pattern "localStorage.*token" | Measure-Object
Write-Host "13. JWT in localStorage: $($localToken.Count) refs (XSS risk - acceptable for SPA)"

# Check for hardcoded API keys in frontend
$apiKeys = $tsFiles | Select-String -Pattern "sk-|AIza|key_id" | Measure-Object
Write-Host "14. Hardcoded API keys in frontend: $($apiKeys.Count) (should be 0)"

# Check for console.log sensitive data
$consoleLogs = $tsFiles | Select-String -Pattern "console\.log" | Measure-Object
Write-Host "15. console.log statements in frontend: $($consoleLogs.Count)"

# Check VITE_API_URL usage
$viteEnv = $tsFiles | Select-String -Pattern "import.meta.env" | Measure-Object
Write-Host "16. Vite env var usage: $($viteEnv.Count) refs"

Write-Host ""
Write-Host "=== MISSING FEATURES AUDIT ==="

# Check for features in routes vs frontend
$frontPages = Get-ChildItem "$frontSrc\pages" -Filter "*.tsx" | Select-Object -ExpandProperty Name
Write-Host "17. Frontend pages found: $($frontPages -join ', ')"

# Check if PaymentPage exists
$payPage = Test-Path "$frontSrc\pages\PaymentPage.tsx"
Write-Host "18. Razorpay payment UI page: $payPage"

# Check if ResetPassword page exists
$resetPage = Test-Path "$frontSrc\pages\ResetPassword.tsx"
Write-Host "19. Reset Password page: $resetPage"

# Check if EmailVerification page exists
$verifyPage = Test-Path "$frontSrc\pages\EmailVerification.tsx"
Write-Host "20. Email Verification page: $verifyPage"

# Check Notes viewer component
$notesComp = $tsFiles | Select-String -Pattern "note.*content|notesRead" | Measure-Object
Write-Host "21. Notes viewer implemented: $($notesComp.Count -gt 0)"

# Check if streak update on login
$streakUpdate = Select-String -Path "$backendSrc\controllers\authController.js" -Pattern "updateStreak" | Measure-Object
Write-Host "22. Streak update on login: $($streakUpdate.Count -gt 0)"

# Badge award logic
$badgeAward = $files | Select-String -Pattern "Badge|badge.*award" | Measure-Object
Write-Host "23. Badge award logic refs: $($badgeAward.Count)"

# Check if badge award is automated
$badgeAuto = $files | Select-String -Pattern "checkBadge|awardBadge" | Measure-Object
Write-Host "24. Auto badge award function: $($badgeAuto.Count) (0 = NOT IMPLEMENTED)"

Write-Host ""
Write-Host "=== DONE ==="
