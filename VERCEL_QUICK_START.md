# 🚀 Vercel Deployment - Quick Start

## ✅ What's Been Set Up

Your project is now fully configured for Vercel deployment with:

- ✅ **Frontend (Vite + React)** - Deployed to root
- ✅ **Backend (Express API)** - Deployed as serverless functions at `/api`
- ✅ **Configuration files** - vercel.json, .vercelignore, API wrapper
- ✅ **Environment setup scripts** - For both Windows and Unix

---

## 🎯 Deploy Now (3 Simple Steps)

### Step 1: Push to GitHub
```bash
git push origin development
```

### Step 2: Login to Vercel (if not already)
```bash
vercel login
```
Visit the URL shown and authenticate.

### Step 3: Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🔐 Set Environment Variables

### Option A: Using the Setup Script (Easiest)

**Windows:**
```bash
setup-vercel-env.bat
```

**Mac/Linux:**
```bash
./setup-vercel-env.sh
```

### Option B: Manual Setup

Go to your Vercel project dashboard → Settings → Environment Variables and add:

**Required:**
- `JWT_SECRET` - Your JWT secret (min 32 characters)
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional (have defaults):**
- `OPENAI_MODEL` - Default: `gpt-4o-mini`
- `JWT_EXPIRES_IN` - Default: `7d`
- `CLIENT_ORIGIN` - Default: `*`

---

## 🌐 After Deployment

Your app will be available at:
- **Frontend:** `https://your-project.vercel.app/`
- **API:** `https://your-project.vercel.app/api/`
- **Health Check:** `https://your-project.vercel.app/api/health`

---

## 📚 Need More Details?

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Complete configuration reference
- Troubleshooting guide
- Post-deployment checklist
- Advanced configuration options

---

## 🆘 Quick Troubleshooting

**Build fails?**
- Check environment variables are set
- Verify OpenAI API key is valid

**API errors?**
- Visit `/api/health` to check API status
- Check Function logs in Vercel Dashboard

**Need help?**
- Check [DEPLOYMENT.md](DEPLOYMENT.md)
- View logs: `vercel logs`
- Contact support: [vercel.com/support](https://vercel.com/support)
