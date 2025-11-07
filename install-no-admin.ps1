# Installation portable Node.js (sans droits admin)
Write-Host "========================================"
Write-Host "  NODE.JS PORTABLE - INSTALLATION      "
Write-Host "========================================"
Write-Host ""

$basePath = $PSScriptRoot
$nodePath = Join-Path $basePath "node-portable"

if (-not (Test-Path $nodePath)) {
    New-Item -ItemType Directory -Path $nodePath | Out-Null
}

Write-Host "Telechargement de Node.js portable..."
Write-Host "Cela peut prendre quelques minutes..."

$nodeVersion = "v24.11.0"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = Join-Path $basePath "node.zip"

try {
    Invoke-WebRequest -Uri $nodeUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "OK - Telechargement termine!"
    
    Write-Host "Extraction de Node.js..."
    Expand-Archive -Path $zipPath -DestinationPath $nodePath -Force
    Remove-Item $zipPath -Force
    
    Write-Host "OK - Node.js portable installe!"
    
    # Créer script de lancement
    $nodeFolder = "node-$nodeVersion-win-x64"
    $startScript = @"
`$nodePath = Join-Path `$PSScriptRoot "node-portable\$nodeFolder"
`$env:PATH = "`$nodePath;`$env:PATH"

Write-Host "Demarrage du serveur..."
cd `$PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..."
    & (Join-Path `$nodePath "npm.cmd") install
}

if (-not (Test-Path ".env")) {
    "PORT=3000`nNODE_ENV=development`nMAX_FILE_SIZE=10485760`nALLOWED_ORIGINS=*" | Out-File ".env"
}

Write-Host ""
Write-Host "Serveur pret sur: http://localhost:3000"
Write-Host "Appuyez sur Ctrl+C pour arreter"
Write-Host ""

& (Join-Path `$nodePath "npm.cmd") run dev
"@
    
    $startScript | Out-File -FilePath (Join-Path $basePath "start-server.ps1") -Encoding UTF8
    
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  INSTALLATION TERMINEE!"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Pour lancer: .\start-server.ps1"
    Write-Host ""
    
    $response = Read-Host "Lancer maintenant? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        & (Join-Path $basePath "start-server.ps1")
    }
}
catch {
    Write-Host "Erreur: $_"
    Write-Host ""
    Write-Host "Telechargez manuellement:"
    Write-Host $nodeUrl
}
