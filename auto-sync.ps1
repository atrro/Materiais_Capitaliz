# Salva automaticamente qualquer alteração desta pasta no GitHub (branch "main"), verificando a cada 60 s.
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repo
$branch = 'main'
$log = Join-Path $repo 'auto-sync.log'
$mutex = New-Object System.Threading.Mutex($false, 'Local\MATERIAIS_AutoSync')
if (-not $mutex.WaitOne(0)) { exit }
$env:GIT_TERMINAL_PROMPT = '0'

function Log($m) {
    if ((Test-Path $log) -and (Get-Item $log).Length -gt 1MB) { Remove-Item $log -Force }
    "$(Get-Date -Format 's') $m" | Add-Content -Path $log
}

while ($true) {
    try {
        $changes = git status --porcelain 2>$null
        if ($changes) {
            Start-Sleep -Seconds 20   # espera as edições terminarem
            git add -A *> $null
            git commit -q -m ("Auto-save " + (Get-Date -Format 'yyyy-MM-dd HH:mm')) *> $null
            if ($LASTEXITCODE -eq 0) { Log 'commit criado' } else { Log "commit falhou ($LASTEXITCODE)" }
        }
        $pending = git rev-list --count "origin/$branch..HEAD" 2>$null
        if ([int]$pending -gt 0) {
            git push origin $branch *> $null
            if ($LASTEXITCODE -eq 0) { Log "push ok ($pending commit(s))" } else { Log "push falhou ($LASTEXITCODE)" }
        }
    } catch {
        Log "erro: $_"
    }
    Start-Sleep -Seconds 60
}
