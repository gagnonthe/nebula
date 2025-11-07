# Script pour créer des icônes simples
# Ce script crée des fichiers PNG de couleur unie comme placeholder

$iconSizes = @(16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512)
$color = "#4F46E5" # Couleur primaire (violet/indigo)

Write-Host "Création des icônes..." -ForegroundColor Cyan

# Fonction pour créer une image simple
function Create-Icon {
    param (
        [int]$size,
        [string]$outputPath
    )
    
    Add-Type -AssemblyName System.Drawing
    
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fond violet
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#4F46E5"))
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    
    # Bordure blanche arrondie
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, $size / 32))
    $margin = [Math]::Max(4, $size / 8)
    $graphics.DrawRectangle($pen, $margin, $margin, $size - ($margin * 2), $size - ($margin * 2))
    
    # Dessiner un symbole de fichier simple
    $symbolPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, $size / 16))
    $symbolMargin = $size / 4
    $symbolSize = $size / 2
    
    # Rectangle pour représenter un fichier
    $graphics.DrawRectangle($symbolPen, $symbolMargin, $symbolMargin, $symbolSize, $symbolSize * 1.2)
    
    # Lignes horizontales pour le contenu
    $lineY = $symbolMargin + ($symbolSize * 0.3)
    for ($i = 0; $i -lt 3; $i++) {
        $graphics.DrawLine($symbolPen, $symbolMargin + ($symbolSize * 0.2), $lineY, $symbolMargin + ($symbolSize * 0.8), $lineY)
        $lineY += $symbolSize * 0.25
    }
    
    $symbolPen.Dispose()
    
    # Sauvegarder
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $pen.Dispose()
}

# Créer les icônes pour la PWA
$pwaPath = "C:\Users\lucaspereiradealmeid\OneDrive - Région Île-de-France\Projet\PWA\files\public\icons"
Write-Host "`nCréation des icônes PWA..." -ForegroundColor Yellow

foreach ($size in @(72, 96, 128, 144, 152, 192, 384, 512)) {
    $filename = Join-Path $pwaPath "icon-${size}x${size}.png"
    Write-Host "  → icon-${size}x${size}.png"
    Create-Icon -size $size -outputPath $filename
}

# Créer les icônes pour Chrome Extension
$chromePath = "C:\Users\lucaspereiradealmeid\OneDrive - Région Île-de-France\Projet\PWA\files\chrome-extension\icons"
Write-Host "`nCréation des icônes Chrome Extension..." -ForegroundColor Yellow

foreach ($size in @(16, 32, 48, 128)) {
    $filename = Join-Path $chromePath "icon${size}.png"
    Write-Host "  → icon${size}.png"
    Create-Icon -size $size -outputPath $filename
}

Write-Host "`n✅ Toutes les icônes ont été créées avec succès!" -ForegroundColor Green
Write-Host "`nNote: Ce sont des icônes de base. Pour de meilleures icônes:" -ForegroundColor Cyan
Write-Host "  - Visitez https://favicon.io/emoji-favicons/file-folder/" -ForegroundColor White
Write-Host "  - Ou utilisez un outil comme Figma, Canva, etc." -ForegroundColor White
