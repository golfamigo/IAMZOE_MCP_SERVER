@echo off
echo Building TypeScript project...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)
echo Build completed successfully.
