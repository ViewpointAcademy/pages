# Google Photos Integration Setup Guide

## Overview
The Mekomos Journey gallery can display photos from a public Google Photos shared album. No special permissions needed - the album must be publicly shared.

## Step 1: Create a Google Photos Shared Album

1. Open [Google Photos](https://photos.google.com)
2. Create a new album or select an existing one
3. Click **Share** → **Create link**
4. Copy the shared link (format: `https://photos.app.goo.gl/xxx`)
5. **Make sure the link is set to "Anyone with the link can view"**

## Step 2: Get Google Photos API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Photos Library API**:
   - Search for "Google Photos Library API"
   - Click "Enable"
4. Create an API Key:
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key

## Step 3: Extract Album ID

From your shared link `https://photos.app.goo.gl/abc123def456`, the album ID is embedded.

**Alternative: Get Album ID from URL**
- Open the shared album link
- Look at the address bar - the ID is in the URL

## Step 4: Configure in App

### For Admin Users:
1. Open the app in browser
2. Go to Gallery tab
3. Open browser console (F12 → Console)
4. Run: `window.configureGooglePhotos()`
5. Enter your Google Photos API Key
6. Enter your shared album ID
7. Photos will load immediately

### To Clear Configuration:
```javascript
window.clearGooglePhotosConfig()
```

## Important Notes

⚠️ **Public Albums Only:**
- The album must be publicly shared (anyone with link can view)
- No authentication required
- API Key is public data

✅ **Permissions:**
- No special permissions needed for public albums
- API key can be safely shared (it's public)
- Photos are read-only (can't modify from app)

📸 **Photo Display:**
- Photos are cached locally after first load
- Cache refreshes when configuration changes
- Supports image metadata (width, height, creation time)
- Original resolution available in lightbox

## Troubleshooting

**"Could not fetch Google Photos" error:**
- Verify API Key is correct
- Verify Album ID is correct
- Check if album is publicly shared
- Ensure Google Photos Library API is enabled

**Photos not showing:**
- Run `invalidateDataCache('gallery')` in console
- Refresh page
- Check browser console for errors (F12)

## Configuration Storage

Settings are saved in browser localStorage:
- `googlePhotosApiKey`: Your API key
- `googlePhotosAlbumId`: Your album ID

Clear these manually to reset:
```javascript
localStorage.removeItem('googlePhotosApiKey');
localStorage.removeItem('googlePhotosAlbumId');
```
