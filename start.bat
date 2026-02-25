@echo off
chcp 65001 >nul
title KotvukAI — Crypto Analytics Platform

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║        KotvukAI — Crypto Analytics        ║
echo  ║         AI-powered Trading Platform        ║
echo  ╚═══════════════════════════════════════════╝
echo.

:MENU
echo  Что вы хотите сделать?
echo.
echo  [1] Запустить проект
echo  [2] Остановить проект
echo  [3] Выход
echo.
set /p CHOICE="  Введите номер (1/2/3): "

if "%CHOICE%"=="1" goto LAUNCH
if "%CHOICE%"=="2" goto STOP
if "%CHOICE%"=="3" goto EXIT
echo  Неверный ввод. Попробуйте ещё раз.
echo.
goto MENU

:: ─────────────────────────────────────────
:LAUNCH
echo.
echo  Запустить KotvukAI?
echo  - Backend: http://localhost:3000
echo  - Frontend: http://localhost:5173
echo.
set /p CONFIRM="  Подтвердите запуск (да/нет): "
if /i "%CONFIRM%"=="да" goto DO_LAUNCH
if /i "%CONFIRM%"=="д"  goto DO_LAUNCH
if /i "%CONFIRM%"=="yes" goto DO_LAUNCH
if /i "%CONFIRM%"=="y"  goto DO_LAUNCH
echo.
echo  Запуск отменён.
echo.
goto MENU

:DO_LAUNCH
echo.
echo  ─────────────────────────────────────────
echo  [1/3] Проверка Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo  ОШИБКА: Node.js не найден!
    echo  Скачайте с https://nodejs.org и установите.
    pause
    goto MENU
)
for /f "tokens=*" %%v in ('node -v') do echo  Node.js %%v — OK

echo.
echo  [2/3] Запуск Backend (порт 3000)...
if not exist "backend\node_modules" (
    echo  Установка зависимостей backend...
    cd backend && npm install --silent && cd ..
)
start "KotvukAI Backend" /min cmd /c "cd backend && node server.js"
timeout /t 3 /nobreak >nul

echo.
echo  [3/3] Запуск Frontend (порт 5173)...
if not exist "frontend\node_modules" (
    echo  Установка зависимостей frontend...
    cd frontend && npm install --silent && cd ..
)
start "KotvukAI Frontend" /min cmd /c "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo  ─────────────────────────────────────────
echo  ✅ KotvukAI успешно запущен!
echo.
echo  Открыть в браузере:
echo  → http://localhost:5173
echo.
set /p OPEN="  Открыть браузер сейчас? (да/нет): "
if /i "%OPEN%"=="да"  start http://localhost:5173
if /i "%OPEN%"=="д"   start http://localhost:5173
if /i "%OPEN%"=="yes" start http://localhost:5173
if /i "%OPEN%"=="y"   start http://localhost:5173

echo.
echo  Для остановки вернитесь в это меню и выберите [2].
echo.
goto MENU

:: ─────────────────────────────────────────
:STOP
echo.
echo  Остановить KotvukAI?
echo  Все окна Backend и Frontend будут закрыты.
echo.
set /p CONFIRM="  Подтвердите остановку (да/нет): "
if /i "%CONFIRM%"=="да" goto DO_STOP
if /i "%CONFIRM%"=="д"  goto DO_STOP
if /i "%CONFIRM%"=="yes" goto DO_STOP
if /i "%CONFIRM%"=="y"  goto DO_STOP
echo.
echo  Остановка отменена.
echo.
goto MENU

:DO_STOP
echo.
echo  Останавливаем процессы...
taskkill /FI "WINDOWTITLE eq KotvukAI Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq KotvukAI Frontend" /F >nul 2>&1

:: Дополнительно завершаем node процессы на портах 3000 и 5173
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo  ✅ KotvukAI остановлен.
echo.
goto MENU

:: ─────────────────────────────────────────
:EXIT
echo.
echo  До свидания!
echo.
timeout /t 2 /nobreak >nul
exit
