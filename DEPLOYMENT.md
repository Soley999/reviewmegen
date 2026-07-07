# Deployment Guide - SolProject101

## 🚀 Deploying to Vercel

This project is configured to deploy both the Frontend (Vite + React) and Backend (Express API) to Vercel as a unified application.

### Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm install -g vercel`
3. Git repository pushed to GitHub/GitLab/Bitbucket

---

## 📋 Step-by-Step Deployment

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Preview**
   ```bash
   vercel
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** `npm run build && cd Backend && npm install`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install && cd Backend && npm install`

4. Add Environment Variables (see below)
5. Click **Deploy**

---

## 🔐 Environment Variables

Add these in the Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Frontend API URL (defaults to /api)
VITE_API_BASE_URL=/api
```

### Optional Variables:

```env
# Client Origin (use * for Vercel auto-configuration)
CLIENT_ORIGIN=*

# JWT Token Expiry
JWT_EXPIRES_IN=7d

# File Upload Limits
MAX_FILE_SIZE_MB=12
MAX_TEXT_CHARS=200000

# OpenAI Configuration
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

---

## 🔧 Configuration Files

The following files are configured for Vercel deployment:

- **`vercel.json`** - Main Vercel configuration
- **`api/index.js`** - Serverless function handler for Backend API
- **`.vercelignore`** - Files to exclude from deployment
- **`.env.example`** - Example environment variables

---

## 🌐 API Routes

After deployment:

- **Frontend:** `https://your-project.vercel.app/`
- **Backend API:** `https://your-project.vercel.app/api/`
- **Health Check:** `https://your-project.vercel.app/api/health`

All API routes are automatically proxied from `/api/*` to the serverless backend.

---

## 📝 Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test the health endpoint: `/api/health`
- [ ] Test user authentication endpoints
- [ ] Upload a test file and verify processing
- [ ] Check logs in Vercel Dashboard for any errors

---

## 🔍 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify `Backend/node_modules` is installed during build
- Check build logs in Vercel Dashboard

### API Returns 500 Errors
- Verify `JWT_SECRET` is set and at least 32 characters
- Check `OPENAI_API_KEY` is valid
- Review function logs in Vercel Dashboard

### CORS Issues
- Set `CLIENT_ORIGIN=*` in environment variables
- Or set to your specific Vercel domain

### Database/Storage Issues
- LowDB uses file-based storage - ensure `Backend/data/` directory exists
- On Vercel, consider using a persistent database (Vercel KV, PostgreSQL, etc.)

---

## 🚨 Important Notes

1. **File Storage:** The current backend uses LowDB (file-based). On Vercel serverless, files are ephemeral. Consider migrating to:
   - Vercel KV (Redis)
   - PostgreSQL (Vercel Postgres)
   - External database service

2. **Upload Directory:** Temporary file uploads work, but uploaded files won't persist across function invocations. Consider using:
   - Vercel Blob Storage
   - AWS S3
   - Cloudinary

3. **Function Limits:**
   - Max execution time: 10 seconds (configurable in `vercel.json`)
   - Max memory: 1024 MB (configurable in `vercel.json`)

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Express Apps to Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Environment Variables on Vercel](https://vercel.com/docs/environment-variables)
