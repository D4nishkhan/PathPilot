$files = Get-ChildItem -Path "C:\Users\hp\.gemini\antigravity\scratch\pathpilot\frontend\src" -Recurse -Filter "*.tsx"
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    $c = $c -replace 'from "\.\./types"', 'from "../types/index"'
    $c = $c -replace "from '\.\./types'", "from '../types/index'"
    Set-Content $f.FullName $c -NoNewline
}
Write-Host "Done fixing imports"
