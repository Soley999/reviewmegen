# ReviewMeGen - Features Documentation

## 🎉 New Features Implemented

### 1. OAuth Authentication (Google & Facebook)

Users can now sign up and log in using:
- **Google OAuth** - Sign in with Google account
- **Facebook OAuth** - Sign in with Facebook account
- **Traditional Email/Password** - Original authentication method

#### Setup Instructions:

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`
6. Copy Client ID and Client Secret to environment variables

**Facebook OAuth:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Configure OAuth redirect URI: `https://your-domain.vercel.app/api/auth/facebook/callback`
5. Copy App ID and App Secret to environment variables

### 2. Email Notifications

Automatic email notifications for:
- **Welcome emails** when users register (via email or OAuth)
- **Login notifications** when users sign in
- Includes login method (email, Google, or Facebook)
- Timestamp of login activity

#### Email Configuration:

Set these environment variables to enable:
```
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password as `EMAIL_PASSWORD`

### 3. Dashboard History with Timestamps

The Dashboard now displays:
- **Date and time** when each reviewer was generated
- **Format type** (flashcards, Q&A, outline)
- **Difficulty level** (easy, medium, hard)
- **Subject and tags** for easy searching
- **Empty state** message when no reviewers exist

Example display:
```
Mathematics Review
📅 Jan 15, 2026 at 2:30 PM
Format: flashcards • medium
Tags: [calculus] [derivatives]
```

### 4. Increased File Upload Limit

- **Previous limit:** 12MB
- **New limit:** 200MB
- Supports larger PDFs, DOCX, and TXT files
- Better handling of textbooks and research papers

### 5. Login Required for File Upload

To prevent abuse and maintain user history:
- Users must **login or sign up** before uploading files
- Clear notification on upload page for non-logged-in users
- Direct links to login/signup pages
- All generated reviewers automatically saved to user's dashboard

---

## 🔐 Environment Variables Reference

### Required Variables:

```env
JWT_SECRET=your-secret-min-32-characters
OPENAI_API_KEY=sk-your-openai-api-key
```

### Optional Variables (for OAuth):

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### Optional Variables (for Email):

```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🚀 Vercel Deployment Checklist

- [ ] Push all changes to GitHub
- [ ] Set required environment variables in Vercel dashboard
- [ ] (Optional) Configure OAuth credentials
- [ ] (Optional) Configure email notifications
- [ ] Deploy to production: `vercel --prod`
- [ ] Test OAuth flows on production domain
- [ ] Update OAuth callback URLs to production domain

---

## 📝 User Flow

### New User Registration:
1. User clicks "Sign up"
2. Options: Email/Password, Google, or Facebook
3. User completes authentication
4. **Welcome email sent** (if enabled)
5. Redirected to Dashboard

### Existing User Login:
1. User clicks "Login"
2. Options: Email/Password, Google, or Facebook
3. User authenticates
4. **Login notification email sent** (if enabled)
5. Redirected to Dashboard

### File Upload & Generation:
1. User must be logged in
2. Upload file (up to 200MB)
3. Configure settings (subject, format, difficulty, language)
4. Generate reviewer
5. **Automatically saved to Dashboard** with timestamp
6. View/download results

### Dashboard Access:
1. View all previously generated reviewers
2. See when each was created (date & time)
3. Search by subject or tags
4. Open to view content
5. Delete if no longer needed

---

## 🐛 Troubleshooting

### OAuth Issues:
- Ensure callback URLs match exactly (including protocol)
- Check that OAuth apps are in production mode, not development
- Verify environment variables are set correctly

### Email Not Sending:
- Check `EMAIL_NOTIFICATIONS_ENABLED=true`
- Verify SMTP credentials
- Check spam folder
- Review application logs for errors

### File Upload Issues:
- Ensure MAX_FILE_SIZE_MB is set to 200
- Check file format is supported (PDF, DOCX, TXT)
- Verify user is logged in

---

## 📊 Database Schema Updates

### User Model (enhanced):
```javascript
{
  id: string,
  email: string,
  name: string,
  passwordHash: string,
  provider: "email" | "google" | "facebook",  // NEW
  providerId: string,  // NEW (OAuth provider user ID)
  createdAt: ISO8601 timestamp
}
```

### Reviewer Model (enhanced):
```javascript
{
  id: string,
  userId: string,
  title: string,
  subject: string,
  tags: string[],
  format: string,
  difficulty: string,
  language: string,
  content: object,
  createdAt: ISO8601 timestamp,  // ENHANCED (now displayed)
  updatedAt: ISO8601 timestamp   // ENHANCED
}
```
