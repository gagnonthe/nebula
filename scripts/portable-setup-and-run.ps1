# Portable Node.js setup and run (no admin required)
param(
    [string]$NodeVersion = "v24.11.0",
    [string]$Arch = "x64",
    [int]$Port = 3000,
    [switch]$AutoOpen,
    [switch]$SkipInstall,
    [switch]$NoNodemon
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Portable Node + Start Dev (no admin)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Ensure TLS 1.2 for downloads
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Root = Split-Path -Parent $PSCommandPath
$PortableDir = Join-Path $Root ".portable"
$NodeDirName = "node-$NodeVersion-win-$Arch"
$NodeDir = Join-Path $PortableDir $NodeDirName
$ZipPath = Join-Path $PortableDir "$NodeDirName.zip"
$NodeUrl = "https://nodejs.org/dist/$NodeVersion/$NodeDirName.zip"

# Create directories
New-Item -ItemType Directory -Force -Path $PortableDir | Out-Null

# Download Node zip if missing
if (!(Test-Path $NodeDir)) {
    if (!(Test-Path $ZipPath)) {
        Write-Host "Downloading Node.js $NodeVersion ($Arch)..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $NodeUrl -OutFile $ZipPath
    }
    Write-Host "Extracting Node.js..." -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath $PortableDir -Force
}

$NodeExe = Join-Path $NodeDir "node.exe"
$NpmCli = Join-Path $NodeDir "node_modules\npm\bin\npm-cli.js"
$NodemonBin = Join-Path $Root "node_modules\nodemon\bin\nodemon.js"

if (!(Test-Path $NodeExe)) {
    throw "node.exe not found at $NodeExe"
}

# Verify Node works
$nodeVer = & "$NodeExe" -v
Write-Host "Node detected: $nodeVer" -ForegroundColor Green

# Create .env if missing
$envPath = Join-Path $Root ".env"
if (!(Test-Path $envPath)) {
@"
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*
"@ | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "Created .env" -ForegroundColor Green
}

# Install dependencies with local Node/npm
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
& "$NodeExe" "$NpmCli" install
if ($LASTEXITCODE -ne 0) {
    throw "npm install failed"
}
Write-Host "Dependencies installed" -ForegroundColor Green

# Start dev server using nodemon directly via node
if (!(Test-Path $NodemonBin)) {
    Write-Host "nodemon not found yet? ensuring devDependencies present..." -ForegroundColor Yellow
}

###############################
# Utility: find free port
###############################
function Get-FreePort {
    param([int]$DesiredPort)
    $p = $DesiredPort
    for ($i=0; $i -lt 15; $i++) {
        try {
            $inUse = Test-NetConnection -ComputerName 'localhost' -Port $p -WarningAction SilentlyContinue
            if (-not $inUse.TcpTestSucceeded) { return $p }
        } catch { return $p }
        $p++
    }
    return $DesiredPort
}

$ChosenPort = Get-FreePort -DesiredPort $Port
if ($ChosenPort -ne $Port) {
    Write-Host "Port $Port occupé. Utilisation du port libre $ChosenPort" -ForegroundColor Yellow
}

###############################
# Ensure .env PORT matches chosen port
###############################
$envPath = Join-Path $Root ".env"
if (!(Test-Path $envPath)) {
@"
PORT=$ChosenPort
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "Created .env" -ForegroundColor Green
} else {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "PORT=") {
        $envContent = ($envContent -split "`r?`n") | ForEach-Object { if ($_ -match '^PORT=') { "PORT=$ChosenPort" } else { $_ } } | Out-String
    } else {
        $envContent = $envContent.TrimEnd() + "`nPORT=$ChosenPort`n"
    }
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "Updated .env PORT -> $ChosenPort" -ForegroundColor Yellow
}

###############################
# Install dependencies (optional skip)
###############################
if ($SkipInstall) {
    Write-Host "Skipping npm install (--SkipInstall)" -ForegroundColor Yellow
} else {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & "$NodeExe" "$NpmCli" install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "Dependencies installed" -ForegroundColor Green
}

###############################
# Determine runner (nodemon or node)
###############################
if ($NoNodemon -or -not (Test-Path $NodemonBin)) {
    if (-not (Test-Path $NodemonBin) -and -not $NoNodemon) {
        Write-Host "nodemon absent – fallback sur node direct" -ForegroundColor Yellow
    } elseif ($NoNodemon) {
        Write-Host "Option --NoNodemon activée" -ForegroundColor Yellow
    }
    $RunArgs = @("server/index.js")
    $RunnerName = "node"
} else {
    Write-Host "Starting dev server (nodemon)..." -ForegroundColor Yellow
    $RunArgs = @($NodemonBin, "server/index.js")
    $RunnerName = "nodemon"
}

###############################
# Launch server process
###############################
Write-Host "Démarrage via $RunnerName sur http://localhost:$ChosenPort" -ForegroundColor Cyan

$process = Start-Process -FilePath $NodeExe -ArgumentList $RunArgs -NoNewWindow -PassThru

Start-Sleep -Seconds 2
if ($AutoOpen) {
    try { Start-Process "http://localhost:$ChosenPort" } catch {}
}

Write-Host "Appuyez sur CTRL+C pour arrêter." -ForegroundColor DarkGray

try {
    while (-not $process.HasExited) {
        Start-Sleep -Milliseconds 500
    }
} finally {
    if (-not $process.HasExited) { $process | Stop-Process -Force }
    Write-Host "Serveur arrêté." -ForegroundColor Yellow
}
