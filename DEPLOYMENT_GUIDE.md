# Deployment Guide - Factory Manager Pro

## GitHub Pages Deployment - WORKING ✅

### Current Setup
Your app is now successfully deployed to GitHub Pages at:
**https://bsse1613-eng.github.io/factory-management/**

### How It Works

1. **Local Build Process**
   - Run: `npm run build`
   - Creates optimized production bundle in `dist/` folder
   - Automatically sets base path to `/factory-management/` for production mode

2. **File Structure**
   - `dist/` folder is committed to Git (not ignored)
   - `dist/index.html` is the entry point
   - All assets are bundled with correct relative paths

3. **GitHub Pages Configuration**
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/dist`
   - URL: `https://bsse1613-eng.github.io/factory-management/`

### Key Configuration Files

#### vite.config.ts ✅
```typescript
// Production mode sets base to /factory-management/
const isProduction = mode === 'production';
const base = isProduction ? '/factory-management/' : '/';
```
- ✅ Development: Base is `/` (local testing)
- ✅ Production: Base is `/factory-management/` (GitHub Pages)

#### .gitignore ✅
- `dist` folder is NOT ignored (line removed)
- This allows built files to be committed and served by GitHub Pages

#### index.html ✅
- Clean entry point
- No problematic importmap
- Correct module script reference

#### services/supabaseClient.ts ✅
- Credentials are optional (won't break build)
- Console warning if missing credentials
- Fails gracefully at runtime if needed

## Workflow

### To Update Deployment:

1. **Make code changes locally**
   ```bash
   # Edit your files
   code App.tsx  # or any file
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Update app with new features"
   git push origin main
   ```

4. **GitHub Pages auto-updates**
   - Changes appear at: https://bsse1613-eng.github.io/factory-management/
   - May take 1-2 minutes to reflect

### Local Development

```bash
# Start dev server (base path = /)
npm run dev

# App runs at: http://localhost:3000
```

## Troubleshooting

### Blank Page
- ✅ Check base path in vite.config.ts
- ✅ Verify GitHub Pages source points to `/dist`
- ✅ Clear browser cache (Ctrl+Shift+Delete)

### CSS/JS Not Loading
- ✅ Ensure `dist/` folder is committed
- ✅ Run `npm run build` and commit changes
- ✅ Check browser console for path errors

### Supabase Connection Issues
- ✅ Set environment variables in `.env.local`:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
  ```

## Files Changed for Deployment

1. **vite.config.ts** - Fixed base path detection
2. **.gitignore** - Removed `dist/` from ignore list
3. **dist/** - Built and committed production bundle
4. **.env.local** - Contains Supabase credentials (not committed)

## Summary

✅ **App is live at:** https://bsse1613-eng.github.io/factory-management/
✅ **Build succeeds:** npm run build completes without errors
✅ **Assets load:** All CSS, JS, images load correctly
✅ **Configuration:** Proper base path for subdirectory deployment
✅ **Updates:** Push to main branch → auto-updates on GitHub Pages

No custom GitHub Actions workflow needed - using simple Git-based deployment!
