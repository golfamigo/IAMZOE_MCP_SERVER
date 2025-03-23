@echo off
echo Building TypeScript project...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully.
echo.
echo You can now start the server to test if the issue is fixed.
echo To restore the backup if anything goes wrong, run:
echo   copy E:\gitHub\IAMZOE MCP SERVER\src\index.ts.backup E:\gitHub\IAMZOE MCP SERVER\src\index.ts /y
echo   npm run build
echo.
echo Press any key to start the server...
pause > nul

echo Starting server...
node dist/index.js
