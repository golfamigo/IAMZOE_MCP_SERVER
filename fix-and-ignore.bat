@echo off
echo Building TypeScript project with fallback method handling...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully.
echo.
echo This solution attempts to ignore 'Method not found' errors by:
echo   1. Setting a custom error handler that ignores MethodNotFound errors
echo   2. Providing a fallbackRequestHandler to handle common unimplemented methods
echo.
echo Press any key to start the server...
pause > nul

echo Starting server...
node dist/index.js
