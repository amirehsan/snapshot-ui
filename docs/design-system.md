# Snapshot Design System

## 1. Visual Theme & Atmosphere

Snapshot reads like a warm, editorial magazine built from soft stone and signal orange. The canvas is a muted putty-cream (`#F3F0EE`), not white, not gray, but a color that feels like the paper of a premium annual report. On top of that canvas, everything that matters is shaped like a stadium, a pill, or a perfect circle. The dominant visual gesture is the **oversized radius**: heroes carry 40-point corners, cards go fully pill-shaped, service images are cropped into circular orbits, and buttons either complete the pill or fit snugly at 20 points. There are almost no sharp corners anywhere on the page.

The second gesture is **orbit and trajectory**. Circular image masks don't sit still. They're connected by thin, hand-drawn-feeling orange arcs that span entire viewport widths, implying a constellation of services rather than a list. Each circle has a small attached "satellite", a white micro-CTA holding an arrow icon, docked onto its perimeter like a moon. This is the most distinctive thing about the system: the circles feel like they're in motion even though the page is still.

Typography is rendered entirely in **Sofia Sans**, an open-licensed geometric sans. Headlines are set at a medium weight (500) with tight negative letter-spacing (-2%), giving them confidence without shouting. Body copy runs at the same family in a slightly lighter weight (450), a weight you rarely see on the web, chosen because it reads softer than regular 400 without feeling thin. The whole system (warm cream surfaces, pill shapes, circular portraits, traced-orange orbits, black CTAs) feels simultaneously institutional and editorial, which is exactly the tension the system is meant to hold.

**Key Characteristics:**
- Warm cream canvas (`#F3F0EE`) replaces traditional white. Every surface is tinted, never sterile
- Extreme border-radius as design language: 40px, 99px, 1000px dominate; anything square is a third-party embed
- Circular image portraits with attached white satellite-CTAs and traced-orange orbital paths
- Ghost "watermark" headlines (cream-on-cream text at heading scale) layered behind circle portraits
- Black primary CTAs with 20px radius in the body; the signal orange is kept to consent flows
- Floating pill-shaped navigation that docks below the viewport top with rounded shoulders
- Eyebrow labels with a tiny accent dot plus uppercase bold tracking, used as the section-category signal
- Dark warm-black footer (`#141413`) with four-column link layout and large conversational headline

## 2. Color Palette & Roles

### Primary
- **Ink Black** (`#141413`): The warm near-black used for primary CTAs, headline text on cream, and the footer surface. Slightly warm (the `13` blue value pulls toward the cream) so it never feels jet-black on the warm canvas. This is the anchor of the palette.

### Secondary & Accent
- **Signal Orange** (`#CF4500`): The burnt/rust CTA orange used on consent actions and eyebrow dots. Deeper than a standard amber, brighter than ink. It's the page's single aggressive color and must be used sparingly.
- **Light Signal Orange** (`#F37338`): A lighter carroty orange used for carousel active indicators and decorative orbital arcs. Always acts as an attention cue, never as body color.
- **Clay Brown** (`#9A3A0A`): The deep rust used for secondary link-style buttons (e.g., consent details). Sits between ink and signal orange.

### Surface & Background
- **Canvas Cream** (`#F3F0EE`): The page canvas. Warm, putty-toned, the default body background. All editorial sections sit on this.
- **Lifted Cream** (`#FCFBFA`): One step lighter than canvas, used for nested "raised" sections that want to feel like paper laid on paper.
- **White** (`#FFFFFF`): Reserved for the floating navigation pill, modal cards, secondary button fills, and small satellite-CTA circles attached to image portraits.
- **Soft Bone** (`#F4F4F4`): A cool-gray alternative surface used inside a handful of component subregions.

### Neutrals & Text
- **Ink Black** (`#141413`): Primary headline and body text color.
- **Charcoal** (`#262627`): A slightly softer black used for some text alternates.
- **Slate Gray** (`#696969`): Muted secondary text. Eyebrow label alternative, disabled states, bottom-row utility text.
- **Granite** (`#555555`) and **Graphite** (`#565656`): Deeper gray for inline body accents and link alternates.
- **Dust Taupe** (`#D1CDC7`): Very muted cream-gray used for disabled or "whisper" text (e.g., placeholder-like empty state labels). Low contrast on cream; use only for subdued content.

### Semantic & Accent
- **Link Blue** (`#3860BE`): A deep, slightly dusty blue used for inline links and informational callouts. Saturated enough to read as a link without being neon.

### Brand Mark
The system does not reserve any palette entry for a logo. Whatever wordmark or mark sits in the nav should render in **Ink Black** on cream surfaces and **Canvas Cream** on the ink footer, so the identity reads as part of the type system rather than as a separate color event. If a multi-color mark is introduced later, treat its colors as brand assets only and keep them out of the UI palette entirely.

### Gradient System
The system uses no programmatic gradients in the core UI. The visual impression of "gradient" comes from two places:
- **Circular image portraits** where a warm-toned photo subject (a ripe peach, a sunflower, a glass of iced tea) fades to the cream canvas at its edge
- **Deep card shadows** on elevated content (`rgba(0,0,0,0.08) 0px 24px 48px`) that create a soft halo beneath pill-shaped media

### Dark Mode
Every value above describes the light system, which is the default. Dark mode leaves the accents untouched and replaces only the surface and text tiers. Full specification in Section 7.

## 3. Typography Rules

### Font Family
- **Primary**: `Sofia Sans` (SIL Open Font License, available on Google Fonts). A geometric sans with a variable weight axis, which is what makes the half-step 450 body weight possible. Every headline, body paragraph, button, nav link, and footer link on the page.
- **Legal / fine print**: the same family at weight 400. Resist adding a second family for small print.
- **Fallback stack**: `'Sofia Sans', Inter, Arial, sans-serif`. Inter is a near-equivalent geometric fallback; Arial is the final web-safe fallback.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| H1 (hero) | 64px | 500 | 64px | -1.28px (-2%) | Set to `1:1` line-height for very tight vertical rhythm on multi-line hero |
| H2 (section) | 36px | 500 | 44px | -0.72px (-2%) | Used in ghost-watermark headline treatments and section titles |
| H3 (card title) | 24px | 500 | 28.8px (1.2) | -0.48px (-2%) | Titles inside service/solution cards |
| H4 (subhead) | 14px | 700 | 18.2px (1.3) | normal | Rarely used in marketing surfaces |
| Eyebrow (H5) | 14px | 700 | 14px | 0.56px (+4%) | Uppercase, paired with a tiny accent dot (e.g., "• SERVICES") |
| Body paragraph | 16px | 450 | 22.4px (1.4) | normal | The half-step 450 weight is the system's signature, softer than 500, firmer than 400 |
| Nav link / Button label | 16px | 500 | 16px | -0.48px (-3%) | Tight, compact, no text-transform |
| Footer link | 14px | 450 | ~20px | normal | Lighter weight on dark footer for airier density |
| Footer column header | 12–14px | 700 | 14px | 0.56px (+4%) | Uppercase, muted gray, short tracking |

### Principles
- **Weight 450 is load-bearing**. Most systems use 400/500/700; this one uses 450 for body copy, which creates an unusually soft reading tone. Replacing it with 400 flattens the identity.
- **Tight negative tracking on headlines** (-2%) gives display text its editorial density. The words lock together rather than breathe.
- **Uppercase tracking only on the eyebrow scale** (14px / 700 / +4% tracking). Don't use uppercase anywhere else; no shouty section titles.
- **One-font system**. Resist the urge to add a second typeface for contrast. The contrast comes from scale, weight, and letter-spacing, not from a serif or display accent.
- **Line-height ratio drops with size**. H1 is 1:1, H3 is 1.2, body is 1.4. Tight display, comfortable reading.

### Note on Font Alternates
Sofia Sans is openly licensed, so it can ship with any build. If a project needs a different geometric sans:
- **Inter** at weights 450/500/700 works as a close stand-in. Expect a slightly taller x-height and looser letter shapes.
- **Neue Haas Grotesk** or **Geist** approximate the same geometric feel for commercial projects (check licensing before shipping either).
- Whichever family is used, preserve the **-2% letter-spacing on headlines** and the **450 body weight** (use `font-weight: 450` with variable fonts, or substitute `font-weight: 400` and tighten the letter-spacing by ~-0.5% to compensate).

## 4. Component Stylings

### Buttons

**Primary, Ink Pill**
- Background: Ink Black (`#141413`)
- Text: Canvas Cream (`#F3F0EE`), not pure white
- Border: 1.5px solid Ink Black (same as bg, creates crisp edge)
- Radius: 20px
- Padding: 6px 24px
- Font: Sofia Sans 16px / weight 500 / letter-spacing -0.32px
- Default: as above; solid warm-black pill on cream canvas
- Active / pressed: subtle inward-shrink or 2px offset (not a hover variant)
- Use for: all marketing CTAs in the page body ("Learn more", "Explore", "Discover")

**Secondary, Outlined Pill**
- Background: White (`#FFFFFF`)
- Text: Ink Black (`#141413`)
- Border: 1.5px solid Ink Black
- Radius: 20px
- Padding: 6px 24px
- Font: Sofia Sans 16px / weight 450 / line-height 20.8px
- Default: white-on-cream pill with crisp ink outline
- Active / pressed: subtle compression
- Use for: secondary actions paired with a primary, or standalone utility CTAs

**Consent / Signal, Orange Pill**
- Background: Signal Orange (`#CF4500`)
- Text: White (`#FFFFFF`)
- Border: 0
- Radius: 24px
- Padding: 1px 30px (very tight vertical, wide horizontal)
- Font: Sofia Sans 13px / weight 400 / letter-spacing 0.13px
- Default: as above; bright rust pill with white text
- Use for: cookie consent, privacy preference, and other legally-distinct confirmations. **Do not** use this orange for marketing CTAs. Keeping it exclusive to consent and compliance is what preserves it as a legal signal rather than decoration.

