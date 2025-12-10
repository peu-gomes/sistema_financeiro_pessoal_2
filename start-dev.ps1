# Script para iniciar o servidor de desenvolvimento
# Execute: .\start-dev.ps1

Write-Host "🚀 Iniciando Sistema Financeiro Pessoal..." -ForegroundColor Green
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Iniciar servidor
Write-Host "⚡ Iniciando servidor em http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔗 Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

npm run dev

# Após o servidor parar
Write-Host ""
Write-Host "❌ Servidor parado" -ForegroundColor Yellow
