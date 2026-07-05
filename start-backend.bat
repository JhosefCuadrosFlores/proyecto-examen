@echo off
title Comedor UPeU - Backend
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo JAVA_HOME no encontrado en %JAVA_HOME%
  echo Ajusta la ruta de Java en start-backend.bat
  pause
  exit /b 1
)
cd /d "%~dp0SistemaRestauranteBackend"
echo Iniciando backend en http://localhost:8080 ...
call mvnw.cmd spring-boot:run
pause
