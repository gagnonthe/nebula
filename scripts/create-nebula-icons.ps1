Add-Type -AssemblyName System.Drawing

function Create-NebulaIcon {
    param ([int]$size, [string]$outputPath)
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = 'AntiAlias'
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(17, 24, 39))
    $graphics.FillRectangle($bgBrush, 0, 0, $size, $size)
    $pinkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 147))
    $circleSize = [int]($size * 0.5)
    $circleX = [int](($size - $circleSize) / 2)
    $circleY = [int](($size - $circleSize) / 2)
    $graphics.FillEllipse($pinkBrush, $circleX, $circleY, $circleSize, $circleSize)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $innerSize = [int]($size * 0.25)
    $innerX = [int](($size - $innerSize) / 2)
    $innerY = [int](($size - $innerSize) / 2)
    $graphics.FillEllipse($whiteBrush, $innerX, $innerY, $innerSize, $innerSize)
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose(); $bitmap.Dispose(); $bgBrush.Dispose(); $pinkBrush.Dispose(); $whiteBrush.Dispose()
    Write-Host "OK: $outputPath" -ForegroundColor Green
}

$basePath = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$pwaPath = Join-Path $basePath "public\icons"
$chromePath = Join-Path $basePath "chrome-extension\icons"

Write-Host "Icones PWA:" -ForegroundColor Yellow
@(72, 96, 128, 144, 152, 192, 384, 512) | ForEach-Object {
    Create-NebulaIcon -size $_ -outputPath (Join-Path $pwaPath "icon-${_}x${_}.png")
}

Write-Host "`nIcones Chrome:" -ForegroundColor Yellow
@(16, 32, 48, 128) | ForEach-Object {
    Create-NebulaIcon -size $_ -outputPath (Join-Path $chromePath "icon${_}.png")
}

Write-Host "`nDone!" -ForegroundColor Green
