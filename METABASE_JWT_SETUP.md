# Metabase JWT Embedding Setup Guide

This guide explains how to set up Metabase dashboard embedding using JWT tokens for secure authentication.

## Overview

The implementation uses:
- **Backend**: Generates JWT tokens with 10-minute expiration
- **Frontend**: Uses Metabase web component (`<metabase-dashboard>`) to display the dashboard
- **Security**: Tokens are generated server-side and never hardcoded

## Step 1: Install Backend Dependencies

```bash
cd backend
pip install PyJWT>=2.8.0
```

Or add to `requirements.txt` (already added):
```
PyJWT>=2.8.0
```

## Step 2: Configure Metabase

1. **Enable Embedding in Metabase**:
   - Log in to Metabase as admin
   - Go to **Settings** → **Admin** → **Embedding**
   - Enable "Embedding"
   - Copy the **Embedding Secret Key** (you'll need this)

2. **Get Your Dashboard ID**:
   - Open your dashboard in Metabase
   - Look at the URL: `http://localhost:3001/dashboard/2`
   - The number after `/dashboard/` is your dashboard ID (e.g., `2`)

## Step 3: Configure Backend Environment Variables

Add to your `backend/.env` file:

```bash
# Metabase Configuration
METABASE_INSTANCE_URL=http://localhost:3001
METABASE_SECRET_KEY=291f9bc4c1f3b294b4d9646967e06682fba67ac7d7f7febd51fba2362554242f
METABASE_DASHBOARD_ID=2
```

**Important**: Replace `METABASE_SECRET_KEY` with your actual secret key from Metabase settings.

## Step 4: Configure Frontend Environment Variables

Add to your `.env.local` file in the project root:

```bash
# Metabase Instance URL (for loading embed.js script)
NEXT_PUBLIC_METABASE_URL=http://localhost:3001
```

## Step 5: Restart Servers

```bash
# Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Frontend (in another terminal)
npm run dev
```

## Step 6: Verify Setup

1. Open your application
2. Navigate to **Reports** page
3. Click the **BI Dashboard** tab
4. The Metabase dashboard should load automatically

## How It Works

1. **Frontend** loads the Metabase embed.js script
2. **Frontend** calls `/api/v1/metabase/embed-token` to get a JWT token
3. **Backend** generates a JWT token with:
   - Dashboard ID
   - 10-minute expiration
   - Signed with Metabase secret key
4. **Frontend** passes the token to `<metabase-dashboard>` component
5. **Metabase** validates the token and displays the dashboard

## API Endpoint

### GET `/api/v1/metabase/embed-token`

Generates a JWT token for embedding a Metabase dashboard.

**Query Parameters**:
- `dashboard_id` (optional): Dashboard ID to embed. Defaults to `METABASE_DASHBOARD_ID` from config.

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "dashboard_id": 2,
  "expires_in": 600,
  "instance_url": "http://localhost:3001"
}
```

## Troubleshooting

### Token Generation Fails

- **Check**: `METABASE_SECRET_KEY` is set correctly in backend `.env`
- **Check**: Secret key matches the one in Metabase Settings → Admin → Embedding
- **Check**: Backend server is running and can access the `.env` file

### Dashboard Not Loading

- **Check**: `NEXT_PUBLIC_METABASE_URL` is set in `.env.local`
- **Check**: Metabase instance is running and accessible
- **Check**: Browser console for errors
- **Check**: Metabase embedding is enabled in Settings

### CORS Errors

- **Check**: Metabase allows embedding from your domain
- **Check**: `METABASE_INSTANCE_URL` matches your Metabase URL

### Script Not Loading

- **Check**: `NEXT_PUBLIC_METABASE_URL` points to your Metabase instance
- **Check**: Metabase is accessible at that URL
- **Check**: Browser console for script loading errors

## Security Notes

- ✅ **Tokens expire in 10 minutes** for security
- ✅ **Tokens are generated server-side** - never hardcoded
- ✅ **Secret key is stored server-side only** - never exposed to frontend
- ⚠️ **For production**: Use HTTPS and restrict CORS origins in Metabase

## Customization

### Change Token Expiration

Edit `backend/app/api/metabase.py`:
```python
"exp": round(time.time()) + (60 * 10),  # Change 10 to desired minutes
```

### Change Dashboard Theme

Edit `src/app/(app)/reports/page.tsx`:
```typescript
defineMetabaseConfig({
  theme: {
    preset: "dark"  // or "light"
  },
  // ...
});
```

### Add Dashboard Parameters

Edit `backend/app/api/metabase.py`:
```python
payload = {
    "resource": {"dashboard": target_dashboard_id},
    "params": {
        "param_name": "param_value"  # Add dashboard parameters here
    },
    # ...
}
```

## Example Configuration Files

### `backend/.env`
```bash
METABASE_INSTANCE_URL=http://localhost:3001
METABASE_SECRET_KEY=your-secret-key-here
METABASE_DASHBOARD_ID=2
```

### `.env.local` (project root)
```bash
NEXT_PUBLIC_METABASE_URL=http://localhost:3001
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for token generation errors
3. Verify all environment variables are set correctly
4. Ensure Metabase embedding is enabled
