@echo off
title ProjetoX Producoes - Servidor Local
echo ========================================================
echo   PROJETOX PRODUCOES — INICIANDO SERVIDOR LOCAL (ZERO CONFIG)
echo ========================================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules\" (
  echo [0/3] Instalando dependencias do Backend (primeira vez)...
  call npm install
)

cd /d "%~dp0frontend"
if not exist "node_modules\" (
  echo [0/3] Instalando dependencias do Frontend (primeira vez)...
  call npm install
)

cd /d "%~dp0backend"
echo.
echo [1/3] Configurando Banco de Dados SQLite local...
copy /Y "prisma\schema.sqlite.prisma" "prisma\schema.prisma" >nul
call npx prisma db push --skip-generate
call npx prisma generate
call npx ts-node prisma/seed.ts

echo.
echo [2/3] Iniciando Backend API na porta 3001...
start "ProjetoX API (Porta 3001)" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo [3/3] Iniciando Frontend Next.js na porta 3000...
start "ProjetoX Frontend (Porta 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   ✅ TUDO PRONTO! ACESSE NO SEU NAVEGADOR:
echo   🌐 Site Publico:     http://localhost:3000
echo   🎟️ Meus Ingressos:   http://localhost:3000/meus-ingressos
echo   📱 Portaria Digital: http://localhost:3000/admin/checkin
echo   🔒 Painel Admin:      http://localhost:3000/admin/dashboard
echo ========================================================
echo.
pause
