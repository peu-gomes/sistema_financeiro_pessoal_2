@echo off
REM Script para iniciar o servidor do Sistema Financeiro Pessoal
REM Autor: Sistema Financeiro
REM Data: 2025-12-08

title Sistema Financeiro Pessoal - Server
color 0A

echo.
echo ========================================
echo  Sistema Financeiro Pessoal
echo  Iniciando servidor...
echo ========================================
echo.

REM Navega para o diretorio do projeto
cd /d "%~dp0"

REM Verifica se o node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

REM Inicia o servidor
echo Servidor iniciando na porta 3000...
echo Acesse em: http://localhost:3000
echo.
echo Pressione CTRL+C para parar o servidor
echo.

call npm run dev

pause
