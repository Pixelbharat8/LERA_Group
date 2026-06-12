# 🚀 LERA Platform - Production Deployment Guide

## Prerequisites
- Supabase account (you have this ✅)
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Domain name (optional but recommended)

---

## Step 1: Configure Supabase Database

### 1.1 Get Your Connection Details
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection string (URI)**

Your connection string format:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 1.2 Run Database Migrations
1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Copy and paste the contents of `database/init/init.sql`
4. Click **Run**
5. Then run V5, V6, V7, V8, V9, V10 migrations in order

---

## Step 2: Deploy Backend to Railway

### 2.1 Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2.2 Deploy Identity Service
```bash
cd backend/identity_service
railway init --name lera-identity
```

### 2.3 Set Environment Variables
In Railway Dashboard → Your Project → Variables:

| Variable | Value |
|----------|-------|
| DATABASE_URL | `jdbc:postgresql://aws-0-[region].pooler.supabase.com:6543/postgres` |
| DB_USER | `postgres.[project-ref]` |
| DB_PASSWORD | `[your-supabase-password]` |
| JWT_SECRET | `your-super-secret-256-bit-key-minimum-32-characters` |
| FRONTEND_URL | `https://your-app.vercel.app` |
| PORT | `8081` |

### 2.4 Deploy
```bash
railway up
```

### 2.5 Get Your Backend URL
After deployment, Railway will give you a URL like:
`https://lera-identity-production.up.railway.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Update Environment Variables
Edit `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://lera-identity-production.up.railway.app
NEXT_PUBLIC_IDENTITY_API=https://lera-identity-production.up.railway.app
```

### 3.3 Deploy
```bash
cd frontend
vercel --prod
```

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 In Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `lera.yourdomain.com`)
3. Update DNS records as instructed

### 4.2 In Railway
1. Go to Service Settings → Domains
2. Add custom domain (e.g., `api.lera.yourdomain.com`)

---

## Step 5: Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Verify database connection
- [ ] Check all API endpoints work
- [ ] Test frontend-backend communication
- [ ] Set up monitoring (Railway provides this)
- [ ] Configure Supabase backup schedule

---

## Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 1GB storage | $25/mo |
| Railway | $5 free credits/month | ~$5-10/mo |
| Vercel | Unlimited deployments | Free for hobby |
| **Total** | **~$0** | **~$30-40/mo** |

---

## Troubleshooting

### Database Connection Issues
- Make sure you're using the **pooler** connection string from Supabase
- Check that your IP is whitelisted in Supabase

### CORS Errors
- Update `FRONTEND_URL` in Railway to match your Vercel URL
- Make sure to include `https://`

### Build Failures
- Check Railway logs: `railway logs`
- Verify all environment variables are set

---

## Quick Commands Reference

```bash
# Check Railway status
railway status

# View logs
railway logs

# Redeploy
railway up

# Check Vercel deployments
vercel ls

# Redeploy frontend
vercel --prod
```

---

## Support
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
