@echo off
REM Setup Vercel Environment Variables Script for Windows

echo Setting up Vercel Environment Variables...
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI is not installed. Install it with:
    echo    npm install -g vercel
    exit /b 1
)

echo Please provide the following environment variables:
echo.

set /p JWT_SECRET="JWT_SECRET (min 32 characters): "
set /p OPENAI_API_KEY="OPENAI_API_KEY: "
set /p OPENAI_MODEL="OPENAI_MODEL (default: gpt-4o-mini): "
if "%OPENAI_MODEL%"=="" set OPENAI_MODEL=gpt-4o-mini

echo.
echo Setting environment variables in Vercel...
echo.

echo %JWT_SECRET% | vercel env add JWT_SECRET production preview development
echo %OPENAI_API_KEY% | vercel env add OPENAI_API_KEY production preview development
echo %OPENAI_MODEL% | vercel env add OPENAI_MODEL production preview development
echo 7d | vercel env add JWT_EXPIRES_IN production preview development
echo 12 | vercel env add MAX_FILE_SIZE_MB production preview development
echo * | vercel env add CLIENT_ORIGIN production preview development
echo https://api.openai.com/v1 | vercel env add OPENAI_BASE_URL production preview development
echo /api | vercel env add VITE_API_BASE_URL production preview development

echo.
echo Environment variables set successfully!
echo.
echo Next steps:
echo    1. Run 'vercel' to deploy to preview
echo    2. Run 'vercel --prod' to deploy to production
echo.

pause
