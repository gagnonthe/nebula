# Script simplifié pour créer des icônes placeholder
Write-Host "Creation d'icones placeholder simples..." -ForegroundColor Cyan

# Creer une image PNG simple en base64 (1x1 pixel violet)
$base64Icon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

function Create-PlaceholderIcon {
    param (
        [string]$outputPath
    )
    
    try {
        # Decoder et sauvegarder
        $bytes = [Convert]::FromBase64String($base64Icon)
        [System.IO.File]::WriteAllBytes($outputPath, $bytes)
        Write-Host "  OK: $outputPath" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERREUR: $outputPath - $_" -ForegroundColor Red
    }
}

$basePath = Split-Path -Parent $PSCommandPath | Split-Path -Parent

# PWA Icons
$pwaPath = Join-Path $basePath "public\icons"
Write-Host "`nIcones PWA:" -ForegroundColor Yellow
@(72, 96, 128, 144, 152, 192, 384, 512) | ForEach-Object {
    $file = Join-Path $pwaPath "icon-${_}x${_}.png"
    Create-PlaceholderIcon -outputPath $file
}

# Chrome Extension Icons
$chromePath = Join-Path $basePath "chrome-extension\icons"
Write-Host "`nIcones Chrome Extension:" -ForegroundColor Yellow
@(16, 32, 48, 128) | ForEach-Object {
    $file = Join-Path $chromePath "icon${_}.png"
    Create-PlaceholderIcon -outputPath $file
}

Write-Host "`n✅ Icones placeholder creees!" -ForegroundColor Green
Write-Host "`nNote: Ce sont des icones temporaires de 1x1 pixel." -ForegroundColor Cyan
Write-Host "Pour de vraies icones, visitez: https://favicon.io/favicon-generator/" -ForegroundColor White
