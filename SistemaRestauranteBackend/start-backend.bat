@echo off
cd /d "%~dp0"

set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME=%JAVA_HOME%
java -version
echo.
echo Iniciando backend en http://localhost:8080 ...
echo.

java -classpath ".mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%CD%" org.apache.maven.wrapper.MavenWrapperMain spring-boot:run

pause
