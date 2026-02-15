# Cache Busting Script

Automatically updates version query strings on all static assets to force browser cache refresh.

## Features

- ✅ **Smart Version Detection** - Automatically detects current version strings
- ✅ **Same-Day Increments** - If running multiple times per day, adds `-1`, `-2`, etc.
- ✅ **Comprehensive Coverage** - Handles CSS, JS, PDF, BibTeX, images, icons
- ✅ **Safe Dry Run** - Preview changes before applying
- ✅ **External URL Safe** - Skips external resources (CDNs, etc.)

## Supported File Types

The script cache-busts the following asset types:
- CSS files (`.css`)
- JavaScript files (`.js`)
- PDF files (`.pdf`)
- BibTeX files (`.bib`)
- Icons (`.ico`)
- Images (`.png`, `.svg`) when linked via `href`

## Usage

### Preview Changes (Dry Run)
```bash
python3 cache_bust.py
```

This shows what would change without modifying any files.

### Apply Changes
```bash
python3 cache_bust.py --apply
```

This updates all HTML files with new version strings.

### Specify Directory
```bash
python3 cache_bust.py --dir /path/to/project --apply
```

## How It Works

1. **Scans** all HTML files in the project
2. **Detects** the most common version string (e.g., `?v=2026-02-15`)
3. **Calculates** new version:
   - If different day → Use today's date (`2026-02-16`)
   - If same day → Increment suffix (`2026-02-15-1`, `2026-02-15-2`, etc.)
4. **Updates** all asset references with new version
5. **Reports** what changed

## Example Output

```
🔍 Found 5 HTML files
📅 Today's date: 2026-02-15

📌 Current version: 2026-02-15
🆕 New version: 2026-02-15-1

📝 Files to update: 5

📄 index.html
   20 change(s)
   - href="/static/stylesheets/styles.css?v=2026-02-15"
   + href="/static/stylesheets/styles.css?v=2026-02-15-1"
   ...

✅ Successfully updated 5 files!
🎉 All assets now use version: 2026-02-15-1
```

## When to Use

Run this script whenever you:
- Update CSS styles
- Modify JavaScript files
- Change images or icons
- Update PDF documents
- Want to force browser cache refresh

## Integration with Git

Recommended workflow:
```bash
# 1. Make your changes to CSS/JS/etc.
git add .

# 2. Run cache buster
python3 cache_bust.py --apply

# 3. Commit everything together
git add .
git commit -m "Update styles and cache bust"
git push
```

## Notes

- The script only modifies HTML files
- External URLs (CDNs) are automatically skipped
- Data URIs are preserved unchanged
- Safe to run multiple times (idempotent)
