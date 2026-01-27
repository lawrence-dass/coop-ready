# Google OAuth Configuration Guide

This guide walks through setting up Google OAuth for SubmitSmart authentication.

---

## Prerequisites

- Google Cloud Console account
- Supabase project access
- Production domain (for production setup)

---

## Step 1: Create Google OAuth Credentials

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Configure OAuth Consent Screen

1. Click **OAuth consent screen** in the left sidebar
2. Select **External** user type (or Internal if using Google Workspace)
3. Click **Create**
4. Fill in required fields:
   - **App name:** SubmitSmart
   - **User support email:** Your email
   - **Developer contact email:** Your email
5. Click **Save and Continue**
6. Skip scopes (default scopes are sufficient)
7. Add test users if using External type
8. Click **Save and Continue**

### 1.3 Create OAuth Client ID

1. Click **Credentials** in the left sidebar
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name:** SubmitSmart Web Client
   - **Authorized JavaScript origins:**
     - Leave empty (not needed for Supabase OAuth flow)
   - **Authorized redirect URIs:**
     - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
     - Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project ID
     - Example: `https://eqlvarvpukgxryammjpf.supabase.co/auth/v1/callback`
     - ⚠️ **IMPORTANT:** Use the **Supabase domain**, NOT your app domain!
     - ⚠️ No trailing slash
     - ⚠️ Must be exactly `/auth/v1/callback` (not `/auth/callback`)
5. Click **Create**
6. **Copy the Client ID and Client Secret** - you'll need these next

**Finding Your Supabase URL:**
- Check your `.env.local` file for `NEXT_PUBLIC_SUPABASE_URL`
- Or go to Supabase Dashboard → Project Settings → API
- The redirect URI is: `[YOUR_SUPABASE_URL]/auth/v1/callback`

---

## Step 2: Configure Supabase

### 2.1 Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your SubmitSmart project
3. Navigate to **Authentication** → **Providers**

### 2.2 Enable Google Provider

1. Find **Google** in the provider list
2. Toggle **Enable Sign in with Google** to ON
3. Enter credentials from Step 1.3:
   - **Client ID:** Paste the Client ID from Google Cloud Console
   - **Client Secret:** Paste the Client Secret from Google Cloud Console
4. Click **Save**

### 2.3 Verify Redirect URLs

Supabase automatically generates callback URLs. Verify these match what you configured in Google Cloud Console:

- Development: `http://localhost:3000/auth/callback`
- Production: `https://your-production-domain.com/auth/callback`

---

## Step 3: Update Environment Variables

Add the following to your `.env.local` file:

```bash
# App URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase credentials (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For production deployment (Vercel):
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

---

## Step 4: Verify Configuration

### 4.1 Test OAuth Flow

1. Start your dev server: `npm run dev`
2. Navigate to login page
3. Click "Sign in with Google"
4. You should be redirected to Google sign-in
5. After authorization, you should return to the app

### 4.2 Check Supabase Auth Logs

1. Go to Supabase Dashboard → **Authentication** → **Logs**
2. Verify successful OAuth sign-in events
3. Check **Users** tab to see newly created OAuth users

---

## Troubleshooting

### Error: "redirect_uri_mismatch" (Most Common Error!)

**Cause:** Redirect URI in Google Cloud Console doesn't match Supabase callback URL

**What's happening:**
- Google expects redirect URI: What you configured in Google Console
- Google received: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- These must match EXACTLY

**Solution:**
1. Find your Supabase URL:
   - Check `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`
   - Or Supabase Dashboard → Project Settings → API
2. The redirect URI is: `[YOUR_SUPABASE_URL]/auth/v1/callback`
3. Go to Google Cloud Console → Credentials → Your OAuth Client
4. Under "Authorized redirect URIs", add EXACTLY:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
5. Click Save and wait 1-2 minutes
6. Try again

**Common mistakes:**
- ❌ Using app domain: `http://localhost:3000/auth/callback`
- ❌ Wrong path: `/auth/callback` instead of `/auth/v1/callback`
- ❌ Trailing slash: `/auth/v1/callback/`
- ❌ Wrong protocol: `http://` instead of `https://`
- ✅ Correct: `https://eqlvarvpukgxryammjpf.supabase.co/auth/v1/callback`

### Error: "access_denied"

**Cause:** User cancelled OAuth flow or app not verified

**Solution:**
- User cancellation is normal behavior
- For unverified app warning: Add test users in OAuth consent screen

### Error: "invalid_client"

**Cause:** Client ID or Client Secret incorrect

**Solution:**
1. Verify credentials in Supabase match Google Cloud Console exactly
2. Regenerate credentials if needed
3. Clear browser cache and try again

### OAuth Works Locally But Not in Production

**Cause:** Production domain not configured

**Solution:**
1. Add production domain to Authorized JavaScript origins
2. Add production callback URL to Authorized redirect URIs
3. Update `NEXT_PUBLIC_APP_URL` environment variable in Vercel
4. Redeploy application

---

## Security Notes

- **Never commit** Client Secret to version control
- Store credentials in environment variables only
- Use HTTPS in production (Vercel enforces this)
- Rotate credentials if compromised
- Monitor Supabase Auth logs for suspicious activity

---

## Additional Resources

- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Setup Date:** 2026-01-26
**Story:** 8-3-implement-google-oauth
**Version:** 1.0
