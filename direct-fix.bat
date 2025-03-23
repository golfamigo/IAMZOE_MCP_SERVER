@echo off
echo Building TypeScript project with direct method implementation...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully.
echo.
echo This solution directly implements resources/list and prompts/list:
echo   1. Declares both capabilities in the server initialization
echo   2. Implements handlers that return empty lists
echo   3. Adds extra error handling for database connection
echo.
echo Press any key to start the server...
pause > nul

echo Starting server...
node dist/index.js
