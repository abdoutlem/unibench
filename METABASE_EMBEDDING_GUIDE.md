# Metabase Dashboard Embedding Guide

This guide explains how to embed a Metabase dashboard directly into the Reports page using Metabase's embedding feature.

## Prerequisites

1. **Metabase Instance**: You need a running Metabase instance (local or hosted)
2. **Admin Access**: You need admin access to configure embedding settings
3. **Dashboard Created**: Have a dashboard ready to embed

## Step 1: Enable Embedding in Metabase

1. **Log in to Metabase** as an admin user
2. **Navigate to Settings** → **Admin** → **Embedding**
3. **Enable Embedding**:
   - Toggle "Embedding" to ON
   - This enables iframe embedding for your Metabase instance

## Step 2: Configure Dashboard Embedding

### Option A: Static Embedding (Simpler, No Authentication)

1. **Go to your Dashboard** in Metabase
2. **Click the "..." menu** (three dots) in the top right
3. **Select "Embed this dashboard"**
4. **Copy the Embed URL** - It will look like:
   ```
   http://localhost:3001/embed/dashboard/[dashboard-id]#bordered=true&titled=true
   ```
5. **Note the Dashboard ID** from the URL (the UUID after `/dashboard/`)

### Option B: JWT Embedding (More Secure, Requires Authentication)

1. **Enable JWT Authentication**:
   - Go to **Settings** → **Admin** → **Embedding**
   - Enable "Embedding" if not already enabled
   - Note: JWT embedding requires additional setup (see Metabase docs)

2. **Get Embedding Parameters**:
   - Dashboard ID (from the dashboard URL)
   - Embedding Secret Key (from Settings → Admin → Embedding)

## Step 3: Configure Environment Variables

### For Static Embedding (Recommended for Development)

Add to your `.env.local` file in the project root:

```bash
# Metabase Embedding Configuration
NEXT_PUBLIC_METABASE_URL=http://localhost:3001/embed/dashboard/[your-dashboard-id]
NEXT_PUBLIC_METABASE_SITE_URL=http://localhost:3001
```

**Replace `[your-dashboard-id]`** with your actual dashboard ID (UUID).

### For JWT Embedding (Production)

```bash
# Metabase Embedding Configuration
NEXT_PUBLIC_METABASE_URL=http://localhost:3001/embed/dashboard/[your-dashboard-id]
NEXT_PUBLIC_METABASE_SITE_URL=http://localhost:3001
METABASE_EMBEDDING_SECRET_KEY=your-secret-key-here
```

**Note**: For JWT embedding, you'll need to generate tokens on the backend (see Step 4).

## Step 4: Get Your Dashboard ID

1. **Open your dashboard** in Metabase
2. **Look at the URL** - it will be something like:
   ```
   http://localhost:3001/dashboard/1
   ```
   or
   ```
   http://localhost:3001/dashboard/abc123-def456-ghi789
   ```
3. **The number or UUID** after `/dashboard/` is your dashboard ID

## Step 5: Update Environment Variable

Edit your `.env.local` file:

```bash
# Example with dashboard ID = 1
NEXT_PUBLIC_METABASE_URL=http://localhost:3001/embed/dashboard/1#bordered=true&titled=true

# Example with UUID dashboard ID
NEXT_PUBLIC_METABASE_URL=http://localhost:3001/embed/dashboard/abc123-def456-ghi789#bordered=true&titled=true
```

### URL Parameters (Optional)

You can add parameters to customize the embed:
- `bordered=true` - Show border around dashboard
- `titled=true` - Show dashboard title
- `theme=night` - Dark theme
- `hide_parameters=param1,param2` - Hide specific parameters

Example:
```
http://localhost:3001/embed/dashboard/1#bordered=true&titled=true&theme=night
```

## Step 6: Restart Next.js Server

After updating `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Step 7: Verify Embedding

1. **Open the Reports page** in your application
2. **Click the "BI Dashboard" tab**
3. **You should see your Metabase dashboard** embedded

## Troubleshooting

### Dashboard Not Showing

1. **Check Metabase Embedding is Enabled**:
   - Settings → Admin → Embedding → Should be ON

2. **Verify Dashboard ID**:
   - Make sure the ID in the URL matches your dashboard
   - Try accessing the embed URL directly in a browser

3. **Check CORS Settings**:
   - Metabase should allow iframe embedding from your domain
   - Check browser console for CORS errors

4. **Verify Environment Variable**:
   - Check the debug message in the BI Dashboard tab
   - Ensure `.env.local` is in the project root (not in `backend/`)
   - Restart Next.js server after changes

### Common Issues

**Issue**: "Embedding is not enabled"
- **Solution**: Enable embedding in Metabase Settings → Admin → Embedding

**Issue**: Dashboard shows but is blank
- **Solution**: Check if the dashboard has cards/questions configured

**Issue**: CORS errors in browser console
- **Solution**: Ensure Metabase allows iframe embedding from your domain

## Advanced: JWT Embedding (For Production)

If you need authenticated embedding:

1. **Enable JWT in Metabase**:
   - Settings → Admin → Embedding → Enable JWT

2. **Create Backend Endpoint** (optional):
   - Generate JWT tokens on your backend
   - Pass tokens to the frontend securely

3. **Update Frontend**:
   - Use the JWT token in the embed URL
   - Format: `http://metabase.com/embed/dashboard/[id]#jwt=[token]`

## Example Configuration

### `.env.local` file:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Metabase Embedding
NEXT_PUBLIC_METABASE_URL=http://localhost:3001/embed/dashboard/1#bordered=true&titled=true
NEXT_PUBLIC_METABASE_SITE_URL=http://localhost:3001
```

### Direct Embed URL Format:
```
http://[metabase-host]/embed/dashboard/[dashboard-id]#[parameters]
```

## Security Notes

- **Static Embedding**: Anyone with the URL can access the dashboard
- **JWT Embedding**: Requires authentication tokens
- **For Production**: Use JWT embedding or restrict access via Metabase permissions
- **HTTPS**: Use HTTPS in production for secure embedding