**Satellite, Circular Micro-CTA**
- Background: White (`#FFFFFF`)
- Icon: Ink Black arrow (`→`) at ~20px
- Border: none
- Radius: 50% (perfect circle)
- Size: ~50–60px diameter
- Shadow: none or very subtle (the portrait's shadow carries the elevation)
- Default: docks onto the bottom-right edge of a circular portrait, protruding partway outside the portrait's circle
- Use for: the primary entry point into service/solution cards; always paired with a circular portrait

**Icon-Only Circle Button (carousel, play/pause)**
- Background: transparent or white
- Icon: 10–20px centered
- Border: 1px solid Ink Black (when on cream) or none (when over media)
- Radius: 50%
- Size: 40px diameter minimum for carousel controls; 80px for hero video play
- Use for: carousel pagination/play-pause, hero video play, search toggle

### Cards & Containers

**Hero Media Frame (Stadium)**
- Background: Dark video or full-bleed imagery (typically black `#000000` or `#2B2B2B` behind video)
- Radius: 40px all corners (creates a stadium shape on wide viewports)
- Width: ~full viewport minus ~48px gutter on each side
- Height: ~60–70% of viewport
- Shadow: none (sits directly on canvas)
- Corners: the extreme 40px radius on a media element is the most iconic gesture in this system. Do not round less

**Service / Solution Portrait Card**
- Shape: Perfect circle (radius 50%) or ellipse (radius 999px / 1000px)
- Diameter: 260–340px desktop; ~220px mobile
- Image crop: square source, cropped to circle
- Attached element: White satellite circular CTA (see above) docked bottom-right, ~40% outside the portrait
- Eyebrow below: accent dot plus uppercase label (e.g., "• SERVICES", "• SOLUTIONS")
- Title below: H3 (24px / weight 500 / -2% tracking), 1–2 lines max
- Decorative orbit: thin ~1px Light Signal Orange curved line spanning from this card outward to the next, implying connection

**Pill Carousel Card**
- Radius: 1000px (full pill) or 40px corners (rounded stadium)
- Width: ~40–60% of viewport
- Height: ~380–420px (portrait-pill orientation)
- Content: full-bleed photography with small overlaid chip labels
- Chip inside: White pill (~999px radius), Ink Black text, padding 8px 20px, used for category tags like "Story"
- Large inline CTA inside: Ink Pill button, oversized (padding 16px 40px, radius 40px)

**Ghost Watermark Text Block**
- Font: Sofia Sans 72–128px / weight 500 / tight -2% tracking
- Color: Canvas Cream slightly darkened (`#E8E2DA` or similar, cream-on-cream)
- Position: layered behind portrait circles, bleeding off the viewport edge
- Purpose: sets section theme without competing with foreground copy

### Inputs & Forms
Minimal form surface on the marketing page. The search input in the nav header is:
- Initial state: a 48px circular button with a magnifier icon
- Expanded state: horizontal input field, border `1px solid` Ink Black at ~50% opacity, radius 999px, padding 12px 24px, white background

**Country/language selector (footer)**
- Background: Ink Black (same as footer)
- Text: White
- Border: 1px solid `rgba(255,255,255,0.4)`
- Radius: 999px (full pill)
- Icon: downward chevron on the right

### Navigation

**Floating Nav Pill (desktop)**
- Container: white-to-translucent-white pill floating below the very top of the viewport with a ~24px top margin
- Radius: 999px / 1000px (full pill)
- Padding: ~16px 40px internal
- Shadow: very soft (`rgba(0, 0, 0, 0.04) 0px 4px 24px 0px`), just enough to lift it off the cream canvas
- Content: wordmark left, primary link group center ("Product", "Solutions", "Customers", "Resources", "Company"), search icon right
- Link spacing: ~48–56px gap between primary links
- Link style: Ink Black, weight 500, 16px, no underline, no pill surround until active

**Mobile Nav**
- The same pill shape but collapsed to: wordmark plus hamburger menu button plus search icon only
- Menu opens into a full-screen overlay with the primary links stacked vertically

### Image Treatment

- **Aspect ratios used**: 1:1 (all service portraits, cropped to circle), ~3:4 or ~4:5 (carousel pill cards), 16:9 or wider (hero video frame)
- **Full-bleed vs padded**: Hero is viewport-wide with gutters; service portraits are always centered in their column with generous whitespace around; footer imagery is rare
- **Masking**: Aggressive circular masking is the defining treatment. Square source images are cropped to perfect circles of matching diameter. Never use rectangular service imagery.
- **Lazy loading**: Standard `loading="lazy"` with a soft blur-up transition from a cream-tinted placeholder, preserving the warm palette during load

### Decorative Orbital Lines

A signature motif: thin (~1–1.5px) single-weight curved lines in Light Signal Orange (`#F37338`) tracing arcs between circular portraits. These lines:
- Imply connection between service cards without literal arrows
- Span widths from ~200px up to full-viewport arcs
- Feel hand-drawn (subtle irregularity) rather than perfect CSS curves
- Appear only in sections with circular portrait content. Never on pill sections, never in the footer

### Footer

- Background: Ink Black (`#141413`)
- Text: White
- Padding: 48px horizontal 100px / bottom 148px (very tall bottom space)
- Structure: large conversational H2 ("Everything you need, whenever you need it.") left-aligned, then a 4-column link grid below
- Column headers: uppercase, muted, weight 700, letter-spacing +4%
- Link rows: white, weight 450, 14px; entries prefixed with a small icon (support bubble, document, map pin, question mark) for the "NEED HELP?" column
- External link marker: a small upper-right arrow (`↗`) after link text
- Bottom row (below a 1px white-at-opacity divider): copyright plus privacy small-print plus country-language pill dropdown plus four social icons

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px
- **Scale**: 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 (powers of 8)
- **Section vertical padding**: ~96–128px between major sections on desktop; ~48–64px on mobile
- **Card internal padding**: 32–40px on desktop, ~24px on mobile
- **Nav top margin**: ~24px from viewport top (the pill floats, doesn't touch)

### Grid & Container
- **Max content width**: ~1200–1280px centered, with ~48–100px horizontal gutter
- **Column pattern**: 12-column implied, but practical layouts use 2-up asymmetric (large headline left, supporting text right), 1-up full-bleed (hero, video), or staggered single-portrait placement (service cards sit in varying grid positions creating the "constellation" feel)
- **Footer grid**: 4 equal columns on desktop, collapses to single column accordion on mobile

### Whitespace Philosophy
The system treats whitespace as structure, not absence. A typical service section has:
- A ghost headline occupying the top ~40% of the section (mostly empty cream)
- A single circular portrait positioned ~60% down, asymmetric to left or right
- ~300–500px of blank canvas between the portrait and the next section

This deliberate emptiness tells the eye "slow down, read one thing at a time", the opposite of dense dashboard UIs.

### Border Radius Scale

| Radius | Use |
|--------|-----|
| 3–6px | Tiny decorative elements, consent banner micro-chips |
| 20px | Primary and secondary body CTAs (the signature button radius) |
| 24px | Consent/orange pill buttons, modal inner chips |
| 40px | Hero media frames, large section container corners, H2 pill labels |
| 50% | Circular portraits, icon-only buttons, satellite CTAs |
| 99px / 999px / 1000px | Full pill shapes: navigation, carousel cards, footer country selector, primary inline chips |

The scale is unusual: most systems use 4/8/12/16. This one skips those and commits to **either small (≤6), medium-large (20–40), or full-pill (99+)**. The middle ground of 8–12 is absent, which is why the UI feels either "precise and utility" or "soft and editorial" with no in-between.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | No shadow | The default. 95% of surfaces sit directly on cream canvas |
| 1 | `rgba(0, 0, 0, 0.04) 0px 4px 24px 0px` | Floating nav pill, barely-there lift |
| 2 | `rgba(0, 0, 0, 0.08) 0px 24px 48px 0px` | Hero media frames, elevated cards. A soft large-radius halo rather than a hard drop |
| 3 | `rgba(0, 0, 0, 0.25) 0px 70px 110px 0px` | Rare; dramatic elevation on a feature tile |

### Shadow Philosophy
Shadows act as **atmospheric cushioning**, not directional light. The Level 2 shadow has a 48px spread and only 8% opacity. It barely exists as dark pixels but creates a "the card is breathing above the canvas" feel. There are almost no hard-edged, tight shadows anywhere in the system. Border lines are preferred over shadows for functional delineation (form inputs, footer divider).

### Decorative Depth
- **Orbital arcs** (Light Signal Orange, ~1px): trace connective paths across sections
- **Ghost watermark headlines**: cream-on-cream text gives sections an almost-pressed-paper quality
- **Circle-image fade**: warm-toned photography at the edge of circular portraits dissolves into the canvas, implying soft atmospheric depth

## 7. Dark Mode

The dark variant inverts surfaces while preserving the accents and the orbital motif. The type scale, spacing system and radius scale are untouched. Only color tokens and a handful of component fills change.

### Surface Ladder
- **Dark Canvas** (`#0E0E0D`): Deepened ink. The default body background in dark mode.
- **Lifted Surface** (`#1A1A19`): Cards and nested containers, one step above canvas.
- **Raised Surface** (`#252523`): Input surfaces and secondary elevated blocks.
- **Deep Well** (`#050505`): Footer surface and framed media backgrounds.

Note the structural shift: the light system's three-tone rhythm (canvas cream, lifted cream, ink footer) becomes a four-step ladder here, and the footer no longer inverts. It goes *deeper* than the canvas rather than darker-than-light, which is what keeps it reading as a destination instead of dissolving into the page.

### Text & Border Tiers
- **Primary Text** (`#FFFFFF`): Headlines and primary text on all dark surfaces.
- **Body Text** (`rgba(255,255,255,0.85)`): Reading paragraphs. Slightly dimmed white.
- **Muted Text** (`rgba(255,255,255,0.6)`): Secondary labels, captions, footer columns.
- **Dust Text** (`rgba(255,255,255,0.4)`): Whisper and disabled content. The dark counterpart to Dust Taupe.
- **Soft Border** (`rgba(255,255,255,0.12)`): Translucent borders around cards and inputs.

### Accents (unchanged from light)
- **Signal Orange** (`#CF4500`): The same consent color regardless of theme. Do not lighten it for dark mode.
- **Light Signal Orange** (`#F37338`): Carousel indicators and decorative orbital arcs.
- **Clay Brown** (`#9A3A0A`): Secondary link-style actions.
- **Link Blue, dark** (`#6C8EE0`): Lifted from `#3860BE` so inline links stay readable on dark canvas. This is the only accent that shifts between themes.

### Component Overrides

**Buttons**
- **Primary, White Pill**: background `#FFFFFF`, text Ink Black (`#141413`), border 1.5px, radius 20px, padding 6px 24px, 16px / weight 500 / -0.32px tracking. The ink pill simply inverts.
- **Secondary, Outlined Pill**: background transparent, text `#FFFFFF`, border 1.5px solid white, radius 20px, padding 6px 24px, 16px / weight 450.
- **Consent, Signal Pill**: unchanged. Background `#CF4500`, white text, radius 24px, padding 1px 30px, 13px / weight 400 / +0.13px tracking.
- **Satellite, Circular Micro-CTA**: unchanged. White fill, ink arrow, radius 50%, 56px.
- **Icon, Round Outline**: background transparent, border 1px solid white, radius 50%, 48px.

**Cards**
Same three signature shapes. The Stadium Hero Frame takes a Lifted Surface fill with a Soft Border and a wide low-opacity shadow. The Full-Pill Editorial Row sits on Raised Surface (`#252523`). Borders do the work of lifting a card off the canvas here, because shadows alone vanish against dark surfaces.

**Inputs & Forms**
The 999px pill radius is kept. Default border is 1px `rgba(255,255,255,0.35)`. Focus firms to 1.5px solid `#FFFFFF` with the outline removed. Error state shifts the border to Signal Orange. Textarea keeps its 20px radius.

### Elevation in Dark

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | Border only, sits flush on canvas | The default |
| 1 | `0 4px 24px / 0.4` | Floating nav pill |
| 2 | `0 24px 48px / 0.5` | Hero frames, elevated cards |
| 3 | `0 70px 110px / 0.6` | Rare; dramatic elevation on a feature tile |

Shadow opacity climbs from the light system's 0.04–0.25 range to 0.4–0.6, because low-opacity shadows are invisible on a near-black canvas. The spread values stay wide, so the atmospheric quality survives. Borders carry most of the separation work and shadows handle only the float.

### Unchanged in Dark
- The full type scale: sizes, weights, tracking and line heights all carry over. Only color tokens change
- The 8px base unit, the spacing scale, section rhythm and gutters
- The entire border radius scale. It is theme-agnostic
- Circular masking, satellite CTA placement, and the orbital motif

## 8. Do's and Don'ts

### Do
- Use Canvas Cream (`#F3F0EE`) as the default body background, never pure white
- Mask service/feature imagery as perfect circles, not rectangles or rounded rectangles
- Attach a white satellite CTA to the bottom-right of each circular portrait
- Set headlines in Sofia Sans weight 500 with -2% letter-spacing
- Use weight 450 (not 400) for body paragraphs
- Keep primary CTAs as Ink Black pills (20px radius) with cream text
- Use Signal Orange only on consent, legal, or compliance actions
- Float the nav as a rounded white pill below the viewport top, not flush at y=0
- Build page rhythm from three surface tones: canvas cream, lifted cream, ink footer
- Use thin Light Signal Orange arcs between service cards to imply connection

### Don't
- Don't use pure white as a page background. It breaks the warm editorial tone
- Don't round image frames at 8–16px. This system uses full-pill, 40px, or full-circle. In-between radii look generic
- Don't use Signal Orange for marketing CTAs. It reads as consent orange and dilutes the legal color signal
- Don't mix typefaces. No serif accent, no script, no secondary display font
- Don't crowd the nav with more than six top-level links. The pill is meant to feel airy
- Don't drop hard shadows. All elevation should use 48px+ spread and ≤10% opacity
- Don't use uppercase for anything larger than the 14px eyebrow label
- Don't omit the tiny accent dot before eyebrow labels. It's the identity
- Don't place circular portraits on a grid. Their magic comes from asymmetric placement

## 9. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | ≤ 767px | Nav pill shows wordmark, menu and search only; primary links hide behind hamburger; service portraits stack single-column centered; hero headline drops from 64px to ~40px; footer columns collapse into a vertical accordion |
| Tablet | 768–1023px | Nav pill shows 2–3 primary links truncated; service portraits arrange 2-up; hero headline ~48px |
| Desktop | ≥ 1024px | Full nav with 5 primary links centered; service portraits asymmetrically placed with decorative orbital lines; hero headline 64px |
| Wide | ≥ 1440px | Content max-width caps at ~1280px; gutters grow symmetrically; orbital lines extend further |

### Touch Targets
All interactive elements comfortably exceed 44×44px. The satellite CTA (circle plus arrow) is ~50–60px. The nav pill buttons are ~48px tall. Mobile hamburger and search are 48×48px. No link or button drops below 40px in any breakpoint.

### Collapsing Strategy
- **Nav**: full pill to compact pill with hamburger. Pill shape is preserved across breakpoints, always rounded, always floating.
- **Service grid**: asymmetric constellation to 2-up to 1-up stack. Orbital arcs are removed on mobile (they only work with asymmetric placement).
- **Spacing**: section vertical padding compresses from 128px to 48px on mobile.
- **Content**: two-column hero (headline left / supporting text right) becomes stacked (headline on top, supporting text below).
- **Footer**: 4 columns to 1 column accordion with chevron toggles per section.

### Image Behavior
Circular portraits scale proportionally (maintaining the perfect circle at every size). Hero video frames maintain their 40px radius at every breakpoint, but the frame itself shrinks with the viewport. Lazy loading is standard with a cream-tinted blur-up placeholder, preserving the palette during load.

## 10. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: "Ink Black (`#141413`), the warm near-black used for primary pill buttons and footer"
- Background: "Canvas Cream (`#F3F0EE`), warm putty body canvas, never pure white"
- Lifted surface: "Lifted Cream (`#FCFBFA`), one step lighter than canvas for nested sections"
- Heading text: "Ink Black (`#141413`)"
- Body text: "Ink Black (`#141413`) at weight 450"
- Muted text: "Slate Gray (`#696969`)"
- Signal / Consent: "Signal Orange (`#CF4500`), reserve for cookie consent and legal actions"
- Accent arc: "Light Signal Orange (`#F37338`), orbital decorative lines only"
- Border / Outline: "Ink Black at 1.5px for pill buttons; 1px at low opacity elsewhere"
- Footer: "Ink Black (`#141413`) with White text"

### Quick Color Reference (Dark)
- Background: "Dark Canvas (`#0E0E0D`), deepened ink body surface"
- Lifted surface: "Lifted Surface (`#1A1A19`) for cards and nested containers"
- Raised surface: "Raised Surface (`#252523`) for inputs and secondary blocks"
- Footer: "Deep Well (`#050505`), deeper than the canvas, not lighter"
- Primary CTA: "White (`#FFFFFF`) pill with Ink Black (`#141413`) text"
- Heading text: "White (`#FFFFFF`)"
- Body text: "`rgba(255,255,255,0.85)` at weight 450"
- Muted text: "`rgba(255,255,255,0.6)`"
- Border / Outline: "Soft Border (`rgba(255,255,255,0.12)`) on cards; `rgba(255,255,255,0.35)` on inputs"
- Inline link: "Link Blue dark (`#6C8EE0`), lifted for legibility"
- Signal / Consent: "Signal Orange (`#CF4500`), identical in both themes"

### Example Component Prompts
- "Create a circular portrait card 300px in diameter, with a square photograph cropped to a perfect circle. Attach a 56px white satellite button with a dark arrow icon at the bottom-right, so it protrudes ~40% outside the portrait. Below the portrait, add an eyebrow label with a Light Signal Orange dot and uppercase 'SERVICES' text in Sofia Sans weight 700 at 14px. Below the eyebrow, set a 24px / weight 500 title in Ink Black."
- "Design a primary CTA button: Ink Black (`#141413`) background, Canvas Cream (`#F3F0EE`) text, 20px border-radius, 6px vertical and 24px horizontal padding, Sofia Sans at 16px weight 500 with -2% letter-spacing."
- "Build a floating navigation pill: white background with `rgba(0, 0, 0, 0.04) 0px 4px 24px 0px` shadow, 999px border-radius, ~16px vertical and 40px horizontal internal padding. Position it 24px below the viewport top, centered, with the wordmark at the left, five primary links centered with 48px gap, and a circular 48px search button at the right."
- "Create a hero media frame: 40px border-radius on all corners, full viewport width minus 48px gutters, ~60% viewport height, dark background for video content. Place it directly on the cream canvas with no shadow."
- "Design a footer: Ink Black (`#141413`) background, white text, 4-column link grid with uppercase muted column headers at 14px weight 700 +4% tracking. Include a large conversational H2 above the grid, a 1px white-at-30%-opacity horizontal divider below, and a bottom row with copyright, legal small-print links, a pill-shaped country selector, and four social icons."

### Iteration Guide
When refining existing screens generated with this design system:
1. Focus on ONE component at a time. Don't redesign multiple surfaces in parallel
2. Reference specific color names AND hex codes from this document
3. Use natural language ("warm putty cream", "stadium pill", "circular portrait with satellite CTA") alongside technical values
4. Describe the desired "feel" (editorial, soft, institutional) alongside specific measurements
5. When in doubt, reach for one of three radii: 20px (buttons), 40px (hero/stadium), or 999px (pill/nav)
6. Default backgrounds to Canvas Cream (`#F3F0EE`), not white. This single change shifts the entire mood toward the system's intended tone

### Known Gaps
- Tablet behavior (768–1023px) is specified by interpolation between the mobile and desktop rules; intermediate layouts may need per-section decisions.
- The exact "whisper" cream tone used for ghost-watermark headlines behind circular portraits sits somewhere between `#E8E2DA` and `#D1CDC7`. Pick one value per section and stay consistent within that section.
- The 450 body weight requires a variable font build. If the project ships static weights only, document the 400-plus-tighter-tracking fallback explicitly so it doesn't drift.
- Dark mode does not specify a ghost-watermark value. The cream-on-cream effect has no direct equivalent on a near-black canvas, so that treatment needs its own dark value before it can be used. White at very low opacity (~0.06) is the obvious starting point but is unverified.
- Dark mode keeps Light Signal Orange (`#F37338`) for orbital arcs at 1–1.5px. On a `#0E0E0D` canvas a hairline at that chroma is prone to shimmer on lower-density displays. Test before committing, and consider 1.5px as the floor rather than 1px.
- No data-dense or tabular component patterns are defined. The whitespace philosophy here actively fights dashboard density, so those surfaces need a separate companion spec.

---

# Appendix A: Form Surfaces Derived for Snapshot

Everything above describes a marketing page. Snapshot is a settings panel, and
section 10 of this document says so directly:

> No data-dense or tabular component patterns are defined. The whitespace
> philosophy here actively fights dashboard density, so those surfaces need a
> separate companion spec.

This appendix is that companion spec, kept here rather than in a separate file
so the two cannot drift apart. It records what was derived while building
Snapshot and, for each, which rule above it was derived from. Implemented in
`packages/core/src/`.

## Taken verbatim, no derivation needed

| Snapshot use | From | Value used unchanged |
| --- | --- | --- |
| page canvas | Canvas Cream | `#F3F0EE`, never white |
| panel card | Lifted Cream | `#FCFBFA`, "paper laid on paper" |
| card corners | large section container | 40px |
| nav rail, save bar | floating nav pill | white, elevation 1 shadow, floats clear of the edge |
| nav rail corners | large container | 40px, not 999px, see below |
| active nav item | "no pill surround until active" | the pill appears: ink fill, cream text |
| primary button | Ink Pill | ink fill, cream text, 1.5px ink border, 20px radius |
| secondary button | Outlined Pill | white fill, ink text, 1.5px ink border, 20px radius |
| section label | Eyebrow | 14/700/+4% uppercase, with the accent dot |
| body copy | Body paragraph | 16px at weight 450 |

## Two colors added to the palette

The palette has no error or success color. A settings panel needs both: a
failed save has to read as failure at a glance, and color is the usual first
cue for that.

Signal Orange was not reused. This document reserves it for consent and
compliance and states that keeping it exclusive is what preserves it as a legal
signal rather than decoration. Saving settings is not a legal action.

Both additions sit in the same earth family as Clay Brown rather than reading as
generic UI red and green, and both were measured rather than chosen by eye:

| token | hex | vs Canvas Cream | vs Lifted Cream | vs White |
| --- | --- | --- | --- | --- |
| error | `#A3231B` | 6.58 | 7.22 | 7.46 |
| success | `#2A5F46` | 6.55 | 7.20 | 7.44 |

For comparison on the same canvas: Clay Brown 6.20, Slate Gray 4.84, Signal
Orange 4.11. Both additions clear AA comfortably at body size.

## Form controls, derived

This document specifies one input, the nav search field, and it is used as the
precedent: white fill, 1px ink border at low opacity, pill radius, generous
horizontal padding.

**Text input.** White fill on the lifted card, pill radius, ink border at 40%
opacity, 24px horizontal padding, 48px tall. The height follows the stated
minimum for nav controls and sits above the "no control drops below 40px" floor.

Pill rather than a moderate radius because the radius scale is deliberately
gapped: this document commits to small, medium-large, or full pill, and calls
the 8 to 12px middle ground absent. A 48px control at 20px radius reads as a
lozenge rather than a field, so it takes the pill step.

**Label.** 14/700, the h4 subhead step. Not the eyebrow, which is the same size
but uppercase, and this document restricts uppercase to that one role.

**Hint.** 14/450, the footer-link step, in Slate Gray.

**Disabled.** Bone fill with Dust Taupe text, which is this document's
designated whisper and disabled color, and an ink border dropped to 15%.

## Vertical rhythm, derived

Section 5 gives the base unit, the scale, and spacing for a marketing page:
96 to 128px between major sections, 32 to 40px of card padding, a 24px nav top
margin. It says nothing about vertical rhythm inside a form, and nothing at all
about a vertical navigation, because its only nav is a horizontal pill. Both
had to be derived.

The rule, which is the part worth remembering: **the gap states how weakly two
things are related.** Four steps, all from the document's own scale.

| Step | Means | Used for |
| --- | --- | --- |
| 8px | parts of one thing | label to its control, control to its hint, one nav item to the next |
| 24px | peers in a list | field to the field below it, one nav group to the next |
| 32px | separate things | card to card, section header to its body, field to the field beside it |
| 48px | the page's own margin | the panel column's top and bottom padding |

**16px is deliberately absent between 8 and 24.** It is on the scale and it is
skipped here for the same reason the radius scale skips 8 to 12: a step that
close to its neighbour makes the reader work out whether two things are related
or merely near each other. Three clearly different steps carry more meaning
than five similar ones.

Two consequences worth stating, because both were got wrong first.

**The horizontal field gap is larger than the vertical one**, 32px against
24px. Fields stack by default, so a vertical gap only has to separate one row
from the next; a horizontal gap has to stop two adjacent fields reading as one
run of controls, which takes more.

**A nav group needs 24px above it and nothing else.** The eyebrow is the only
separator the rail has: there is no rule, no divider, no change of surface.
Without that gap the groups touch and read as one list. 32px was considered and
rejected. At thirteen groups it adds close to 400px of
scroll, for a legibility gain the uppercase, the +4% tracking and the accent
dot have already bought.

One alignment rule goes with it. The group label's accent dot hangs into the
gutter rather than indenting the label, so the label text and the link text
below it sit on the same vertical axis. An indented label reads as a different
level of hierarchy, which is exactly what a group heading is not.

## Two states invented, because none are specified

**Focus ring:** 2px Ink Black outline at 2px offset.

Ink rather than Signal Orange, because the orange is reserved and focus is
neither consent nor compliance. Ink is the system's anchor and clears 16.25:1 on
canvas, so 2px is unmissable without introducing a color the palette lacks.
`outline` rather than `box-shadow`, so a focus ring does not read as one of the
four elevation levels. Applied as `:focus-visible`, so keyboard users get the
ring and mouse users do not.

**The ring inverts on an ink fill, and only there.** 16.25:1 is the number on
canvas; on the ink pill the rail's current item takes it is 1:1, and the rail
insets its ring rather than offsetting it, because a closed group's fold clips
anything drawn past an item's edge. So the current item's ring is drawn in
canvas, the pill's own text color, which inverts with the theme alongside it.
Everywhere the ring sits outside its control, as the buttons' 2px offset does,
ink on an ink pill still reads against the page behind it and nothing changes.

**Dirty field indicator:** 1.5px Light Signal Orange border, plus a
"• CHANGED" chip on the label in Clay Brown.

Light Signal Orange is this document's decorative attention cue, used for
orbital arcs and carousel indicators and described as "always an attention cue,
never body color". A border is not body color, so an unsaved field borrows the
signal the system already uses to mean "look here". The chip reuses the eyebrow
pattern, accent dot included, because color alone is not a sufficient cue.

## Three places this deviates, with reasons

**The nav rail is 40px, not 999px.** This document's navigation is a full pill,
but that spec describes a short horizontal bar. A 999px radius on a tall narrow
column produces a lozenge with unusable corners. 40px keeps the soft register at
the right scale.

**The page header has no rule beneath it.** This document has no horizontal
header band and no dividers outside the footer; its rhythm comes from tone and
whitespace, not lines.

**The form column is 880px, not the 1200 to 1280px content cap.** That cap is
specified for a 12-column marketing grid. A settings form at that width pushes
each input far past a comfortable reading measure.

## What the implementation enforces

Two rules from this document are enforced by the build rather than left to
memory, so breaking them is a build error rather than a review comment:

- **The absent radius middle.** Tailwind's default radii all land in the 8 to
  16px range this document rejects, so they are cleared. `rounded-lg` compiles
  to nothing.
- **The single type scale.** Tailwind's numeric text sizes are cleared, so
  `text-sm` cannot sit beside `text-body` as a second, off-system spelling.

## Dark mode, and what it left for this appendix

Section 7 now specifies dark mode. Its surface ladder, text tiers and the lift
of Link Blue were measured before adoption and hold up:

| tier | on canvas | on lifted | on raised | on well |
| --- | --- | --- | --- | --- |
| Primary text, white | 19.31 | 17.42 | 15.36 | 20.38 |
| Body, white 85% | 13.95 | 12.82 | 11.41 | 14.58 |
| Muted, white 60% | 7.29 | 6.90 | 6.45 | 7.33 |
| Light Signal Orange | 6.73 | 6.07 | 5.35 | 7.10 |
| Link Blue dark `#6C8EE0` | 6.05 | 5.46 | 4.81 | 6.39 |

Lifting Link Blue was necessary rather than cosmetic: the light `#3860BE`
measures 2.62 to 3.48 on these surfaces and would have failed AA everywhere.

Three things that section does not resolve, all found by measuring it.

**The two derived semantic colors have no dark variants, and the light ones
fail badly.** `#A3231B` and `#2A5F46` measure 2.06 to 2.74 on the dark ladder,
because they were chosen for a cream canvas. Dark variants, measured the same
way and landing in the same band as Light Signal Orange:

| token | light | dark | dark worst case, on Raised |
| --- | --- | --- | --- |
| error | `#A3231B` | `#E8705F` | 5.06 |
| success | `#2A5F46` | `#5AAC80` | 5.59 |

**Clay Brown is listed as unchanged in dark, and it should not be.** It carries
"secondary link-style actions", but `#9A3A0A` measures 2.18 to 2.90 on the dark
ladder, well under the 4.5 a link needs. It is the one accent in that list that
does not survive the theme switch.

Resolved, because Snapshot does use it: the "CHANGED" chip on a dirty field is
Clay. The dark value is **`#D9925F`**, measuring 7.57 / 6.82 / 6.02 / 7.98 on
canvas / lifted / raised / well.

Lifting it along its own hue, the way Link Blue was lifted, does not work here.
Clay is hue 20 at 88% saturation, and raising only its lightness lands on
`#F16E2C`, which is Light Signal Orange to the eye. Those two carry different
meanings and both appear on a dirty field at once: the border is Light Signal
Orange and the chip beside it is Clay. The value above is hue 16 at 60%
saturation, which keeps the earth character and sits 29 dE from Light Signal
Orange, matching the 28 dE those two have in light.

**Soft Border is specified for "cards and inputs" and only works for cards.**
White at 12% measures 1.42 against Lifted Surface, far below the 3:1 WCAG 1.4.11
asks of a control boundary. The same section separately gives inputs a 1px white
35% border, which measures 3.14 and does clear it. The input value is the
correct one; the "and inputs" in the Soft Border line is the error.

## Two surfaces the theme switch needed

**A hairline that is transparent in light.** Section 7 gives dark cards a Soft
Border because the tone step from `#0E0E0D` to `#1A1A19` is too small to read on
its own, while light cards separate by tone alone and carry no outline. Both are
right, and expressing it as a border that is present in one theme and absent in
the other would reflow the box by 1px on every switch. It is one token instead,
`--color-hairline`, transparent in light and white 12% in dark, so the border is
always there and only sometimes visible.

The menu popup is the exception and keeps a visible hairline in both themes: it
is a float surface opening over the nav rail, which is also a float surface, so
in light it is white on white and the shadow alone does not close the shape.

**A scrim, which is not a palette color.** The mobile drawer's scrim was Ink
Black. Ink inverts to white in dark mode, which would have made the scrim
lighten the page it covers. Dimming is what the component is for in both
themes, so it takes Deep Well (`#050505`) fixed, at 0.4 in light and 0.65 in
dark. The opacity step follows the same reasoning as the elevation table: a
near-black page needs more of it to register.

## Still missing

No specification for: tooltip, empty state, or loading state. Each needs the
same derive-and-record treatment as it arrives.

Tabs arrived with the Design panel's Colors card and are derived in
the tabs component CSS: the segmented control's row of 40px pills in a padded
track with 24px corners, and the ink pill for the selected tab. The track is
canvas with no control boundary, because a tab switches what is shown and holds
no value, so it should not read as a field.

Textarea, select, checkbox, radio, toggle, color, media, multi-select and rich
text are now all derived and demonstrated in the component library, which is
the working reference rather than a second written spec.

Third-party surfaces get the same treatment through their own theming
variables rather than through overrides of their internals. The rich text
editor is the first: its border, radius, palette and focus ring are set from
Snapshot tokens through the editor's own variables, so the container owns the
boundary and the editor inherits it in both themes.

Radio is now specified by use rather than by the document: the appearance choice
in the account menu is two native radios styled as full-pill rows, selected
state as the ink pill the nav already uses for its active link, plus a check
glyph so color is not the only signal. Toggle arrived later as a switch: a
stadium track with a round thumb, the pill vocabulary again, for a setting
that is simply on or off.

## Page composition, derived

Section 5 gives a marketing page's grid: a 1200 to 1280px centred column, 2-up
asymmetric blocks, and a whitespace philosophy that says outright it "actively
fights dashboard density". None of that survives contact with dozens of
settings panels, so page composition had to be derived like the form surfaces
above it.

### What the predecessor did

Worth stating because it is easy to mistake for a system. Across the previous
settings app's twenty-six pages, **twenty-five are a single column of cards**
and **one** is two-column, laid out with CSS multi-column
(`columns-1 sm:columns-2` with `break-inside-avoid`).

CSS columns are the wrong tool for a settings page, for a reason that is not
about taste. **Placement is a consequence of content height, not a decision.**
Which card lands beside which is whatever the packing algorithm produces, so it
changes when anyone adds a field, and two panels built the same way do not look
related. It is also why the pattern appears once: it cannot be applied
predictably, so nobody applied it again.

### The evidence the layout has to satisfy

Form research is consistent and points one way. A single-column form is
completed measurably faster, 15.4 seconds in the CXL study of 702 participants,
and Baymard finds multi-column layouts cause users to skip fields or complete
the wrong ones, because there is more than one reasonable reading of which
field comes next.

The complication is that Snapshot is two tasks in one surface. Initial setup is
a form, filled top to bottom, and the research applies directly. Every visit
after that is a find-and-change, where the user is scanning for one setting,
and a single 4000px column is the worst possible shape for scanning.

The resolution is to separate the two levels. **Cards are for scanning, fields
are for filling.**

### The rule

**A card takes all of the workspace, half of it, or a third beside two thirds.
Widths only ever pair.**

Pairing is what produces harmony across many panels: two halves close a
row and so do a third and two thirds, so every row tiles exactly. A width free
to sit beside any other tiles only in some combinations, which is how a set of
pages drifts into looking hand-arranged.

**Which width is derived, not chosen, and the test is how many field columns
the content wants. One column, half. Two or more, full.**

**A third is the one card that test does not size.** It holds one small choice,
a pair of cards or a switch, that decides what the card beside it holds, and
that card takes the other two thirds. The worked example is a menu editor: where the
menu comes from is a third, and the builder it switches on sits beside it. As
two full width cards the choice was a near empty band and the builder's rows so
wide that their buttons sat a screen away from their names. A third is about
330px at the 1440px entry, which is room for a choice and not for fields, so a
third never holds a form. A two thirds card can also span two rows beside two
one third cards stacked on top of each other, when both decide what it holds: the menu editor
stacks the source over the list of menus on the left, and the builder spans
both rows on the right.

So width is spent at exactly one level per card: a half card is a single column
of fields, and a full card is where multiple field columns live. A half card at
the 1440px entry is about 540px, which fits one comfortable field and not two,
so a half card that paired its fields would produce exactly the cramped columns
Baymard warns about.

Counting columns rather than counting fields is the part that matters. A field
count is a proxy and proxies drift: fourteen color swatches want four columns
while fourteen addresses want one.

| | |
| --- | --- |
| Half | one column of fields. Engages at 1440px, stacks below it |
| Third | one small choice, beside the two thirds card it governs. Engages at 1440px, stacks below it |
| Two thirds | what the third beside it switches on or decides |
| Full | two, three or four field columns. Always a repeating slot group or rich text |

**Cards in a row keep their own heights.** `align-items: start`, not stretch. A
row reads as a row, and the leftover space under a short card reads as the
whitespace section 5 asks for. Stretching would make every card in a row end in
dead space.

### Previews

A setting gets a preview when its effect is visual and cannot be read off the
value. "Poppins" does not tell you what Poppins looks like; a phone number
needs no preview because the value is the thing.

This matters most in a settings panel whose saved values reach the site only
after a rebuild, where the round trip from changing a font to seeing it is
minutes. **A preview is then the only feedback available in between.**

One rule governs them: **a preview must be true.** A font preview that renders
in the panel's own font rather than the chosen one is worse than no preview,
because it reads as a promise the panel does not keep. The font preview
loads the selected family on demand so the sample is the setting rather than a
description of it.

The preview frame takes 24px, one step down from the section's 40px, as
everything set in a section does; see Nested radii below. 6px would read as a
utility chip rather than as a panel.

## Nested radii, derived

This document gives the radius scale but not what happens when one rounded
surface sits inside another, and a settings panel does that constantly: a
field's frame inside a section, a picture inside a card, an option inside a
popup.

**Rounded inside rounded takes the next step down the scale.** An inner corner
sharper than its frame reads as a box dropped in, and one as round as its frame
reads as swollen. Both shipped: a 6px picture in a 24px card, and 24px icon
options in a 24px popup.

| holder | what it holds | examples |
| --- | --- | --- |
| 40px | 24px | a section's field frames, cards, lists, previews and code blocks; a dialog's search results, file tiles, file list and drop zone |
| 24px | 20px | a card's picture, an image field's preview, the rich text source view, a popup's options and time boxes, a file tile's picture, the slot switcher's tabs |

Should anything ever sit inside a 20px part, it takes 6px.

**Where a ladder starts.** A panel section, a dialog and the rail are 40px. A
field frame, a card, a list and a popup are 24px, the step under that, and
keep it wherever a panel places them, a card inside a master-detail list included. Stepping
a control down inside a card would draw one control two ways on two panels,
and push its preview to 6px, the chip look the preview is there to avoid. So
the rule runs from a holder to what is placed in it, and from a control to its
own parts, never on down through every level.

**What takes no step.**

- **Pills and circles.** They are shapes rather than sizes: buttons, text
  inputs, chips, nav items, avatars and calendar days keep theirs wherever they
  sit, and a pill imposes no step on what it holds.
- **Floating surfaces.** A popup, menu or toast sits above the page rather than
  in it, so it takes 24px wherever it opens and its parts step down from there.
- **Text-sized chips and checkboxes.** A key, an inline code sample, a
  tooltip, a badge or a checkbox keeps 6px, since at a larger radius it would
  turn into a pill.
- **Anything flush with its holder's edge.** It is clipped to the holder's own
  corners rather than rounded, as the picture at the top of a file tile
  is.

## Where each text color may go, derived

The palette states that Taupe is "disabled and whisper" text and that Slate is
secondary, but it gives no test, so the restriction was broken three times in
the first two panels: a preview's eyebrow label and two empty states were all
set in Taupe. Every one of them is text the reader has to read.

Measured on the three surfaces a panel actually uses:

| | Bone | Lifted | Canvas Cream |
| --- | --- | --- | --- |
| Ink | 16.76 | 17.84 | 16.25 |
| Charcoal | 13.75 | 14.63 | 13.33 |
| Granite | 6.78 | 7.21 | 6.57 |
| Clay | 6.40 | 6.81 | 6.20 |
| Slate | 4.99 | 5.31 | 4.84 |
| Signal | 4.24 | 4.51 | 4.11 |
| **Taupe** | **1.44** | **1.53** | **1.40** |

**The test: does the reader need to read it?**

If yes, it cannot be Taupe, whatever its size or weight. Taupe fails AA at
every size on every surface in this system, so there is no combination that
rescues it.

| Text | Color |
| --- | --- |
| A label, a hint, an eyebrow, an empty state, a helper sentence | Slate |
| The same, where the type is small and uppercase and wants headroom | Granite |
| A value, a title, a field label | Ink |
| Placeholder text, a disabled control, an unset indicator | Taupe |

Signal Orange is 4.24 on Bone and therefore fails AA for body text, which is a
second reason beyond its reservation for consent not to reach for it.

### Accent colors carry meaning inside a panel, not just outside it

Clay Brown is the unsaved-change color: the field component sets the
"CHANGED" chip in it. That makes Clay unavailable for decoration anywhere in
Snapshot, because a clay word inside a card reads as a field that needs saving.
An early header preview used Clay for a sample brand mark and had exactly
that problem.

The same holds for the three colors already reserved by section 2: Signal
Orange for consent, Error for a failed save, Success for a saved one. What is
new here is that **the reservation extends to sample content**. A preview
showing what the user's site looks like still sits inside the panel and is
read with the panel's vocabulary.

Where a preview needs to show hierarchy, it uses the neutral tiers, Ink against
Slate. Where a preview needs to show the user's actual brand colors, it
reads them from the fields being edited rather than borrowing from Snapshot's
own palette.

---

# Appendix B: Library derivations

Everything above was derived for one settings app. This appendix records what
changed when the system became a general component library: the rule each
change comes from and, where a color is involved, what it measures. Components
add their own sections here when they are built.

## Token names

Token names follow the app's names so a value can still be traced to this
document. Four were renamed because they described a marketing page:

| App name | Library name | Why |
| --- | --- | --- |
| `--radius-button` 20px | `--radius-control` | It rounds tiles and rows that light up as well as buttons. |
| `--radius-consent` 24px | `--radius-surface` | In an app it is the card, popup and field-frame step. |
| `--text-footer-link` | `--text-small` | It is the hint and helper text step. |
| `--text-footer-header` | `--text-overline` | Uppercase column headers in tables and stat tiles. |

Three values have no name in the document, so the library gives them one:

- `--font-mono` is `ui-monospace`, `SFMono-Regular`, `Menlo`, then the generic
  `monospace`. It is for code only, and Sofia Sans stays the one family for
  every label and sentence.
- `--container-field` is 44rem (704px), the widest a single control grows. Past
  about 700px the eye has to travel too far from a label to the end of its own
  input.
- `--focus-ring-color` is ink, kept as one reference to `--color-ink` so every
  ring follows the theme and a theme can recolor them all from this one token.
  Each theme scope declares it again, since a variable that holds `var()`
  resolves where it is declared. A scope that sets `--color-ink` itself,
  outside the theme attribute, must set `--focus-ring-color` too, just as it
  would set `color`.

## Four colors added

All four are tokens with a light and a dark value, so no component mixes its
own.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `boundary` | ink at 50% | white at 50% | The edge of a control: inputs, checkbox and radio boxes, segmented tracks, a switch's off track. |
| `disabled` | `#F4F4F4` (Bone) | `#1A1A19` (Lifted Surface) | The fill of a disabled control. |
| `frame` | ink at 12% | white at 12% | The outline of a list, or of a float surface opening over another. |
| `divider` | ink at 10% | white at 10% | A rule inside a surface. |

**Boundary is the document's own value in light, and firmer in dark.** Section
4 gives the input border as "Ink Black at ~50% opacity". The app dropped it to
40%, which measures 2.58:1 on white, under the 3:1 WCAG 1.4.11 asks of a
control's edge. Section 7 gives dark inputs white at 35%, which clears 3:1 for
an edge, as Appendix A notes. The library uses 50% in dark too, because the
same token is a switch's off track: at 35% the dark thumb measures 2.84 against
it, and at 50% it measures 4.59. At 50%:

| Boundary against | Light | Dark |
| --- | --- | --- |
| the control's own fill (Raised) | 3.47 | 4.93 |
| a card (Lifted) | 3.36 | 5.59 |
| the page (canvas) | 3.06 | 6.20 |

A switch's off track uses the same value and measures 3.45 against a card in
light, where the app's 22% measured 1.61.

**Disabled is recessed in both themes.** The app used Bone, which in dark is
the same `#252523` as an enabled control's fill, so a disabled field looked
enabled. The dark value steps down to Lifted Surface instead.

The `hairline` color is the app's variable of the same name, unchanged. The
scrim's opacity is a token, `opacity-scrim`, 0.4 in light and 0.65 in dark.

The `scrollbar` and `scrollbar-hover` colors are the app's thumb colors: ink at
22%, and at 40% under the pointer, with white at the same strengths in dark.
The app mixed them from ink where it used them. The library writes the values
out, so no component mixes its own. Standard `scrollbar-color` has no hover
state, so `base.css` sets only the first.

## The shape axis

A site may cut every corner one of three ways from one attribute,
`data-shape`, which the app offered its clients as a site setting. Rounded is
the scale this document describes. Soft and Square are opt-in alternatives,
and Soft deliberately uses the 10 to 16px range this document rejects for
Rounded.

| Token | Rounded | Soft | Square |
| --- | --- | --- | --- |
| `--radius-micro` | 6px | 6px | 0 |
| `--radius-control` | 20px | 10px | 0 |
| `--radius-surface` | 24px | 12px | 0 |
| `--radius-stadium` | 40px | 16px | 0 |
| `--radius-pill` | 999px | 12px | 0 |
| `--radius-dot` | 50% | 50% | 50% |

Each scale descends, so the nested-radius rule holds in every shape. Dots never
change: a square radio would read as a checkbox, so roundness there is meaning.
No component writes a corner of its own, or the shape could not reach it.

## Rules every component follows

- **Nested themes reset text color.** A `[data-theme]` element sets
  `color: var(--color-ink)`. Inherited color is computed in the parent's theme,
  so without it a light card in a dark page keeps white text.
- **One cursor rule.** Every interactive control sets `cursor: pointer`, a
  disabled one `not-allowed` and a pending one `progress`. The app's buttons
  had none, because its reset removed it, while its choice controls had one.
- **An inset focus ring on an ink fill inverts to the canvas color.** The app did this
  for the current rail link only; the selected segmented option and the
  selected appearance row kept an ink ring on ink, invisible. Outset rings stay
  ink, which still reads against the page behind the fill.
- **Invalid outranks changed.** A field that is both shows the error border.
  The app showed the orange one, because its changed rule came later in the
  file.
- **Hover on a float surface is a 5% ink wash.** The app stepped Float to
  Lifted, which is the same color in dark, so the hover vanished there. The
  wash measures 1.10 in light and 1.14 in dark: a cue, not a boundary.
- **Reduced motion stops every transition**, except a spinner, which slows to
  a 2.4 second turn: a still spinner reads as finished.
- **Weights are 400, 450, 500 and 700.** No 600. Base styles turn off font
  synthesis, so a missing weight never renders as faux bold.
- **Minimum sizes:** 14px for sentences, 12px for short uppercase labels.
- **Touch targets stay at 40px.** A control drawn smaller extends its hit area
  with a pseudo-element, as the app's menu row buttons do.

## Spinner

The document specifies no loading state. This one is derived from the orbit,
the system's one moving shape.

- A 3px ring at 25% of the current color, with a quarter arc at full strength
  turning every 900ms.
- Round line caps. The ends of a stroke are dots, and dots stay round in every
  shape.
- It takes the color and size of the text around it, 1em, so inside a button it
  is the label's own color and needs no variant. Two fixed sizes serve standalone
  use: 24px, and 40px, the touch-target floor of whatever it stands in for.
- Under reduced motion it slows to a 2.4 second turn rather than stopping. A
  still spinner reads as finished.
- It is announced as an indeterminate progress bar named "Loading" unless it is
  given a name.

## Button

The document's Ink Pill and Outlined Pill become `primary` and `secondary`.
Two variants are added for an app:

- **Tertiary** is a borderless slate label that turns ink on hover, for the
  recessive action beside a primary, such as Cancel. It has no fill, so it
  never competes with the pill beside it.
- **Danger** fills with the error color for a destructive confirmation, such
  as Delete. Error keeps its meaning: a destructive action is the one place a
  button warns that something will be lost. Its canvas label is in the
  contrast gate in both themes. Signal Orange is not a variant; it stays with
  consent.

The document's 6px by 24px padding makes a 31px pill, and its own touch target
rule says no button drops below 40px, so the padding sets the shape and a 40px
minimum height sets the target. Secondary fills with Float rather than White,
so on a dark surface it is the document's dark secondary: the surface's own
fill with a white outline. A press shows the same color step as hover rather
than the document's compression, because touch has no hover to show it.

Pending keeps the fill and the width. The label turns invisible but stays in
the accessibility tree, a spinner named by `pendingLabel` sits over it, and
presses are ignored while focus stays. In dark the primary hover fill is
translucent, so the fill is clipped to the padding box: painted under the
border as well, the border band would read brighter than the pill.

A plain anchor or span that wears the `button` class and carries
`aria-disabled="true"` is drawn disabled, as a `button` element with `disabled`
is, and the one exception is a pending button, which React Aria marks
`aria-disabled` too and which keeps its fill.

## Typography

Heading, Text and Eyebrow are the document's hierarchy table with a class on
each row, so no size, weight or tracking here is new. These are the places the
library had to decide.

**The element and the look are two props.** `level` picks the element, `h1` to
`h4`, and `size` picks the type step, 1 to 4. `size` follows `level` unless it is
given. A page outline and a visual hierarchy are different things: a card title
is a small heading under the page's `h1`, and a hero line is a large heading
that is not the page title. If one prop did both, a heading would be picked for
its size and the outline would skip a level. `level` defaults to 2, because an
`h1` is once per page and the page decides where it goes.

**They are plain elements.** React Aria has a Heading, and it is the obvious
basis. It is a client module that exists to read a dialog's context, which
nothing here has, and type should work in a server component. So Heading is a
plain `h1` to `h4`, and Text and Eyebrow are a plain `p`, `span` or `div`. None
carries a client directive or imports React Aria.

**Headings scale down on small screens.** The document's responsive table says
the hero headline is about 48px on a tablet and about 40px on a phone. The
library makes that exact and carries it to the section step, which drops from
36px to 28px under 768px:

| Step | Token | 1024px and up | Under 1024px | Under 768px |
| --- | --- | --- | --- | --- |
| `heading-1` | `--text-h1` | 64px | 48px | 40px |
| `heading-2` | `--text-h2` | 36px | 36px | 28px |
| `heading-3` | `--text-h3` | 24px | 24px | 24px |
| `heading-4` | `--text-h4` | 14px | 14px | 14px |

The smaller sizes are in rem, so they follow the reader's browser font size as
the tokens do. Line height is a ratio, so it scales with the size and the 1:1
display step stays 1:1 at every width. A media query cannot read a custom
property, so the two widths are written out in `heading.css`. A test compares
them with `--breakpoint-md` and `--breakpoint-sm`, so they cannot drift. Under
768px the card title and the subhead are already small enough to stay.

**The class is `copy`, not `text`.** A class may not start with a Tailwind
namespace, and `text-` is one: `text-small` would collide in any app that also
uses Tailwind. Text renders `copy`, with `copy-small` and `copy-muted` added for
the small step and the muted tone. `copy` is the `--text-body` step, 16px at
weight 450, and `copy-small` is `--text-small`, 14px.

**Muted is slate, never taupe.** A muted sentence is still read, and the test in
"Where each text color may go" is whether the reader needs to read it. Slate on
canvas measures 4.84:1 in light and 7.26:1 in dark. Of the five grounds the
contrast gate already lists for hints and notes, canvas is the lowest in light,
and bone is the lowest in dark at 6.44:1. Slate clears 4.5:1 on all of them, so
no pairing was added. Taupe fails AA on every surface.

**Spacing is the layout's.** Each class sets `margin: 0`, so the default margin
of a paragraph or a heading never adds to a gap the layout already chose.

**The eyebrow is a label.** It is 14px, 700, +4% tracking, in capitals and in
slate, which is the document's eyebrow row set in the color its text-color test
gives an eyebrow. It renders a `p`, `span` or `div` and never a heading, because
it labels the heading beside it and is not an entry in the outline. It is
`inline-flex`, so a span sits inside a line of text. A label with no gutter
beside it takes the `eyebrow-inset` variant, or the `inset` prop of Eyebrow,
which keeps the dot inside the label's box.

**The eyebrow's dot is Light Signal Orange.** The document is split on the dot's
color. Its palette lists eyebrow dots among the uses of Signal Orange, and its
prompt guide asks for a Light Signal Orange dot. The library takes the second
reading, because Signal Orange is reserved for consent and an eyebrow is not
consent, and because the app's own page header already draws its dot in Light
Signal Orange. The dot is 6px, and it takes `--radius-dot`, so it stays round in
every shape. It is always lit. The app's rail group label greys its dot until the
group holds the current page, which is navigation state, and an eyebrow has none.

The dot measures 2.53:1 on canvas in light, under the 3:1 that WCAG 1.4.11 asks
of a graphic that carries meaning. It carries none: the label says everything
without it, and the dot is the system's mark. It is decoration, so it is not in
the contrast gate. In dark it measures 6.73:1.

**The dot hangs into the gutter.** It sits left of the label by its own width
plus the gap, 6px and `--spacing-part`, so the label text lands on the same
left edge as the content below it. An indented label reads as a different level
of hierarchy, which is what the rail's group label learned. Where a label has
no gutter beside it, a caller sets `margin-inline-start: 0` on
`.eyebrow::before` to keep the dot inline.

## Link

The document names Link Blue for inline links. The app never used it for one:
its inline links were Ink with an underline, written out again inside three
panels, with no hover and no focus style, so keyboard focus showed only the
browser's default ring. Link Blue appeared only in code highlighting. The
library draws one link and gives it the states the app left out.

- **Link Blue, underlined.** The text is `--color-link`, which is lifted in dark
  as the document specifies. Color alone does not tell a link from the words
  around it, so the underline always stays: 1px, offset 0.25em, which is 4px at
  body size and the app's offset, and it scales with the type.
- **Measured.** Link Blue is already in the contrast gate as text on canvas,
  lifted, float and raised, so a link is held to 4.5:1 on every surface a page,
  card or rail can be. It measures 5.16 to 5.86 in light and 4.81 to 6.05 in
  dark. No new pair was needed.
- **Hover and press thicken the underline to 2px.** The change is not
  color-only and does not move the text. The color stays put, so the measured
  pairs are the only ones in play. Press shows the same step as hover, because
  touch has no hover to show it.
- **Focus is the standard ring**, `--focus-ring-color` at the standard width
  and offset. The link takes the micro radius so the ring follows the link in
  every shape.
- **A disabled link is Dust Taupe** with the `not-allowed` cursor. It keeps its
  underline, so the word still reads as a link that is switched off, and hover
  does nothing. React Aria marks it with `data-disabled`; a plain anchor says it
  with `aria-disabled="true"`, as a button does, and gets the same look.
- **A long address wraps.** It breaks anywhere, so a link whose text is one long
  path cannot push a narrow screen sideways.
- **An inline link is exempt from the 40px target.** WCAG 2.5.8 excepts a link
  inside a sentence, and a 40px hit area would overlap the lines above and
  below it. A link used alone as a control, such as a menu entry, takes its
  height from the container it sits in.

## Kbd

The app drew its key hints twice: the rail's launcher key at 14px and the
search palette's keys at 11px. 11px is under the 12px floor for short labels,
so the library has one key, at 12px, that looks the same wherever it sits.

- Slate on Bone, the app's pairing. Slate on Bone is already in the contrast
  gate and measures 4.99 in light and 6.44 in dark.
- **The chip is a tint, not an edge.** Bone against the surface behind it
  measures 1.03:1 on canvas in light, and in dark it is the same color as
  raised, 1.00:1, so on those surfaces the chip has no shape of its own. The
  Slate text carries the key: 4.99:1 in light and 6.44:1 in dark.
- `--radius-micro`, the step the shape table gives key hints, so a key follows
  the shape axis.
- Weight 700 with the overline tracking, and tabular figures. Tabular figures
  keep a changing number steady, and nothing more: a key is as wide as its
  label.
- Sofia Sans. A browser gives `kbd` a monospace face; the library sets the sans
  family back, since a key is a label and `--font-mono` is for code only.
- The app hid its rail key from assistive technology, so the shortcut was not
  announced there. A key inside a sentence should be read, so the library adds
  no `aria-hidden`; a caller who does not want the key announced passes it.

## Badge

The document has no badge and the app drew none, so this one is derived. It
labels a state or a count beside a name. It is not a control, so it has no
hover, no focus ring and no touch target.

- **Outlined, not filled.** A badge is a 1px border and a label in the same
  color. A tinted fill would put the text on a ground of its own and add a
  pair to measure for every tone on every surface. With no fill the text sits
  on the surface behind the badge, and every pair is one the gate already
  holds. The border is a hairline's weight: a badge labels, it is not a control
  to be found, so it does not need the 1.5px edge a control gets.
- **Four tones.** Neutral is Slate, info is Link Blue, success is the success
  color and error is the error color. Neutral is the base, so it has no class
  of its own. Clay is unsaved work and Signal Orange is consent, and Light
  Signal Orange is an attention cue that a label has no use for, so none of the
  three is a tone.
- **A short uppercase label.** 12px, the floor for short uppercase text,
  weight 700 and the overline tracking. Figures are tabular, so a column of
  counts such as 12 and 8 lines up. The corners are `--radius-micro`, the step
  the shape table gives badges, so the shape axis reaches them.
- **Color is never the only signal.** The label says what the badge means. The
  tone only repeats it.
- **A long label wraps inside the badge.** It breaks anywhere, so no label can
  push a narrow screen sideways.

Measured as the text color on each surface a badge sits on, light then dark,
for canvas, lifted, float and raised in that order. The 1px border is the same
color as the text, so it clears the 3:1 that WCAG 1.4.11 asks of an edge by
the same margin. The lowest text pair is 4.81, info on raised in dark.

| Tone | Color | Light | Dark |
| --- | --- | --- | --- |
| Neutral | Slate | 4.84, 5.31, 5.49, 5.49 | 7.26, 6.94, 6.94, 6.44 |
| Info | Link Blue | 5.16, 5.67, 5.86, 5.86 | 6.05, 5.46, 5.46, 4.81 |
| Success | Success | 6.55, 7.20, 7.44, 7.44 | 7.03, 6.34, 6.34, 5.59 |
| Error | Error | 6.58, 7.22, 7.46, 7.46 | 6.36, 5.73, 5.73, 5.06 |

All sixteen pairs are in the contrast gate already, so Badge adds none. Slate
is also measured on Bone, 4.99 and 6.44, so a neutral badge may sit there. The
info and success tones are not measured on Bone, so they stay on the four
surfaces above. Error is gated on Bone too, because a field part draws it
there.

## IconButton

Section 4 gives the icon-only circle button as transparent or white, an icon
of 10 to 20px, a 1px ink border on cream or none over media, a 50% radius and
a 40px diameter at the least. The library keeps all of it and splits the two
looks into variants. The radius is `--radius-pill`, so the circle follows the
shape axis: a circle in Rounded, 12px in Soft, square in Square.

- **Ghost** is the base. It has no fill and no edge, and its icon is slate,
  turning ink on hover. It is the document's "none over media" look, for bars,
  headers and the corner of a code block.
- **Outline** is the document's circle on cream: a transparent fill, a 1px ink
  border and an ink icon. Ink is white in dark, so the edge follows the theme.
  The edge is the ink pairing the contrast gate already holds against canvas,
  lifted, bone, float and raised. Ink measures 16.25 on canvas, 17.84 on
  lifted and 18.43 on float in light, and 19.31, 17.42 and 17.42 in dark, far
  over the 3 that WCAG 1.4.11 asks of an edge.

Hover and press are a 5% ink wash, over whatever the button sits on, in both
variants. The app stepped Float to Lifted, which are the same color in dark,
so its hover changed nothing there. Like every hover wash it is a cue and not a
boundary, so it has no pair in the contrast gate. The icon is ink on the wash,
and measures 14.70 on canvas and 16.65 on float in light, 17.41 and 15.25 in
dark. The lowest of the five grounds is 13.24, Bone in dark. A press shows the
wash too, since touch has no hover to show it. The ghost icon at rest is
slate, which measures 4.84 on canvas in light and 7.26 in dark, over the 4.5
the text gate asks of it and the 3 an icon needs.

Disabled turns the icon taupe, stops the hover and shows `not-allowed`. An
outline button's edge fades to 15% ink, as the Button's does. Taupe measures
1.40 on canvas in light and 3.81 in dark. A disabled control is exempt from
contrast, as the Button's disabled label is.

The rest follow the rules above:

- The icon is 20px, the top of the document's range. Icon libraries draw at
  24px, so the stylesheet sets the size of any `svg` inside.
- The ring is the shared focus ring, outside the circle, so ink still reads
  against the page behind it.
- The cursor is `pointer`. The app's header toggle and toast dismiss had none.
- The disabled look matches `:disabled`, `data-disabled` and
  `aria-disabled="true"`, so a plain anchor that wears the classes and says it
  is disabled with `aria-disabled` is drawn disabled too, with no hover.
- The button is 40px. The app's rail collapse button was 28px and its toast
  dismiss 32px, and neither is carried over: a control drawn smaller extends
  its hit area instead.
- The only motion is a 120ms fade of the wash, and reduced motion removes it.

The icon holds no text, so it is hidden from assistive technology and the
types require a name: `aria-label`, or `aria-labelledby`. Given an `href` the
component renders an anchor with the same classes, because an icon that goes
somewhere, such as a GitHub link, is a link and not a button. The app's icon
controls were all buttons. React Aria renders a disabled link as a `span` with
`role="link"` and `aria-disabled`, which the stylesheet matches through
`data-disabled`. There is no pending state, since an icon has nowhere to show
one.

## Field parts

A field is a label, a control, a hint and, when they apply, an error line, a
length count and a "Changed" chip. The parts are separate so any control can
carry them. The document already gives the label and the hint their steps;
everything else here is derived.

- **The wrapper** is a grid with 8px between its parts, the "parts of one
  thing" step. It stops at `--container-field`, so a count set at the end of
  the field lands under the end of the control and a hint wraps at a readable
  measure. Its column may shrink, and the label, hint, error line and count
  break a long unbroken word where they must (`overflow-wrap: anywhere`, as
  Link, Kbd and Badge do), so one such word wraps inside its part and the page
  does not scroll sideways. The label row holds the label and the chip, and the
  chip wraps under a long label instead of overflowing.
- **Label** is 14/700 in ink, the h4 step. **Description** is 14/450 in slate,
  the small step. Both are the document's own, unchanged.
- **Error** is 14/450 in the error color. The app had no inline error line, but
  its per-control problem lines (a list, a menu, a stale icon) are exactly this
  step and this color, so a field's error is the same line. It is not heavier
  than the hint: the sentence says what is wrong, so color is not the only cue,
  and the control's border and `aria-invalid` carry the rest. React Aria links
  it to the control as its description, so a screen reader reads it with the
  field.

**The length counter advises and never blocks.** It sets no `maxlength` and no
validity, so a value past the budget still saves, as in the app. It reads
"62 of about 60", the app's wording, and stays empty until the value reaches
70% of the budget: "0 of about 320" beside an empty field reads as a demand
for 320 characters. `showFrom` moves that share and `label` replaces the text.
The text sits in a polite `status` region that is in the page from the start
and empty until the count appears, because a live region that arrives
together with its text is often not announced. An empty region leaves the
layout without leaving the accessibility tree, so it costs no gap. Figures are
tabular so the count does not shimmer as it changes.

**Past the budget the count turns to ink at 700.** The app set it in clay. The
library keeps clay for the "Changed" chip alone: a value over its budget is
usually a value that was just edited, and two clay words on one field read as
one status. Error is wrong for the reason the app gave, since a value over its
budget saves. Ink at 700 is the strongest text the system has and no hue is
involved, so it holds for readers who cannot tell the colors apart. The
number already says it is over, and `label` lets an app say it in words.

**The chip is the full eyebrow step**: 14px, 700, 4% tracking, uppercase, with
a 6px dot, all in clay. The app's comments call it "a smaller scale" and
"eleven pixels", but its rule applies the whole eyebrow step and nothing
shrinks it, so the library draws what the app shipped. The dot is drawn and
the word is real text, so a screen reader reads "Changed" rather than a bullet
and the word can be replaced. The chip is an element beside the label, not
text inside it, so the control's accessible name stays the label's own.

**Invalid outranks changed, and the chip steps aside.** The app gave its label
one marker slot, and when a field was both changed and invalid the "check"
marker took it. The library has no check marker, because the error line is the
text cue, so the chip hides and the field shows the error border, the error
line and no chip. `data-changed` on the field's root shows the chip and
`data-invalid` hides it. Each control draws its own border for the two states,
and the error border wins there too.

| Color | Part | Lowest on the five surfaces, light | Dark |
| --- | --- | --- | --- |
| Ink | Label, count past its budget | 16.25 | 15.36 |
| Slate | Description, count | 4.84 | 6.44 |
| Error | Error line | 6.58 | 5.06 |
| Clay | Changed chip | 6.20 | 6.02 |

The five surfaces are canvas, lifted, bone, float and raised. Clay on float and
error on bone were not in the contrast gate, so they are now: every text color
a field part uses is gated on every surface.

## TextField

The document specifies one input, the nav search field, and Appendix A derived
the settings input from it. The library keeps that input and changes a few
things, each recorded here.

- **Shape and fill** are the app's: 48px tall, `--radius-pill`, the Raised
  fill, 24px by 12px padding, and the 16px body step at weight 450 in ink. 16px
  also keeps iOS Safari from zooming the page when the field takes focus. The
  radius is a token, so the pill follows the shape axis. The field fills its
  column and `field` caps the column at `--container-field`, so the control has
  no width limit of its own.
- **The edge** is `--color-boundary`, 1px, the document's own 50% ink. The app
  dropped it to 40%, which measures 2.58:1 on white ("Four colors added").
- **Hover** darkens the edge to ink at 65%, the app's value, and only where
  hover exists. It measures 5.72 against the Raised fill in light and 7.30 in
  dark. The changed and invalid edges outrank it.
- **The cursor** stays the text I-beam. The pointer rule is for controls that
  are pressed. A disabled field takes `not-allowed`.
- **Read-only looks like an enabled field.** The app draws no read-only input.
  Its dashed "static" value is page text for a value another panel edits, not an
  input. A read-only field keeps focus, selection and its place in the form,
  so only the browser's `readonly` and React Aria's `data-readonly` on the
  field's root mark it, and an app that wants a quieter look can draw one from
  those.

**Focus firms the edge and keeps the ring.** Section 7 says a dark input's
focus "firms to 1.5px solid white with the outline removed", and Appendix A
gives every control a 2px ink ring at 2px offset. The library does both, for a
reason the section 7 sentence cannot cover: the changed and invalid edges are
1.5px already and outrank the focus edge, so with no ring a focused changed or
invalid field would look exactly like an unfocused one, on the two fields that
most need attention. At rest, focus draws a 1.5px ink edge (white in dark,
which is the document's value to the letter) inside the ring. A changed or
invalid field keeps its own edge and the ring alone shows focus. The ring is
the token ring in every state. The app drew it in the error color on an
invalid field; one color means a theme recolors focus from `--focus-ring-color`
alone and a reader learns one cue.

**Placeholder is taupe, which is quiet by design.** Taupe measures 1.58 against
the Raised fill in light and 3.68 in dark, under the 4.5 a sentence needs. It
is the document's designated whisper, so a placeholder shows an example and
never carries what the label does not: the label always names the field.
Firefox dims a placeholder on its own, so opacity is set to 1 and taupe is the
only color.

**Disabled** uses the `disabled` fill, taupe text and an ink edge at 15%, the
app's value and the same edge as a disabled Button. The edge measures 1.37
against the fill in light and 1.59 in dark. An inactive control is outside the
3:1 asked of a boundary, and in dark the recessed fill ("Four colors added") is
what sets it apart. The changed and invalid edges outrank the disabled edge,
because the chip and the changed border always show together.

**Changed and invalid are borders on the control, keyed on the field's root.**
The root carries `data-changed` and, from React Aria, `data-invalid`. Changed
is Light Signal Orange at 1.5px and invalid is the error color at 1.5px. The
invalid rule is declared after the changed one, so a field that is both shows
the error edge (the app showed the orange one).

| Edge | Lowest on the five surfaces, light | Dark |
| --- | --- | --- |
| Ink (the focus edge) | 16.25 | 15.36 |
| Error (invalid) | 6.58 | 5.06 |
| Light Signal Orange (changed) | 2.53 | 5.35 |

Light Signal Orange is under the 3:1 that a boundary asks on every light
surface (2.53 to 2.87), and while a field is changed it is the field's edge.
That is the document's own choice of attention cue, kept and recorded rather
than gated, since it would fail the gate. The cue is never alone: the clay chip
carries the word and is gated, the chip is read with the field, and the label,
the value and the ring still identify the control.

**The length count counts what will be saved.** `budget` counts the value's
length as typed. The app trimmed the value and collapsed runs of spaces first;
the library's count is the value the form submits, so the figure never
disagrees with what a server receives. Everything else about the count is the
field parts' own: it advises, never blocks, and appears from 70% of the budget.

**The Changed chip is announced.** The border and the chip are visual, so
TextField passes the chip's id to React Aria as `aria-describedby` while the
field is changed and shows its chip, merged with any `aria-describedby` the
caller passes. A screen reader then reads the hint and then "Changed" with the
field. An element named in `aria-describedby` is read even when `display: none`
hides it, so the chip also leaves the page while the field is invalid by any
cause and not only through `isInvalid`: a required field that was emptied and
submitted is changed and invalid, and must read its error alone. The label
row, the chip and this wiring are one internal helper (`FieldHead` and
`useChangedDescription`) that every later field with a label row uses, so
they all behave alike.

**The input does not animate.** The app's has no transition, and core
components never animate shape, so there is nothing for reduced motion to
stop. The docs site keeps its own shape transition, which its global
reduced-motion rule stops.

No pairing was added to the contrast gate. Every color the input draws is
gated already (ink, error, the boundary against its fill) or deliberately
quiet and recorded above (taupe, Light Signal Orange in light).

## TextArea

The document says one thing about a textarea, in its dark-mode notes: it
"keeps its 20px radius". The spec's shape table agrees, listing "textarea
parts" under `--radius-control`, and the spec's catalog row for TextArea adds a
6rem minimum height and vertical resize only. The library draws a textarea as
the TextField control on a taller box and records each difference here.

**One control, two classes.** The textarea carries `input textarea`, so the
fill, the edge, hover, the focus edge and ring, the placeholder, disabled, and
the changed and invalid borders keyed on the field's root all come from the
input and are recorded under TextField. `textarea.css` is one rule,
`.input.textarea`, and it sets seven properties: `height`, `min-height`,
`border-radius`, `padding-block`, `padding-inline`, `line-height` and `resize`.
It sets no edge, color, outline or cursor, so no state rule of the input can
lose to it or beat it, and a test holds the two files to separate properties.
It names both classes so it outranks the input's single class in any import
order.

- **Shape** is `--radius-control`, the document's 20px: 20px in Rounded, 10px in
  Soft, square in Square, the corner a Button has, so a textarea and the
  controls beside it share one. The document's dark-mode note and the spec's
  shape table both give it. The spec's catalog row for TextArea names the surface
  radius (24px), a number that came from the source app, and the document and
  the shape table supersede it. The input's pill does not carry over: a box this
  tall would read as a lozenge.
- **Height** is auto with a floor of 6rem (96px), the source's value, so the box
  is as tall as its rows and never shorter than the floor. Body text is 22.4px a
  line (16px at 1.4), so three rows are 67.2px, plus 24px of padding and 2px of
  edge, which is 93.2px: under the floor, so rows 1 to 3 look alike and `rows`
  defaults to 3, the source's. Four rows are 115.6px and five are 138px. The box
  does not grow with its text: it scrolls inside, as the source's does, and
  `field-sizing: content`, which would grow it, is not available across the
  browser floor.
- **Resize is vertical only.** The field is one grid column capped at
  `--container-field`, and a box dragged wider would break it. Shrinking stops
  at the floor (dragged up to 20px from its top edge, a three-row box stays
  96px). The handle is the browser's, drawn in the corner over the curve of the
  radius, and is not restyled. A keyboard cannot resize, so `rows` is the way to
  a taller box and the docs say so.
- **Padding and line height** are the input's: 12px block and 24px inline, and
  the 16px body step at 1.4. The source's override sets only the block padding
  (`py-3`, the same 12px). They are restated in `textarea.css` so the height
  arithmetic above sits in one file. The 24px inline padding is more than the
  20px Rounded radius, so the first line of text clears the curve.
- **A taller box can move by 1px.** The input is a fixed 48px, so its edge
  growing from 1px to the 1.5px of the focus, changed and invalid edges moves
  nothing. A box taller than the floor (four rows or more) is as tall as its
  rows, so on a screen that draws a 1.5px edge it is 1px taller while it has
  one. The default box sits on its floor and does not move. This is reasoned
  from the box model and not measured: the headless browser the tests use draws
  every edge at 1px. It is accepted: holding the height still would need a fixed
  height, which is what a textarea is not.
- **A long value scrolls inside the box.** The box does not grow with its
  text, so a value taller than its rows scrolls, and its scrollbar sits inside
  the curve of the corner, which clips it. `textarea.css` sets no scrollbar
  property. The tokens' `color-scheme` themes the scrollbar for light and dark,
  and `base.css` adds a thin `scrollbar-width` and a `scrollbar-color` from the
  palette when an app loads it. Components never depend on `base.css`, so a
  textarea without it keeps the browser's own scrollbar, drawn in the theme's
  `color-scheme`. The `Overflow` story shows the box scrolled to its top with
  its text cut at the edge. The headless browser that makes the baselines hides
  scrollbars, so the images do not draw the bar: it was checked once in the
  same browser with scrollbars drawn (inside the curve, thin and themed in
  light, dark and at 375px) and no test holds it.
- **The count** counts the value's length, a line break as one character: that
  is the value React Aria reports and `FormData` holds. The unit is the value's
  `length`, in UTF-16 code units, the unit JavaScript, `maxLength` and the value
  `onChange` receives all use, so an emoji, or an accented letter built from two
  code points, can count as two. A browser sends each
  line break in a form request as two characters (CR and LF; measured as
  `%0D%0A` in a posted body), so a server that measures the request sees one more
  per line. The budget is a soft target and the count can pass it. `maxLength` is
  a hard stop that the count does not read, so set `budget` at or below it.
  Everything else about the count is TextField's: it advises, never
  blocks, and appears from 70% of the budget.

No pairing was added to the contrast gate. The fills, edges and text are the
input's, and the textarea draws no color of its own.
