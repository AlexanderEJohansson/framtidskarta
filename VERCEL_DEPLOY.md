# Vercel Deployment Notes

## Project Status
- ✅ Project linked: `prj_S283kgbZ4ZcFJdS02QHz3KpWzPet`
- ✅ Team: `team_chQG1j34iyHieuMYUjX9ULLs`
- ✅ GitHub remote connected

## Required Environment Variables (add in Vercel Dashboard)

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://djdqpkslbvgniweqofkc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_GqWikxjCQ-HzjAGqb465-A_TCvWZ7Tv
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZHFwa3NsYnZnbml3ZXFvZmtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExMjA3NSwiZXhwIjoyMDkyNjg4MDc1fQ.BFdJFV9FnmaAzPjMAP-A-NVfuMP01lPwWEeHvSZK_eY
```

### Stripe (TODO - not yet configured)
```
STRIPE_SECRET_KEY=sk_live_...  # TODO: Add when Stripe account is ready
STRIPE_WEBHOOK_SECRET=whsec_...  # TODO: Add after setting up webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # TODO: Add when Stripe account is ready
```

## Vercel Dashboard Setup
1. Go to: https://vercel.com/dashboard
2. Select project "framtidskarta"
3. Go to Settings → Environment Variables
4. Add the variables above
5. Redeploy (or push to main to auto-deploy)

## Deployment Commands (if CLI was authenticated)
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel redeploy --token=<token>
```
