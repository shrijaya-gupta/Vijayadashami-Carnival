# Vijayadashami Carnival — Assets Directory

This directory stores visual assets and icons for the **Vijayadashami Carnival** website at SRMU Campus, B5-408.

## Directory Structure
- `assets/`
  - `README.md` — Asset documentation and guidelines
  - `icons/` — Reserved for future custom SVG or vector icons
  - `images/` — Reserved for official campus photos and banners

## Visual Design & Asset Philosophy (Phases 1 & 2)
1. **Lightweight Inline Vector SVGs**: Game illustrations (Lemon Race, Target Shooting, Musical Chairs, Human Knot, Cup and Balloon Pyramid Challenge, Balloon Dual Race) and UI icons are embedded directly in the markup to ensure:
   - Zero external dependency failures or broken image links.
   - Ultra-fast load times and crisp scaling across Retina and mobile displays.
   - Accessible color styling matching the CSS custom property design system (`var(--color-primary)`, `var(--color-secondary)`, `var(--color-accent-coral)`, etc.).
2. **CSS Procedural Decorations**: Confetti sprinkles, gradient orbs, and glassmorphism backdrops are created purely via modern CSS3 for optimal performance and smooth 60fps animations.
3. **Data-Driven Rules**: All game data is modularized in `js/games-data.js` with draft/provisional status flags (`"Pending Organizer Approval"`).

## Upcoming Assets (Phase 3: Registration & Student Flow)
- Official SRMU logo vector asset
- High-resolution campus map marker for Building B5-408
- Game rule infographics & downloadable reference cards
- Department & sponsor banners
