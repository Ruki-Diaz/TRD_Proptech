# Beta Deployment Guide

This guide covers everything needed to deploy the TRD Proptech application to Vercel (Frontend) and Render/Railway (Backend).

## A. Push to GitHub

Commit your beta preparation changes and push to your remote repository:

```bash
git add .
git commit -m "Prepare beta deployment: UI fixes, CORS config, and env setup"
git push origin main
```

## B. Deploy backend to Render/Railway

You should deploy the backend first so you have an API URL to give to the frontend.

1. Create a new Web Service on Render or Railway, connected to your GitHub repository.
2. Set the Root Directory to: `backend`
3. Set the Build Command: `pip install -r requirements.txt`
4. Set the Start Command: `gunicorn run:app`

**Environment Variables Required for Backend:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SECRET_KEY=your_flask_secret_key
FLASK_ENV=production
FRONTEND_URL= (Leave blank for now, we will fill this in Step D)
```

## C. Deploy frontend to Vercel

1. Create a new project on Vercel and connect it to your GitHub repository.
2. Set the Framework Preset to Vite.
3. Set the Root Directory to: `frontend`
4. Set the Build Command to: `npm run build`
5. Output directory should be: `dist`

**Environment Variables Required for Frontend:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```
*(Replace the VITE_API_BASE_URL with the actual URL provided by Render/Railway from Step B)*

## D. After frontend deployment

1. Copy your new Vercel URL (e.g., `https://your-app-name.vercel.app`).
2. Go back to your Backend hosting dashboard (Render/Railway).
3. Add or update the `FRONTEND_URL` environment variable:
   `FRONTEND_URL=https://your-app-name.vercel.app`
4. Redeploy the backend. This allows CORS to accept requests from your Vercel URL.

## E. Hosted beta test checklist

Ensure you test the following flows on the live beta URL:
- [ ] Home page loads successfully
- [ ] Navbar routing works
- [ ] Properties catalog loads listings
- [ ] Property images and fallbacks load correctly
- [ ] Property Detail page loads specific data
- [ ] Login and Registration works for both Users and Agents
- [ ] Admin panel loads users and allows verification/promotion
- [ ] Agent dashboard works
- [ ] Saving properties works
- [ ] Sending enquiries works
- [ ] No CORS errors in the browser console
- [ ] No `localhost` API calls in the browser Network tab
- [ ] Mobile responsive layout is unbroken
