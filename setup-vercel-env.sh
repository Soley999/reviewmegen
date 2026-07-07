#!/bin/bash
# Setup Vercel Environment Variables Script

echo "🔧 Setting up Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run:"
    echo "   vercel login"
    exit 1
fi

echo "📝 Please provide the following environment variables:"
echo ""

# JWT Secret
read -p "JWT_SECRET (min 32 characters): " JWT_SECRET
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "⚠️  Warning: JWT_SECRET should be at least 32 characters for security"
fi

# OpenAI API Key
read -p "OPENAI_API_KEY: " OPENAI_API_KEY

# Optional variables with defaults
read -p "OPENAI_MODEL (default: gpt-4o-mini): " OPENAI_MODEL
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}

read -p "JWT_EXPIRES_IN (default: 7d): " JWT_EXPIRES_IN
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}

read -p "MAX_FILE_SIZE_MB (default: 12): " MAX_FILE_SIZE_MB
MAX_FILE_SIZE_MB=${MAX_FILE_SIZE_MB:-12}

echo ""
echo "🚀 Setting environment variables in Vercel..."
echo ""

# Set environment variables for all environments (production, preview, development)
vercel env add JWT_SECRET production preview development <<< "$JWT_SECRET"
vercel env add OPENAI_API_KEY production preview development <<< "$OPENAI_API_KEY"
vercel env add OPENAI_MODEL production preview development <<< "$OPENAI_MODEL"
vercel env add JWT_EXPIRES_IN production preview development <<< "$JWT_EXPIRES_IN"
vercel env add MAX_FILE_SIZE_MB production preview development <<< "$MAX_FILE_SIZE_MB"
vercel env add CLIENT_ORIGIN production preview development <<< "*"
vercel env add OPENAI_BASE_URL production preview development <<< "https://api.openai.com/v1"
vercel env add VITE_API_BASE_URL production preview development <<< "/api"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'vercel' to deploy to preview"
echo "   2. Run 'vercel --prod' to deploy to production"
echo ""
