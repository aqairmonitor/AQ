# AQ Air — Current Website Specification

A description of the site **as it is implemented today**, taken from `index.html`, `style.css` and `script.js`. Nothing here is a recommendation. Where the code contains dead or inconsistent parts, they are listed in [§ 17](#17-known-quirks-and-dead-code) rather than silently corrected.

- **Files:** `index.html` (single page), `style.css` (~8,100 lines, no preprocessor), `script.js` (one IIFE, no framework).
- **External dependencies:** Google Fonts (Inter, Manrope) and Lenis 1.3.26 from jsDelivr (smooth scroll). **No GSAP / ScrollTrigger.** Every pin, scrub and horizontal move is native `position: sticky` plus hand-written scroll math.
- **Breakpoint vocabulary used below:**

| Name | Width | Notes |
|---|---|---|
| Large desktop | ≥ 1441px | |
| Desktop / laptop | 1201–1440px | The "wide layout". All pinned desktop choreography runs at ≥ 1201px |
| Short laptop | ≥ 1201px **and** height ≤ 820px | Vertical rhythm tightens |
| Tablet | 768–1200px | Stacked layouts. Sub-steps at 1080px and 1023px |
| Large phone | 481–767px | |
| Phone | ≤ 640px | |
| Small phone | ≤ 480px | |
| Landscape phone | ≤ 1200px, height ≤ 520px, landscape | |

Other thresholds that matter: **1240px** (hero cards switch to a grid), **1080px** (Why AQ Air and readings restack), **1023px** (footer and product tiles).

---

## Contents

1. [Visual direction](#1-visual-direction)
2. [Design tokens: colour, type, easing, glass](#2-design-tokens)
3. [Global behaviour: loading, smooth scroll, reveals, layering](#3-global-behaviour)
4. [Preloader](#4-preloader)
5. [Navigation](#5-navigation)
6. [Hero](#6-hero)
7. [Live readings (counter band)](#7-live-readings-counter-band)
8. [Product section](#8-product-section)
9. [The product flight (desktop only)](#9-the-product-flight-desktop-only)
10. [Trust section](#10-trust-section)
11. [Why AQ Air](#11-why-aq-air)
12. [How AQ Air Works + scroll-controlled video](#12-how-aq-air-works)
13. [Contact](#13-contact)
14. [Footer](#14-footer)
15. [Floating elements: WhatsApp, back-to-top](#15-floating-elements)
16. [Responsive summary by breakpoint](#16-responsive-summary-by-breakpoint)
17. [Known quirks and dead code](#17-known-quirks-and-dead-code)
18. [Mobile scrolling performance](#18-mobile-scrolling-performance)
19. [Media inventory](#19-media-inventory)

---

## 1. Visual direction

- **Mood:** calm, premium "health-tech / smart home". The page is one continuous surface. It starts in Deep Air Blue and dark photography, turns light (white/ice) for Why AQ Air and How It Works, and returns to Deep Air Blue for Contact and the footer.
- **Seams:** there are almost no hard section boundaries. Each join is a colour that continues across the boundary: gradient ramps, masks, and negative-margin "pulls" where one section's background reaches up under the previous one. Contact is the one deliberately straight join.
- **Atmosphere layers:** most dark sections carry a decorative, `aria-hidden` layer:
  - soft radial "blooms"
  - drifting "motes" (2–3px dots rising slowly)
  - thin animated SVG "flow" lines with a moving dash
  - hairline rings

  All are gradients or transforms, masked top and bottom so they never touch a seam.
- **Glass:** floating cards are thin translucent panels with hairline borders and soft shadows. Several use `backdrop-filter`; most deliberately do not, for performance.
- **Motion philosophy:**
  - almost everything is either **scroll-scrubbed** (position = scroll) or a **one-shot reveal** triggered by IntersectionObserver
  - looping ambient animations are slow (7–40s) and small in amplitude
  - off-screen sections have their animations paused

## 2. Design tokens

### 2.1 Colour (`:root`)

| Token | Value | Used for |
|---|---|---|
| `--deep` / `--deep-air-blue` | `#16324F` | Brand dark. Hero landing, readings band, airband start, Contact ground, light-section text, CTA text on light buttons |
| `--deep-800` | `#102640` | Contact → footer handoff, nav panel/stuck bar (`rgba(16,38,64,…)`) |
| `--deep-900` | `#0B1C2F` | Body background, airband end, hero gradient end |
| `--glacier` / `--glacier-blue` | `#B9D9E1` | Accents on dark: eyebrows, links, pins, sparklines, button gradient end, meter bars |
| `--ice` / `--ice-blue` | `#D6EBF3` | Light text on dark, preloader ground, button gradients, How It Works text |
| `--platinum` | `#DADEE1` | Declared; practically unused |
| `--white` | `#FFFFFF` | Headings on dark, light sections' ground |
| `--turquoise` | `#447F98` | Light-section accents: Why AQ Air eyebrow, benefit icons, focus rings, AI chip gradient |
| `--slate` | `#629BB5` | Mid-tone: motes, gradients, AI meter |
| `--on-dark-72` | `rgba(214,235,243,.76)` | Body copy on dark |
| `--on-dark-52` | `rgba(185,217,225,.4)` | Tertiary copy on dark (footer copyright) |
| `--ink-70` / `--ink-50` | `rgba(22,50,79,.70/.50)` | Body copy on light sections |
| WhatsApp green | `#25D366` | The only off-palette colour, used deliberately |

Other one-off hexes appear inside long, densely sampled gradients (Oklab-sampled ramps in Contact and the footer; the airband ramp `#1A3A5C → #0B1C2F`).

### 2.2 Typography

- **Fonts** (Google Fonts, `display=swap`):
  - `--font-display` is **Manrope** 600/700/800, used for every heading, number, card title and brand name
  - `--font-body` is **Inter** 400/500/600/700, used for body, labels, inputs and buttons
- Both have system fallbacks: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Antialiasing is set to grayscale on the body.

| Role | Family / weight | Size (desktop → clamp) | Line height | Tracking |
|---|---|---|---|---|
| Hero H1 | Manrope 800 | `clamp(2.4rem, 3.8vw, 3.45rem)` | 1.06 | −.035em, `text-wrap: balance`, shadow `0 2px 30px rgba(7,20,34,.5)` |
| Hero accent line | same, gradient text Glacier→Ice→Glacier (96°), `display: block` | | | |
| Section H2 (product) | Manrope 800 | `clamp(2.4rem, 3.8vw, 3.45rem)` | 1.06 | −.035em |
| Section H2 (why / how / contact) | Manrope 800 | `clamp(2.1rem, 3.5vw, 3.15rem)` | 1.08 | −.035em |
| Trust H2 | Manrope 800 | `clamp(2rem, 3.4vw, 3.1rem)` | 1.12 | −.024em |
| Lead paragraphs | Inter 400 | `clamp(1rem, 1.1vw, 1.08rem)` | 1.7–1.75 | |
| Eyebrows | Inter 700, uppercase | .82rem | | .16em |
| Card labels (hero readings) | Inter 600, uppercase | .62rem | | .12em |
| Card values | Manrope 700 | .95rem | | −.01em |
| Buttons | Inter 600 | .96rem | | |
| Counter numbers | Manrope 700, gradient text | `clamp(2rem, 4.2vw, 3rem)` | 1 | −.02em |

Responsive title overrides (applied late in the sheet, so they win):

| Width | Product / Trust / Why / How / Contact H2 | Hero H1 |
|---|---|---|
| ≤ 1200px | `clamp(1.9rem, 4.3vw, 2.35rem)` | unchanged |
| ≤ 640px | `clamp(1.6rem, 7vw, 1.95rem)`, margin-bottom .85rem | `clamp(1.9rem, 8.4vw, 2.2rem)` |

At ≤ 640px, leads drop to `.95rem / 1.6`.

### 2.3 Layout primitives

- **Shell:** `--shell: min(1300px, 100% - 4rem)`. It becomes `100% - 2.5rem` at ≤ 1200px and `100% - 1.5rem` at ≤ 640px. Every section's inner uses it.
- **Easing:**
  - `--ease: cubic-bezier(.22,.61,.36,1)` (general)
  - `--ease-premium: cubic-bezier(.22,1,.36,1)` (buttons)
  - `--pre-ease: cubic-bezier(.22,1,.36,1)` (preloader)
  - Scroll scrubs use JS smoothstep / smootherstep instead of CSS easing.
- **Shared glass tokens** (used by back-to-top):
  - `--glass: linear-gradient(150deg, rgba(255,255,255,.19), rgba(255,255,255,.07))`
  - `--glass-br: 1px solid rgba(214,235,243,.30)`
  - `--glass-sh: inset 0 1px 0 rgba(255,255,255,.26), 0 26px 50px -26px rgba(6,20,34,.85)`
- **Focus:** `2px solid var(--turquoise)`, offset 3px. It is Ice on dark sections (hero, contact, footer).
- **Overflow:** `html { overflow-x: clip }` and `.airdata { overflow-x: clip }` stop horizontal page scroll. Pinned sections use `overflow: clip`, never `hidden`, so `position: sticky` keeps working.

### 2.4 Buttons

| Class | Look | Hover (pointer: fine only) |
|---|---|---|
| `.btn` base | pill, `padding: 1rem 1.85rem`, radius 999px, Inter 600 .96rem, `gap .6rem`, transitions .28s `--ease-premium` | |
| `.btn--primary` | gradient `135deg White → Ice 46% → Glacier`, Deep text, inset white top highlight plus two soft shadows | `translateY(-3px) scale(1.015)`, whiter gradient, bigger shadow; arrow `translateX(3px)`. Active: `translateY(-1px) scale(1.004)`, .12s |
| `.btn--ghost` | transparent, `1px solid rgba(214,235,243,.45)`, Ice text; play-icon circle | same lift, bg `rgba(214,235,243,.07)`, border .78, white text; icon `translateX(3px)` |
| `.btn--solid` (Trust CTA) | same gradient as primary | `translateY(-2px)`, arrow +3px |
| `.btn--outline` | `rgba(255,255,255,.06)`, border Glacier .34 | bg Glacier .16 |

## 3. Global behaviour

### 3.1 Page load

1. An inline `<head>` script adds `html.pre-on` (shows the preloader and locks scroll) and `html.js`. It sets `history.scrollRestoration = 'manual'`, strips any `#hash` from the URL, and forces `scrollTo(0,0)` again on `load`. **Every reload starts at the hero.**
2. A 3.6s safety timer removes the preloader even if `script.js` never loads.
3. `script.js` (deferred) runs the preloader bar, then adds `body.is-loaded`. That class starts the hero entrance (`preHero`: opacity 0 → 1, `translateY(14px)` → 0, .95s; the stage is delayed .1s).

### 3.2 Smooth scroll (Lenis)

- Created only if the library loaded and reduced motion is off.
- Options: `duration: 1.4`, `smoothWheel: true`, `wheelMultiplier: 0.75`, `touchMultiplier: 1`, **`syncTouch: false`** (touch scrolling stays native).
- `virtualScroll` is routed through an optional `scrollGate` (see § 11.6).
- One global rAF loop calls `lenis.raf(t)` and then every registered frame hook (the How It Works film spring and the Why AQ Air tilt/cursor). **The loop runs every frame for the life of the page.**
- CSS: `html.lenis` sets `scroll-behavior: auto`, which cancels the native `scroll-behavior: smooth`.

### 3.3 Scroll reveals (`[data-reveal]`)

- One IntersectionObserver: `threshold .15`, `rootMargin 0 0 -10% 0`. It adds `.is-in` once and then unobserves.
- The hide-then-reveal CSS is armed only once `body.js-reveal` exists. Without JS, or with reduced motion, everything is simply visible.
- Stagger comes from inline `style="--d:…ms"` on each element.

| Section | Hidden state | Duration |
|---|---|---|
| Product, Trust, Contact | `opacity 0, translateY(22px), blur(9px)` | 1.1s `--ease`, delay `--d` |
| Why AQ Air | `opacity 0, translateY(20px), blur(8px)` | 1.1s |
| Footer | `opacity 0, translateY(18px)` (no blur) | 1s |

### 3.4 Idle parking

An IntersectionObserver (`rootMargin 150px`) toggles `.is-idle` on:

`.hero, .airdata, .product, .assure, .whyaq, .howto, .contact, .foot`

`.is-idle *` sets `animation-play-state: paused`. Looping CSS animations only run near the viewport.

### 3.5 Reduced motion

- Lenis is off.
- The preloader shortens to a 400ms floor and 900ms ceiling.
- The hero film holds its first frame.
- Reveals are shown immediately.
- The flight, the trust scrub, the How It Works pin scrub and the film scrub don't run.
- The How It Works film is hidden (`display: none`).
- Most looping animations are set to `none`.
- Card and trust transforms are reset.

### 3.6 Stacking (z-index)

| Layer | z-index |
|---|---|
| Preloader `.pre` (fixed) | 999 |
| Nav `.nav` (sticky) | 40 |
| WhatsApp `.wa`, back-to-top `.totop` (fixed) | 35 |
| Flying product `.showcase__device.is-flying` (fixed, desktop) | 30 |
| `.airband`, `.product` | 2 |
| `.airdata`, `.assure`, `.whyaq`, `.howto`, `.contact`, `.foot` | 1 (tie broken by source order, so a later section's pulled-up background covers the previous one) |
| Section atmosphere layers | −1 / −2 inside each section's own `isolation: isolate` context |

## 4. Preloader

- **Markup:** `#preloader.pre`, containing five drifting motes, the brand mark (circle plus two "air" strokes) with "AQ**Air**", and a 2px progress bar.
- **Look:**
  - full-screen, fixed, Ice `#D6EBF3` ground with a white radial highlight
  - mark and "Air" in Turquoise, "AQ" in Deep, name Manrope 800 `clamp(1.5rem, 2.6vw, 1.95rem)`
  - bar `clamp(150px, 20vw, 210px)` wide, track Deep at .11, fill gradient Slate → Deep
- **Animation:**
  - core and bar enter with `preIn` (.9s, 10px rise; the bar is delayed .12s)
  - the core then "breathes" (`scale 1 → 1.028`, 3.6s loop)
  - motes drift inward (`preMote`, 5.4–6.6s)
- **Progress (JS rAF):**
  - creeps asymptotically to 90% (`.9·(1 − 2^(−t/420))`)
  - once the page has loaded **and** 1.5s has passed (or 2.6s regardless), runs to 100% over 380ms with an ease-out cubic
- **Exit:**
  - adds `.is-out`: `opacity 0, scale(1.035)`, over .62s / .72s
  - adds `body.is-loaded` at the same moment
  - after 740ms, scrolls to top again, removes `html.pre-on` (unlocking scroll) and removes the node
- **Timing:** typical total is ~1.6–2.0s; the cap is ~3.3s.

## 5. Navigation

- **Structure:** `header.nav > .nav__bar` holds `.brand` (mark plus "AQ**Air**"), `nav.nav__links` (Product, Technology, Air Science, Support, all `href="#"`), `.nav__cta` "Get AQ Air" (`#`) and `.nav__toggle` (hamburger, hidden on desktop).
- **Position:** `position: sticky` inside the hero.
  - `top: clamp(.9rem, 2vw, 1.5rem)`, same top margin, width `--shell`, centred
  - Because it is sticky inside `.hero`, it scrolls away with the hero. It is not fixed for the whole page.
- **Bar:**
  - pill (radius 999px), `padding .55rem .55rem .55rem 1.15rem`, `gap 1.5rem`
  - background `rgba(255,255,255,.06)`, border `rgba(185,217,225,.34)`, `backdrop-filter: blur(10px)`
- **Brand:** mark 34×34, radius 11px, Ice→Glacier gradient, Deep glyph 20px. Name Manrope 800 1.14rem; "Air" Glacier 600.
- **Links:**
  - `.6rem 1.1rem` padding, pill, Inter 500 .9rem, colour `--on-dark-72`, `gap .25rem`, centred with `margin: 0 auto`
  - hover: Glacier pill background with Deep text (.25s)
- **CTA:**
  - `.72rem 1.5rem`, Inter 600 .89rem, Glacier background, Deep text, glow shadow
  - hover: Ice background, `translateY(-1px)`
- **Stuck state:** JS adds `.nav.is-stuck` once `scrollY > 24`. The bar becomes `rgba(16,38,64,.58)`, border .42, `blur(18px) saturate(140%)`, shadow. The transition is .4s.
- **≤ 1200px (mobile menu):**
  - links leave the bar; the toggle (42px circle, glass, 17px three-line burger that folds into a ×) appears; the CTA is pushed right
  - the links become a **dropdown panel**: absolute, `top: 100% + .55rem`, full bar width, radius 22px, `rgba(16,38,64,.97)` (`.86` where backdrop-filter is supported), `blur(14px)`
  - panel enter/exit: `opacity`, `translateY(-8px)` and `visibility`, .28s
  - panel links are full-width rows, `.85rem 1rem`, radius 15px, Ice text
  - the panel closes on a link click, Escape (focus returns to the toggle), an outside click, or resizing above 1200px
  - the toggle's `aria-expanded` and label ("Open menu" / "Close menu") stay in sync
  - landscape phone: panel `max-height: 62svh; overflow-y: auto`
- **≤ 640px:** bar padding `.5rem .5rem .5rem .9rem`, name 1rem, CTA `.65rem 1.15rem` .84rem, toggle 40px.
- **≤ 480px:** bar gap .5rem, mark 30px, name .95rem, CTA `.6rem .95rem` .79rem, toggle 36px, burger 15px.

## 6. Hero

### 6.1 Structure

```
.herostack                       min-height 100svh, flex column, bg Deep
  .hero                          flex:1, overflow hidden, gradient bg
    .room.has-photo.has-video    absolute inset 0, z -1  (background)
      video#hero-video.room__video   assets/video/hero.mp4
      .room__grade, (wall/window/frame/rays/plants/floor: hidden with has-photo)
      svg.room__air   (4 animated "ribbons")
      svg.room__dust  (10 specks)
      .room__scrim, .room__grain, .room__vignette
    header.nav
    main.hero__inner             grid: copy | stage
      .hero__copy   (H1, paragraph, two buttons)
      .hero__stage > .stage > 6 × article.fcard
```

`.herostack` is followed directly by `.airdata`, the counter band (§ 7).

### 6.2 Background video

- **Element:** `hero.mp4` (≈29 MB), with `autoplay muted loop playsinline preload="auto" disablepictureinpicture`.
  - If the file fails to load, `onerror` removes the element and the `has-photo` / `has-video` classes, and a vector "room" illustration renders instead.
- **Sizing:**
  - `inset: 0; width: 100%; height: 100%; object-fit: cover`, so it is never stretched
  - background `--deep-900` until the first frame
- **`object-position`:**

  | Width | Value |
  |---|---|
  | Desktop | `50% 50%` |
  | ≤ 1200px | `70% 50%` |
  | ≤ 640px | `68% 50%` |

  The tablet and phone values keep the family in the video in frame.
- **Fade-in:** with `html.js` it starts at `opacity 0` and fades to 1 over .7s once `loadeddata` / `canplay` fires (`.is-ready`).
- **Playback control (JS):**
  - plays only while the hero is within 200px of the viewport **and** the tab is visible; otherwise it pauses
  - reduced motion removes autoplay and holds the first frame
- **Layers over the video (desktop):**
  - `.room__grade`: flat gradient tint, `rgba(22,50,79,.30)` at left fading to `rgba(68,127,152,.12)` at right, no blend mode
  - `.room__scrim`: horizontal readability gradient, `rgba(9,24,40,.78)` at 0%, `.66` at 24%, `.42` at 40%, `.18` at 54%, `.05` at 68%, 0 at 80%
  - `.room__vignette`: radial, 0 inside 58% and `.30` at the corners
  - `.room__air` ribbons: opacity .8; a blurred double plus four thin gradient strokes animating `stroke-dashoffset` over 20–29s
  - dust specks: 10 dots, `drift` 13–24s, ±22/−34px
  - grain: hidden when video is present
- **≤ 1200px:** the scrim turns vertical: `.76` at the top (behind the copy), easing to `.14` at 64%, then `.44` at the bottom.
- **Bottom landing:**
  - `.room::after`: the bottom 40% ramps to solid Deep by 72% of that band
  - `.hero::after`: a separate ramp `clamp(200px, 32%, 460px)` tall, ending in solid `#16324F`
  - together they make the hero dissolve into the readings band's identical `#16324F`
  - `.hero` background (behind the video): `linear-gradient(168deg, #1E4368, Deep 40%, #102640 74%, #0B1C2F)`

### 6.3 Copy

- **Grid:** `.hero__inner` is `grid-template-columns: 1.1fr 1fr`, `gap clamp(2rem, 4vw, 4.5rem)`, `padding-top clamp(2rem, 5vw, 4rem)`, items centred vertically, width `--shell`.
- `.hero__copy` has `max-width: 38rem`.
- **H1:** "Know the Air You Breathe." plus a block-level accent span "Protect What Matters." (gradient text). Margin-bottom 1.35rem.
- **Paragraph:** "AQ Air continuously monitors the air around you, detects abnormal air-quality conditions, and uses AI to help you understand what is happening—so you can take action when it matters." Max-width 31rem, `clamp(1rem, 1.1vw, 1.08rem)`, line-height 1.7, colour `--on-dark-72`, margin-bottom 2.25rem.
- **Actions:** flex, wrap, `gap .85rem`.
  - "Discover AQ Air →" (`.btn--primary`)
  - "▷ How It Works" (`.btn--ghost`, with a play icon in a circle)
  - Both `href="#"`.

### 6.4 Sensor cards (`.fcard`, six)

**Content:**

| Card | Icon | Label | Value | Extra |
|---|---|---|---|---|
| `fcard--aq` (near) | two air strokes | Air Quality | Good | sparkline 46×20 |
| `fcard--co2` (mid) | two circles | CO₂ | Normal | breathing dot |
| `fcard--pm` (mid) | particle dots | PM2.5 | Low | 5-bar meter (2 lit) |
| `fcard--voc` (far) | droplet + line | VOC | 0.3 | |
| `fcard--gas` (near) | flame | Gas | Safe | breathing dot |
| `fcard--temp` (mid) | thermometer | Temperature | 24°C | |

**Look (final, after late `!important` overrides):**

- background `rgba(22,50,79,.42)`, border `1px solid rgba(22,50,79,.62)`, **no backdrop-filter**, sheen pseudo-element removed
- padding `.6rem .8rem`, radius 15px, `gap .6rem`, shadow `0 8px 32px rgba(22,50,79,.14)` plus inset top highlight, top-edge 1px reflection line
- icon chip 30×30, radius 9px, Ice→Glacier gradient, Deep glyph 17px
- label .62rem uppercase .12em; value Manrope 700 .95rem; both forced to `#D6EBF3`
- hover (pointer devices): background .52, border .78, `translate: 0 -3px` (.35s)

**Depth tiers:**

| Tier | Scale | z-index | Opacity |
|---|---|---|---|
| near | 1.02 | 6 | 1 |
| mid | .94 | 5 | .97 |
| far | .84 | 3 | .9, lighter shadow |

Each card also has a slight tilt `--r` (−2° to +1.6°).

**Float:** `bob` keyframes, `translateY(0 ↔ −6px)` with the scale and tilt preserved. Durations 9s / 10.4s / 11.7s / 9.8s / 12.3s / 11.1s, with negative delays so the cards never sync.

**Desktop placement (≥ 1201px):** `.stage` becomes `position: static`, so the cards are positioned against the **whole hero**:

| Card | top | horizontal |
|---|---|---|
| AQ | 12% + 18px | left 49% |
| VOC | 39% | left 46.5% |
| CO₂ | 15% | right 6% |
| PM2.5 | 66% | left 44% |
| Gas | 80% − 30px | right 5% |
| Temp | 42% | right 3% |

- **≥ 1441px:** CO₂, Gas and Temp use `right: max(6% / 5% / 3%, 50% − 660/680/700px)` so they stay near the content on ultra-wide screens.
- **1201–1440px:** cards are tighter (padding `.54rem .72rem`, value .9rem, spark 40px) and the PM2.5 meter is hidden.

**Stage box** (desktop, invisible): `height: clamp(320px, min(62vh, 100svh − 400px), 640px)`, `aspect-ratio 5/6`. It only sets the composition's minimum height.

**≤ 1240px (grid mode):**

- `.hero__stage .stage` becomes a grid of **3 equal columns**, `grid-auto-rows: 1fr`, `gap .75rem`, `max-width 42rem`, centred under the copy
- cards turn static: `position: relative`, no scale/tilt/animation/transform, opacity 1, labels `nowrap`
- order: AQ, CO₂, VOC, PM2.5, Gas, Temp
- ≤ 640px: **2 columns**, `max-width 28rem`, `gap .6rem`, card padding `.5rem .6rem`
- all six cards stay visible at every width

**Other sizes:**

- 768–1023px: padding `.56rem .74rem`, value .9rem
- ≤ 640px: icon 26px, label .56rem (later .6rem at ≤ 767px), value .84rem, meter hidden
- ≤ 480px: padding `.46rem .58rem`, radius 12px, icon 24px, value .8rem, label .55rem

### 6.5 Hero responsive layout

- **≤ 1200px:** `.herostack` stops asking for 100svh (`min-height: 0; display: block`). The grid becomes one column (copy above cards), `gap clamp(2.5rem, 6vw, 4rem)`, padding-top `clamp(2.5rem, 7vw, 4rem)`. The ghost button gets a Deep wash `rgba(22,50,79,.46)` with border .72 for legibility over the video.
- **≤ 767px:**
  - the buttons sit **side by side**, centred, `nowrap`, `gap .6rem`, padding `.8rem 1.15rem`, .88rem, icons 16–17px
  - the primary button gets a transparent 1px border so both buttons are the same height
  - hero-inner gap `clamp(2rem, 7vw, 3rem)`
- **≤ 640px:** H1 `clamp(1.9rem, 8.4vw, 2.2rem)` with −.03em tracking; paragraph .95rem / 1.6, margin-bottom 1.4rem.
- **≤ 480px:** buttons `.72rem .85rem`, .8rem, icons 14–15px, gap .45rem.
- **Landscape phone:** two columns come back (copy | cards); H1 `clamp(1.6rem, 4.4vw, 2.2rem)`; paragraph .92rem; stage `min(300px, 100%)` square.

## 7. Live readings (counter band)

- **Section:** `section.airdata#air-data`, directly below `.hero` inside `.herostack`.
  - background solid `#16324F`, the same value the hero lands on, so there is no visible seam
  - padding `--read-gap clamp(2.75rem, 5vw, 4rem)` top, `--read-hem clamp(2rem, 3.5vw, 3rem)` bottom
- **Atmosphere:** three `airwave` radial blooms (`airDrift` 26/34/30s, ±2.5% translate, scale 1 → 1.08) and 14 motes (`moteRise` 24–38s, drifting up 56–118px). The layer is masked to the middle 38–76% of the height.
- **Grid:** 4 equal columns, `column-gap clamp(1.5rem, 3.4vw, 3.25rem)`, centred text.

| Value | Label |
|---|---|
| **5** (`data-to=5`) | SMART SENSORS |
| **24/7** (`data-to=24`, suffix `/7`) | CONTINUOUS AIR MONITORING |
| **5+** | AIR PARAMETERS TRACKED |
| **Real-Time** (word) | INTELLIGENT ALERTS |

- **Node anatomy:** gradient number (Glacier→Ice→White→Glacier), then a 2.5rem "link" row containing:
  - a hairline track (Glacier .16) spanning column plus gap, with fade masks at the outer ends
  - a beam that scales across it
  - a spark (5px white dot with glow)
  - a stem that drops
  - a 7px pin that pulses when live (`pinPulse` 3.2s)

  Then the label (Inter 600 `clamp(.7rem, .95vw, .78rem)`, uppercase .13em, `--on-dark-72`).
- **Animation (JS, one-shot):**
  - waits for `body.is-loaded` (after the preloader), then for 30% visibility
  - one rAF loop: the beam crosses each node in **560ms**, staggered 560ms apart
  - at the halfway point the node goes `.is-live`: number fades from `.22` to 1, un-blurs from 6px and rises from 10px over .8s; the stem grows; the pin lights
  - numbers count up over **850ms** with easeOutExpo
  - the "Real-Time" word gets a halo burst (1.9s) and a letter-spacing squeeze (.1em → −.005em, 1.4s)
  - total ≈ 3.5s, then the loop stops
- **Responsive:**
  - stays 4 columns at every width, only shrinking
  - ≤ 1080px: number `clamp(1.5rem, 4vw, 2.4rem)`, label `clamp(.58rem, 1.5vw, .72rem)`
  - ≤ 640px: number `clamp(1rem, 4.8vw, 1.6rem)`, label `clamp(.5rem, 2.1vw, .62rem)`, col-gap `clamp(.4rem, 2vw, .9rem)`
  - ≤ 480px: number `clamp(.92rem, 4.4vw, 1.2rem)`, label `clamp(.54rem, 2.3vw, .62rem)`, col-gap .35rem
  - padding shrinks at ≤ 767px, on short laptops and on landscape phones

## 8. Product section

### 8.1 Wrapper (`.airband`)

- min-height 100svh, flex column, `z-index 2`
- background ramp `#16324F → #1A3A5C → … → #102640 (70%) → #0B1C2F`
- `::before` adds two very faint Glacier radial lights, rising `--join-rise` (`clamp(140px, 15vw, 230px)`) above the band
- `::after` closes the bottom 300px on Deep, the tone Trust opens on

### 8.2 `section.product#product-showcase`

- **Padding:** `--band-gap clamp(2.75rem, 5vw, 4rem)` top, `clamp(4rem, 8vw, 7rem)` bottom. Section `overflow: hidden`.
- **Blooms:** three radial washes with 14–20px blur, masked top and bottom.
- **Grid:** `.product__inner`, `1.05fr | 1.15fr`, `gap clamp(2rem, 4vw, 4.5rem)`, centred.

**Left column (`.phead`, max-width 38rem):**

- H2 "One Device. A Clearer Understanding of Your Air." (white, Manrope 800)
- lead "Five sensors in a single unit, read continuously and turned into plain language you can act on." (`--on-dark-72`)
- `.connect` block:
  - label "STAY CLOSE, EVEN WHEN YOU'RE AWAY" (.82rem, 700, uppercase .16em, Glacier)
  - note "Monitor your air and receive important alerts from your phone—even when you're away from the room." (.88rem)

**Right column (`.showcase`, the stage):** relative, `height: clamp(420px, 66vh, 640px)` (`clamp(360px, 62vh, 640px)` on short laptops).

- **Glow:** `.showcase__glow`, a radial Ice glow behind the device (blur 10px). It references a `halo` animation that has no keyframes, so it is static (§ 17).
- **Flow:** `svg.showcase__flow`, three dashed flow lines (`flow` 22/27/24s).
- **Device:**
  - `.showcase__device`: absolute, centred at `left 50% / top 40%`, width 36%, z 5
  - an inline SVG render (viewBox 530×525) with drop shadows, an ellipse contact shadow and a reflection below
  - scroll "settle": JS writes `--drift` = −16px…+16px depending on the device's distance from the viewport centre, applied via `translate`
- **Five sensor cards (`.scard`):**
  - transparent, `border 1px solid rgba(185,217,225,.42)`, inset highlight plus deep shadow, radius 18px, `padding .72rem .95rem`
  - icon chip 34px (Ice→Glacier, Deep glyph); name Manrope 700 `clamp(.84rem, .95vw, .94rem)` white; description `clamp(.62rem, .72vw, .68rem)`

  | Card | Position | Width | Description |
  |---|---|---|---|
  | CO₂ | left −6%, top 4% | 35% | "Ventilation awareness" |
  | PM2.5 | left −6%, top 24% | 35% | "Fine particle monitoring" |
  | VOC | left −6%, top 44% | 35% | "Indoor pollutant awareness" |
  | Gas | right −6%, top 2% | 35% | "Abnormal gas detection" |
  | Temperature & Humidity | right −6%, top 21% | 35% | "Indoor environment monitoring" |

- **AI Air Insight card (`.aicard`):**
  - absolute, left −6%, bottom 0, width 50%, radius 24px, padding `1rem 1.15rem 1.1rem`, same transparent glass
  - head: 26px chip (Turquoise→Slate gradient, Ice sparkle icon) plus "AI AIR INSIGHT" (.7rem uppercase .16em Glacier)
  - state "Air Needs Attention" (Manrope 800 1.12rem)
  - note "CO₂ levels are elevated. The room may need better ventilation." (.78rem)
  - 5px meter track with a Turquoise→Slate fill at 68%, animated once (`fill` 2.6s, delay .8s, from `scaleX(.088)`)
- **Living Room phone (`.phone`):**
  - absolute, right 1%, bottom 0, width `clamp(120px, min(23.6%, 20vh), 186px)`
  - sized in container-query units (`cqi`)
  - transparent glass frame (radius 15.5cqi, side-button ticks, notch), screen `aspect-ratio 9/19`
  - content: "Living Room"; a status pill with a spinning Glacier ring (`spin` 9s) plus "AIR QUALITY / Good"; a list CO₂ 612, PM2.5 6, VOC 0.3, Gas Safe; a home-indicator bar
- **Cursor parallax (JS, desktop hover):** the pointer position sets `--px` / `--py` (−.5….5). Each card translates by these times its `--depth`: 10–24px (cards), 12px (AI card), 10px (phone). Reset on leave.
- **Reveal:** every item has `[data-reveal]` with a stagger of 0–400ms.

**Chain (`ol.chain`)**, centred under the grid, `margin-top clamp(1.5rem, 3vw, 2.5rem)`:

- **Sensors Detect → AI Understands → AQ Air Alerts**
- 44px icon chips (glass; the AI one is an Ice→Glacier solid)
- connectors are 1px gradient lines `clamp(40px, 7vw, 110px)` wide with 1.2rem margins
- text Manrope 700 1rem white
- reveals stagger 0 / 120 / 240ms

### 8.3 Product responsive

- **≤ 1200px:**
  - `.product__inner` stacks (header on top); `.airband` `min-height: 0`
  - `.showcase` becomes a 6-track grid (`column-gap .6rem`, `row-gap .75rem`):
    - row 1: device, full width, `width min(230px, 54%)`, centred
    - row 2: CO₂, VOC, PM2.5 (2 tracks each)
    - row 3: Temp & Humidity, Gas (tracks 2–3 and 4–5, centred)
    - row 4: AI card, full width
  - the phone is removed (`display: none`); glow and flow lines are hidden
- **≤ 1023px:** sensor cards become **vertical tiles** (icon over name over description, centred): padding `.72rem .5rem .8rem`, name .78rem, description .58rem, icon 30px. Gaps `.45rem / .6rem`.
- **≤ 767px:** band gap `clamp(2.25rem, 8vw, 3rem)`; section padding bottom `clamp(3.25rem, 9vw, 5rem)`; description .64rem.
- **≤ 640px:**
  - section padding `2rem 0 2.5rem`, lead margin 1.25rem
  - chain connectors hidden (steps wrap with `gap 1rem 1.4rem`)
  - card padding `.8rem .9rem`; AI card padding `1.15rem 1.2rem 1.3rem`
- **≤ 480px:** device `min(190px, 62%)`, card padding `.7rem .78rem`, icon 30px, chain icons 40px, text .92rem.

## 9. The product flight (desktop only)

At **≥ 1201px** with motion allowed, the product SVG from § 8 is the **same element** throughout the page.

- **Mechanics:**
  - JS adds `.is-flying`: `position: fixed; left 0; top 0; z-index 30`
  - positioning uses `translate(--fx, --fy)` and `scale(--fs)`, recomputed on each scroll/resize frame from three live rects:
    1. **Home:** `.showcase__slot`, an invisible box with the device's original geometry
    2. **Trust dock:** `#trust-mark`, absolute in the pinned trust stage at `left 14.2% / top 34.5% / width 24.5%`, aspect 530:525
    3. **Why dock:** `#why-mark`, the empty centre of the Why AQ Air orbit
- **Leg 1 (Product → Trust):**
  - progress `t` runs from the product section's bottom reaching the viewport bottom until the trust stage sits at 56% of viewport height
  - eased with smoothstep
  - `.reel.is-landed` is added at `t > .985`
- **Leg 2 (Trust → Why):**
  - `g` runs from the why-mark sitting ~1.85 viewport heights below its final position (52% of the viewport) to arriving there
  - eased with smootherstep
  - the trust dock is "held" (its rect is corrected for the unpinning) so there is no jump when the pin releases
- **Styling during flight:** the drop-shadow darkness, contact shadow and reflection fade out as `--lit` (= `g`) rises, as the device enters the light section.
- **Trigger for Why AQ Air:** at `g > .82` the section gets `.is-settled` (latched), which releases the six benefit cards (§ 11.5).
- **Scope:** below 1201px, or with reduced motion, the flight is disabled. The device stays in the product grid, and Why AQ Air shows its own vector device.

## 10. Trust section

`section.assure#trust` — "One Device. Protection for Every Space."

### 10.1 Background

- **Image:** full-bleed photograph `assets/image/bg.png` (1555×1012), `center / cover`, painted on `::after`. Nothing is laid over it.
- **≤ 767px:** swaps to the portrait render `newresponsive.png` (1024×1535, with the product already on a pedestal), `background-position: 38% center`.
- **Fallback:** a ramp `--assure-ground` (Deep → … → `#93B6CB`) shows only if the image fails.
- **Top join:** `::before` is a 260px Deep veil that thins in seven stops, so the photo rises out of the airband above.
- **When pinned:** the image moves onto `.assure__ground`, a sticky 100svh layer with `margin-bottom: −100svh`, so the background stays still while the stage is held.

### 10.2 Content

- **Left column:** `.reel__dock`, an invisible box that holds the column open (`--dock-w: 372px`, aspect 530:525). On desktop the flying product lands over it.
- **Right column:** one grid cell holding four layered items:
  1. `.reel__copy`:
     - H2 "One Device. Protection for Every Space."
     - paragraph "AQ Air stays with the spaces that matter most—from the rooms where your family rests to the places you work, cook, and travel. Continuous monitoring helps you stay aware of the air around you, wherever life happens." (max 33rem, `clamp(1.02rem, 1.15vw, 1.15rem)`, lh 1.72)
     - **"Get AQ Air →"** (`.btn--solid`), margin-top `clamp(1.5rem, 2.8vw, 2.1rem)`; ≤ 1200px: `clamp(2rem, 6vw, 2.75rem)`
  2. Three `figure.reel__shot`, each with an image and a caption:

     | # | Image | Title | Line |
     |---|---|---|---|
     | 1 | `spaces/img1.webp` (fallback `img1.png`, 1672×941) | Where Your Family Breathes | Reading the air your family shares, through the day and all through the night. |
     | 2 | `spaces/img2.png` (1536×1024) | The Air You Travel In | AQ Air reads the cabin on the move and says when to close the vents. |
     | 3 | `spaces/img3.png` (1536×1024) | Home, From Anywhere | At work, one glance is enough. The room you left keeps reporting. |

- **Images:** `width/height: auto`, `max-width: 100%`, `max-height: min(44svh, 400px)`, **no `object-fit`**. The natural aspect ratio is kept (no crop, no stretch), so the three pictures render at slightly different sizes.
  - radius 18px (`--shot-radius`)
  - three-layer shadow `0 2px 4px / 0 8px 20px / 0 22px 48px` in `rgba(8,22,37,.18–.22)`
  - ≤ 767px: a single shadow `0 12px 28px rgba(8,22,37,.26)`
- **Captions:**
  - title Manrope 700 `clamp(1.5rem, 2.15vw, 2rem)` white
  - line `clamp(.95rem, 1.05vw, 1.08rem)` `--on-dark-72`
  - max-width 30rem, margin-top `clamp(1rem, 1.8vw, 1.5rem)`

### 10.3 Desktop (≥ 1201px): pinned horizontal sequence

- **Pin length:**
  - section height `100svh + --act2`, where `--act2 = 88svh + 5 × 66svh = 418svh`, so **518svh** in total
  - `.reel` is `position: sticky; top: 0; height: 100svh`, so the stage is pinned for **418svh of scroll**
  - pin and unpin are native sticky: it engages when the section top reaches the viewport top, and releases when the section bottom reaches the viewport bottom
- **Scroll progress:** `p = −sectionTop / (sectionHeight − 100svh)`, clamped to 0…1.
- **JS timeline (normalised units, 3 pictures):**
  - first act 88, then 66 per picture after the first: total 220 units, stretched proportionally over the 418svh
  - the statement fades out and rises 26px over `p ∈ [0, .40 × 88/220]`, then stops being clickable (`.is-shift`)
  - picture 1 slides in over `p ∈ [.24 × F0, .79 × F0]` (F0 = 0.4)
  - pictures 2 and 3 slide in over 68% of their own 66-unit slice
  - each picture fades out over the first 58% of the next picture's travel; the **last never leaves**
  - captions (`--txt`) fade and rise 26px only after their picture stops, over 45% of the rest period; they fade out 1.6× faster than the picture
- **Picture motion:**
  - `transform: translateX((1 − --in) × 58vw − --out × 8vw)`
  - opacity `min(1, --in × 2.2) × (1 − --out)`
  - resting offset `translate: −clamp(1.25rem, 3vw, 3.25rem) −clamp(1.5rem, 4.5vh, 3.5rem)`
  - every picture enters from beyond the right edge (58vw) into the **same cell**; the outgoing one drifts 8vw left as it fades
  - easing is smootherstep (zero velocity and acceleration at both ends)
- **Product:** lands on `#trust-mark` during the approach and stays still for the whole act (`--p2-lift: 0`, `--p2-shrink: 0`).
- **Short laptop:** images `max-height: min(42svh, 340px)`.

### 10.4 Tablet and mobile (≤ 1200px): pinned horizontal slides

- **Script:** runs its own code (JS § 10) when motion is allowed and `overflow: clip` is supported. It adds `body.js-hstory`.
- **Pin length:**
  - section height `100svh + 4 × 36svh` = **244svh**, padding 0
  - `.reel` is sticky, `top 0`, `100svh`, content centred; the ground is pinned too
  - so the pin lasts **144svh of scroll**
- **Slides:** four slides on one horizontal line:
  - slide 0 is the statement (heading, paragraph, button), centred, `max-width min(88vw, 520px)`
  - slides 1–3 are the pictures, each a centred column (image, title, line)
  - positioning: `translateX((i − --sp) × 104vw)`
- **`--sp`:** the sum of three smootherstep ramps, one per transition. Each ramp occupies the middle 26–74% of its third of the pin, so `--sp` walks 0 → 1 → 2 → 3 with rests between. **Only one slide is on screen at rest.**
- **Images:** `max-width: min(88vw, 520px)`, `max-height: 46svh`. On ≤ 767px, `31svh`, so the slide sits in the upper "wall" area above the pedestal in the portrait background. The stage is top-aligned there with padding-top `clamp(1.25rem, 4vh, 2.25rem)`.
- **Type:** caption title `clamp(1.3rem, 5.4vw, 1.85rem)`, line `clamp(.86rem, 3.4vw, 1rem)`; H2 at ≤ 640px `clamp(1.6rem, 7vw, 1.95rem)`.
- **Button:** "Get AQ Air" stays inside slide 0 under the paragraph and leaves with it. It is not clickable once `--sp > .5`.
- **Fallback:** without JS, with reduced motion, or without `overflow: clip`, the section is an ordinary vertical sequence (statement, then three pictures stacked, images `max-height: 56vh` at ≤ 767px and `58vh` at 768–1023px).

### 10.5 Transition to Why AQ Air

The trust photo ends on a pale blue floor. Why AQ Air (§ 11) is pulled up over it by `--whyaq-pull` and fades from transparent to `#CBE1EC` to white.

## 11. Why AQ Air

`section.whyaq#why-air-aq`, the first light section.

### 11.1 Ground and join

- **Pull:** `--whyaq-pull: clamp(120px, 13vw, 190px)`. The section gets `margin-top: −pull` and the same amount added to its top padding, so the background reaches up under the last of the trust photo while the content does not move.
- **`::before`:** a 12-stop eased veil from transparent to `#CBE1EC` across the pull, then `#CBE1EC → #DFEFF6 → #F1F8FC → white` over the next ~450px. Everything below is white.
- **Blooms:** two soft blooms (Glacier / Slate, 18–22px blur), masked.

### 11.2 Header (centred, max-width 46rem)

- eyebrow "WHY AQ AIR" (Turquoise .82rem 700 .16em)
- H2 "More Than a Monitor. A Smarter Way to Understand Your Air." (Deep, Manrope 800)
- lead "AQ Air turns continuous air-quality readings into clear, useful information—helping you understand what's happening around you and when it needs your attention." (`--ink-70`, max 40rem, lh 1.75)

### 11.3 Orbit stage (desktop)

- **Box:** `.orbit`, `aspect-ratio 1200/780`, max-width 1200px. It shares a coordinate space with `svg.orbit__flow`: two breathing rings (`orbitBreath` 12s) and six connector paths.
- **Core:** `.orbit__core`, centred at 50% / 50.3%, width 24%.
  - contains a halo, `#why-mark` (the flight's landing box, desktop), a fallback vector device (hidden while the flight runs) and a contact shadow
- **Six benefits (`.worb` / `.wcard`):** width 25.5%, positioned in an arc.
  - left column right-aligned at `right 68% / 72.2% / 66.8%`, tops 15.4% / 50.3% / 85.1%
  - right column mirrored
  - icon chip 44px (White→Ice, Turquoise glyph, soft shadow)
  - number "01"–"06" (Manrope 700 .78rem .18em, Deep .38)
  - title Manrope 700 `clamp(1.02rem, 1.25vw, 1.2rem)` Deep
  - line .9rem / 1.68 `--ink-70`

  | # | Title | Line |
  |---|---|---|
  | 01 | Understand, Don't Just Measure | Turn sensor readings into clear, human-friendly insights instead of showing numbers alone. |
  | 02 | Continuous Awareness | AQ Air continuously monitors your environment without requiring constant manual checking. |
  | 03 | Smart Alerts | Know when unusual air conditions need your attention. |
  | 04 | Stay Connected | Receive important air-quality information through your smartphone, even when you're away. |
  | 05 | Designed for Real Life | Made for bedrooms, living spaces, kitchens, offices, classrooms, cars, and other everyday environments. |
  | 06 | Built for Everyone | Designed for the spaces shared by children, families, adults, workers, and older generations. |

- **Background field (`.ofield`):** masked to an ellipse, `perspective 1100px`.
  - two drifting light pools (`ofLume` 17s, `ofLumeB` 23s)
  - a perspective grid (`rotateX 64°`, 68px cells, scrolling 68px per 32s)
  - four expanding sensor "waves" (7.4–10.3s)
  - three tilted conic-gradient rings spinning via `@property --spin` (26s / 34s reverse / 22s)
  - a breathing central glow (19s)
- **≥ 1081px sizing:**
  - section `min-height: 100svh + pull`, content centred vertically, padding `--whyaq-pad clamp(2.25rem, 4.2vh, 3.75rem)`
  - orbit height `clamp(400px, 100svh − chrome, 780px)`, where chrome is `clamp(21rem, 17rem + 8vh, 27rem)`; width derived from that height
  - title `clamp(2rem, 2.9vw, 2.65rem)`; cards slightly smaller (icon 38px, title `clamp(.98rem, 1.05vw, 1.1rem)`, line .84rem)

### 11.4 Motion (desktop)

- **Field entrance:** when 18% of the section is visible, `.is-lit` fades the field in (opacity 0 → 1, scale .85 → 1, 1.25–1.35s, delay 180ms). The grid follows at 520ms.
- **Scroll tilt:** `--wy` goes from −1 to +1 across the section's pass through the viewport. It is applied as `rotateX(wy × 2.5°) rotateY(wy × −4°)` on `.ofield__deep`, written from the Lenis frame loop.
- **Cursor parallax** (≥ 1201px, mouse only): the field translates up to 8px × 6px, eased at 8% per frame.
- **Reveal:**
  - header items reveal on scroll (110ms / 220ms stagger)
  - cards and connector lines reveal with delays 420 / 540 / 660 / 780 / 900 / 1020ms
  - cards: 1.1s fade, rise and unblur
  - lines: `stroke-dashoffset 1 → 0` over 1.5s
  - **with the flight running**, cards and lines stay hidden until `.is-settled` (the device has landed), then play in sequence

### 11.5 Scroll hold (desktop, wheel/trackpad only)

JS § 8b. While the benefit sequence is still playing:

- a downward wheel that would bring How It Works into view is intercepted through Lenis `virtualScroll`
- the page glides to the last position before How It Works and holds there
- held at most for the sequence length (~2.1s from its start), then released permanently
- touch is never held; upward scrolling is never held

### 11.6 Responsive

- **≤ 1200px:** tilt and cursor are off, the grid is hidden, rings spin 1.25× slower.
- **≤ 1080px:**
  - orbit becomes a **2-column grid** (max 46rem), connector SVG hidden
  - core on its own row, centred, `min(230px, 46vw)`, halo 175%
  - cards left-aligned
  - field re-centred on the core at 3× the core width
  - section padding `calc(clamp(3rem, 7vw, 4rem) + pull)` / `clamp(3rem, 7vw, 4rem)`
- **≤ 767px:** third ring and two waves hidden, remaining animations slowed 1.35–1.5×.
- **≤ 640px:** one column; core `min(200px, 54vw)` (180px / 58vw at ≤ 480px); padding `calc(2.75rem + pull)` / 2.5rem; orbit margin-top 1.75rem, row-gap 1.35rem.
- **All stacked layouts:** cards reveal individually as they scroll in. There is no waiting on the flight and no scroll hold.

## 12. How AQ Air Works

`section.howto#how-it-works`

### 12.1 Structure and ground

- **Box:** `.howto__box` sets the scroll length; `.howto__story` is the screen (sticky on desktop).
- **Ground:** section gradient `white → #EAF4F9`, mostly covered by the film.
- **Film:** `.howto__film`, absolute inset 0, z −2, `overflow: clip`.
  - contains `video.howto__filmEl` (`new-video-scrub-720.mp4`, ≈10 MB, 24fps, all-intra)
  - `muted playsinline preload="metadata"`, no autoplay, no loop
  - `object-fit: cover`, `object-position: 50% 55%`
- **Scrim:** `.howto__air` is a Deep scrim:
  - desktop: `.58` at the top, clear from 44–56%, `.60` at the bottom
  - ≤ 1200px: an even `.52 / .34 / .30 / .48`
  - the two Glacier washes are hidden
- **Text colour:** all text is Ice `#D6EBF3` with a double text-shadow `0 1px 2px rgba(10,28,46,.45), 0 2px 14px rgba(10,28,46,.35)`.
- **Header:** H2 "How AQ Air Works"; lead "From the air around you to insights you can act on." (600 weight). Centred, max 46rem.

### 12.2 Four stages (`.howto__track`)

- Four columns, `col-gap clamp(1.5rem, 3vw, 3rem)`.
- Each step: a stage illustration (height `--stage-h clamp(158px, 19vh, 226px)`), a rail (track, beam, spark, stem, node), then number, title and copy.

| # | Title | Copy | Illustration |
|---|---|---|---|
| 01 | Sense | Built-in sensors continuously monitor the air around you for important changes in indoor air quality. | device silhouette with pulsing read rings and LED, 8 particles drifting in (`senseIn` 6.5s) |
| 02 | Analyze | AQ Air processes sensor readings continuously to identify unusual patterns and changes in your environment. | "mind" rings (breathing 9s), a sweep (6s rotation), pins; five chips (CO₂, VOCs, Air Quality, Smoke, Gas) that fade in and bob ±3px |
| 03 | Understand | Complex air-quality readings are translated into clear information that is easier to understand. | raw rows (CO₂ 1180 ppm, VOC 0.42 mg/m³, AQI 78) blur out, then a white insight card "Air Quality Needs Attention / CO₂ levels are rising / Ventilation recommended" rises in |
| 04 | Act | Receive useful alerts on your phone so you can respond when your indoor environment needs attention. | mini phone; "AQ Air Alert · now / Air quality has changed in your room." drops in (−22px, .45s delay) with a glow |

- **Rail:** 1px track Deep .13; beam gradient Slate → Turquoise → Deep; spark 5px Deep with a Glacier ring; 8px node that turns Deep and pulses when live.
- **Stage wake:** `.is-live` fades the stage, number, title and copy up from 14px (.95s, staggered .07s / .13s).

### 12.3 Desktop (≥ 1201px): pinned scrub

- **Pin length:** box height `100svh + --how-run (400svh)` = **500svh**. The story is `position: sticky; top: 0; min-height: 100svh`, so it is pinned for **400svh**.
- **Rail progress:** `p = −boxTop / (boxHeight − storyHeight)`. Each stage's `--sp` is linear over its slice: lead .05, span .20, stages starting at p = .05, .283, .517, .75. A stage goes live at `--sp ≥ .5`.
- **Short laptop:** story padding reduced, stage height `clamp(130px, 17vh, 200px)`.

### 12.4 Scroll-controlled video (all widths)

- **Mapping:** scroll progress 0 → 1 maps to the first → last frame.
  - desktop: across the 400svh pin
  - stacked: from the section top at the viewport top to its bottom at the viewport bottom (or its whole pass if shorter than a screen)
- **Loop:** runs inside the Lenis frame hook (or its own rAF while near, if Lenis is absent).
  - a **critically damped spring** follows the target: lag .14s with Lenis, .2s without
  - speed capped at 2.5 film-seconds per second (60fps)
  - seeks whole frames to the frame centre, with `fastSeek` where available
  - only one seek in flight at a time; the next is sent on `seeked`
  - lead compensation uses a running average of seek latency (starts at 45ms)
  - when scrolling is almost still, it aims directly at the final resting frame
- **Loading:** after `load`, or when the section comes within 100% of a viewport, the whole file is `fetch`ed into a Blob URL, so seeks never wait on the network. A muted play/pause "primes" iOS. Fallback is `preload = auto`.
- **Re-measure:** on resize, load and any body `ResizeObserver` change.

### 12.5 Tablet and mobile (≤ 1200px)

- **Layout:** no pin. Stages stack in **one column** (max 34rem, `row-gap clamp(3rem, 7vw, 4.5rem)`, later `clamp(2.25rem, 5vw, 3rem)`; 2rem at ≤ 640px).
  - rail limited to 15rem, masked at both ends
  - a 1px vertical connector hangs below each step
  - copy max 27rem
- **Film:** becomes `position: sticky; top: 0; height: 100lvh; margin-bottom: −100lvh` inside the story, so it fills the screen behind the scrolling stages. It is still scrubbed by scroll across the section's pass.
- **Stage wake:** per-step IntersectionObserver (threshold .3, −12% bottom margin) adds `.is-live`. `--sp` transitions to 1 over 1.1s (registered `@property`) instead of being scrubbed.
- **≤ 640px:** stage height `clamp(168px, 44vw, 210px)` (`clamp(150px, 46vw, 190px)` at ≤ 480px); illustrations smaller (device 148px, mind 152px, card 226px, phone 122px); copy .88rem.
- **Landscape phone:** stage height `clamp(130px, 30vh, 180px)`.

### 12.6 Transition to Contact

A straight edge: Contact opens on its own photograph (§ 13).

## 13. Contact

`section.contact#contact`

### 13.1 Ground

- **Image:** photograph `assets/image/con.png` (1672×941) on `::before`, `70% 60% / cover` (`72% 60%` at ≤ 767px). **No overlay, tint, mask or filter**: the image is shown as shot.
- **Base colour:** the section's own gradient (a light→navy ramp whose fade height `--contact-fade` is now `0px`, so it is effectively `#16324F → #102640`). It only shows if the image fails.
- **Sizing:** `min-height: 100svh`, flex column, content centred vertically.
  - padding top `clamp(3rem, 8svh, 5.5rem)`, bottom `clamp(2rem, 6svh, 4.5rem)`
  - ≤ 767px: `clamp(3rem, 12vw, 4.5rem)` / `clamp(2.25rem, 8vw, 3.5rem)`
- The former atmosphere layer (blooms, rings, flow lines, motes) has been removed from the markup.

### 13.2 Layout

- Grid `1fr | 1.08fr`, `gap clamp(2rem, 4vw, 4.5rem)`, `align-items: start`, width `--shell`.
- ≤ 1200px: one column, `gap clamp(2.25rem, 6vw, 3.25rem)`.

### 13.3 Left column (`.contact__intro`, max 34rem; unlimited when stacked)

All left text uses a white halo `text-shadow: 0 1px 14px rgba(255,255,255,.55)` for legibility over the bright photo.

- **Eyebrow** "GET IN TOUCH": Deep at .78, .82rem 700 .16em.
- **H2** "Let's Talk About Better Air.": Deep `#16324F`, Manrope 800.
- **Lead** "Whether you have questions about AQ Air, need product support, or want to explore AQ Air for your home or business, we're here to help.": `rgba(16,38,64,.9)`, weight 500, max 31rem (38rem stacked).
- **Contact list (`ul.contact__ways`):** one local glass box.
  - `rgba(255,255,255,.28)`, `blur(8px)`, border `rgba(255,255,255,.45)`, radius 20px, padding `clamp(1rem, 1.8vw, 1.35rem)`
  - three rows separated by Deep .18 hairlines:

  | Name | Line | Email |
  |---|---|---|
  | General Enquiries | Questions about AQ Air, how it works, and what it reads. | hello@airaq.com |
  | Product Support | Setup, sensors, alerts and anything your device is doing. | support@airaq.com |
  | Business & Partnerships | AQ Air across offices, buildings, fleets and retail. | partners@airaq.com |

  - icon chips: 44px, radius 14px, `rgba(255,255,255,.22)`, `blur(6px)`, border `rgba(255,255,255,.45)`, Deep glyph 22px
  - name: Manrope 700 `clamp(1rem, 1.15vw, 1.1rem)`, Deep
  - line: .89rem, `rgba(16,38,64,.86)`, 500
  - email: `mailto:` link, .89rem 700 Deep; the underline grows on hover (.35s)
- **Info box (`.contact__trust`):** "Your questions matter. Our team will get back to you as soon as possible."
  - `rgba(255,255,255,.26)`, `blur(8px)`, border `rgba(255,255,255,.45)`, radius 16px, Deep text 500, Deep check-mark icon

### 13.4 Form panel (`.contact__panel`, right column)

- **Panel:** `rgba(22,50,79,.12)`, `blur(8px)`, border `rgba(214,235,243,.25)`, inset highlight plus soft drop shadow. Radius 26px (22px at ≤ 767px). Padding `clamp(1.15rem, 3svh, 2.35rem) clamp(1.25rem, 2.6vw, 2.35rem)`.
- **Fields (`novalidate`, no submit handler):**
  - two rows of two: **Full Name**, **Email Address**; **Phone Number**, **Subject**
  - then **Message** (textarea, `min-height clamp(96px, 14svh, 190px)`, 120px at ≤ 640px, vertical resize)
  - placeholders: "Your full name", "you@example.com", "+1 555 000 0000", "What is this about?", "Tell us a little about what you need."
- **Labels:** .7rem, 600, uppercase .13em, **white** with shadow `0 1px 6px rgba(11,28,47,.45)`.
- **Inputs:**
  - `rgba(22,50,79,.22)`, border `rgba(214,235,243,.20)`, radius 14px, padding `.85rem 1rem`, Inter .95rem
  - text white, placeholder white .65
  - hover border .34
  - focus: background .30, border `rgba(214,235,243,.6)`, ring `0 0 0 3px rgba(214,235,243,.16)` (.28s)
  - autofill painted `#2A4966` with white text
- **Send Message:**
  - `.btn--primary` restyled to solid Ice `#D6EBF3`, Deep text and arrow, soft shadow
  - hover: `translateY(-2px)`, white background, arrow +3px
- **Gaps:** rows and form `clamp(.75rem, 1.9svh, 1.3rem)`.
- **≤ 640px:** fields go to **one column**; Send button full width; panel padding `clamp(1.15rem, 5vw, 1.5rem)`.
- **≤ 480px:** icon 40px; input padding `.8rem .9rem`, radius 12px; info box `.85rem .95rem`, .85rem text.
- **Reveal:** eyebrow, title, lead, rows (260 / 340 / 420ms), info box (500ms) and panel (220ms) all use `[data-reveal]`.

## 14. Footer

`footer.foot`

- **Ground:** two dense Oklab ramps, `#102640 → #0B1C2F` over the top 68% and then `#0B1C2F → #081729`. `overflow: clip`.
  - padding `clamp(3.5rem, 7vw, 6rem)` top, `clamp(1.75rem, 3vw, 2.5rem)` bottom
- **Atmosphere:** masked below 190px.
  - one large Glacier glow (`footGlow` 30s, scale 1 → 1.05)
  - two dashed flow lines (34s / 41s)
  - six motes
- **Grid:** `1.4fr | .85fr | .85fr | 1.15fr`, `gap clamp(2rem, 3.5vw, 3.75rem)`.
  1. **Brand** (max 24rem):
     - nav brand lockup
     - statement "Know the Air You Breathe. Protect What Matters." (Manrope 700 `clamp(1.02rem, 1.2vw, 1.15rem)`)
     - note "AQ Air continuously monitors your indoor environment and turns air-quality data into clear insights you can understand and act on." (.89rem)
     - social buttons LinkedIn / X / YouTube: 38px, radius 12px, glass, Glacier icon; hover white, lift 2px. All `href="#"` (placeholders).
  2. **Explore:** Product (→ `#product-showcase`), Technology (→ `#air-data`), Air Science (→ `#trust`), How It Works (→ `#how-it-works`), Why AQ Air (→ `#why-air-aq`).
  3. **Support:** Contact Us (→ `#contact`), Product Support (mailto), FAQs, Privacy Policy, Terms & Conditions (`#`).
  4. **Stay Connected:**
     - "Get AQ Air updates, indoor air-quality insights, and product news."
     - email input (reuses `.cfield__input` styling) plus "Subscribe →" button (`.btn--primary`, `.72rem 1.15rem` .88rem)
     - `novalidate`, no handler
- **Column styling:** titles .78rem 700 uppercase .16em Glacier; links .92rem `--on-dark-72`, hover Ice with `translateX(3px)`.
- **Bottom bar:** "© 2026 AQ Air. All rights reserved." and "Privacy Policy · Terms & Conditions". Top border Glacier .12; .84rem `--on-dark-52`.
- **Reveal:** brand 0, columns 120 / 200 / 280ms.
- **≤ 1023px:** 2 columns (brand and newsletter full width); bottom bar padding-right 64px to clear the floating buttons.
- **≤ 640px:** 2 columns (Explore | Support), brand and newsletter full width; input and button full width; bottom bar stacked with padding-bottom 64px.
- **≤ 480px:** smaller statement, notes and social buttons (36px).

## 15. Floating elements

### 15.1 WhatsApp (`a.wa#wa-chat`)

- **Link:** fixed, bottom-right at `--fab-edge: clamp(1rem, 3vw, 2.25rem)`. `z-index 35`, `target=_blank`.
  - `href` is built by JS from `data-wa-number` (currently **empty**, so it opens `wa.me` with no recipient) and `data-wa-text` ("Hi AQ Air, I'd like to know more about AQ Air.")
- **Look:** `--wa-size` 3.5rem (3.1rem at ≤ 640px), `#25D366` disc, white glyph at 56%, inset rim plus two soft shadows.
- **Behaviour:**
  - hover: lift 2px (.45s); active: `scale(.97)`
  - hides (`.is-away`: fade, drop 12px, `scale(.92)`, not clickable) whenever the contact form panel or the footer newsletter is on screen, and returns when they leave

### 15.2 Back to top (`button.totop#to-top`)

- **Button:** 3.25rem (2.9rem at ≤ 640px) glass circle, fixed at the same edge, stacked `.75rem` above the WhatsApp button.
  - drops into the corner when WhatsApp is away (`body.wa-away`, bottom transitions .45s)
- **Visibility:** appears after scrolling 1.5 viewport heights (fade, rise from 14px, from `scale(.92)`, .34s).
- **Action:** click scrolls to top via Lenis, or native smooth scroll without it. Hidden entirely if JS never ran.

## 16. Responsive summary by breakpoint

| Area | Desktop ≥ 1201 | Laptop 1201–1440 / short | Tablet 768–1200 | Phone 481–767 | Small ≤ 480 |
|---|---|---|---|---|---|
| Shell side margin | 2rem each side | same | 1.25rem (≤ 1200) | .75rem (≤ 640) | .75rem |
| Nav | full bar, links centred | same | burger + dropdown panel | same, smaller | smallest sizes |
| Hero | 2 columns; cards float over the room; video centred | cards tighter; short screens tighten padding | 1 column; cards in a 3-column grid (from ≤ 1240); video 70% | buttons side by side; cards in 2 columns (≤ 640); video 68% | smaller H1 and buttons |
| Hero height | fills screen with readings (`.herostack` 100svh) | same | content height | content height | content height |
| Readings | 4 columns | same | 4 columns, smaller (≤ 1080) | 4 columns, smaller (≤ 640) | 4 columns, smallest |
| Product | copy / stage; floating cards, AI card, phone; cursor parallax | stage 62vh | stacked 3+2 grid, phone hidden; tiles (≤ 1023) | tighter padding | device 190px |
| Product flight | on | on | off | off | off |
| Trust | pinned 418svh, pictures slide in from 58vw | images ≤ 340px on short screens | pinned 144svh, 4 slides × 104vw | same; portrait background, image 31svh | same |
| Why AQ Air | orbit, tilt, cursor, scroll hold | same | orbit with lighter motion; 2-column grid at ≤ 1080 | 1 column (≤ 640) | core 180px |
| How It Works | pinned 400svh, rail scrub + film scrub | shorter stages | stacked, film sticky behind, film scrubbed, stages wake on scroll | same, smaller | smaller |
| Contact | 2 columns, 100svh | same | 1 column | same, panel radius 22 | 1-column fields, full-width button |
| Footer | 4 columns | same | 2 columns (≤ 1023) | 2 columns + full-width brand/news | smaller type |

**Hidden on smaller screens:**

- hero PM2.5 meter (1201–1440 and ≤ 640)
- product phone mockup, glow and flow lines (≤ 1200)
- chain connectors (≤ 640)
- Why AQ Air connector SVG (≤ 1080), perspective grid (≤ 1200), third ring and two waves (≤ 767)
- hero grain (≤ 767)
- trust dock and mark (always hidden below 1201)

## 17. Known quirks and dead code

These describe the code as it is. None of them are fixed here.

1. **Trust timing mismatch.** CSS sizes the desktop pin for six pictures (`88svh + 5 × 66svh`), but there are three. The JS shares the run proportionally, so each picture gets ~125svh of scroll instead of the intended 66svh.
2. **1201–1240px overlap.** Hero cards are switched to grid mode by the `≤ 1240px` rules, while the `≥ 1201px` rules still give them `top` / `left` percentages. In that 40px band, the grid cards carry those offsets.
3. **`@keyframes halo` does not exist.** `.showcase__glow` is therefore static.
4. **Unused JS:** the use-case carousel (JS § 5, `#usecase-track`) has no markup.
5. **Missing trust elements:** `.reel__caption`, `.reel__note` and `.reel__under` are styled and scripted but not in the HTML, so the trust "texts" loop does nothing.
6. **Unused hero CSS:** `.insight` (AI line in the hero) is styled but has no markup. The vector room scenery and the hero device are hidden by `has-photo`.
7. **Contact:** the `.contact__bloom`, `.contact__ring`, `.cflow` and `.contact__motes` CSS remains, but that markup was removed. The `--contact-fade` ramp is zeroed.
8. **Placeholders:** the WhatsApp number is empty, most nav and footer links are `#`, and neither form has a submit handler.
9. **Unreferenced media:** `herovideo.mp4`, `new-video.mp4`, `new-video-scrub.mp4`, `worck*.mp4`, `Family.mp4` (two copies), `contact.jpg`, `bg-original.png`, `bgrespons.png`, `bg-portrait.png`, `trustportrait.png`, and `assets/image/contact.html` (20 MB).

## 18. Mobile scrolling performance

What actually runs on a phone (≤ 767px, motion allowed):

- **Lenis is active** with `syncTouch: false`, so touch scrolling is native. The global rAF loop still runs **every frame** for the lifetime of the page (it calls `lenis.raf` and the frame hooks).
  - The Why AQ Air tilt/cursor hook exits early below 1201px.
  - The film spring hook exits early unless the How It Works section is near.
- **Hero video:** a 29 MB `hero.mp4` with `preload="auto"` and autoplay starts downloading immediately. It pauses once the hero is more than 200px off-screen.
- **Trust:** pinned for 144svh using `position: sticky`. One passive scroll listener (rAF-throttled) writes a single custom property (`--sp`); movement is `transform` only. The pinned ground is a sticky full-screen background image.
- **How It Works:**
  - not pinned, but the full-screen film is `position: sticky` behind the stages and **scrubbed by seeking** on every frame the spring moves
  - the whole 10 MB file is fetched into memory after page load, even if the user never reaches the section
  - seeking is one frame at a time with a single seek in flight; the file is all-intra, so each seek decodes one frame
- **Why AQ Air:** no pin and no scroll hold (desktop only). The field still animates (fewer rings and waves, slower); the rings use a registered `@property` angle, which is animated on the main thread in some browsers.
- **Product flight:** off.
- **Backdrop filters on phones:**
  - nav bar (10px; 18px once stuck) and the open menu panel (14px)
  - Contact: list box, icon chips, info box, form panel (6–8px)
  - back-to-top button (14px)
- **Cheap paths already in place:**
  - off-screen sections pause their CSS animations (`.is-idle`)
  - bloom blur filters are dropped at ≤ 1023px; the hero grain is dropped at ≤ 767px
  - `will-change` is removed from product cards on phones
- **Scroll restore:** the page always reloads at the top, and the preloader locks scrolling for ~1.5–3s.

## 19. Media inventory

| Asset | Size | Where | Behaviour |
|---|---|---|---|
| `assets/video/hero.mp4` | 29.2 MB | Hero background | autoplay, muted, loop, playsinline, cover; paused off-screen |
| `assets/video/new-video-scrub-720.mp4` | 10.1 MB | How It Works background | scroll-scrubbed, 24fps all-intra, fetched as a Blob |
| `assets/image/bg.png` | 1555×1012, 1.4 MB | Trust background ≥ 768px | cover |
| `assets/image/newresponsive.png` | 1024×1535, 1.5 MB | Trust background ≤ 767px | cover, 38% centre |
| `assets/image/spaces/img1.webp` (`img1.png` fallback) | 1672×941 | Trust picture 1 | natural ratio, max-height capped |
| `assets/image/spaces/img2.png`, `img3.png` | 1536×1024 | Trust pictures 2–3 | same |
| `assets/image/con.png` | 1672×941, 1.8 MB | Contact background | cover, 70% 60% (72% 60% ≤ 767px) |
| Product / Why / How device | inline SVG | Product, flight, Why fallback, How stage 01 | vector, no raster |
| Icons | inline SVG, `currentColor` | everywhere | 1.4–1.9 stroke, rounded caps |
