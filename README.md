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

- **Image slideshows** (`slideshow.js`)  
  Swipable image carousels with auto-advance, keyboard navigation, touch/mouse drag, and dot indicators. Auto-advance pauses when the slideshow is off-screen (via IntersectionObserver) to save resources. Used for research highlight teasers (with hover zoom) and the Conference Gallery page (full-width, no crop).
- **Zoom containers** (`zoom-containers.js`)  
  Click-to-expand images and videos without leaving the page
- **Video comparison sliders** (`video_comparison.js`)  
  Interactive side-by-side video comparisons with draggable sliders for qualitative research demonstrations
- **Custom PDF Viewer** (`pdf-modal.js`, `pdfviewer.html`)  
  Full-screen in-page PDF viewer for any `.pdf` link site-wide. Powered by a self-hosted PDF.js instance, it avoids native browser limitations. It features a sleek Edge-style top toolbar with page shadows, custom controls (zoom, page navigation, fit width/page, rotate, print, and download), and comprehensive keyboard shortcut support. The viewer visually mirrors the Microsoft Edge PDF experience, including an automatic system-aware light/dark theme that adapts to OS preferences independently of the main site theme. It intelligently intercepts external links inside the PDF to open in new tabs and auto-zooms landscape posters.
- **Image viewer modal** (`image-modal.js`)  
  Lightweight modal for standalone image links (`.jpg`, `.png`, `.webp`, etc.). The modal shrink-wraps around the image up to 95% of the viewport while maintaining aspect ratio. Matches the theme of the PDF and BibTeX modals. Intercepts image links automatically site-wide; title is read from the `title` attribute, the wrapped `<img>`'s `alt`, or the filename as a fallback.
- **Lazy loading**  
  Images and videos load on demand for improved performance

### Motion & Interaction Polish

A layer of lightweight, tasteful micro-interactions — all pure CSS, all theme-aware, and all respecting `prefers-reduced-motion`:

- **Staggered header & footer entrance**  
  On first visit or page refresh, the sidebar logo, portrait/icons, nav links, and footer fade and slide in with a 1s stagger. Internal link navigation skips the animation (detected via `PerformanceNavigationTiming`).
- **Section content fade-in**  
  The main content area fades in on every page navigation for a smooth transition feel.
- **Theme toggle rise/set**  
  The sun/moon theme icons animate with a rise/set transition on hover — the current icon drops down while the next one rises from above, previewing the theme switch before committing on click.
- **Animated sliding underlines**  
  Inline text links, sidebar navigation links, and the sidebar email grow an underline left-to-right on hover. The underline uses `currentColor`, so it fades in sync with the text color.
- **Slow color fades**  
  Navigation links and social icons ease into the accent-hover color over ~0.45s for a softer, more deliberate feel (icons keep their subtle scale pop).
- **Icon hover lift & glow**  
  Social icons in the header and footer lift upward with a subtle translateY on hover, plus an accent-colored drop-shadow glow.
- **Portrait & brandmark hover**  
  The portrait photo and logo brandmark have a soft shadow at rest and subtly lift with an accent glow on hover.
- **Solid active nav**  
  The selected/active navigation link uses a solid `currentColor` underline. On touch devices, tapping a nav link plays the underline animation before navigating (~180ms delay).
- **Pill-style buttons with accent fill**  
  All buttons (`.button`, plus the BibTeX modal and PDF toolbar action buttons) are fully rounded pills that fill with the accent color and lift with a soft themed shadow on hover. Close (`×`) buttons are circular and spin 90° on hover.
- **Heading accent bars**  
  Each section `<h1>` carries a short accent-colored bar underneath. Flex headings (title + inline BibTeX button) anchor the bar to the title text only, so it never runs under the button.
