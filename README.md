# Allen Tu’s Webpage

Source code for my personal website:  
👉 **https://tuallen.github.io**

Welcome to my long-running pet project — a place where my web development experiments collide with my habit of polishing research papers, figures, and visualizations a little too carefully. What began as a simple academic homepage has gradually evolved into a playground for experimenting with UI details, interactive media, and small quality-of-life features that make research artifacts nicer to browse.

The guiding principle is simple: keep things lightweight, readable, and publication-friendly — while still supporting richer interaction where it genuinely improves understanding.

---

## Credits

This site is built on top of the excellent academic website template by  
**Gowthami Somepalli**  
https://github.com/somepago/somepago.github.io/tree/50f518f52bb19d6d9b9ca65f76dc06bd01d429fb

Huge thanks to her for open-sourcing a clean, well-structured starting point.

---

## Tech Stack

- **Pure HTML / CSS / JavaScript** — No frameworks, no build process; just vanilla web technologies
- **Font Awesome 6.5.1** — General-purpose icon library
- **Academicons** — Academic-specific icons (Google Scholar, ORCID, arXiv, etc.)
- **Custom SVG icon system** — Inline SVG masks for institutional and organizational logos
- **Modern image formats** — WebP with PNG/JPG fallbacks
- **Google Analytics** — Lightweight traffic monitoring

---

## Custom Features & Extensions

On top of the original template, I’ve introduced a number of custom features and extensions.

### Interactive Media

- **Zoom containers** (`zoom-containers.js`)  
  Click-to-expand images and videos without leaving the page
- **Video comparison sliders** (`video_comparison.js`)  
  Interactive side-by-side video comparisons with draggable sliders for qualitative research demonstrations
- **Lazy loading**  
  Images and videos load on demand for improved performance

### Dynamic Content & Theming

- **Dark mode toggle** (`theme-switcher.js`)  
  Manual theme switcher with localStorage persistence, smooth transitions, and zero FOUC (flash of unstyled content)
- **Component-based architecture** (`components.js`)  
  Reusable header and footer components with dynamic navigation highlighting and automatic copyright year
- **Automatic GitHub star counts** (`github-stars.js`)  
  Real-time repository star counts via the GitHub API
- **Semantic Scholar citation retrieval** (`semantic-scholar.js`)  
  Automatic citation counts for publications
- **External link handling** (`new-tabs.js`)  
  External links automatically open in new tabs

### Custom Icon System

A fully custom icon system extending Academicons and Font Awesome with inline SVG masks for consistent styling and scalability:

- `ai-allentu` — Personal logo
- `ai-tu` — Personal brandmark
- `ai-umd` — University of Maryland
- `ai-umd-cs` — UMD Computer Science
- `ai-str` — Systems & Technology Research (STR)
- `ai-ncino` — nCino
- `ai-iarpa` — IARPA
- `ai-xhs` — Xiaohongshu (RedNote)
- Custom Semantic Scholar and Web of Science icons

All icons are implemented using `mask-image` so they inherit text color, scale cleanly, and support dark mode automatically.

### Design & UX

- **Dark mode** — Toggle between light and dark themes with moon/sun icon in footer; preference persists across sessions
- **Responsive layout** — Mobile-optimized design with proper viewport handling, video container alignment, and centered navigation
- **Icon grid navigation** — Compact header linking to CV, profiles, and social platforms
- **Structured data** — JSON-LD schema markup for better SEO and rich snippets
- **Comprehensive meta tags** — Open Graph, Twitter Cards, and canonical URLs
- **Multi-page structure** — Home, Link Hub, and 3D/4D Research Portfolio
- **Favicon system** — Adaptive SVG favicons (red for light mode, white for dark mode) with PNG fallbacks and ICO support

### Performance & SEO

- **Preconnect hints** — DNS prefetching for external resources
- **Deferred JavaScript** — Non-blocking script loading
- **Semantic HTML5** — Proper heading hierarchy and ARIA labels
- **Optimized media** — Appropriately sized images and compressed video assets

---

## Project Structure
```
├── index.html              # Main homepage
├── hub/                    # Link hub page
├── 3d/                     # 3D/4D research portfolio
├── components/             # Reusable HTML components
│   ├── header.html         # Shared header with navigation
│   └── footer.html         # Shared footer with dynamic copyright
├── static/
│   ├── stylesheets/
│   │   ├── styles.css      # Main consolidated styles with CSS variables for theming
│   │   ├── icons.css       # Custom icon definitions
│   │   └── zoom_containers.css
│   ├── js/
│   │   ├── components.js   # Component loader system
│   │   ├── theme-switcher.js # Dark mode toggle with localStorage
│   │   ├── github-stars.js
│   │   ├── semantic-scholar.js
│   │   ├── new-tabs.js
│   │   ├── video_comparison.js
│   │   └── zoom-containers.js
│   ├── icons/              # SVG logos and favicons
│   └── images/             # Photos and media
├── media/                  # Research teasers and videos
├── files/                  # CV, resume, BibTeX, etc.
├── sitemap.xml             # SEO sitemap
└── robots.txt              # Crawler directives
```

---

## Local Development

To run the site locally:

```bash
sh run_server.sh
```

Then navigate to `http://localhost:8000` in your browser.

The server script uses Python's built-in HTTP server for quick local testing.

---

## Features in Action

Want to see these features live? Check out:

- **[3D/4D Research Portfolio](https://tuallen.github.io/3d/)** — Zoom containers and video demonstrations
- **[Main Homepage](https://tuallen.github.io/)** — GitHub star counts and Semantic Scholar citations
- **[Link Hub](https://tuallen.github.io/hub/)** — Custom icon system showcase
- **Header navigation** — Custom brandmark and icon grid on any page

---

## Browser Support

This site uses modern web standards and is optimized for:

- **Chrome/Edge** (latest)
- **Firefox** (latest)
- **Safari** (latest)

Graceful degradation is implemented for older browsers:
- WebP images fall back to PNG/JPG
- CSS mask-image icons degrade to standard text
- JavaScript features are progressively enhanced

---

## Known Limitations

- Video comparison sliders require JavaScript enabled
- Some custom icons may not render correctly in very old browsers (pre-2020)
- Citation counts and GitHub stars require API availability
- Zoom containers work best on desktop; mobile uses native image viewing

---

## Philosophy

The goal is to keep the site **lightweight, readable, and publication-friendly**, while still supporting richer interactive content when it meaningfully improves understanding. Every feature is added intentionally — no bloat, no unnecessary dependencies, just thoughtful enhancements to research presentation.

---

## License & Reuse

Feel free to explore, borrow ideas, or adapt pieces for your own academic website. If you use significant portions of this code, please credit both the original template by **Gowthami Somepalli** and any custom features adapted from this repository.

---

**Last Updated:** February 15, 2026  
**Built with care** ☕  
**by Allen Tu, with help from AI tools**