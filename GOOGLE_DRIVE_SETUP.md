# Google Drive Image Setup Guide

This application now stores images using Google Drive URLs instead of server uploads. This approach eliminates server storage limitations and makes image management simpler.

## Setup Steps

### 1. Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named something like `system-design-app-images`
3. Right-click the folder → Share
4. Change permissions to "Anyone with the link" → Editor
5. Copy the folder URL for reference

### 2. Get Shareable Image URLs

#### Method 1: Direct Share Link (Recommended)

1. Upload an image to your Google Drive folder
2. Right-click the image → Share
3. Click "Change to anyone with the link"
4. Copy the link

#### Method 2: Direct Image URL

If you have a Google Drive file ID, you can construct a direct URL:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

To get the FILE_ID:
1. Right-click image → Get link
2. The URL will be: `https://drive.google.com/file/d/FILE_ID/view`
3. Extract the FILE_ID and use the format above

### 3. Using URLs in Admin Panel

#### For Articles

1. Go to Admin → Articles → Create/Edit Article
2. In the "Image URLs (Google Drive)" section:
   - Paste a Google Drive image URL
   - Press Enter or click "Add URL"
   - The image preview will appear below
   - Add multiple images by repeating the process
   - Click the X button to remove images
3. Save the article

#### For Courses

1. Go to Admin → Courses → Create/Edit Course
2. In the "Thumbnail URL (Google Drive)" section:
   - Paste the Google Drive image URL
   - The preview will show on the course listing
3. Save the course

## Best Practices

✅ **Do:**
- Keep images organized in named folders
- Use descriptive filenames
- Test URLs before saving
- Keep drive folder publicly accessible

❌ **Don't:**
- Delete images from Google Drive after adding to articles
- Make the folder private/restricted
- Use very large image files (compress first)
- Rely on shortened URLs (they may expire)

## Troubleshooting

### Images Not Loading

1. **Check URL format**
   - URL should start with `https://`
   - Contains `drive.google.com` or `uc?export=view`

2. **Check Permissions**
   - Ensure the sharing link is set to "Anyone with the link"
   - Test the URL in a new browser tab (not logged in)

3. **Format Issues**
   - Some URLs may need to be converted to direct format:
   - From: `https://drive.google.com/file/d/FILE_ID/view`
   - To: `https://drive.google.com/uc?export=view&id=FILE_ID`

### Database URL Storage

- URLs are stored directly in MongoDB
- No server file processing needed
- URLs remain valid as long as folder sharing is enabled

## URL Examples

### Valid URLs
- `https://drive.google.com/uc?export=view&id=1ABC123DEF456`
- `https://drive.google.com/file/d/1ABC123DEF456/view`
- `https://drive.google.com/file/d/1ABC123DEF456/view?usp=sharing`

### Invalid URLs
- `https://drive.google.com/file/d/...` (without view)
- URLs from restricted/private files
- Expired sharing links

## API Endpoint Changes

The `/api/upload` endpoint is **no longer needed** for image uploads.

### Old Flow (Deprecated)
```
File Upload → /api/upload → Save to server → Return /uploads/... URL
```

### New Flow
```
Google Drive URL → Store in Database → Display from Google Drive
```

## Database Schema

Articles now store images as:
```javascript
{
  images: [
    "https://drive.google.com/uc?export=view&id=...",
    "https://drive.google.com/uc?export=view&id=..."
  ]
}
```

No changes needed - the system already supports full URLs!

## Need to Migrate Old Images?

If you have old `/uploads/...` URLs in the database:

1. Download images from the server
2. Upload to Google Drive
3. Get the shareable URLs
4. Update database documents with new URLs

Contact the development team for assistance with bulk migration if needed.
