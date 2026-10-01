@echo off
chcp 65001 >nul
title CanaisPlay - Reprodutor IPTV & M3U
echo ====================================================
echo Iniciando servidor CanaisPlay em http://localhost:3000 ...
echo ====================================================
start "" "http://localhost:3000"
"C:\Program Files\nodejs\node.exe" "%~dp0server.js"
pause