- **Softer media surfaces**  
  Video/image thumbnails and the video-comparison sliders have rounded corners and a subtle, theme-aware drop shadow at rest (the shadow releases during the zoom-container hover so it doesn't magnify).
- **Touch-aware hover**  
  All hover effects are disabled on touch devices via `@media (hover: none)` to prevent sticky `:hover` states after tap.
- **Mobile bio toggle**  
  On mobile, the second paragraph of the About Me bio collapses behind a chevron button for a cleaner first impression.

### Dynamic Content & Theming

- **Dark mode toggle** (`theme-switcher.js`)  
  Manual theme switcher with localStorage persistence, smooth transitions, and zero FOUC (flash of unstyled content)
- **Component-based architecture** (`components.js`)  
  Reusable header and footer components with dynamic navigation highlighting, automatic copyright year, sessionStorage caching for flash-free navigation, and entrance animations on first visit/refresh
- **Automatic GitHub star counts** (`github-stars.js`)  
  Real-time repository star counts via the GitHub API
- **Semantic Scholar citation retrieval** (`semantic-scholar.js`)  
  Automatic citation counts for publications
- **News timeline toggle** (`news-toggle.js`)  
  Collapsible news timeline with animated expand/collapse. The vertical rail grows to meet each item as it appears, with staggered entry reveals and a gradient taper when collapsed. The third item shows a down-arrow indicator when collapsed; the last item shows an up-arrow when expanded. Clicking dates, dots, or the sidebar column toggles the state.
- **External link handling** (`new-tabs.js`)  
  External links automatically open in new tabs
- **BibTeX copy & download** (`bibtex.js`, `bibtex-modal.js`)  
  GitHub-style copy-to-clipboard and download functionality for BibTeX references, available both on a standalone page and as a responsive modal popup on research pages (e.g., Home, 3D Portfolio, Biometrics). Modal action buttons share the same unified pill-button style as the PDF toolbar.
- **Theme-aware styling tokens**  
  CSS variables drive consistent, theme-aware styling across all pages — including highlight-table borders and dedicated shadow tokens (`--accent-shadow`, `--media-shadow`) that keep hover shadows tuned for both light and dark themes.

### Custom Icon System

A fully custom icon system extending Academicons and Font Awesome with inline SVG masks for consistent styling and scalability:

- `ai-allentu` — Personal logo
- `ai-tu` — Personal brandmark
- `ai-umd` — University of Maryland
- `ai-umd-cs` — UMD Computer Science
- `ai-str` — Systems & Technology Research (STR)
- `ai-ncino` — nCino
- `ai-iarpa` — IARPA
- `ai-amazon` — Amazon
- `ai-xhs` — Xiaohongshu (RedNote)
- Custom Semantic Scholar and Web of Science icons

Several logos also ship a full-color variant (e.g. `ai-amazon-color`, `ai-str-color`, `ai-umd-cs-color`, `ai-iarpa-color`, `ai-ncino-color`) that layers brand colors using multiple mask elements, while the base icons inherit text color for theming.

Monochrome icons are implemented using `mask-image` so they inherit text color, scale cleanly, and support dark mode automatically.

### Design & UX

- **Modern typography** — [Inter](https://rsms.me/inter/) as the primary typeface (with a system-font fallback stack), font antialiasing, and refined heading weight/letter-spacing for a cleaner, more contemporary feel
- **Dark mode** — Toggle between light and dark themes with moon/sun icon in footer; preference persists across sessions
- **Large-screen auto-zoom** — The layout keeps its fixed width, but on wide monitors the content (`.wrapper`) progressively scales up via CSS `zoom` (1.1× at 1500px through 1.6× at 2800px) to fill a modern amount of the screen. Fonts, sidebar, media, and spacing all scale together, so the layout and line breaks stay identical — things just get bigger. `zoom` is applied to the content wrapper (not `body`) so full-screen modals stay sized to the real viewport and never require scrolling.
- **Responsive layout** — Mobile-optimized design with proper viewport handling, video container alignment, and centered navigation
- **Icon grid navigation** — Compact header linking to CV, profiles, and social platforms
- **Structured data** — JSON-LD schema markup for better SEO and rich snippets
- **Comprehensive meta tags** — Open Graph, Twitter Cards, and canonical URLs
- **Multi-page structure** — Home, Link Hub, 3D/4D Research Portfolio, Biometric Recognition Research, Conference Gallery, and BibTeX References
- **System-Aware Favicon** — Intelligent favicon adaptation that prioritizes system dark mode (white icon for contrast) while respecting page theme in light mode (red/dark red).

### Performance & SEO

- **Preconnect hints** — DNS prefetching for external resources
- **Deferred JavaScript** — Non-blocking script loading
- **Semantic HTML5** — Proper heading hierarchy and ARIA labels
- **Optimized media** — Appropriately sized images and compressed video assets
- **Cache busting** — Automated versioning system for static assets to ensure browsers load latest versions

---

## Project Structure
```
├── index.html              # Main homepage
├── hub/                    # Link hub page
├── 3d/                     # 3D/4D research portfolio
├── biometrics/             # Biometric recognition research
├── gallery/                # Conference gallery (CVPR, FG slideshows)
├── bibtex/                 # BibTeX references page
├── components/             # Reusable HTML components
│   ├── header.html         # Shared header with navigation
│   └── footer.html         # Shared footer with dynamic copyright
├── static/
│   ├── stylesheets/
│   │   ├── styles.css      # Main consolidated styles with CSS variables for theming
│   │   ├── icons.css       # Custom icon definitions
│   │   └── zoom_containers.css
│   ├── js/
│   │   ├── components.js   # Component loader with entrance animations
│   │   ├── theme-switcher.js # Dark mode toggle with rise/set animation
│   │   ├── slideshow.js    # Swipable image carousels
│   │   ├── pdf-modal.js    # Full-screen PDF viewer modal (auto-zooms posters; native passthrough on mobile)
│   │   ├── image-modal.js  # Image viewer modal (intercepts all image links; auto-loads .webp if available, downloads original)
│   │   ├── github-stars.js
│   │   ├── semantic-scholar.js
│   │   ├── new-tabs.js
│   │   ├── news-toggle.js  # Collapsible news timeline with animated rail
│   │   ├── video_comparison.js
│   │   ├── zoom-containers.js
│   │   └── bibtex.js       # Copy/download functionality for BibTeX
│   ├── icons/              # SVG logos and favicons
│   └── images/             # Photos and media
├── media/                  # Research teasers and videos
├── files/                  # CV, resume, etc.
├── cache_bust.py           # Automated cache busting script
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

- **[3D/4D Research Portfolio](https://tuallen.github.io/3d/)** — Zoom containers, video demonstrations, BibTeX modal, and PDF viewer
- **[Biometric Recognition Research](https://tuallen.github.io/biometrics/)** — Custom icon system, BibTeX modal, and PDF viewer
- **[Main Homepage](https://tuallen.github.io/)** — GitHub star counts, Semantic Scholar citations, slideshows, BibTeX modal, and PDF viewer
- **[Conference Gallery](https://tuallen.github.io/gallery/)** — Full-width image slideshows for CVPR 2026, FG 2026, and CVPR 2025 with LinkedIn/RedNote post links
- **[Link Hub](https://tuallen.github.io/hub/)** — Custom icon system showcase and PDF viewer
- **[BibTeX References](https://tuallen.github.io/bibtex/)** — Standalone page with GitHub-style copy/download buttons and Google Scholar/Semantic Scholar links
- **Header navigation** — Custom brandmark and icon grid on any page; CV link opens in the PDF viewer; staggered entrance animation on first visit

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
- The large-screen `zoom` scaling is a pure enhancement — unsupported browsers simply render the page at its normal fixed width
- Motion effects respect `prefers-reduced-motion` and fall back to instant state changes

---

## Known Limitations

- Video comparison sliders require JavaScript enabled
- Some custom icons may not render correctly in very old browsers (pre-2020)
- Citation counts and GitHub stars require API availability
- Zoom containers work best on desktop; mobile uses native image viewing
- On mobile (iOS/Android), the custom PDF viewer is bypassed to let the OS handle PDFs natively

---

## Philosophy

The goal is to keep the site **lightweight, readable, and publication-friendly**, while still supporting richer interactive content when it meaningfully improves understanding. Every feature is added intentionally — no bloat, no unnecessary dependencies, just thoughtful enhancements to research presentation.

---

## License & Reuse

Feel free to explore, borrow ideas, or adapt pieces for your own academic website. If you use significant portions of this code, please credit both the original template by **Gowthami Somepalli** and any custom features adapted from this repository.

---


## Cache Busting

When you update CSS, JavaScript, or other static files, run the cache busting script to force browsers to reload the new versions:

```bash
# Preview changes
python3 cache_bust.py

# Apply changes
python3 cache_bust.py --apply
```

The script automatically:
- Detects the current version (e.g., `?v=2026-02-15`)
- Increments if run multiple times per day (`?v=2026-02-15-1`, `-2`, etc.)
- Updates all CSS, JS, PDF, images, and other static assets in HTML files

---

## Related Project Websites

In addition to this personal site, I have also built or helped assemble several research project websites based on this codebase:

- [pup3dgs.github.io](https://pup3dgs.github.io/) ([Source Code](https://github.com/pup3dgs/pup3dgs.github.io))
- [speedysplat.github.io](https://speedysplat.github.io/) ([Source Code](https://github.com/speedysplat/speedysplat.github.io))
- [speede3dgs.github.io](https://speede3dgs.github.io/) ([Source Code](https://github.com/speede3dgs/speede3dgs.github.io))
- [transfira.github.io](https://transfira.github.io/) ([Source Code](https://github.com/transfira/transfira.github.io))
- [splatsure.github.io](https://splatsure.github.io/) ([Source Code](https://github.com/splatsure/splatsure.github.io))
- [jianyuwang0511.github.io/tameldl](https://jianyuwang0511.github.io/tameldl) ([Source Code](https://github.com/jianyuwang0511/tameldl))

This template has also been used for other academic websites that I helped their authors set up, including:

- [zhouyuanyuan6.github.io](https://zhouyuanyuan6.github.io/) ([Source Code](https://github.com/zhouyuanyuan6/zhouyuanyuan6.github.io))
- [jianyuwang0511.github.io](https://jianyuwang0511.github.io/) ([Source Code](https://github.com/jianyuwang0511/jianyuwang0511.github.io))

---

**Last Updated:** July 30, 2026
  
**Built with care** ☕  
**by Allen Tu, with help from AI tools**