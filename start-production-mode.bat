@echo off
title ProjetoX Producoes - Modo Producao (Alta Performance)
color 0A

echo.
echo  ==============================================================
echo     🎵 PROJETO X PRODUCOES — MODO PRODUCAO (SPEED PROD)
echo  ==============================================================
echo     Construindo bundles otimizados para carregamento INSTANTANEO!
echo  ==============================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando e compilando o Frontend (Next.js Build)...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar o frontend! Verifique os logs acima.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Iniciando Servidor Backend (Porta 3001)...
start "ProjetoX Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo.
echo [3/3] Iniciando Servidor Frontend em Producao (Porta 3000)...
start "ProjetoX Frontend Next.js Prod" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ==============================================================
echo  🚀 SISTEMA RODANDO EM MODO PRODUCAO DE ALTA PERFORMANCE!
echo ==============================================================
echo  🏠 Site Publico:     http://localhost:3000
echo  🎟️ Meus Ingressos:  http://localhost:3000/meus-ingressos
echo  📱 Portaria Digital: http://localhost:3000/admin/checkin
echo  📊 Painel Admin:    http://localhost:3000/admin/dashboard
echo ==============================================================
echo.
pause
