# Installation portable Node.js (sans droits admin)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NODE.JS PORTABLE - INSTALLATION      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = Split-Path -Parent $PSCommandPath
$nodePath = Join-Path $basePath "node-portable"

# Créer le dossier portable
if (-not (Test-Path $nodePath)) {
    Write-Host "Creation du dossier portable..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $nodePath | Out-Null
}

Write-Host "Telechargement de Node.js portable..." -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Gray

# Télécharger Node.js portable (ZIP)
$nodeVersion = "v24.11.0"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = Join-Path $basePath "node.zip"

try {
    # Télécharger
    Invoke-WebRequest -Uri $nodeUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "✅ Telechargement termine!" -ForegroundColor Green
    
    # Extraire
    Write-Host "`nExtraction de Node.js..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $nodePath -Force
    
    # Nettoyer
    Remove-Item $zipPath -Force
    
    # Trouver le dossier extrait
    $extractedFolder = Get-ChildItem -Path $nodePath -Directory | Select-Object -First 1
    $nodeBinPath = $extractedFolder.FullName
    
    Write-Host "✅ Node.js portable installe!" -ForegroundColor Green
    
    # Créer un script de lancement personnalisé
    Write-Host "`nCreation des scripts de lancement..." -ForegroundColor Yellow
    
    $startScript = @"
# Script pour lancer le serveur avec Node.js portable
`$nodePath = Join-Path `$PSScriptRoot "node-portable\node-$nodeVersion-win-x64"
`$env:PATH = "`$nodePath;`$env:PATH"

Write-Host "Demarrage du serveur File Share..." -ForegroundColor Cyan
Write-Host "Node.js: " -NoNewline
& (Join-Path `$nodePath "node.exe") --version

cd `$PSScriptRoot

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstallation des dependances..." -ForegroundColor Yellow
    & (Join-Path `$nodePath "npm.cmd") install
}

# Créer .env si nécessaire
if (-not (Test-Path ".env")) {
    Write-Host "Creation du fichier .env..." -ForegroundColor Yellow
    @"
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*
"@ | Out-File -FilePath ".env" -Encoding UTF8
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  SERVEUR PRET!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ouvrez votre navigateur sur:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Yellow
Write-Host ""

# Lancer le serveur
& (Join-Path `$nodePath "npm.cmd") run dev
"@
    
    $startScriptPath = Join-Path $basePath "start-server.ps1"
    $startScript | Out-File -FilePath $startScriptPath -Encoding UTF8
    
    Write-Host "✅ Script de lancement cree: start-server.ps1" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  INSTALLATION TERMINEE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour lancer le serveur, executez:" -ForegroundColor Cyan
    Write-Host "  .\start-server.ps1" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Voulez-vous lancer le serveur maintenant? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        & $startScriptPath
    }
}
catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution alternative:" -ForegroundColor Yellow
    Write-Host "1. Telechargez manuellement: $nodeUrl" -ForegroundColor White
    Write-Host "2. Extrayez le ZIP dans le dossier: $nodePath" -ForegroundColor White
    Write-Host "3. Relancez ce script" -ForegroundColor White
}
