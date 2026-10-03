# dev-harness 스킬을 %USERPROFILE%\.claude\skills 에 디렉터리 정션으로 설치합니다 (관리자 권한 불필요).
# 사용: powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME '.claude' }
$dest = Join-Path $configDir 'skills'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Get-ChildItem -Directory (Join-Path $repo '.claude\skills') -Filter 's-r-*' | ForEach-Object {
    $target = Join-Path $dest $_.Name
    if (Test-Path $target) {
        $item = Get-Item $target -Force
        if ($item.LinkType -ne 'Junction' -and $item.LinkType -ne 'SymbolicLink') {
            Write-Host "건너뜀: $target 이 이미 있고 링크가 아닙니다"
            return
        }
        $item.Delete()
    }
    New-Item -ItemType Junction -Path $target -Target $_.FullName | Out-Null
    Write-Host "설치: /$($_.Name) -> $($_.FullName)"
}
Write-Host '완료. Claude Code 를 다시 시작하면 어느 폴더에서나 위 명령을 쓸 수 있습니다.'
