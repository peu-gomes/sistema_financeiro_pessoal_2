@echo off
REM Script para iniciar o servidor de desenvolvimento
REM Clique duas vezes para executar

cls
echo.
echo ========================================
echo  SISTEMA FINANCEIRO PESSOAL
echo ========================================
echo.
echo Iniciando servidor...
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    echo.
    call npm install
    echo.
)

REM Iniciar servidor
echo Iniciando servidor em http://localhost:3001
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

call npm run dev

pause
