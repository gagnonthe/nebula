# Script d'installation automatique
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FILE SHARE SYSTEM - INSTALLATION    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = Split-Path -Parent $PSCommandPath

# Verifier Node.js
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js est installe: $nodeVersion" -ForegroundColor Green
        
        # Installer les dependances
        Write-Host "`nInstallation des dependances npm..." -ForegroundColor Yellow
        cd $basePath
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependances installees avec succes!" -ForegroundColor Green
            
            # Creer le fichier .env
            Write-Host "`nCreation du fichier .env..." -ForegroundColor Yellow
            $envContent = @"
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*
"@
            $envPath = Join-Path $basePath ".env"
            $envContent | Out-File -FilePath $envPath -Encoding UTF8
            Write-Host "✅ Fichier .env cree!" -ForegroundColor Green
            
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "   INSTALLATION TERMINEE AVEC SUCCES!   " -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Pour lancer le serveur:" -ForegroundColor Cyan
            Write-Host "  npm run dev" -ForegroundColor White
            Write-Host ""
            Write-Host "Le serveur sera accessible sur:" -ForegroundColor Cyan
            Write-Host "  http://localhost:3000" -ForegroundColor White
            Write-Host ""
            
            # Proposer de lancer le serveur
            $response = Read-Host "Voulez-vous lancer le serveur maintenant? (O/N)"
            if ($response -eq "O" -or $response -eq "o") {
                Write-Host "`nLancement du serveur..." -ForegroundColor Yellow
                npm run dev
            }
        }
        else {
            Write-Host "❌ Erreur lors de l'installation des dependances" -ForegroundColor Red
            Write-Host "Essayez manuellement: npm install" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "❌ Node.js n'est pas installe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "ETAPES A SUIVRE:" -ForegroundColor Yellow
    Write-Host "1. Telechargez Node.js LTS depuis: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Installez Node.js" -ForegroundColor White
    Write-Host "3. Redemarrez VS Code" -ForegroundColor White
    Write-Host "4. Relancez ce script" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Voulez-vous ouvrir le site Node.js maintenant? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        Start-Process "https://nodejs.org/"
    }
}
