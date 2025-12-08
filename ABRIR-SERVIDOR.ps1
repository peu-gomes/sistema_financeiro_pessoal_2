# Script PowerShell para iniciar o servidor
# Clique com botão direito e escolha "Run with PowerShell"

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Sistema Financeiro Pessoal - Server " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Servidor iniciando na porta 3000..." -ForegroundColor Cyan
Write-Host "Acesse em: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione CTRL+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

npm run dev

Read-Host "Pressione Enter para fechar"
