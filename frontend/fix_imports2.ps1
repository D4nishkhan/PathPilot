$files = Get-ChildItem -Path "C:\Users\hp\.gemini\antigravity\scratch\pathpilot\frontend\src" -Recurse -Filter "*.tsx"
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    # Replace: import { TypeA, TypeB } from "../types/index"
    # With:    import type { TypeA, TypeB } from "../types/index"
    $c = $c -replace 'import \{([^}]+)\} from "\.\.\/types\/index"', 'import type {$1} from "../types/index"'
    $c = $c -replace "import \{([^}]+)\} from '\.\.\/types\/index'", "import type {`$1} from '../types/index'"
    Set-Content $f.FullName $c -NoNewline
}
Write-Host "Done"
