$nodePath = Join-Path $PSScriptRoot "node-portable\node-v24.11.0-win-x64"
$env:PATH = "$nodePath;$env:PATH"

Write-Host "Demarrage du serveur..."
cd $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..."
    & (Join-Path $nodePath "npm.cmd") install
}

if (-not (Test-Path ".env")) {
    "PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*" | Out-File ".env"
}

Write-Host ""
Write-Host "Serveur pret sur: http://localhost:3000"
Write-Host "Appuyez sur Ctrl+C pour arreter"
Write-Host ""

& (Join-Path $nodePath "npm.cmd") run dev
