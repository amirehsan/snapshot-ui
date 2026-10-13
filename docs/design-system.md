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

No specification for: empty state or loading state. The tooltip is derived in
Appendix B. Each needs the same derive-and-record treatment as it arrives.

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

Nine values have no name in the document, so the library gives them one:

- `--font-mono` is `ui-monospace`, `SFMono-Regular`, `Menlo`, then the generic
  `monospace`. It is for code only, and Sofia Sans stays the one family for
  every label and sentence.
- `--container-field` is 44rem (704px), the widest a single control grows. Past
  about 700px the eye has to travel too far from a label to the end of its own
  input.
- `--spacing-inset` is 16px, how far floating chrome sits clear of the
  viewport's edge. It is the one step the spacing rhythm skips, recorded as its
  exception in "Floating chrome and the shell".
- `--container-sidebar` is 20rem, the navigation rail's full width, and 6.5rem
  under `data-sidebar="collapsed"`. "Floating chrome and the shell" derives
  both.
- `--focus-ring-color` is ink, kept as one reference to `--color-ink` so every
  ring follows the theme and a theme can recolor them all from this one token.
  Each theme scope declares it again, since a variable that holds `var()`
  resolves where it is declared. A scope that sets `--color-ink` itself,
  outside the theme attribute, must set `--focus-ring-color` too, just as it
  would set `color`.
- `--z-modal` is 1000, `--z-toast` 1100, `--z-chrome` 30 and `--z-header` 20.
  They fix the order in which the overlays and the app's chrome stack:

  | Layer | z-index | Why |
  | --- | --- | --- |
  | Tooltip, popover, menu, any positioned overlay | 100000, inline | React Aria writes it as an inline style when it positions the overlay, and CSS cannot lower it. |
  | Toast region | `--z-toast`, 1100 | Above every modal, so an error raised from an action inside a dialog is not under the scrim. |
  | Dialog, confirm dialog, drawer, sheet, command palette and their scrims | `--z-modal`, 1000 | The ladder has to fit under React Aria's popovers, so a menu opened from a dialog sits above it. |
  | Fixed chrome: the rail, its collapse button, the tab bar, a save bar | `--z-chrome`, 30 | A modal covers the chrome, and the chrome never covers a modal. |
  | A sticky page header | `--z-header`, 20 | Above the page it scrolls over and under every piece of fixed chrome. A page's own sticky elements stay at or under it. |

  Ties inside a layer break by DOM order: React Aria appends each portal after
  the last, so a stacked dialog sits above the first. The four names are in
  `tokens.js` and `tokens.css` and not in the Tailwind theme, which has no
  z-index namespace. An app whose chrome already uses larger numbers overrides
  `--z-modal` and `--z-toast`. The overlays do not use the browser's top layer,
  so a third-party overlay at a very large z-index can cover a library dialog.

## Six colors added

All six are tokens with a light and a dark value, so no component mixes its
own.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `boundary` | ink at 50% | white at 50% | The edge of a control: inputs, checkbox and radio boxes, segmented tracks, a switch's off track. |
| `disabled` | `#F4F4F4` (Bone) | `#1A1A19` (Lifted Surface) | The fill of a disabled control. |
| `frame` | ink at 12% | white at 12% | The outline of a list, or of a float surface opening over another. |
| `divider` | ink at 10% | white at 10% | A rule inside a surface. |
| `warning` | `#8A5300` | `#E8B04F` | A state that needs a look soon and is not a failure. |
| `gain` | `#2A5F46` | `#6CC195` | Money in: an amount that arrived. |

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

**Warning and gain.** The two newest colors take the values of the first app
built on the library, kept exactly so that app can delete its own copies. Both
are text colors, and both are measured on every surface text may sit on, against
the real palette with `packages/core/scripts/contrast.js`. The last column is an
ink fill, to record that neither may sit on one.

Light (canvas `#F3F0EE`, lifted `#FCFBFA`, bone `#F4F4F4`, float and raised
`#FFFFFF`, disabled `#F4F4F4`):

| Color | canvas | lifted | bone | float | raised | disabled | on an ink fill |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `warning` `#8a5300` | 5.58 | 6.12 | 5.75 | 6.33 | 6.33 | 5.75 | 2.91 (never) |
| `gain` `#2a5f46` | 6.55 | 7.20 | 6.76 | 7.44 | 7.44 | 6.76 | 2.48 (never) |

Dark (canvas `#0E0E0D`, lifted and float `#1A1A19`, bone and raised `#252523`,
disabled `#1A1A19`):

| Color | canvas | lifted | bone | float | raised | disabled | on an ink fill |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `warning` `#e8b04f` | 9.89 | 8.92 | 7.86 | 8.92 | 7.86 | 8.92 | 1.95 (never) |
| `gain` `#6cc195` | 8.92 | 8.04 | 7.09 | 8.04 | 7.09 | 8.04 | 2.17 (never) |

Every pair clears the 4.5:1 of body text, with 5.58 the lowest (`warning` on
canvas in light), so both work as text, as a graphic (3:1) and as a numeral. The
gate holds ten pairs, `warning` and `gain` as text on canvas, lifted, bone,
float and raised, and none on an ink fill. The canvas color as text on a
`warning` or `gain` fill measures 5.58 and 6.55 in light and 9.89 and 8.92 in
dark, so a filled part is feasible in both themes. As text on its own 12% wash
over canvas the colors measure 4.72 (`warning`) and 5.50 (`gain`) in light,
which caps a tinted wash at about 12% on canvas.

**Keeping them apart.** By CIE76, the metric this document uses (it calls clay
and Light Signal Orange, 28 apart in light and 29 in dark, far enough):

| Pair | Light | Dark |
| --- | --- | --- |
| `warning` to `clay` | 21.1 | 23.1 |
| `warning` to Light Signal Orange | 36.3 | 37.2 |
| `warning` to `error` | 35.6 | 44.6 |
| `gain` to `success` | 0.0 | 7.6 |

Warning to clay is the closest pair of distinct hues. By CIEDE2000 it is 13.4
in light and 13.8 in dark, well above the roughly 5 at which two colors are told
apart at a glance. `gain` and `success` are the same value in light. The two are
kept apart by rule as well as by value: clay is only the Changed chip on a
field's label, and warning is a badge, a toast stripe, later an alert or a meter
fill. They never meet in one component.

**Why warning is not Light Signal Orange.** That color measures 2.53 to 2.87 on
the light surfaces, under the 3:1 a graphic needs and under any text minimum,
and it is already the changed border and the eyebrow dot.

**The meaning rules**, beside the existing reservations:

- `warning` means a state that needs the reader's eye soon and is not a failure:
  Watch, Behind, Needs review, Out of date. Never decoration, never unsaved
  (clay), never consent (signal), never a stand-in for Light Signal Orange.
- `gain` means money that arrived. It is drawn with a plus sign, and with a word
  where it names a state. It is never the outcome of a save, which is `success`,
  even in light, where the two values are the same: the tokens differ by
  meaning, and sample content keeps the difference as it does for the other
  reservations.
- State is never color alone: the badge label, the sign and the word carry the
  meaning.

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
- **A field's props require an accessible name.** A field is named by a
  visible `label`, or by its text as `children` where it has no `label` prop
  (Checkbox, Switch and Radio), or by an `aria-label` or an `aria-labelledby`.
  IconButton has no text of its own and takes the last two. A segmented option
  is the exception: it draws its `children`, which stay required, and an
  `aria-label` is an extra for an option that shows only an icon. The types
  require a name, so code that names nothing does not compile. Every component
  states the rule through one shared type. A union cannot be extended, so each
  field also exports its base props type (`TextFieldBaseProps` and so on) for
  a wrapper to extend or `Omit`, and a wrapper passes the rule on by
  intersecting that with the exported `AccessibleName<'label'>` (or
  `AccessibleName<'children'>`). The error for a field with no name either
  says the props are not assignable or names only `aria-labelledby`; both
  mean the field has no name.
- **A state that only a fill carries is also drawn in forced colors.** Windows
  high contrast repaints every background with the reader's canvas, and it
  draws a border and an outline in the reader's text color. A state that a
  border or an outline carries survives that. A check mark drawn with a mask
  survives only in a system color, which the checkbox and the radio group give
  it. A switch's track and thumb and the chosen segmented option are fills, and
  without help they are the same canvas as everything around them, so those
  components give their fills system colors too. Each does it in a
  `@media (forced-colors: active)` block, which is the one place a system color
  may be written: a test fails any component file that writes one anywhere
  else.

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
presses are ignored while focus stays. The spinner's name joins the button's,
so a pending "Save" reads "Save Saving". React Aria joins them only when an
attribute names the button, and name computations differ on whether a
progress bar inside a button gives its name to the button's content, so while
pending the library names a button that has no name attribute by its label,
through `aria-labelledby`, and React Aria adds the spinner. At rest it is named
by its text again. A test holds the name in both states, and React Aria
announces it as the wait starts. In dark the primary hover fill is
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
no gutter beside it, the `eyebrow-inset` variant, or the `inset` prop of
Eyebrow, keeps the dot inline, inside the label's box.

## Numerals

A hero amount and a tile's figure want a display size that the headings do not
give: between the 64px display step and the 36px section step. The library adds
two type steps, `numeral` and `numeral-sm`, and two sizes of Text that draw them.

| Step | Token | Size | Line height | Tracking | Weight | Under 768px |
| --- | --- | --- | --- | --- | --- | --- |
| `numeral` | `--text-numeral` | 56px | 1 | -3% | 500 | 44px |
| `numeral-sm` | `--text-numeral-sm` | 32px | 1.1 | -2% | 500 | 32px |

**Size.** 56px for a hero amount and 32px for a tile beside others, both in rem
so they follow the reader's browser font size.

**Weight and tracking.** Both take the headings' weight, 500. Tracking is
tighter than the headings' -2% at the large size, because figures at display size
set loosely. The small size keeps -2%.

**Line height.** 1 and 1.1, as the display step's is 1, since a numeral is one
line and never a paragraph.

**Tabular figures.** A text token cannot carry `font-variant-numeric`, and Sofia
Sans has tabular figures, so a column of amounts lines up only when the class
asks for them. The classes `copy-numeral` and `copy-numeral-sm` set tabular
digits beside the four properties of their token. Tabular figures are wider:
"$12,345.67" at 56px is 253px proportional and 293px tabular. The Tailwind
`text-numeral` utility sets only the size, line height, tracking and weight: it has
no phone step, no `nowrap` and no direction, so a Tailwind user adds
`whitespace-nowrap tabular-nums`, their own phone step and `dir="ltr"` on a
signed figure, or uses the `.copy-numeral` class.

**The phone step.** On a 320px screen a card with 20px of padding leaves 248px of
content, and 293px does not fit. At 44px the same figure is 230px, so the large
step drops to 2.75rem under 768px. The width is the `--breakpoint-sm` token,
written out in `copy.css` because a media query cannot read a custom property,
and a test compares them so they cannot drift. The small step needs none:
"$1,234,567.89", the widest figure tested, is 216px at 32px. A single figure
fits, but two `numeral-sm` figures cannot share a row at 320px, since neither
wraps, so a row of them wraps as a row (`flex-wrap`), as the docs example does.

**Why `nowrap`.** The text classes break a long word anywhere
(`overflow-wrap: anywhere`), which is right for a sentence and wrong for a
number: a figure that breaks across two lines reads as two numbers, which is a
wrong number. Both numeral classes set `white-space: nowrap`, which wins over the
inherited wrapping. Keep a numeral to one figure, and give it its sign and unit
in the string, since nothing is formatted here.

**Direction.** A numeral reads left to right in every direction, and keeps its
sign where it was written. A leading plus or minus is neutral to the bidi
algorithm, so in a right-to-left block "+$1,980.00" alone in its box would draw
as "$1,980.00+", with the sign stranded on the far side of the digits. Both
classes therefore set `direction: ltr` and
`unicode-bidi: isolate`, which pins the figure to its written order. That alone
would left-align a block-level figure inside a right-to-left layout, because
`start` follows the element's own direction, so `text-align: match-parent`
resolves `start` against the parent: the figure still begins at the start of a
right-to-left line. Measured in Chromium, Firefox and WebKit, Chromium knows only
`-webkit-match-parent` and Firefox only `match-parent`, so `copy.css` writes both,
the standard name last. Without the fix the sign lands right of the currency symbol
in all three. A block-level figure, such as a grid item, would keep its sign
without `isolate`; an inline one inside a right-to-left sentence would not,
since its own `direction` reorders nothing unless it is isolated. Two stories in
"Checks/Right to left" measure it in Chromium. "Numerals" checks block figures:
the sign sits left of the currency symbol and the figure's right edge is the
block's. "Numeral in a sentence" checks an inline figure among Arabic words,
where the sign lands after the digits without `isolate`.

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
- **Five tones.** Neutral is Slate, info is Link Blue, success is the success
  color, warning is the warning color and error is the error color. Neutral is
  the base, so it has no class of its own. Warning is a state that needs a
  look soon and is not a failure: Watch, Behind, Needs review, Out of date. It
  is its own color because Light Signal Orange measures 2.53 to 2.87 on the
  light surfaces, under the 3:1 a graphic needs, and is already the changed
  border and the eyebrow dot (see "Six colors added").
  Clay is unsaved work and Signal Orange is consent, and Light Signal Orange is
  an attention cue that a label has no use for, so none of the three is a tone.
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
| Warning | Warning | 5.58, 6.12, 6.33, 6.33 | 9.89, 8.92, 8.92, 7.86 |
| Error | Error | 6.58, 7.22, 7.46, 7.46 | 6.36, 5.73, 5.73, 5.06 |

All twenty pairs are in the contrast gate already, so Badge adds none. Slate
is also measured on Bone, 4.99 and 6.44, so a neutral badge may sit there. The
info and success tones are not measured on Bone, so they stay on the four
surfaces above. Error is gated on Bone too, because a field part draws it
there, and warning is gated there as well, 5.75 and 7.86, so a warning badge
may sit on Bone.

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
`data-disabled` and also through `aria-disabled`. In forced colors it is drawn
in `GrayText`, as the browser draws a disabled button element. There is no
pending state, since an icon has nowhere to show one.

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
library keeps clay for unsaved work, which is the "Changed" chip and the
dot that marks a folded card holding a change: a value over its budget is
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

**The chip wraps when its text is long.** It is one line at its natural width,
as the word "Changed" is, and a `changedLabel` that is longer moves to a row of
its own and then wraps, inside a word if it must, so a translation or an
address in it can never be wider than the field. The first version could not
wrap, and one long word pushed the page sideways at 320px.

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

- **Shape and fill** are the app's: `--size-field` tall (48px, 36px in
  compact), `--radius-pill`, the Raised fill, 24px of inline padding and none
  on the block axis, so the height alone decides, and the 16px body step at
  weight 450 in ink. 16px
  also keeps iOS Safari from zooming the page when the field takes focus. The
  radius is a token, so the pill follows the shape axis. The field fills its
  column and `field` caps the column at `--container-field`, so the control has
  no width limit of its own.
- **The edge** is `--color-boundary`, 1px, the document's own 50% ink. The app
  dropped it to 40%, which measures 2.58:1 on white ("Six colors added").
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
3:1 asked of a boundary, and in dark the recessed fill ("Six colors added") is
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
than gated, since it would fail the gate. In a labelled field the cue is never
alone: the clay chip carries the word and is gated, the chip is read with the
field, and the label, the value and the ring still identify the control. A
field named by `aria-label` has no label row and so no chip, and there the
edge is the whole cue: an app that changes such a field says so in words of
its own.

**The length count counts what will be saved.** `budget` counts the value's
length as typed, in UTF-16 code units, the unit JavaScript, `maxLength` and the
value `onChange` receives all use, so an emoji, or an accented letter built
from two code points, can count as two. The app trimmed the value and collapsed
runs of spaces first; the library's count is the value the form submits, so the
figure never disagrees with what a server receives. Everything else about the
count is the field parts' own: it advises, never blocks, and appears from 70% of
the budget.

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
  code points, can count as two. A browser sends each line break in a form
  request as two characters (CR and LF; measured as `%0D%0A` in a posted body),
  so a server that measures the request sees one more per line. The budget is a
  soft target and the count can pass it. `maxLength` is a hard stop that the
  count does not read, so set `budget` at or below it. Everything else about the
  count is TextField's: it advises, never blocks, and appears from 70% of the
  budget.

No pairing was added to the contrast gate. The fills, edges and text are the
input's, and the textarea draws no color of its own.

## Checkbox

The document specifies no checkbox. The app's choice control is the precedent:
a 20px box with a 1.5px edge and a micro corner, 12px from its text, in a row
at least 40px tall. The library keeps that shape and settles what the app left
open, each recorded here.

- **The box** is 20px, the Raised fill, a 1.5px edge and `--radius-micro`. The
  corner follows the shape axis: 6px in Rounded and Soft, square in Square. A
  radio keeps its dot round in every shape because roundness is its meaning; a
  checkbox is the small square the shape axis cuts.
- **The row is the label, and it is 40px tall.** The app's row is a `label`
  with `min-height: 40px` and 8px above and below, so a 20px box is never the
  target by itself. React Aria's checkbox button is that label: it wraps the
  input, the box and the text, so a press on the box, the gap, the padding or
  the text toggles it. The label takes its own width, so the target is the
  visible row and not the empty line after it. The text sits in an element of
  its own, because a link or an emphasis inside the label would otherwise be a
  second flex item with a 12px gap before it. The hint is outside the label,
  as React Aria structures it: it describes the checkbox without becoming part
  of its name, and it is not a target. It is indented to the text, not the box.
  A checkbox with no text, named by `aria-label` as a table's row select is,
  has a row only as wide as the box, so the box takes a transparent hit area of
  its own, 40px square and centred on it, as a `::before` that leaves the drawn
  box where it is. At the default line height the box sits about 1px above the
  middle of its 40px row, so the area reaches about 1px past the row's top edge
  and stops about 1px short of its bottom edge. Rows in a stack are 40px apart,
  so the areas of neighbours meet and do not overlap, and each overhangs its box
  by 10px, which leaves 4px clear in the 24px between horizontal rows. The same
  10px overhang means a label-less checkbox needs 10px of room beside a scroll
  edge, a window's or a scrolling container's.
- **The edge** is `--color-boundary`, ink at 50%. The app drew the box at 45%,
  which measures 2.99 against Raised in light (about 3.0, and 2.63 on the page).
  Boundary is the document's own 50% and the token every control edge uses, so
  a checkbox and a text field on one card match.
- **Hover** darkens the edge of an empty box to ink at 70%, the app's value,
  only where hover exists, and pressing shows the same edge so touch has a cue.
  A checked box keeps its ink edge. A read-only box has nothing to press, so it
  shows neither.
- **Checked is an ink fill with a canvas mark.** The app drew the check as an
  image with a literal `#F3F0EE` stroke, so on the white fill of dark mode it
  measures 1.13:1 and is invisible, though its comment says it follows the
  theme. The library draws the mark with `mask-image`: the SVG says only where
  the mark is, and the mark's color is `--checkbox-mark`, the canvas token,
  painted as the background of the mask's element. The mark is then canvas on
  ink in both themes and no color lives in an image. Indeterminate is a bar
  drawn the same way, and it wins when the box is both selected and mixed.
- **Focus is the token ring on the box,** 2px at 2px offset, outside the box
  and not on the row. The ring sits outside the ink fill, so ink still reads
  against the page behind it and it does not invert; only an inset ring on an
  ink fill does.
- **Invalid turns the edge to the error color** at the same 1.5px and leaves the
  fill and the mark alone, so a checked box that is invalid still reads as
  checked. The error line is under the label's text. In a group, React Aria
  marks every box invalid while the group is, so every edge turns and the one
  error line under the group says why.
- **Disabled** has no look in the app: the row keeps its pointer and its full
  color. The library gives the box the `disabled` fill and an ink edge at 15%,
  the label and the mark taupe, and `not-allowed`. The hint stays slate: it is
  not the control's label, a reader may still need it, and taupe on it measures
  about 1.4:1 in light, which axe fails. A disabled checkbox falls outside the
  3:1 asked of a control, as Button's disabled edge does, so the pairs are
  recorded and not gated. A disabled box that is checked keeps its mark in
  taupe, which is faint in light and clear in dark:

  | Disabled | Light | Dark |
  | --- | --- | --- |
  | Edge against its fill | 1.37 | 1.59 |
  | Taupe mark on the fill | 1.44 | 3.81 |

- **Read-only looks like an enabled box,** as a read-only input does, with the
  default cursor, no hover edge and its place in the tab order and the form.
  `data-readonly` is the hook for an app that wants another look.
- **No transition.** The mark appears and the state changes at once, so there is
  nothing for reduced motion to stop.
- **Forced colors.** The browser replaces every author color but a system color,
  and a mask that paints canvas on an ink fill would then paint canvas on
  canvas. In forced colors the selected box takes `Highlight` with a
  `HighlightText` mark and a disabled one `GrayText`. These are the only colors
  in `checkbox.css` that are not tokens, and they exist because the reader's own
  palette is the point there (checked in Chromium with forced colors emulated).

**The group follows the field contract and marks a change with the chip alone.**
`CheckboxGroup` is a `field` with a label row, a hint and an error line, and it
has `data-changed` and `data-invalid` on its root, a chip that is read with the
group and a chip that leaves while the group is invalid, exactly as TextField
does. The source's composite controls draw the changed edge on the one surface
a field has: the track, the trigger or the frame. A group of boxes has none, and
the app's choice rows have no changed look at all, only the label chip. Drawing
it on the boxes would mark boxes that did not change, would drop an empty box's
edge from 3.48 to the light signal orange's 2.87 against Raised (2.53 on the
page, under the 3:1 a boundary asks), and would sit beside the ink edge of every
checked box. So the boxes keep their edges, the chip carries the cue and no rule
keyed on `data-changed` draws a box. Invalid still outranks changed: the chip
leaves, every box takes the error edge and the line shows.

- **Orientation** is vertical by default and horizontal on request. React Aria's
  group has none, so the component writes `data-orientation` on the root for the
  layout, and nothing else depends on it: arrow keys do not move between
  checkboxes in either layout. Each checkbox is its own tab stop, so the keys are
  Tab and Space. Horizontal rows wrap, 24px apart, so long labels fall to the
  next row and never scroll the page sideways.
- **Spacing.** The rows carry their own 8px of padding, so the group's 8px
  between parts would double it: the group closes the gap, and the label sits
  8px above the first box's text, like a text field's.
- **A form reset can lose boxes in a group.** This is React Aria's, and it is
  not worked around. In `useCheckboxGroupState`, `addValue` takes an updater,
  so each call builds on the one before, but `removeValue` filters the
  `selectedValues` it closed over, which is the list as it was before the
  reset, and sets the result outright. A native `reset` runs every box's reset
  in turn, in one event, so the last removal wins. Two things follow. A reset
  that unchecks more than one box leaves all but the last of them checked: with
  the default `[]` and `a` and `b` checked, it ends at `['a']`. A reset that
  re-checks a box before it unchecks another one, in DOM order, loses the
  re-checked box: with the default `['email']` and the user at `['sms']`, it
  ends at `[]` and not `['email']`. A reset that only re-checks boxes, or that
  unchecks a single box and re-checks the others only after it, works. In a
  controlled group, `onChange` fires once per box that changes and the last
  array is the wrong one. Two tests hold the correct expectations as expected
  failures, so a fix upstream flags itself.
- **A group shows one error line, its own.** React Aria clears the error
  context of the checkboxes inside a group, so an `errorMessage` on one of them
  is not shown there. It shows when the checkbox stands alone.
- **A checkbox on its own takes the chip too, beside its label.** `isChanged`
  and `changedLabel` follow the field contract, as Switch's do: `data-changed`
  on the root, a clay chip that a screen reader reads with the checkbox, and a
  chip that leaves the page while the checkbox is invalid, by any cause, React
  Aria's own validation included. Invalid outranks changed. The boxes keep their
  edges, for the reason given for the group above, and the only rule keyed on
  `data-changed` shows or hides the chip. The row is a `label`, so the chip
  cannot be inside it: it would join the checkbox's name, and a press on it
  would toggle the box. It sits beside the row in the `field-head` row instead.
  The head starts its items at the top, and the chip takes the row's 8px of
  padding and half of what the 22.4px line has over its own 14px line, 12.2px,
  so its middle is on the middle of the first line and of the box, and a row of
  one line stays 40px tall with nothing moved. A chip that does not fit beside
  the row drops under it and keeps the margin, 12.2px under the row. A long
  `changedLabel` wraps inside the field, so the page never scrolls sideways at
  320px. A checkbox with no visible label has no label row and no chip, as
  Switch has none. Inside a `CheckboxGroup` the checkbox ignores `isChanged` and
  keeps the markup it had, with no label row, because the group's chip covers
  the group.

| Box edge (boundary on its Raised fill) against | Light | Dark |
| --- | --- | --- |
| Raised | 3.48 | 4.93 |
| Float | 3.48 | 5.59 |
| Lifted | 3.36 | 5.59 |
| Bone | 3.16 | 4.93 |
| canvas | 3.06 | 6.20 |

| Other edges and marks | Light | Dark |
| --- | --- | --- |
| canvas mark on the ink fill | 16.25 | 19.31 |
| The app's mark on the ink fill | 16.25 | 1.13 |
| Hover edge (ink at 70%), lowest on the five surfaces | 6.04 | 8.22 |
| Error edge, lowest on the five surfaces | 6.58 | 5.06 |
| Ink fill, lowest on the five surfaces | 16.25 | 15.36 |

The figures are the gate's own arithmetic, rounded to two decimals. "Six
colors added" lists the boundary on Raised as 3.47, which is the same 3.4767
cut and not rounded. Bone is the one surface the boundary was not yet gated
on, and a checkbox can sit in a note, so it is now: `CONTRAST_PAIRS` holds the
boundary on all five surfaces. canvas on ink, the checked mark, was gated as the
primary label already, at the stricter text minimum, and a test now says so.

## RadioGroup

The document specifies no radio. Its section on what is still missing says radio
is "specified by use": the appearance choice in the account menu is full-pill
rows, the chosen one an ink pill with a check glyph. The app also draws a plain
choice, a 20px native radio beside its label. The library joins them: the rows
and the ink pill are the account menu's, and the dot is the plain choice's.

- **A group is a field.** Its root carries `field` and `radio-group`, its label
  row holds the label and the Changed chip, and its hint and error line follow
  the options, as on every field. Each option can carry a hint of its own,
  which sits under its row and lines up with the label text.
- **Rows** are `--radius-pill`, 40px or taller (1.5px edge, 8px padding and a
  22.4px line draw 41.4px, and a 1x display draws the edge as 1px, so the row
  measures 40.4px there), with 16px at each side and 12px between the dot and
  the label. They fill the group's width when stacked, so the whole row is the
  target, and hug their label in a horizontal group, where they wrap. The label
  is the 16px body step at 450, not the account menu's 500: it is the content of
  a choice, not an action. An unchosen row has no fill and no visible edge.
- **The label's text sits in a box of its own** (`radio-text`), so a link or an
  emphasis inside it stays in one run of text and is not a second flex item with
  a 12px gap before it, and so one long word wraps inside the row
  (`overflow-wrap: anywhere`) and never widens it: before the box a long word
  pushed the row past a 320px page. A radio with no text has no box, and its row
  is the padding and the dot, 54px by 40px. The hint of an option in a
  horizontal group is taken out of the option's width (`contain: inline-size`),
  so the pill hugs its label and the hint wraps to the pill: without it the
  option was as wide as the hint's sentence.
- **The dot** is 20px, `--radius-dot` and the Raised fill, with a 1.5px edge in
  the boundary color. It is the plain choice's box with the document's 50%
  boundary where the app used 45%. It stays round in every corner shape, because
  a square radio would read as a checkbox.
- **The dot sits level with the first line of a label that wraps.** The row
  centred its items, so a label of three lines put the dot beside the middle of
  the second, away from the words a reader starts with. A row with text now
  starts its items at the top, and the dot takes a margin of half of what the
  22.4px line has over its 20px, 1.2px, as a checkbox's box does. For a label of
  one line that is where centring put it, so every one-line row keeps its
  place. A row with no text has no first line, and keeps the dot centred in its
  40px. The test for text is the `radio-text` box the component draws around
  the words, so a hand-written row with bare text beside the library's dot is
  drawn as before, centred. Left to right and right to left read alike, since
  the margin is on the block axis.
- **The chosen row is the ink pill, and its ring holds the check.** Ink fill,
  canvas label, and the dot's ring and check drawn in canvas. The account menu
  put its check at the end of the row; the library puts it in the dot, so one
  element carries both states and the labels stay aligned. The plain choice
  painted an ink dot through an inset ring, which on an ink row would be ink on
  ink, so the dot is not filled. The check is a mask over a token color, never
  an image with a fixed stroke: the app's checkbox check used a literal
  `#f3f0ee` stroke and measured 1.13:1 on dark's white fill. canvas follows the
  theme, and measures 16.25 in light and 19.31 in dark against ink.
- **Hover is the document's 5% ink wash on a row that is not chosen**, and the
  ring steps up to ink at 70%, the plain choice's hover value. The wash lowers
  the 50% ring against the page from 3.06 to 2.77 on canvas and from 3.16 to
  2.86 on bone, under the 3:1 an edge asks, so the ring firms with it. A chosen
  row is already ink and takes neither, as the app's checked row kept its fill
  on hover. A read-only group takes neither either, and shows the default
  cursor: a pointer and a wash promise a change it cannot make. Pressed shows
  the hover look, since touch has no hover.
- **Focus on a row that is not chosen** is the token ring outside the row, 2px
  at 2px, as on a Button. **Focus on the chosen row** is the same ring in the
  canvas color, inside the row. The app drew its account rows' ring in ink,
  inset, on the ink pill: 1:1, invisible, and the arrow keys move focus and the
  choice together, so the focused row is nearly always the chosen one. The ring
  sits 4px in from the edge and not flush: flush, a canvas ring on a canvas page
  reads as a pill that shrank, and 4px leaves ink on both sides of it. The
  design document's rule holds: the ring inverts on an ink fill, and only there.
- **Invalid is an edge on the rows; changed is the chip alone.** The row is the
  control, so an invalid group puts a 1.5px error edge on every row, keyed on
  the group's `data-invalid`. The edge is transparent the rest of the time, so
  nothing shifts. The fill stops at the padding box, so the edge on a chosen
  row is measured against the page and not against ink: the error color on ink
  is 2.47 in light, and against the page it is 6.58 to 7.46. A group that is
  both changed and invalid shows the error edge and no chip. A changed group
  draws no edge at all. The field contract in "Field parts" says the chip and
  a changed border always show together, and this is the one place the library
  departs from it, for choice groups (RadioGroup, and CheckboxGroup likewise).
  The source draws the changed edge on text controls and on the outer track of
  composite controls, never on a choice row. And the edge of a choice is the
  boundary of its dot, a required 3:1 ring: recoloring it Light Signal Orange
  would trade 3.06 to 3.48 for 2.53 to 2.87 on the light surfaces. The clay
  chip carries the cue, it is gated on every surface, and a screen reader reads
  it with the group.
- **Disabled** (the app had no look: pointer cursor, full color) is taupe text,
  a faint ring at ink 15% and the `not-allowed` cursor, as a disabled Button and
  Input are. A disabled group's choice is still information, so a disabled,
  chosen row keeps its check at the boundary strength on the disabled fill, with
  the 15% edge a disabled Button has, and the check is gated at 3:1. The
  disabled ring measures 1.21 against canvas in light and 2.03 in dark, and the
  taupe label 1.40 and 3.81: inactive controls are outside the contrast asked of
  active ones, and the shape of the check, not its color, says what is chosen.
- **Nothing animates.** A radio's state changes at once, as the app's did, and
  core components never animate shape, so there is no reduced-motion block.
- **Forced colors** repaint every background, which would leave the mask's
  color the color of its ground. A system color is kept, so the check is drawn
  in the row's text color there. A disabled row is drawn in `GrayText` for its
  label, its ring and, when chosen, its check, as a disabled checkbox is, so it
  does not read as an enabled one.
- **Every state has a native twin.** A row is also drawn from its input: chosen
  is `:has(input:checked)`, focus is `:has(input:focus-visible)` and disabled is
  `:has(input:disabled)`, beside React Aria's `data-selected`,
  `data-focus-visible` and `data-disabled`, so a plain label around a native
  radio and the library's dot gets the same pill, ring and disabled look. The
  input is named, so a link focused inside the label rings itself and never the
  row. Read-only has no native form, and keeps its data attribute alone. `:is()`
  takes the specificity of its highest argument, so each native test sits in
  `:where()`, which weighs nothing, and the one attribute beside it carries the
  weight: no rule changed its weight or its place in the order. Checkbox and
  SegmentedControl read their inputs the same way.
- **A disabled, chosen radio leaves the group with no tab stop.** React Aria's
  `useRadio` (in `@react-aria/radio`) gives the tab stop only to the chosen
  radio, and then takes it away from a disabled one, so with `defaultValue="team"`
  and Team disabled, Tab skips the group and a keyboard user cannot reach the
  other options. It is a limit of React Aria, recorded and not worked around:
  an `it.fails` test holds the correct behavior, a tab stop in the group, so an
  upstream fix reports itself. Until then, do not disable the chosen option of
  a group the reader can still change.
- **A group with no visible label shows no Changed chip**, since the chip lives
  in the label row. `isChanged` still sets `data-changed` on the root, and
  nothing else, because a choice group draws no changed edge: a group whose
  change should show needs a `label`.

| Pairing | Light (lowest of the five surfaces) | Dark |
| --- | --- | --- |
| Ring (boundary over Raised) against the surface | 3.06 | 4.93 |
| Ring against the washed surface, at rest | 2.77 | 4.25 |
| Ring against the washed surface, on hover (ink 70%) | 5.46 | 7.09 |
| The wash against the surface (a cue, not an edge) | 1.11 | 1.11 |
| canvas on ink: label, ring, check, inset focus ring | 16.25 | 19.31 |
| Error edge against the surface | 6.58 | 5.06 |
| Check of a disabled, chosen row on the disabled fill | 3.40 | 5.21 |

The five surfaces are canvas, lifted, bone, float and raised. One pair was
added to the gate: the disabled check. The boundary ring against bone (3.16 in
light, 4.93 in dark) was added with Checkbox, so the ring is gated on all five
surfaces. The wash is recorded and not gated, since it would fail it.

## Switch

The document gives the switch one sentence: a stadium track with a round
thumb, the pill vocabulary again, for a setting that is simply on or off. The
numbers are the app's, from `js/switch-input.js` and `control.css`, and the
library changes the ones below, each recorded here.

**Size is the app's.** A 52px by 30px track and a 24px round thumb. The row is
the label, so the whole line is one target, and the label text is the body step
in ink, as in the app.

**The thumb keeps the same gap everywhere.** The app padded the track by 2px
and moved the thumb 22px, which left 2px at the start when off and 4px at the
end when on. A 24px thumb in a 30px track has 3px above and below, so the
library gives it 3px at both ends too. The travel is then the track (52px) less
the thumb (24px) less two gaps (6px), which is 22px again: the app's distance,
with the padding changed to match it. Width, thumb size and gap are three
properties and the travel is computed from them, so a size that changes stays
symmetric. The thumb follows `--radius-pill` like the track, a circle in
Rounded and Soft and a square in Square. It moves by its inline margin and not
by a transform, so it reverses in right-to-left text without a direction
selector, which the browser floor does not have.

**The off track is the boundary color and the on track is ink.** The app mixed
ink at 22% for the off track, which measured 1.62:1, and "Six colors added"
already names a switch's off track as a use of `boundary`. The thumb is the
Raised fill when off and canvas when on, which on an ink track (white in dark)
is the inverse, as the primary Button's label is. The off track is painted on
the surface itself, so each pair is measured on all five surfaces a switch can
sit on:

| Pair | Lowest on the five surfaces, light | Dark |
| --- | --- | --- |
| Off track against the surface | 3.38 | 4.93 |
| Raised thumb on the off track | 3.48 | 4.24 |
| Ink track against the surface (the ink text pairs) | 16.25 | 15.36 |
| canvas thumb on the ink track (the primary Button label) | 16.25 | 19.31 |

The first two rows are new in the contrast gate: the off track on each surface,
and the thumb on it on each (Lifted was there already). The last two were gated
already, at 4.5:1, and still are.

**The thumb casts no shadow.** The app gave it the lift shadow. At 4% in light
it cannot be seen, and at 40% in dark it smears a gray halo across the white on
track, so the library draws a flat thumb in both themes.

**Focus is the token ring around the track,** 2px at a 2px offset. It sits
outside the track so ink still reads against the surface when the track is ink.
The app drew the same ring, in ink; the library draws it in the focus ring
token. Nothing else on the row changes.

**Disabled is different when the switch is on and when it is off.** The app drew
ink at 10% for both, so a disabled switch told on from off by the thumb alone.
The library follows the disabled idiom of the Button
and the input and splits it. Off is hollow: the recessed `disabled` fill, a 1px
edge of ink at 15% and a taupe thumb. On is filled: a taupe track and a thumb
in the recessed fill. The fill, the thumb and its position all say which, so no
one cue carries it. A disabled control is outside the 3:1 asked of an active
one: the taupe thumb on the recessed track measures 1.44 in light and 3.81 in
dark, and the filled track against its surface 1.40 to 1.58 in light and 3.68
to 3.81 in dark. The label is taupe too, as the paragraph on the disabled label
below records.

**Changed is a ring around the track and the chip beside the label.** The app's
switch draws a changed cue of its own, a 2px ring in light signal orange
("a 1.5px border on a 24px pill reads as a smudge rather than a cue"), so the
library keeps the ring and does not draw the 1.5px border that text fields use.
The ring is outside the track, so it does not replace the off track's boundary
fill: the track under it keeps the 3.38:1 measured above, on every surface. The
track draws the ring, keyed on the field's root (`data-changed`) as the field
contract asks, so it shows on an ink track and on a boundary one. The focus ring steps out
past it by its width, so a changed switch with focus shows both. The chip is
the field's `FieldChanged`, beside the label and not inside it, so the switch
is named by its label alone, and a screen reader reads it with the switch
through `aria-describedby`, exactly as TextField's chip is read. Light signal
orange measures 2.53 to 2.87:1 against the light surfaces and 5.35 to 6.73 in
dark. That is under the 3:1 a boundary asks in light, and it is kept and
recorded rather than gated, for the reason TextField gives: the cue is never
alone, because the clay chip carries the word and is gated. A switch with no
visible label draws the ring and no chip, as a field without a label row does.

**There is no invalid or required state.** The app drew an error ring on a
switch row. A switch takes effect as soon as it is flipped, so no value of it
can be wrong, and a choice that a form confirms later is a Checkbox. The
library leaves `isRequired`, `isInvalid` and `validate` out of the props.

**Drawn 30px, hit 40px.** The row extends its hit area with a pseudo-element, 5px
above and below, so the touch rule holds with no layout shift. The app's switch
was 30px with nothing extended.

**A disabled label is taupe, and the track and the chip sit level with the first line.**
The label stayed ink on a disabled switch, while the checkbox and the radio draw
theirs taupe, the document's color for disabled text, so the switch now follows
them (`GrayText` in forced colors, as theirs is). Taupe on the five surfaces
measures 1.40 to 1.58 in light and 3.68 to 3.81 in dark. That is under the 4.5:1
asked of text, and WCAG 1.4.3 exempts the text of a disabled control, so the
pairs are recorded and not gated, as the checkbox's and the radio's are. The
row also centred its items, which put the track beside the middle of a label that
wraps. It now starts them at the top, so the track is level with the first line.
The track (30px) is taller than the 22.4px line, so the row pads the text down
by half the difference, 3.8px, at the top and the bottom, and the track takes
that half back as a negative margin on both sides. A row of one line is still
30px tall with its text where it was, and its hit area still reaches 5px past it,
to 40px. A longer label runs on below the track with the 3.8px under its last
line that one line has, and the margins are even so a layout that sets the row
to `display: contents`, as the docs' settings rows do, still centres the track.
The Changed chip follows the track: its head starts its items at the top too,
and the chip takes a margin of half of what the track has over its own 14px
line, 8px, so it is level with the first line and, for a row of one line,
exactly where centring put it. A chip that does not fit beside the row drops
under it, as before, with the same 8px above it.

**Hover draws nothing, as in the app.** The thumb moving is the feedback, and the
pointer cursor marks the row as pressable. A read-only switch looks like an
enabled one, like a read-only field, and only its cursor stops being a pointer,
since a press does nothing.

**Motion is the app's 160ms,** a fade of the track and a slide of the thumb, and
both stop under reduced motion, which the app's did not. The corners never
animate: they belong to the shape axis.

**The control is a native checkbox with the `switch` role,** from React Aria's
SwitchField and SwitchButton, so a screen reader says "switch, on" where a
checkbox would say "checked", as the app wanted. It submits its `value` (the
browser's `on` without one) under its `name` only while it is on, and is left
out of the form while disabled. The app's two-option text value, its `Yes|No`
pair and its list of fields that read as on when blank are the app's own logic
and not the library's.

**In forced colors the track and the thumb take system colors.** The browser
paints every background canvas, so a canvas thumb sat on a canvas track and an
on switch and an off one drew the same border and nothing else: only the
thumb's place was left to tell them apart. A `@media (forced-colors: active)`
block sets the three properties every state reads. Off is an empty track in
the text color with a solid CanvasText thumb. On is a Highlight track with a
HighlightText thumb, so the pair the system guarantees to read together is the
pair drawn. Disabled off is a GrayText edge and thumb on an empty track, and
disabled on is a GrayText track with a canvas thumb, so the disabled pair still
differ from each other and from the enabled pair. The changed ring and the
focus ring are borders and outlines, which the browser keeps. This block, and
the ones in the checkbox, the radio group and the segmented control, are the
only places in the library that write a color that is not a token.

**A long word in the label breaks inside the row.** The label is the
`switch-text` span, which wraps in its own right (`min-width: 0` and
`overflow-wrap: anywhere`), so an address in a label breaks inside it. The row
is an inline flex box, and its own `min-width: 0`, `max-width: 100%` and
`overflow-wrap: anywhere` keep the row itself inside a 320px screen. The
`switch-text` box is positioned, so it stacks above the row's hit area, the
`::before` that reaches 5px past the row: a link in the label takes its own
press, and a press anywhere else on the text still reaches the row.

## SegmentedControl

The document specifies no segmented control. Tabs (see "Still missing" in
Appendix A) are the same row of pills with no value, and the source has one
for choosing a value. The library keeps the source's control and changes a few
things, each recorded here.

- **Shape.** The track is a pill with the Raised fill and the boundary edge:
  `--radius-pill`, which the shape table already lists for segmented tracks, so
  it follows the shape axis. The options sit inside it at 4px, and their corner
  is the track's less that 4px, so the two stay concentric in every shape: pills
  in a pill, 8px inside Soft's 12px, square inside square. The source drew the
  track with a fixed 24px corner, which is the pill's corner at this height, so
  Rounded looks the same.
- **The options are 40px tall.** The source's comment says 40px (48 less 4px of
  padding each side) and its rule gives 38, because the 1px edge was left out of
  the sum. The library sets the option to 40px and the track to 48px, the height
  of the input beside it. The track's height is set and not left to add up. The
  firmer 1.5px edge of a changed or invalid control is a width the browser may
  snap to a whole device pixel, so it draws 1px on most screens and 1.5px on a
  2x screen, and a height that depended on it would jump with the state. The
  options stay centered, and the edge is all that changes.
- **The edge** is `--color-boundary`, 1px. The source dropped it to 40%, which
  measures 2.58:1 on white ("Six colors added"). Hover does not touch it.
- **Labels** are the action step (16px, weight 500) in slate. The options are
  sized by their labels, and the room left over is shared out equally. A label
  too long for its option is cut with an ellipsis, a last resort: the control
  stacks before that happens. Labels have a line a little taller than the step,
  so an ellipsis never clips a descender. An option is never narrower than 40px,
  so a one-glyph label, a letter or a numeral, is still a 40px target: with no
  floor a compact option would be about 36px wide, the glyph between its 14px
  of padding each side.
- **The chosen option is an ink fill with canvas text**, the shape the rail's
  current link uses. canvas on ink measures 16.25:1 in light and 19.31 in dark,
  and is in the contrast gate already (the primary button's label).
- **Hover is a 5% ink wash** and the label turns ink, only where hover exists
  and never on the chosen option, a disabled one or a touch screen. The wash
  measures 1.11 against the fill in light and 1.16 in dark: a cue, not a
  boundary, and not gated. The label turns ink because the source's did; slate
  would have held 4.96 and 5.84 on the wash. A read-only control takes no wash
  and no pointer cursor, as a radio, a checkbox and a switch do: it cannot
  change, so it is not offered as a button. React Aria already removes
  `data-hovered` under read-only, but the native `:hover` half of the rule
  would still paint, so the rule excludes `[data-readonly]` itself, inside
  `:where()` so that hover keeps the weight of the chosen fill written after it.

**Focus on the chosen option is an inset ring in the canvas color.** Focus and
selection move together on a radio group, so the focused option is nearly always
the chosen one, and the source drew an ink ring inside an ink fill, which
measures 1:1. The ring inverts here, as the rail's current link does: canvas on
ink is gated at 3:1 ("the inverted focus ring on an ink fill") and measures
16.25 and 19.31. It sits 4px inside the pill, as far in as the standard ring
sits out. Every other option takes the standard ring, 2px outside the pill,
which lands on the track's own edge and reads as a ring there.

**A control stacks when its row does not fit.** The options are all in one row or
all in a column, never some of each. The component compares the row's natural
width with the room the control has, and a row wider than its room, by more than
half a pixel (the width a row can overrun by and still paint inside), stacks.
Stacked, every option is 40px tall in both sizes, the labels start at the left
and the track takes the surface corner, 24px in Rounded, with the options 4px
inside it at 20px. A pill's corner is half the track's height, which on a column
is a blob. The component sets `data-stacked` on the root and the stylesheet does
the rest.

How the row is measured is the part worth recording, because a naive version
flickers. Two elements are read and nothing is copied. The track is
`width: max-content` and at least as wide as its root, so a row that does not fit
makes the track wider than the root, and no copy of the options is needed to
learn the natural width. The room is a zero-height marker as wide as the root.
It is the marker that a `ResizeObserver` watches, not the root, because stacking
changes the root's height, and a size change that an observer's own callback
causes in the element it watches raises the browser's "loop completed with
undelivered notifications" error. A stacked track is a column, so its width says
nothing about the row; to find out whether the row fits again, the component
takes `data-stacked` off, reads both widths, and puts the answer back, which is
one layout inside the observer's callback and never paints the in-between state.
It looks again only when something that can change the answer happened: the room
changed, a label changed (a `MutationObserver` on the track), a web font arrived
(the row measured in a fallback face is the wrong width), or `size` changed.
Choosing an option, hovering and moving focus change none of them. Where a width
cannot be read, as in a hidden panel, the arrangement stays as it is. The source
measured with off-screen copies of the labels; reading the real track needs no
copy and cannot disagree with it. Measuring needs script: before the page
hydrates, or with scripts off, nothing has said to stack, so a row that does not
fit overflows its root there.

**The room is the root's own width.** The root is a field, so like every field
it fills the column it is in, up to `--container-field`. A control placed in a
parent that sizes its children to their content, a flex row or a centered grid,
takes its natural width and has no room to compare with, so it never stacks and
its row overruns the parent instead. A control that must stack there needs a
width (`flex: 1` in a row, or a `width` in a grid). The source measured the room
beside the control's neighbors, which is more than a field's column asks for.
The compact controls in the docs header never need it: they sit in a row that
wraps. The marker is as wide as the root's padding box, so horizontal padding a
caller adds to the root through `className` makes the measured room wider than
the room the track has, and a row can overrun it by that much without stacking.
Give the control's spacing outside it, as a margin or a wrapper.

**The compact size, `sm`,** is for a toolbar or a header, where the 48px track
is too tall. It draws the track at 40px and the options at 32px, 14px type, with
2px between them, and each option is still hit at 40px: a pseudo-element
reaches over the 4px of padding and edge, which is all there is between the
control and what is next to it, so nothing shifts. It is a size prop and not a
docs-only rule because the docs header and the homepage's Corners switch both use
it. A stacked compact control uses 40px rows, so the hit areas of neighboring
rows never overlap.

**Disabled had no look in the source.** A disabled control is recessed, as every
field is: the disabled fill, an ink edge at 15%, and taupe labels, with the
not-allowed cursor. The chosen option keeps its place as a taupe pill with the
disabled fill for its label, so a reader can still tell which value is set; in
the source's switch a disabled control was the same whether on or off.
Disabled is outside the 3:1 asked of a boundary and the 4.5:1 asked of text:

| Disabled | Light | Dark |
| --- | --- | --- |
| Taupe label on the disabled fill | 1.44 | 3.81 |
| Chosen pill on the disabled fill, and its label on the pill | 1.44 | 3.81 |
| Edge, ink at 15%, on the disabled fill | 1.37 | 1.59 |

**A disabled, chosen option leaves the control with no tab stop.** React Aria's
`useRadio` (in `@react-aria/radio`) gives the tab stop only to the chosen radio,
and then takes it away from a disabled one, so with `defaultValue="dark"` and
Dark disabled, Tab skips the control and a keyboard user cannot reach the other
options. A segmented control is built on the same hook, as a radio group is. It
is a limit of React Aria, recorded and not worked around: an `it.fails` test
holds the correct behavior, a tab stop in the control, so an upstream fix
reports itself. Until then, do not disable the chosen option of a control the
reader can still change.

**Changed and invalid are edges on the track, keyed on the field's root.** The
source's rule looked for the tracked input inside the segmented group, and the
input was the group's sibling, so the track never drew its orange edge and only
the chip showed. The root carries `data-changed` and, from React Aria,
`data-invalid`, and the track draws the edge for them, as an input does: light
signal orange for changed, the error color for invalid, both 1.5px, and the
invalid rule comes after the changed one so a control that is both shows the
error edge. The chip leaves while the control is invalid by any cause and is read
with the control while it is changed, through the same label-row helper as
TextField.

| Edge | Lowest on the five surfaces, light | Dark |
| --- | --- | --- |
| Boundary, over the Raised fill | 3.06 | 4.93 |
| Error (invalid) | 6.58 | 5.06 |
| Light Signal Orange (changed) | 2.53 | 5.35 |

The boundary and the label colors are gated already (slate on Raised measures
5.49 and 6.44). Light Signal Orange is under the 3:1 a boundary asks on every
light surface, the document's own choice of attention cue, recorded and not
gated, and never alone: the clay chip carries the word.

**The options are always laid out in a row.** React Aria's `orientation` is not
a prop here. The arrow keys serve both axes of a radio group, so a stacked
control answers Up and Down as well as Left and Right, and the group stays
`aria-orientation="horizontal"` for the one arrangement it was drawn in. A
control needs a visible label or an `aria-label`, and the types ask for one.
Nothing animates, so there is no reduced-motion block; the docs site keeps its
own corner transition.

No pairing was added to the contrast gate: every color the control draws is
gated already (slate and ink on Raised, canvas on ink, the boundary, the
inverted ring, error) or recorded above (the hover wash, Light Signal Orange in
light, the disabled look).

**In forced colors the chosen option is Highlight.** The browser paints every
background canvas, so the ink pill became canvas on a canvas track, with the
same text color as every other option: the chosen one could not be told from
the rest. A `@media (forced-colors: active)` block gives the chosen option
Highlight with HighlightText, and a disabled chosen option GrayText with canvas
text, so it is still the one that was chosen. The focus ring on the chosen
option is HighlightText, because the browser's own ring color would sit on the
Highlight fill. The track's edge and the other options' text are the browser's
own, and they hold. Like the checkbox's, the radio group's and the switch's,
the block is one of the only places in the library that writes a color that is
not a token.

## Card

The document's panel section becomes `Card`, with a header, a title, a note
and a body. Lifted Cream, the stadium corner and 32px of padding come straight
from the document. Seven things were derived.

- **The padding is a spacing step.** It reads `--spacing-card`, 32px, the size
  of the separate step, "section header to its body", so the space around a
  card's content and the space between its header and body are one number. The header's rule
  reaches the card's edges through negative margins of the same size, so the
  two cannot drift apart. The rule is `--color-divider`, the app's ink at 10%
  under its own token, and the border is `--color-hairline`, which is why the
  box does not move when the color mode changes.
- **The card's padding is `--spacing-card`**, 32px, and 20px under
  `data-density="compact"`. A card cannot know how wide the column around it
  is, so a site that wants 20px on a phone sets `--spacing-card` under its own
  media query, as the docs site does; the under-title padding is
  `min(var(--spacing-peer), var(--spacing-card))`, so the rule inside a compact
  card is 20px everywhere.
- **The header is a div.** A `<header>` outside sectioning content is the
  page's banner. A card is a div unless it is told otherwise, so every card
  header at page level would add a banner, and axe fails two of them as
  duplicate landmarks. The title is what names a card, so the structure is
  carried by the heading and not by the wrapper.
- **The title's level is not its look.** The app's section title was always an
  `h2`. In a library the card cannot know where it sits in the page's outline,
  so `level` picks the element, `h1` to `h4`, and the type stays the h3 step at
  every level, so the same card looks the same wherever it is placed.
- **A card in a card steps down.** The app never put a card in a card. The
  library does, and the nested radii table already says what to do: a 40px
  holder holds 24px cards. A card placed in another card, directly or in its
  body, takes `--radius-surface`, which is 12px in Soft and 0 in Square. The
  rule is those two placements and not any descendant: a card that sits on a
  well of its own, such as the docs preview stage, is not on the card's
  surface and keeps its corner. In light a nested card is Lifted on Lifted and
  the hairline is transparent, so nothing would show its edge. It takes the
  frame outline a list takes. The outline is a cue and not a boundary, since
  nothing depends on seeing the edge: it measures 1.28 against Lifted in light
  and 1.43 in dark.
- **The body owns the rhythm.** It is the app's body grid: 24px between peers
  down the page and 32px between them across it, which only shows once the body
  is given columns. Its children carry no vertical margin of their own, so a
  paragraph's default one never adds to the 24px.
- **A long word breaks anywhere.** `overflow-wrap: anywhere` is set once, on
  the card, and inherited by every part and by whatever the card holds. It
  first sat on the title and the note alone, which left every paragraph and
  bare text in the body uncovered, and a part that sets its own value beats the
  inherited one, so none does. It is `anywhere` and not `break-word`, because
  only `anywhere` also lowers the card's min-content width, which a flex or
  grid parent sizes the card by. Measured at 320px with a word of 130 letters,
  in the fallback font of the browser the baselines are drawn in, the first
  version let a paragraph in the body scroll the page to 981px, and a title in
  a centered flex column made the card 1426px wide. With `anywhere`
  on the card, every placement fits the 280px column it sits in.

The title is ink and the note is slate, both on Lifted, and both pairings are
in the contrast gate. Ink measures 17.84 in light and 17.42 in dark, and slate
5.31 and 6.94. The app's collapse toggle is not part of Card. It arrives with
the collapsible card.

## CollapsibleCard

The app's folding card becomes `CollapsibleCard`: a card whose body folds
under its header, with the title as the toggle. It draws with Card's classes,
so the two look alike, and every rule it adds names a part a plain card does
not have, so a plain card is unchanged. Eight things were derived.

- **The fold is the app's grid row, without its visibility step.** Before the
  component was written, two ways to fold React Aria's `DisclosurePanel` in
  200ms were built and compared in Playwright's Chromium, Firefox and WebKit:
  the app's grid row, one track that moves between `1fr` and `0fr`, and React
  Aria's `--disclosure-panel-height`, which it sets to the panel's
  `scrollHeight` in pixels and to `auto` once the panel has settled. Both
  folded smoothly both ways with no flash, took the folded body out of the tab
  order and the accessibility tree, and stopped moving under reduced motion.
  React Aria's height failed an open card with a popup in it: `scrollHeight`
  counts an absolutely positioned child that hangs out of the body, so in
  Chromium a 147px body with a popup below it folded from 307px, jumping
  taller first, and opened to 306px before it snapped back to 147px, and
  Firefox and WebKit did the same. The grid row measures nothing and did
  neither. The app also hides a folded body with `visibility`, and that failed
  find-in-page in all three: neither `window.find()` nor a text fragment link
  reached text that `visibility` hides. So the library keeps the grid row and
  drops the visibility step. React Aria already sets `hidden="until-found"` on
  a folded panel once the panel's own transitions have finished, which takes
  the body out of the tab order and the accessibility tree and leaves it to
  find-in-page: a text fragment link opened a folded card in Chromium and
  WebKit, `window.find()` did in Firefox, and each time the card reported it
  through `onExpandedChange`. The grid is drawn only while the panel is shown,
  so a browser without `until-found` falls back to the `display: none` that
  `hidden` gives, which a `display` on the panel would override, and its
  find-in-page does not search a folded body. That last part is reasoned and
  not measured, since all three browsers have `until-found`. A reveal opens
  the card at once. The browser scrolls to the match as soon as its
  `beforematch` event is done, and with the 200ms open the body was still 0px
  tall then, and clipped, so a scroll container: the browser scrolled the
  body instead of the page, and the body dropped that offset when it stopped
  clipping. In Chromium, a text fragment link to the last of 41 paragraphs in
  a 480px card, in an 800px window, left the match at 3188px, out of view.
  Each card listens for `beforematch` on its root, in the capture phase,
  before React Aria's listener on the fold opens it, and every card that
  changes in the render React Aria flushes inside that event carries
  `data-instant` until two frames later, the mark a server-rendered card
  carries at hydration: the card itself, each card with its `storageKey`, and
  a controlled card whose parent opens it. Drawn at once, the match landed at
  399px, centred, as it does under reduced motion. A card the server renders
  folded is findable by a text fragment link only while the browser is still
  looking when the page hydrates. The server's HTML carries `hidden=""` on a
  folded panel, which no browser searches, and React Aria sets `until-found`
  in a layout effect after hydration. Measured by loading, with a text
  fragment link, a page that sets `hidden="until-found"` on its target after
  a delay, in Playwright's Chromium 156, Firefox 153 and WebKit 26.5:
  Chromium opened it at 300ms and not at 1.5s, WebKit at 1.5s and not at 5s,
  and Firefox with the attribute set as the page parsed and not 50ms later.
  So the docs promise find-in-page on the hydrated page, which needs no
  retry, qualify the link case with these figures, and tell an app whose link
  must reach a card to leave it open.
- **The body clips only while it is folded or folding.** An open card draws a
  popup inside it whole, past its edge. A body that folds has to clip, so the
  component marks the root `data-folding` on every toggle and takes the mark
  off when every transition the fold runs has finished, as `getAnimations()`
  and their `finished` promises report it: 203 to 219ms after a toggle in the
  three browsers. A toggle that turns a moving fold back replaces its
  transition, and the replaced one settles late, so only the latest toggle's
  settling takes the mark off. With nothing running, as under reduced motion,
  it comes off at once. `overflow: hidden` is keyed on that mark and on the
  folded state, and on nothing else.
- **The target is the title's row.** The title is a heading that holds the
  toggle, a button as wide as the block the title and the note share, with
  the chevron at its end. Padding of half of what 40px has over the title's
  line, 5.6px, takes it to 40px, and an equal negative margin gives the room
  back, so the header is as tall as a plain card's. A minimum height of 40px
  covers the rounding of a layout in fractions of a pixel, which drew the
  padded row 39.98px tall. A title that wraps keeps its own height, since the
  margin gives back only the padding. A card that folds while focus is in
  its body, as after a Done button there, moves the focus to the toggle,
  since the body is about to be hidden and would take the focus with it.
  React Aria's disclosure does not.
- **The header is a row that wraps, and the note stays under the title.**
  The title and the note are one block, the heading, with the note 8px under
  the title, as in a card. The actions end the row, 24px after the heading,
  the peer step, and the two are centred on each other. The 24px is the row's
  column gap, which is drawn only between two items on a row, so with no
  actions the toggle spans the row, and actions that wrap start at the row's
  start. The heading takes the room the actions leave, and never less than
  12rem (192px) beside them: where the row cannot give it that, the actions
  wrap under the note, so the order on screen is always title, note, actions,
  which is the order in the page and the order a screen reader reads. 12rem
  holds a typical title on one line with its chevron, as "Notifications"
  needs 161px, and it is a floor the title keeps whatever the actions hold,
  so the title's room decides, not a width. The first version made the
  header a size container and moved the actions under the note below 18rem,
  which failed two ways, measured in Chromium with Sofia Sans. A size
  container takes no width from what it holds, and a folded body adds none
  either, so a folded card in a column that starts its items was 66px wide,
  its padding, with a 16-character title 0px wide on 14 lines. It is now 275px
  wide, and the open card 259px, each with the title on one line, where a
  plain card is 227px. With a 45-character title in a 240px column, both
  fill the column, with the title on 4 lines. And a query on the header's
  width cannot see what the actions hold, so above 18rem their column took
  its full width and left the title the rest: two buttons in a 390px phone's
  358px card squeezed "Notifications" to 11px on 13 lines, and three buttons
  in a 420px card to 0px. Both now keep the title on one line, with the
  actions under the note. The size container also made the header a
  containing block and a stacking context, which a dropdown among the
  actions that does not render in a portal would have been positioned and
  painted against. Nothing contains the header now. One cost of the floor:
  "Notifications" and a tertiary Reset need 303px, so in a 390px phone's
  card, 292px inside its padding, the Reset moves under the note, where the
  18rem query kept it beside the title. The actions are never inside the
  toggle, so no control sits inside another, and they stay usable while the
  card is folded.
- **The chevron turns toward the title.** It is a 24px Lucide `ChevronDown`
  in slate, which turns ink on hover, where hover exists, and on a press,
  since touch has no hover. It sits level with the first line of a title that
  wraps, beside the words a reader starts with, as a checkbox's box does.
  Folded, it turns a quarter toward the title, which is the inline start. CSS
  has no turn that follows the direction, and `:dir()` is past the browser
  floor (Chrome 120), where Lightning CSS rewrites it as a list of
  right-to-left languages and so ignores `dir`. So each `dir` attribute sets
  the turn as a custom property, 90deg for `ltr` and -90deg for `rtl`, and it
  inherits: the nearest `dir` decides, as it does for the layout. `dir="auto"`
  sets no turn, so the nearest `ltr` or `rtl` above it decides, and a region
  marked `auto` whose text resolves to right to left should set `dir="rtl"`
  itself.
- **The space folds with the body.** The header's bottom margin, its bottom
  padding and its rule move to 0 with the fold, so a folded card ends at its
  own 32px of padding. The fold, the space and the chevron move in 200ms,
  ease, and reduced motion stops all three.
- **The root is the card's own element.** React Aria's `Disclosure` always
  renders a div, its `render` prop must return one, and it passes on only
  global attributes, so an `aria-labelledby` would be lost. The root is the
  `div`, `section` or `article` that `as` picks, and takes `className`, `ref`
  and every attribute, and the disclosure is a div inside it that draws
  nothing. The root carries `data-expanded` from the same state the
  disclosure is given.
- **Forced colors.** The browser repaints the title in the reader's text
  color, but an svg keeps a color its author set, so the slate chevron stayed
  slate. A `@media (forced-colors: active)` block gives it the toggle's own
  color, at rest, hovered and pressed. The ring is an outline, which the
  browser keeps (checked in Chromium with forced colors emulated, in light and
  dark).

| Chevron on the card's Lifted ground | Light | Dark |
| --- | --- | --- |
| Slate, at rest | 5.31 | 6.94 |
| Ink, hovered and pressed | 17.84 | 17.42 |

Both are in the contrast gate already, as text on Lifted at 4.5:1, over the
3:1 an icon needs, so no pair was added, and a test says so. The focus ring is
the ink ring the gate holds on Lifted.

**Remembering the fold.** `storageKey` keeps every remembered card's fold in
one `localStorage` entry, `snapshot-ui:collapsed`, a JSON list of the folded
keys, so a key the browser has not stored is open, and a fold or an open keeps
the keys of cards on other pages. The entry has no version and records only
folds, so `defaultExpanded={false}` does not apply under a `storageKey`, and
the JSDoc and the docs say so. Honouring it would need explicit opens
recorded as well, a change to the entry that has to keep reading the lists
0.2.0 wrote. The page reads it through
`useSyncExternalStore`: cards with one key share one state, and the `storage`
event brings in other tabs. An entry that cannot be read reads as nothing
folded, a write the browser refuses is skipped, neither throws, and the page
keeps a fold for as long as a remembered card is on it. The server cannot see
the browser's storage, so its snapshot is open, and a server-rendered card
folds in the render after hydration. That fold is drawn at once: a card the
server rendered carries `data-instant`, which turns its transitions off, from
the server's HTML until two frames after hydration. A first version set the
mark in a layout effect, for one frame, and on a page with two cards of one
key it started all five of the second card's transitions in Chromium: the
first card's `getAnimations()` brought the styles up to date before the second
card's effect had set its mark. Rendered from the server on, the mark is in
place before anything reads a style. Measured on a server-rendered page
hydrated two frames after its first paint, with two cards folded from storage:
no transition started in Chromium, Firefox or WebKit, against five per card
with the rule taken out, and a later press moved as usual. Find-in-page opened
a remembered folded card through the store in all three, by a text fragment
link in Chromium and WebKit and by `window.find()` in Firefox, and the other
card with its key opened and the open was stored.

**The folded marker.** A folded card that holds a change shows a dot after its
title: 8px, `--radius-dot`, in Clay, the color of the Changed chip the dot
stands for, so it reads as unsaved work, as the chip and the chip's own dot
do. It shows while the card is folded and either `isChanged` is given or an
element in the body carries `data-changed`, which every field's root carries
while it is changed, a field in a nested card included. While `isChanged` is
true the card's own root carries `data-changed` too, as a field's root does,
so a collapsible card around it counts the change, whether the inner card is
open or folded. The core stylesheets key `[data-changed]` only under a field's
own classes, so the attribute draws nothing on a card. A MutationObserver on
the fold watches that one attribute in its subtree, and the elements that come
and go there, only while the card is folded, and is disconnected when it opens
or leaves the page, so a large open card costs nothing. When the card folds it
reads the fold once, in the render that folds it or in React's check just
after, so a field changed while the card was open marks it with no change in
the body after the fold. The dot is out of the flow, so it moves no word, and
it sets no inset, so it stays where the flow would put it: after the title's
last word, on the last line, a part step on and centred on that line. It first
hung off the end of the words' box, centred on the first line, and on a title
that wraps the box is as wide as the room: in a 288px card, "Notification
preferences for every workspace" on three lines put the dot 63.8px past
"Notification" and 8px from the chevron, where it read as part of the chevron.
It now sits 8px after "workspace" and 15.3px clear of the chevron, mirrored in
right to left (measured in Chromium). A folded
title always keeps the dot's room, 16px, drawn or not, so the title never
moves when the dot comes or goes and the dot never reaches the chevron; an
open card keeps none, so no open card changed. While the dot shows, the
toggle is described by `changedLabel`, "Changed" unless given, in an element
with the `hidden` attribute after the heading, which a description may name,
so the toggle's name and the heading's text stay the title, and a screen
reader reads the title, collapsed, then Changed. In forced colors the dot, a
background, was painted over with the canvas and vanished (checked in Chromium
with forced colors emulated), so the forced-colors block draws it in
`CanvasText`.

| Folded marker on the card's Lifted ground | Light | Dark |
| --- | --- | --- |
| Clay | 6.81 | 6.82 |

The dot carries meaning, and on a folded card it is the only thing a sighted
reader sees of the change, so it is held to the 3:1 that WCAG 1.4.11 asks of
such a graphic, and gated: the pair is in the contrast gate at 3:1, on Lifted,
which is the ground of every card, a card nested in a card included. It was
first Light Signal Orange, the attention cue a changed field's edge uses, at
2.78 in light. That edge is never the only cue, since the clay chip beside it
carries the word, and the toggle's hidden description reaches only a screen
reader, so nothing excused the dot. Clay also measures 4.5 and over as text
on Lifted, where the chip sets it.

**Opening for an invalid field.** A folded card opens itself when a field in
its body fails the browser's validation, on submit or when a script calls the
form's `checkValidity()` or `reportValidity()`. It listens on its root, in
the capture phase, for the `invalid` event the browser fires at each control
that fails, and opens through the same setter as its toggle when the control
is inside the fold, so a remembered fold is forgotten and a controlled card is
asked through `onExpandedChange(true)`. A control among the header's actions
is in view already and leaves the card folded. A React Aria field moves focus
to the first field that failed, itself, from its own `invalid` listener on the
control, during the same event, so the card renders the open inside its
listener with `flushSync`. Without it, a submit started from script left the
field to take focus while its card was still folded and hidden: in jsdom the
field was focused with the card's toggle still collapsed and the panel still
`hidden="until-found"`. The open is drawn at once, as find-in-page's is: the
listener marks its event as a reveal before it opens the card, so every card
that opens in that render, each card with its `storageKey` included, carries
`data-instant` until two frames later. With the 200ms open the body was still
0px tall and clipped when the field took focus, so the browser scrolled the
body and not the page, and the field ended out of view. Measured in Chromium
in an 800 by 700 window, with motion, a required field after 20 others in a
folded card: focused at 2426px before, at 326px after, as under reduced
motion; a plain `required` input after 20 fields, which the browser focuses
itself, at 2424px before and 679px after; and the field in the lower of two
folded cards with one key, below 20 fields in the upper, at 2601px before and
539px after. A story submits a folded card whose required field follows 20
others and checks that the field is focused inside the window. This covers
every field the browser validates, a React Aria field or a plain one, open or
folded by a remembered key, with or without motion. The browser fires
`invalid` at each control that fails, one after another in the same task, so
the card opens, or asks a controlled card's parent to, once for all of them:
a controlled card that stayed folded was first asked once per failing field.
React Aria's other path, `validationBehavior="aria"`, sets no
`required` attribute and no custom validity, so the browser finds nothing
wrong, fires no `invalid` event and submits the form. A folded card then stays
folded, the docs say so, and an app that validates that way opens the card
from its own state. No second mechanism was added for it.

## Overlays

Dialog, ConfirmDialog, Drawer, Sheet, Popover, Menu, Toast, CommandPalette and
Tooltip share one layer: a stylesheet, `overlay.css`, and two private hooks,
`useOverlayScope` and `useOverlayStack`. It is derived here once, before any
of them is built, and each overlay's own section records only what is its own.

**Two classes.** Every overlay portals to `document.body`, React Aria's
default, and every portaled root carries the class `overlay` beside its own.
For a modal the root is the panel, React Aria's `Modal`, and the
`ModalOverlay` that holds it carries the second class, `overlay-scrim`. A
sheet's scrim is its `SheetBackdrop`, inside React Aria's `SheetOverlay`, so
the backdrop carries `overlay-scrim` and the overlay does not, and
`overlay.css` fits the shared scrim to that backdrop in one variant,
`.overlay-scrim.sheet-scrim`; "Sheet" says why. A portal sits outside
whatever the app styled, and `base.css` is opt-in, so `overlay` restates on
the root what `base.css` gives a page: `box-sizing: border-box`, ink, Sofia
Sans, the body size, line height and weight, and `text-align: start`. The app
restated the font on its dialog for the same reason. The page under an
overlay never sees a library class.

**The inset.** `overlay` also declares `--overlay-inset` as
`var(--spacing-inset)`, the 16px the app's rail, save bar and toast all keep
from the viewport's edge. It reads `--spacing-inset`, which `## Floating chrome
and the shell` derives, and `overlay.css` is the one place it is declared. It is
declared on `overlay-scrim` too, in the same rule: a modal's scrim is the
panel's parent and reads the inset for its own padding, and a custom property
declared on the panel never reaches its parent, so the scrim would have none.

**Theme, shape and density scope.** A portal leaves every nested
`[data-theme]`, `[data-shape]` and `[data-density]` subtree, so without help a
dialog opened from a dark card would draw in the page's light theme.
`useOverlayScope` returns a callback ref for the overlay's root, which copies
the three onto the root when it attaches. The root mounts when the overlay
opens, since React Aria unmounts a closed overlay, so attach is open. It is a
callback ref and not an effect, because React attaches a root's ref only after
the layout effects of everything inside the root have run: an effect in a
component inside a modal's panel found no panel at all, and the copy never
happened. It starts from the origin: the trigger, where React Aria hands the
overlay one (Popover and Menu through `PopoverContext`, Tooltip through
`TooltipContext`), and otherwise what held focus when the overlay opened. The
pressed trigger still holds focus as the root attaches, and React Aria's
`Dialog` moves focus later, in an effect, but content that focuses itself as
it mounts does not wait: React focuses a native `autoFocus`, or React Aria's
`Input` with `autoFocus`, in the same layout phase, before the root's ref
attaches, and a dialog opened from a dark card then opened in the root theme.
So the modal frame records `document.activeElement` in a layout effect of the
panel's first child, which runs before anything in the content, and hands that
to the copy as its origin. Content that focuses itself, such as a palette's
input, needs no origin of its own. For each attribute, in the order theme,
shape, density, the nearest ancestor of the origin that carries it gives the
value, and an attribute no ancestor carries is removed from the root. So an
origin outside every nested scope, or the body when nothing is focused, gets
the root theme. For a modal the copy lands on the panel and not on the scrim,
so a light card's dialog is light while the scrim keeps the page's opacity.
The toast region copies nothing and follows the page root. The one escape
hatch is React Aria's `UNSAFE_PortalProvider` with a container inside the
scope: the docs show it, imported from `react-aria`, and the library neither
uses it nor adds a dependency for it. Every overlay has an `InDarkScope` story
that proves the copy.

**Direction.** Every overlay root sets `dir` from `useLocale().direction`.
React Aria does it for `Popover` and the toast region, and the wrappers do it
for Tooltip, `ModalOverlay` and `SheetOverlay`. Every rule is written in
logical properties. `:dir()` is above the browser floor (Chrome 120), so no
rule uses it: where a physical side is needed, as for the drawer's slide, the
component resolves its `placement` and the direction into a `data-side`
attribute, and the stylesheet keys on that. The direction comes from the
locale and never from the page: a `dir` on a section does not reach an
overlay portaled to the body, so an app wraps a right-to-left region, such as
a guide in Persian, in `I18nProvider` with the region's locale.
`@snapshot-ui/react` re-exports React Aria's own `I18nProvider`, as it does
`RouterProvider`, so the provider and the parts share one copy of React Aria
whatever else the app installs. "Checks/Right to left" holds a story for
Dialog, Drawer, Sheet, Popover, Menu, Toast and CommandPalette.

**The scrim.** Only the modal surfaces have one: Dialog, ConfirmDialog,
Drawer, Sheet and CommandPalette. Popover, Menu, Tooltip and Toast never dim
the page; React Aria's invisible underlay only catches a press outside. The
scrim is Deep Well (`#050505`) at the theme's `--opacity-scrim`, 0.4 in light
and 0.65 in dark, as "Two surfaces the theme switch needed" in Appendix A
derives. It is never ink, which is white in dark and would lighten the page it
covers. It is a background color, mixed with `color-mix()`, and not `opacity`,
so it never fades the panel inside it. It keeps `forced-color-adjust: none`.
Without it, Chromium in forced colors leaves the scrim translucent, keeping
its alpha of 0.4, but swaps its color for the reader's background color:
measured, `rgba(0, 0, 0, 0.4)` in a dark palette and `rgba(255, 255, 255,
0.4)` in a light one, which washes the page out instead of dimming it. With
it, the scrim stays Deep Well. The property is inherited, and a modal's panel
is the scrim's child, so `overlay` sets `forced-color-adjust: auto` and every
panel, with everything in it, follows the reader's palette again. It is fixed
over the viewport at `--z-modal`, as a grid each modal places its panel in,
and its height is `--visual-viewport-height`, the inline value React Aria
writes on the overlay so that the on-screen keyboard shortens it, or `100dvh`
without one. It is `box-sizing: border-box`, so the padding a modal gives it
to keep its panel off the viewport's edges sits inside that height on a page
without `base.css`, where a content box would push the panel past the bottom
by twice the padding. While the overlay enters or exits the scrim is
transparent, and its color moves in 180ms, ease. A press on the scrim
dismisses when the modal is `isDismissable`; a press on the toast region does
not.

**One scrim when modals stack.** A modal opened from a modal, such as a
confirm from a dialog, would paint a second scrim over the first and darken
the page twice. `useOverlayStack` keeps the open modal overlays in a
module-level list, in the order they opened. A modal is in it while its state
is open, so one that is exiting has already left. The first in the list is the
bottom-most and paints the scrim. Every other one carries `data-stacked`, set
straight on its scrim so React never re-renders React Aria's overlay for it,
and is transparent while it still catches presses. When the bottom-most
closes, the next becomes bottom-most and paints. The list creates no DOM, so
it is safe to import on the server, and it answers two more questions:
CommandPalette's shortcut is ignored while any other modal is open, and tests
read it.

**Surfaces.**

| Overlay | Fill | Edge | Shadow | Corners |
| --- | --- | --- | --- | --- |
| Dialog, ConfirmDialog | `--color-float` | `--color-hairline` | `--shadow-dramatic` | `--radius-stadium` |
| Drawer | `--color-float` | `--color-hairline` | `--shadow-dramatic` | `--radius-stadium` |
| Sheet | `--color-float` | `--color-hairline` | none | `--radius-stadium`, top corners only |
| Popover, Menu | `--color-float` | `--color-frame` | `--shadow-float` | `--radius-surface` |
| CommandPalette | `--color-float` | `--color-frame` | `--shadow-float` | `--radius-surface` |
| Toast | `--color-float` | `--color-frame`, plus a 4px tone stripe | `--shadow-float` | `--radius-surface` |
| Tooltip | `--color-ink` | a transparent 1px border, for forced colors | `--shadow-float` | `--radius-micro` |

Every overlay but the tooltip sits on Float: this document reserves white for
floating surfaces, and the app's dialog fill differs from Float by one step in
light and not at all in dark. A modal sits over a dimmed page and separates
from it by tone, so it takes the hairline, which is nothing in light and white
at 12% in dark. Measured against the scrimmed canvas, a dialog's Float is 3.10
in light and 1.15 in dark, where the hairline carries the edge, as this
document already accepts for cards. A float that is not modal opens over any
surface, another float included, so it takes the frame in both themes, as the
menu popup already does ("Two surfaces the theme switch needed"). The palette
is a floating surface and not a panel dialog, so it takes the popup's edge,
corner and shadow. Modal surfaces take elevation level 3 and floats level 2;
the sheet casts none, since its only edge is at the bottom of the viewport,
where a shadow shows nothing. Parts step down the nested-radii ladder: a 24px
popup holds `--radius-control` rows, a 40px dialog holds 24px parts, and
buttons keep `--radius-control`, because a pill is a shape and not a size.
Soft and Square descend by construction.

**Spacing.** A list popup pads 8px (`--spacing-part`), a free-content popover
24px (`--spacing-peer`), a dialog 32px (`--spacing-separate`), and a drawer
and a sheet 24px (`--spacing-peer`, derived in their own sections). Rows in a
list sit 4px apart, the app's list gap, kept because two hover washes need a
seam between them.

**Motion.** Every overlay moves on React Aria's `[data-entering]` and
`[data-exiting]`, with `transition`. React Aria waits for the transitions
through `getAnimations()` before it unmounts, and with nothing running, under
reduced motion or in jsdom, it mounts and unmounts at once.

| Overlay | Enter and exit |
| --- | --- |
| Scrim | its background color, 180ms ease |
| Dialog, ConfirmDialog, CommandPalette | opacity, and an 8px rise to rest, 180ms ease |
| Drawer | a slide from its edge by `calc(100% + var(--overlay-inset))`, 180ms ease, by `data-side` |
| Sheet | React Aria drives the slide with scroll and the backdrop fades through its keyframes; the Modal fallback slides up by its own height in 180ms |
| Popover, Menu | opacity, and 4px toward the trigger by `data-placement`, 140ms ease-out |
| Tooltip | opacity, and 4px toward the trigger, 140ms ease-out |
| Toast | opacity and an 8px rise on enter, through `@starting-style`; the exit is instant |

Reduced motion turns every one of them off, transitions and animations alike,
in a block after the rules it overrides; nothing in an overlay needs the
spinner's exception. `@starting-style` is above the browser floor (Safari
17.5, Firefox 129), so only the toast uses it, and on a floor browser a toast
simply appears.

**Focus.** Dialog, Drawer, Sheet and CommandPalette focus the panel's
container, or the child with `autoFocus`: the palette's input, or
ConfirmDialog's Cancel or Confirm. Menu focuses its first item, or its first
or last when Arrow Down or Arrow Up opened it. A free Popover focuses its
container. Tooltip and Toast never take focus. On close, React Aria's
`FocusScope` returns focus to the trigger; a toast closed while focused hands
focus to its neighbor; and when a confirmed action removes the trigger, the
caller places focus, which the docs say. Escape closes the topmost overlay
only, so a tooltip inside a dialog closes first. The containers React Aria
focuses with `tabIndex="-1"` (`Dialog`, `Popover`, `Menu`) take
`outline: none`, so opening by keyboard does not ring the whole panel, and
the rings stay on the controls inside. A ring inside a scrolling list is inset
(`outline-offset: calc(-1 * var(--focus-ring-width))`), because a scroll
container clips an outset ring, and on an ink-filled row it inverts to the
canvas color, as "Rules every component follows" says. Hover on a float is
the 5% ink wash, inside `@media (hover: hover)`.

**Widths and touch.** Every width caps against the viewport, so a 320px
screen never scrolls sideways. A dialog is 28rem wide, or 40rem at `lg`, a
drawer 20rem, a toast 28rem, a tooltip 20rem and the palette 40rem, each at
most the viewport less 2rem, the inset on both sides. A popover and a menu cap
at the viewport less 2rem inside React Aria's 12px `containerPadding`, and a
sheet is `min(100%, 36rem)`. Dialog, drawer and sheet bodies scroll inside the
panel (`min-height: 0; overflow-y: auto; overscroll-behavior: contain`) while
the head and the action row stay; a sheet's body scrolls once the sheet is
fully open and leaves out `overscroll-behavior`, so a swipe it cannot take
goes on to the sheet, as "Sheet" derives. Heights use `dvh`, with
`--visual-viewport-height` for the on-screen keyboard. Targets are 40px: a
menu row, which grows to 44px under `pointer: coarse`, the toast's dismiss
button, which is the 40px IconButton, and a dialog's buttons, which are
Buttons. Tooltips never show on touch.

**Forced colors and right to left.** The scrim keeps `forced-color-adjust:
none`, and every overlay root restores `auto`, so a modal's panel does not
inherit the scrim's opt-out. The selected menu row and the palette's active
row become `Highlight` with `HighlightText`, a disabled row `GrayText`, and
the sheet's grabber `CanvasText`. The tooltip keeps a transparent border,
which the browser redraws so the tip keeps its shape, and shows no arrow.
Every other border survives, since the browser redraws borders in the reader's
text color. Every system color sits inside `@media (forced-colors: active)`,
the one place the core test allows one. In right to left every root carries
`dir`, the rules are logical, placements are `start` and `end`, and the drawer
and the toast mirror.

**Strings.** English defaults, every one replaceable through a prop:
ConfirmDialog's `cancelLabel` ("Cancel") and its required `confirmLabel`; the
`closeLabel` of Dialog, Drawer and Sheet ("Close"); Toast's `dismissLabel`
("Dismiss"); the toast region's `aria-label`, React Aria's localized count,
such as "2 notifications.", unless given; and CommandPalette's `labels`
object. React Aria's own hidden "Dismiss" buttons follow `I18nProvider`.

**Server safety.** No overlay formats with `Intl` during render, reads
`window` or `document` at render or at import, or measures before its first
paint, and every value an overlay shows may be given as a preformatted string,
such as the palette's `end` slot or a toast's title. The toast queue and the
overlay stack are module singletons that create no DOM, so they are safe to
import on the server. `localStorage` is read only through
`useSyncExternalStore`, with an empty snapshot on the server. Every file that
imports React Aria starts with `'use client'`, and so does every module in the
overlay folder, the two hooks included: `useOverlayScope`, which reads
`document.activeElement`, and `useOverlayStack`, which touches no DOM API but
sits with it there, where every module is a client module. A helper that
imports no React Aria and is only ever imported by a client module carries no
directive and sits inside that module's boundary, as the palette's recents
store does, like the collapsible card's fold store before it.

**Layers.** Modal surfaces and their scrims sit at `--z-modal`, the toast
region above them at `--z-toast`, and React Aria's positioned overlays at the
inline 100000 it writes, as "Token names" sets out with the reasons.

**Refs.** Each overlay's `ref` takes the type of the React Aria part it lands
on: `HTMLElement` for Dialog, ConfirmDialog, Drawer, Popover and
CommandPalette, and `HTMLDivElement` for Sheet, Menu and Tooltip. A ref shared
by a Dialog and the Sheet that stands in for it on a phone is a callback ref
that takes an `HTMLElement`, which both accept; a `useRef<HTMLElement>` object
fits only the first five.

## Dialog and ConfirmDialog

The app's dialog becomes `Dialog`: a panel up to 28rem wide with 40px
corners, 32px of padding, an `h3` title and slate text, and a danger form with
an error-tinted icon well, whose body scrolls while its action row stays, and
which Escape and a press on the backdrop close. It had no close button and no
motion, and a second dialog replaced the first. Five things changed.

- **Float, not lifted.** The app filled its dialog with the lifted surface.
  This document reserves white for floating surfaces, and the two differ by
  one step in light and not at all in dark, so the panel is Float, as every
  overlay is ("Overlays").
- **The title is an `h2`.** It is React Aria's `Heading` in the dialog's
  `title` slot, which is what points the dialog's `aria-labelledby` at it, and
  React Aria gives it level 2. It is drawn in the card title step, the `h3`
  step, whatever its level, as a card title is. It is required, so every
  dialog has a name.
- **The description is wired by the library.** React Aria points
  `aria-describedby` at its `description` slot only for an alert dialog, so
  `Dialog` gives the description an id and points the dialog at it, unless the
  caller passes `aria-describedby` of their own.
- **The close button is opt-in.** Escape and the scrim close a dialog, as in
  the app, so a short dialog needs no X. A long one, whose action row the
  reader may not have reached, asks for it with `hasCloseButton`: a ghost
  IconButton with Lucide's `X`, 24px from the top and the inline end. Inset
  24px and 40px wide, it reaches 32px past the panel's 32px padding, so the
  head keeps 2.5rem clear at its end, those 32px and the 8px a part keeps, and
  a long title never runs under it.
- **Motion, and stacking.** The panel fades in and rises 8px in 180ms, ease,
  while the scrim's color moves in the same 180ms, and both stop under reduced
  motion. A dialog opened from a dialog, such as a confirm over a form, stacks
  over it: one scrim paints, Escape closes the top one, and the first keeps
  its focus state for when the second closes.

**The head.** The well, the title and the description are parts of one thing,
so they sit 8px apart (`--spacing-part`), and the head is 24px from the body
and the body 24px from the actions (`--spacing-peer`). The well is a 48px
circle in `--radius-pill`, Bone with an ink icon sized to 20px, as IconButton
sizes its icon. In the danger tone it is error at 14% over Float with the icon
in error. The title is ink, and the description is `--text-body` in slate.

| Pair | Light | Dark | Held |
| --- | --- | --- | --- |
| Ink icon on the Bone well | 16.76 | 15.36 | gated, as ink text on bone |
| Error icon on the 14% error well over Float | 5.88 | 4.72 | measured, not gated |
| Slate description on Float | 5.49 | 6.94 | gated, as slate text on float |

Every icon clears the 3:1 a graphic needs. The danger well is measured in
`test/contrast.test.js` and recorded here rather than gated, because the wash
is a mix and not a token the gate can name. The well's tone is a cue beside
the words: the title and the danger Button say what the dialog loses.

**The panel on the scrim.** Measured against the scrimmed canvas, Float is
3.10 in light and 1.15 in dark. In light the tone carries the edge and the
hairline is transparent; in dark the hairline, white at 12%, carries it, as
this document already accepts for cards. In forced colors the edge is drawn in
`CanvasText`, so the panel keeps its shape on the scrim, which stays Deep
Well. The well's fills vanish there and the icon
stays, which is enough.

**Widths and height.** The scrim is a grid that centres the panel with the
16px overlay inset clear on every side, inside the viewport's height, since
the scrim is sized by its border box ("Overlays"). The panel is `min(28rem,
100%)` wide, or `min(40rem, 100%)` at `size="lg"`, of the room inside that
padding, which is the viewport less 2rem. Its height stops at 100% of the same
room, and it takes `min-height: 0` for that cap to hold: a grid item's
automatic minimum is its content, which grew the scrim's row to a long
dialog's full height, measured at 1395px for twenty paragraphs in a 720px
viewport, and left 100% nothing to cap. With no minimum the row is the
scrim's, and a short dialog still sits in its middle. Inside, the body takes
the room left (`min-height: 0; overflow-y: auto; overscroll-behavior:
contain`) and scrolls, while the head and the action row keep their height. A
body that scrolls and holds nothing to focus, such as a page of terms, is a
tab stop while it scrolls, as the homepage's install command is on a phone:
Chrome and Firefox let the keyboard reach a scroller that holds nothing to
focus, Safari does not, and axe fails one nothing can reach. A body that holds
a control is reached through the control, so a long form gains no extra stop
before its first field. As a tab stop the body draws the focus ring tokens
itself, so it rings on a page without `base.css` too. The action row wraps,
ends at the inline end, which `flex-end` follows in right to left, and spaces
its buttons 8px apart.

**Padding and corners.** The panel pads 32px, `--spacing-separate`, the
app's number and the step for a section's header to its body. It takes
`--radius-stadium`, and its parts step down the nested-radii ladder: the well
is a circle, buttons keep `--radius-control`, and a field in the body keeps
its own corner. Soft and Square descend by construction.

**What React Aria gives.** Its `Dialog` focuses the dialog element on open,
unless a control inside already holds focus, and its `FocusScope` holds Tab
inside and gives focus back to the trigger, or to whatever held it when a
controlled dialog opened, in the frame after the dialog leaves. The frame
does not wait for that frame: when the panel leaves the page with focus
inside it, closed or taken off by the app, it gives focus back at once to
what held it as the panel opened, if focus is on the body and that element is
still on the page. On a loaded machine the frame comes late, and React Aria's
dialog focuses itself 500ms after it opens while focus is on the body, so a
dialog under a closing overlay would otherwise take focus for good. It gives
focus back through React Aria's own `react-aria-focus-scope-restore` event, so
a trigger that handles its own restore, such as a link preview that must not
reopen, still does, and it moves nothing when focus was elsewhere before the
close. The Popover does the same. Its
`ModalOverlay` runs `usePreventScroll` while open, which sets
`overflow: hidden` on the root element, hides everything outside with `inert`,
or `aria-hidden` where `inert` is missing, while it keeps any element marked
`data-react-aria-top-layer` visible, and writes `--visual-viewport-height` on
the scrim. The element React Aria focuses takes `outline: none`, so opening
from the keyboard does not ring the whole panel.

**The toast region.** Every library modal passes React Aria a predicate that
keeps a press inside `.toast-region` from counting as a press outside, so
pressing a toast's action while a dialog is open never closes the dialog.

**Forms, and the parts that are not exported.** The spec exported the body and
the action row as parts for a custom layout, but a dialog's `children` always
land inside its own body, so the parts placed there nested, and a nested action
row scrolled away with the body. They stay internal, and `actions` is the one
row that stays in view. A form dialog puts its `<form id>` in `children` and its
submit button in `actions`, joined to the form by the button's `form`
attribute. Enter in a field still submits, since a submit button joined that
way is the form's default button.

**ConfirmDialog.** The app's confirm becomes `ConfirmDialog`, an alert
dialog on top of `Dialog`, and `useConfirm()`, the app's promise. The app's
rule is kept whole: a question resolves yes only when the confirm button is
pressed. Escape, the backdrop, Cancel and a second question asked over the
first all resolve no, because silence is never yes.

- **Cancel, then the confirm button.** The safe answer comes first in the
  DOM, so it is the first thing Tab and a screen reader reach, and the confirm
  button ends the row at the inline end, as a primary action does in every
  dialog. Cancel is a tertiary Button, and the confirm button is primary, or
  danger in the danger tone. Its label names the outcome, "Delete 3
  transactions", never "OK", so the button says what it does without the
  title.
- **Initial focus by tone.** The app's focus landed on Cancel by DOM order;
  here it is explicit. In the danger tone `autoFocus` puts it on Cancel, so a
  stray Enter loses nothing. In the default tone it goes on the confirm
  button, the answer the question expects. React Aria's Dialog then leaves
  focus where it is. These are the library's two uses of `autoFocus` on a
  button, and each carries its own lint exception with the reason: initial
  focus inside a modal is the dialog pattern.
- **`tone` has no default.** The app defaulted to danger on purpose. A
  default either way hides a choice the caller must make: a destructive
  question drawn as a harmless one is the costly mistake, and a harmless one
  drawn as destructive teaches people to ignore the warning. So the prop is
  required, and the danger tone draws the warning triangle in the error well
  unless `icon` replaces it. Danger is for an answer that loses something:
  data, money or work. An action that cannot be taken back but loses nothing,
  such as sending an invoice, takes the default tone. A caller the type
  cannot hold, such as plain JavaScript, that leaves the tone out is warned
  once in the console.
- **The description is required.** An alert dialog is read out on open by its
  name and its description, so every confirm has both. React Aria points the
  `alertdialog` at the description itself; `Dialog` wires it the same way for
  every role.
- **Pending.** When `onConfirm` returns a promise, the dialog waits for it:
  the confirm button takes Button's pending state, whose label stays in the
  tree under the spinner, Cancel is disabled, and Escape and the scrim are off,
  so a half-finished action cannot be abandoned. It closes when the promise
  resolves. When it rejects, the dialog stays open and is no longer pending,
  so the question can be answered again, and the error goes to
  `reportError()`, which reports it as if nothing had caught it: the console
  shows it and the page's `error` listeners hear it, once. Where
  `reportError` is missing it is thrown again from a microtask. `isPending`
  draws the same state for a caller that tracks the work itself.
  `pendingLabel` names the spinner, "Loading" by default, and should name the
  work, such as "Deleting". Button joins the spinner's name to a pending
  button's ("Button"), so pending, the confirm button reads "Delete 3
  transactions Deleting", and React Aria announces that as the wait starts. A
  dialog that closes while its promise runs, which only a controlled caller
  can do, drops that run: reopened, it is not pending, and the run's end
  neither closes it nor calls anyone.
- **Every other way out is a cancel.** Escape, a press on the scrim and Cancel
  each call `onCancel` once. A confirm never does: the component marks the
  close a confirm asks for before it closes, and its close handler reads and
  clears the mark. To see every close, whether the dialog follows a
  `DialogTrigger`, `isOpen` or `defaultOpen`, it resolves that state itself by
  React Aria's rule and hands `Dialog` a controlled `isOpen`. Inside a
  `DialogTrigger` the trigger owns that state, as it does for any modal, so
  the dialog's own `onOpenChange` is not called there, and the component
  warns once when it is given one.

**`useConfirm()`.** It returns `{ confirm, dialog }` and needs no provider.
`confirm(options)` shows the question and returns a promise. A second
`confirm` while one is open answers the open one no and shows the new one,
unmounting the component that asked answers an open question no, and a
question asked after that answers no at once, so no promise is left waiting.
`dialog` is `null` until the first question, so a page that never asks draws
nothing. After that the hook keeps the last question rendered: an answered
one stays, closed, so React Aria plays the panel's and the scrim's exit before
it removes them, as it does for a dialog from a trigger.

Questions asked one after another are one run: one asked over an open one, or
chained after an answer, as a follow-up to a yes is. Three rules hold a run
together.

- **One overlay, a new question in it.** Each question keys the dialog element
  and its content, inside a panel and scrim that stay, so its initial focus
  runs again on its own tone's answer, and the overlay does not blink. A
  remount of the whole overlay would record the outgoing question's focused
  Cancel as the place to give focus back, since React Aria's focus scope
  records that as it renders.
- **The scope of the first trigger.** The hook records what held focus when
  the first question opened. A question asked while the last panel is still
  leaving reopens that panel, which keeps its scope. One asked after it has
  left would open from the body, because focus fell there with the panel, so
  the hook gives focus back to the recorded trigger first, as the panel
  leaves, without scrolling to it, and the next question opens from it, in its
  theme, shape and density. The scope is found again through that trigger and
  not stored, so a question asked after the panel has left, once the answer's
  work has removed the trigger and nothing in the scope holds focus, opens in
  the root theme. A question chained straight after the answer, the usual
  `if (await confirm(a)) { remove(); await confirm(b); }`, is asked while the
  panel is still leaving and keeps the scope. Strict Mode's rehearsed unmount
  of a new panel does not end the run, and a test runs a chain under
  `StrictMode`.
- **Focus goes back to the first trigger.** When the last question is
  answered and its panel has left, focus returns to the recorded trigger, not
  to the body and never to a Cancel that has gone. React Aria does this a
  frame later; the hook does it as the panel leaves, so a question chained in
  that frame still opens from the trigger.

The hook offers no pending state: the work after a yes belongs to the
caller's own interface, and a caller that wants the dialog itself to wait
renders `ConfirmDialog` with `onConfirm`. When the work removes the button
that asked, such as a row's Delete, focus has nowhere to go back to, so the
caller places it, as the docs example does on the row that takes its place.

**Nothing new is measured.** The danger well is Dialog's, measured above, and
the buttons are Button's tertiary, primary and danger variants, whose labels
the contrast gate already holds: slate on Float, canvas on ink and canvas on
error.

## Drawer

The app's drawer becomes `Drawer`: a floating panel inset 16px from the
viewport's edges, with 40px corners, the float fill and the hairline edge,
that slid in from the start edge in 180ms over the Deep Well scrim, at 0.4 in
light and 0.65 in dark, and that Escape and a press on the scrim closed. It hid
itself with `visibility` when closed and had no focus trap. React Aria's
`Modal` and `Dialog` give it what it lacked: focus moves in and is held there,
the page behind is inert and does not scroll, and a closed drawer is unmounted
rather than hidden. It shares the modal frame with Dialog, so the scrim, the
stack, the scope copy and the toast-region exception are the ones "Overlays"
derives.

**One object with the rail.** The panel floats 16px clear of the viewport on
every side, the overlay inset, which is the gap the app's navigation rail keeps
from the edge. A shell shows its navigation as that rail on a wide screen and
as this drawer on a narrow one, so the two are drawn as one object: the same
float fill, the same 40px corner, the same distance from the edge, the same
24px of padding. Only the scrim and the shadow tell the drawer from the rail.
The scrim is a grid that stretches the panel down its height, inside the inset
(`align-items: stretch`), and the panel is `height: 100%` of that room. Its
height takes `min-height: 0` for the same reason the dialog's does: a grid
item's automatic minimum is its content, and a list of forty links grew the
scrim's row past the viewport, measured at a 1412px body that showed all of
it and scrolled nothing. With no minimum the row is the scrim's, and the body
scrolls.

**Width.** `min(20rem, 100%)` of the room inside the scrim's padding, which is
`min(20rem, 100vw - 2rem)`: 320px wherever the screen holds it with 16px on
each side, and the screen less 32px on a phone narrower than 352px, so a 320px
screen keeps 16px of scrim beside a 288px panel and never scrolls sideways.

**Padding is 24px, not the dialog's 32.** A 320px panel at 32px leaves 256px
for a navigation list, which is tight for a page name beside an icon, and the
rail the drawer mirrors pads 24. So the header, the body and the footer pad
`--spacing-peer`. The header is a row: the title at the start and the close
button at the end, with `margin-inline-end: -0.5rem`: the icon sits 10px
inside the 40px button, so it lands 2px inside the padding edge instead of
10px and lines up with the text beneath it. The button, 40px, sets the row's
height, so the title's first line is centred on it: the title steps down by
half of what the button is taller than its line, `calc((2.5rem - 1lh) / 2)`,
5.6px for the 28.8px `h3` line, which puts both centres 44px below the panel's
inner edge, where a dialog's X sits too. The step applies only beside the
button, and a title that wraps keeps its first line there and runs on below.
The header pads only its top and sides, so the body's own 24px is the gap
under it. The footer pads its sides and its bottom, plus
`env(safe-area-inset-bottom)`, so an account row or an action stays clear of
a phone's home indicator, and it wraps a long word, as the title and the body
do, so an account row's address never pushes past a 288px panel.

**The body scrolls from the keyboard.** While the body scrolls and holds
nothing Tab reaches, such as a page of notes, it is a tab stop of its own, by
the same rule and the same shared helper as a dialog's body: Chrome and
Firefox let the keyboard reach such a scroller and Safari does not, and axe
fails one nothing can reach. A body that holds a link or a control is reached
through it, so a navigation list gains no extra stop. As a tab stop the body
draws the focus ring tokens itself, inset by the ring's width, because it runs
flush to the panel's sides, where an outset ring would cross the hairline. The
panel clips to its own shape (`overflow: clip`): with no footer the body's
square bottom corners meet the 40px curve, and the clip keeps that ring, and
the text scrolling through the body's padding, inside it. Nothing in the panel
paints past its edge on purpose; the close button's ring keeps 12px clear of
it.

**The slide is by `data-side`, and the side is physical.** The panel moves in
from its edge by its own width plus the inset, so it starts wholly off the
screen: `translate: calc(-100% - var(--overlay-inset)) 0` on the left and
`calc(100% + var(--overlay-inset)) 0` on the right, in 180ms, ease, and not at
all under reduced motion. `translate` is physical, and `:dir()` is above the
browser floor, so the component resolves `placement` against the locale's
direction into `data-side`: `start` is the left in left to right and the right
in right to left, and `end` the other way. The alignment is physical too,
`justify-self: left` and `right`: the scrim carries the locale's `dir`, and a
grid's `start` and `end` follow it, so a right-hand drawer aligned to `end`
sat on the left in right to left and slid in from the right, across the page.

**The title.** It is React Aria's `Heading` in the dialog's `title` slot, an
`h2` drawn in the `h3` step in ink, as Dialog's is, and it is required, so
every drawer has a name. A navigation list names itself, and a title over it
would say the same thing twice, so `isTitleHidden` wraps the heading in React
Aria's `VisuallyHidden`: it still names the dialog, and the header shows only
the close button, at the end. With no close button either, nothing in a
header would show, so there is none: the hidden title sits straight in the
dialog, out of the flow, and the body's own 24px is the top of the panel, as
the rail's is. An empty header would have kept its 24px of top padding over
the body's, and started a shell's list 48px down.

**The close button is on by default.** Escape and the scrim close a drawer,
but a drawer is tall and is often opened by touch, where neither is visible as
a way out, so the X is drawn unless `hasCloseButton` is false. It is the ghost
IconButton, 40px, with Lucide's `X`, named "Close" unless `closeLabel` says
otherwise.

**A closed set of props.** Drawer lists its props and passes none of React
Aria's dialog props through, unlike Dialog and Sheet, which extend them: its
dialog is named by its title alone and takes no `aria-describedby`, `id` or
`aria-label`, since the modal frame forwards a fixed set and the type promises
only what reaches React Aria. A drawer that needs a description says it in its
body; passing the props through later would break nothing.

**The shadow.** A drawer is a modal surface, so it takes elevation level 3,
`--shadow-dramatic`, as Dialog does. A shell whose drawer is the rail itself,
shown over the page on a narrow screen, may set `--shadow-lift`, the rail's
level 1, on its own class; the library does not, since a drawer it ships is
always over a scrim.

**Nothing new is measured.** The panel is Float with the hairline over the
scrim, 3.10 in light and 1.15 in dark with the hairline carrying the edge, as
"Overlays" records; the title is ink on Float and any secondary line slate on
Float, pairs the contrast gate already holds. In forced colors the edge is
drawn in `CanvasText`, so the panel keeps its shape on the scrim.

## Sheet

A bottom sheet for phones, swiped down to dismiss. React Aria 1.22.1 ships a
`Sheet` family that does the swipe with the browser's own scroll: the overlay
holds a scroll container two viewports tall, the sheet sits one viewport in,
and an `IntersectionObserver` closes the sheet once it has scrolled out. The
spec builds `Sheet` on that family only if it holds in Chromium, WebKit and
Firefox, and on the modal frame with dragging deferred if it does not. A spike
decided it before any sheet code was written. This is its record, and the
derivation of the component follows it.

**Date and versions.** 2026-10-13, on macOS (arm64), headless.
`react-aria-components` 1.22.1, with `react-aria` 3.53.1, and Playwright
1.64.0. The engines, with what `browser.version()` printed:

- Chromium 156.0.8078.4, the headless shell Playwright 1.64.0 pins
  (`chromium-1248`); printed 156.0.8078.4.
- WebKit build `webkit-2336` (WebKit framework 626.1.1), which the Playwright
  release that installed it labels WebKit 26.5. Playwright 1.64.0 pins
  `webkit-2370` and reports a fixed 27.2 from `browser.version()` and in the
  user agent whatever build it drives, so the 27.2 it printed is not this
  engine's number.
- Firefox 153.0 (`firefox-1538`); printed 153.0.

Playwright 1.64.0 pins `webkit-2370` and `firefox-1555`, which were not
installed, and nothing was downloaded, so WebKit and Firefox were launched
from their installed builds through `executablePath`.

**The prototype.** A throwaway story, `Checks/Sheet spike`, deleted before
this record was committed. A sticky header (`position: sticky; top: 0;
z-index: 20`, 96px tall), then three triggers, each with its sheet: one under
a `SheetTrigger`, one controlled through `isOpen` by `useState`, and one with
`preventDismissal`. Each is a `SheetOverlay position="bottom"` holding a
`SheetBackdrop`, Deep Well at 0.4 with a `swipeAnimation` from opacity 0 to 1,
and a `Sheet`: white, 40px top corners, `max-height: 92dvh`,
`min(100%, 36rem)` wide, a flex column. Its `SheetContent` is the scroller
(`overflow-y: auto; min-height: 0`) and holds a heading, a TextField, a Close
button, a trigger for a second sheet and twenty paragraphs. The overlay took
the inline style the spike's brief gave it, `position: fixed; inset: 0;
z-index: 1000`.
Two prototype rules stood in for the library: the second backdrop turned
transparent on `[data-stack-index="1"]`, and `animation: none !important`
removed the backdrop's animation under reduced motion.

**The run.** A Playwright script against the built Storybook ran the eight
criteria of spec 7.6 in each engine, each criterion in a fresh context: 1280
by 720 by default, 375 by 760 with `hasTouch` for criteria 3 and 8, and
`reducedMotion: 'reduce'` for criterion 7. React Aria drives the swipe with
native scroll, so in every engine a swipe was a wheel scroll at the sheet's
middle toward its edge, `page.mouse.wheel(0, -900)`. Chromium, the one engine
whose protocol can send touch, also took a real touch drag through the
DevTools protocol (`Input.dispatchTouchEvent`: a start, eight moves 40px
apart, an end); that is the touch proof. The script ran twice. Every criterion
passed both times, every length and attribute it measured was the same, and
the timings and frame counts differed by at most 27ms and one frame. The
table gives the first run.

| Criterion | Chromium 156 | WebKit (build 2336) | Firefox 153 |
| --- | --- | --- | --- |
| 1. Opens from a `SheetTrigger` and from `isOpen`; focus moves in and returns | Pass. Focus on the `SheetContent` dialog 546ms after the press (trigger) and 495ms (`isOpen`); back on each trigger after its Close button | Pass. 270ms and 249ms | Pass. 775ms and 761ms |
| 2. Escape closes, a backdrop press closes, `preventDismissal` stops both | Pass. Escape closed in 292ms, a press 20px from the top, which lands on React Aria's stage over the backdrop and never on the backdrop itself (below), in 293ms; with `preventDismissal`, still open after Escape, a press and a 900px swipe, and its Close button closed it in 292ms | Pass. 172ms, 172ms and 165ms | Pass. 285ms, 289ms and 283ms |
| 3. A swipe down dismisses it | Pass. The wheel took the scroll from 760 to 0 and the sheet was gone 50ms later; the touch drag (410 to 730) dismissed it 525ms after the touch began, the scroll carrying on to 55, below the 60.8 at which the sheet has left a 760px screen | Pass. Gone 199ms after the wheel: as desktop Safari, React Aria waits for `scrollend` and 50ms | Pass. Gone 23ms after the wheel. No view timeline, so the 300ms fallback: it ran on the open, and on Escape (gone in 286ms, 34 frames of the reverse fade, opacity 1 to 0.08); on the swipe it played no frame (below) |
| 4. A body taller than `92dvh` scrolls inside, the sheet stays put | Pass. A 1483px body in a 662.4px sheet (92dvh at 720); a wheel of 600 moved the body's `scrollTop` from 0 to 600, the sheet's top stayed at 57.6 and the outer scroll at 720 | Pass. The same numbers | Pass. The same numbers |
| 5. Two sheets stack, one scrim paints | Pass. The second sheet, its overlay and its backdrop carry `data-stack-index="1"`, the first `0` and `data-has-descendants`; the backdrops compute `rgba(5, 5, 5, 0.4)` and, by the prototype's rule, `rgba(0, 0, 0, 0)`; Escape closed the top sheet only, and focus went back to its trigger in the first | Pass. The same | Pass. The same |
| 6. Above a sticky header at `z-index: 20` | Pass. At (640, 77), inside both the header (0 to 96) and the sheet (57.6 to 720), the hit is the sheet's content; at the header's middle, a part of the overlay | Pass. The same | Pass. The same |
| 7. Reduced motion: no smooth scroll, settles in a frame, no backdrop animation | Pass. `scroll-behavior: auto`; the scroller's first frame was already at rest (720), and entering ended in that frame; the backdrop's `animation-name` computes `none`, by the prototype's rule; Escape closed in 33ms | Pass. At rest in the first frame, entering ended one frame later; Escape 22ms | Pass. At rest and entered in the first frame; Escape 4ms |
| 8. A focused field keeps the sheet on screen as the viewport shrinks | Pass. From 375 by 760 to 375 by 400 with the field focused: still open, the sheet 32 to 400, the field 155.6 to 203.6, `--visual-viewport-height` 400px | Pass. The same numbers | Pass. The same numbers |

**Verdict: React Aria's `Sheet` family.** Every criterion passed in all three
engines, in both runs, so the modal frame fallback is not taken and dragging
is not deferred. The library's `Sheet` is built on `SheetOverlay`, `SheetBackdrop`,
`Sheet` and `SheetContent`, re-exports React Aria's `SheetTrigger`, and
passes `snapPoints` through.

**Two runs outside the criteria.** The eight ran once more with the overlay
left to React Aria's own positioning, its inline style only `z-index: 1000`,
and passed in all three engines. Then a page made 2000px taller was scrolled
600px and a sheet opened from the keyboard, since a click scrolls its trigger
into view and undoes the page's scroll. With the brief's `position: fixed` the
sheet drew at 657.6 to 1320 of a 720px viewport in all three engines, 62px of
it on screen. With React Aria's positioning it drew at 57.6 to 720, over the
stuck header. React Aria places its scroll container at the page's scroll
offset inside an overlay it positions at the document's origin, so a fixed
overlay moves the sheet down by however far the page is scrolled.

**What the spike leaves for the component.**

- **Leave the overlay's position to React Aria.** `SheetOverlay` writes
  `position: absolute`, `top: 0`, `left: 0`, the page's width and height and
  `overflow: clip` inline. Inline declarations outrank a class rule without
  `!important`, so `overlay-scrim`'s `position: fixed` and `height` never
  reach it, and nothing may set its position inline. It needs
  `z-index: var(--z-modal)`, which React Aria leaves unset and without which a
  `z-index: 20` header paints over the sheet. The scrim's color belongs on
  `SheetBackdrop`, the part that fades with the swipe; on the overlay it would
  paint a second scrim under it, one that does not follow the swipe.
- **Focus lands on `SheetContent` after the enter scroll.** React Aria
  focuses the dialog itself (`role="dialog"`, `tabIndex="-1"`), and only once
  the enter scroll has ended: `SheetOverlay` sets `UNSTABLE_deferUntilEntered`
  and its enter waits for `scrollend`. Measured from the press, that is about
  500ms in Chromium, 250 to 285ms in WebKit and 750 to 780ms in Firefox, and
  the first frame under reduced motion. All three fired `scrollend` for the
  instant scroll too, so the deferred focus arrived there as well. A play test
  waits for focus, not for the mount, and `SheetContent` takes
  `outline: none` as the other `tabIndex="-1"` containers do.
- **A press outside never reaches the backdrop.** Above the sheet the hit is
  React Aria's stage, a `div` inside `[data-sheet-scroll]` that covers the
  whole viewport over the backdrop; the press closes the sheet through React
  Aria's press-outside handling, and `SheetBackdrop` itself is never pressed.
  React Aria also makes the backdrop `inert`, as it does everything outside
  the sheet, so it takes no hit wherever it is drawn. A test that presses the
  scrim presses the stage above the sheet.
- **`preventDismissal` holds against the swipe.** While the sheet rests,
  React Aria shrinks the scroll travel to 1px, so a 900px swipe moved it from
  1 to 1 and the `IntersectionObserver` close never fired. Escape and a press
  outside did nothing, and a Close button closed it through the ordinary exit.
- **Reduced motion is half React Aria's.** Its own scrolls go instant (it
  passes no `behavior` under `prefers-reduced-motion: reduce`), and it sets no
  `scroll-behavior`, which computes `auto`. It writes the backdrop's
  `swipeAnimation` inline whatever the setting: under reduced motion the
  inline `animation-name` was still the keyframes' name in Chromium and
  WebKit. So `sheet.css` removes it with `animation: none !important` under
  `prefers-reduced-motion: reduce`, since a rule without `!important` loses to
  the inline style.
- **Firefox fades the scrim on open and close only.** With no
  `animation-timeline: view()`, React Aria runs the backdrop's keyframes for
  300ms, linear, while the sheet enters and exits, and not during a swipe. On
  a swipe it unmounts the sheet as soon as it has scrolled out, so the scrim
  stays at full opacity while the sheet scrolls away and goes with it. In
  Chromium and WebKit the backdrop runs on the sheet's view timeline
  (`--sheet-timeline-0`), and its opacity went from 1 to 0 over the Escape
  exit.
- **Stacking is React Aria's own list.** React Aria numbers
  `data-stack-index` on the overlay, the backdrop and the sheet from a
  module-level list of its own, separate from the library's overlay stack,
  and marks the sheet beneath with `data-has-descendants`. The spike keyed the
  transparent second backdrop on `[data-stack-index="1"]`; the component keys it on
  `data-stacked` from the overlay stack, as spec 7.3 says. Escape closes only
  the top sheet, and focus returns to its trigger in the sheet beneath.
- **`SheetContent` fills the sheet.** React Aria forces `width: 100%` and
  `height: 100%` on it inline. The spike's body scrolled with the sheet a flex
  column capped at `92dvh` and the scroller at `min-height: 0`. With no
  `snapPoints`, `data-expanded` was set at rest in all three engines, so a
  body that scrolls only under `[data-expanded]` scrolls at once.
- **The keyboard case is the library's.** Resizing the viewport moves the
  layout viewport, and `dvh` with it, so criterion 8 proves the `92dvh` cap
  and not the on-screen keyboard, which on iOS shrinks only the visual
  viewport. React Aria writes `--visual-viewport-height` on the overlay (400px
  after the resize) and a `--sheet-scroll-padding-y` it never reads itself;
  capping the sheet against `--visual-viewport-height`, as spec 7.3 asks, is
  the library's rule.
- **Not proven here.**
  - WebKit with `hasTouch` still reported `maxTouchPoints` 0 and a Mac user
    agent, so React Aria took its desktop Safari paths; its iOS paths, the
    58px allowance for Safari's toolbar and the iOS scroll lock, ran in no
    engine.
  - A touch swipe ran in Chromium only, through the DevTools protocol;
    WebKit and Firefox were swiped with the wheel.
  - The on-screen keyboard: criterion 8 resized the layout viewport, so it
    proves the `92dvh` cap and not a keyboard that shrinks only the visual
    viewport.
  - The spike set no `snapPoints`.
  - An `autoFocus` child is a hazard, reasoned from the source and not
    measured: React focuses it as it mounts, before React Aria's deferred
    focus, and the deferral exists so that focus does not interrupt the iOS
    enter scroll.
  - The engines were older than the builds Playwright 1.64.0 pins
    (`webkit-2370`, `firefox-1555`), and the runs were headless on macOS
    only.

**jsdom.** The unit tests run in jsdom 30.1.2, which has no
`IntersectionObserver`, `ResizeObserver`, `Element.prototype.scrollTo`,
`matchMedia` or `Element.prototype.getAnimations`. Rendered there, any open
`SheetOverlay` throws `ReferenceError: IntersectionObserver is not defined`
as it mounts, and one with `preventDismissal` and `snapPoints` also needs
`ResizeObserver`. React Aria skips its enter and exit callbacks for an element
with no `getAnimations`, so in jsdom a bottom sheet mounts and unmounts at
once, and with the observers stubbed it mounted without calling `scrollTo` or
`matchMedia`, which only those callbacks' scrolls reach. The unit tests stub
`IntersectionObserver`, `ResizeObserver` and `Element.prototype.scrollTo` in
`packages/react/test/setup.ts` and assert markup, names and dismissal there;
the swipe lives in the play tests.

### The component, derived

There is no source sheet, so every value below is derived here, and the
consumer's two numbers, 92% of the height and a grabber, are recorded as the
consumer's. The modal frame fallback was not built: the spike passed, and
`Sheet` is React Aria's family behind the public API the spec gives either
path.

| Part | Value | Rule |
| --- | --- | --- |
| Surface | `--color-float`, `1px solid var(--color-hairline)` | White is for floating surfaces, and a modal separates from the scrim by tone, with the hairline as its edge, as "Overlays" records for every modal panel |
| Corners | `--radius-stadium` on the two top corners, square below | A dialog is 40px; the bottom is flush with the viewport's edge and takes no corner. The two radii are logical, `border-start-start-radius` and `border-start-end-radius`, which is all the sheet needs in right to left |
| Height | content-high, `max-height: 92dvh` after a `92vh` line | The consumer's number: 8% of a 760px phone leaves about 60px of the page above the sheet as the reader's context |
| Width | `min(100%, 36rem)`, centred | No token. A phone surface that still reads on a tablet. React Aria's stage centres the sheet in a flex column and `margin-inline: auto` holds it there; the sheet's own position is React Aria's inline `relative`, so no `inset-inline` is needed |
| Elevation | none | The only free edge is the viewport's bottom, where a downward shadow shows nothing; the scrim and the hairline separate it |
| Scrim | the shared `overlay-scrim` on `SheetBackdrop`, and nothing on `SheetOverlay` | Below |
| Grabber | 40px by 4px, `--radius-dot`, `--color-boundary`, `aria-hidden`, centred in a 44px band | Dots stay round in every shape. Boundary painted straight on float is gated at 3:1 already, as the switch's off track there: 3.48 in light and 5.21 in dark, cited and not added. The 44px band is the touch target size, though the grabber is decoration and the whole sheet is what a finger swipes |
| Header | the title in the `h3` step in ink, the description in body slate, the close IconButton at the end, `padding-inline: var(--spacing-peer)` | The card title step; the close button is the 40px ghost IconButton |
| Body | `padding: var(--spacing-peer)`, `overflow-y: clip` until fully open and `auto` then, no `overscroll-behavior` | Below |
| Safe area | the footer's bottom padding, or the body's when there is no footer, plus `env(safe-area-inset-bottom, 0px)` | The last thing in the sheet stays clear of a phone's home indicator |
| Footer | `padding: var(--spacing-part) var(--spacing-peer)` and the safe area below | 8px over and under a row of buttons or an account, 24px at the sides |
| Layer | `z-index: var(--z-modal)` on `SheetOverlay`, and nothing else | React Aria's overlay has none and would sit under a sticky header at `z-index: 20` |
| Motion | React Aria's scroll slides the sheet; `@keyframes sheet-scrim-fade` fades the backdrop from opacity 0 to 1 over the swipe | Below |
| Forced colors | the edge and the grabber in `CanvasText` | The hairline is transparent in light and the grabber is a fill, and the repaint keeps neither |

**The overlay is React Aria's, with a layer.** `SheetOverlay` keeps React
Aria's inline `position: absolute` at the document's origin, the page's size,
and the class gives it only `z-index: var(--z-modal)`. The spike's run on a
page scrolled 600px drew a fixed overlay's sheet 62px on screen in all three
engines, so nothing may fix it. The scrim's color is on the backdrop only:
spec 7.3 put `overlay-scrim` on the overlay and 7.4 on the backdrop, and on
the overlay it would paint a second scrim under the backdrop's, one that does
not fade with the swipe. The spec carries the departure.

**The backdrop is the scrim, fitted to where React Aria puts it.** It takes
`overlay-scrim` for the Deep Well color, the transparency of `data-stacked`
and the forced-colors opt-out, and three of the shared rules give way. They
give way in `overlay.css`, beside the rules they fit, as the variant
`.overlay-scrim.sheet-scrim`. Two classes outrank the shared rule's one, so
the variant holds in whatever order the browser reads the two files: an app
that imports `@snapshot-ui/core/components/sheet.css` before `overlay.css`, or
a bundler that splits them by route, gets the same sheet. Written in
`sheet.css` at the shared rule's specificity, they held only while
`overlay.css` came first, as it does in `styles.css`. The scrim's color is
written once, in the shared rule.

- The modal layer, `z-index: var(--z-modal)`, would put the backdrop over the
  sheet's scroller inside the overlay, its sibling, so it is `auto` and the
  backdrop paints first, under the sheet. React Aria makes the backdrop
  `inert`, so a hit test passes through it wherever it is drawn: a story
  checks the computed `auto` and the order instead.
- The viewport's height, `var(--visual-viewport-height, 100dvh)`, sizes a
  fixed scrim. The backdrop is React Aria's `position: absolute; inset: 0`
  inside the page-sized overlay, and with that height it covered only the
  top of a scrolled page, measured at 330px of a 900px view; `height: auto`
  lets `inset: 0` fill the overlay. The `ScrolledPage` story pins both.
- The shared scrim fades its color in and out on `data-entering` and
  `data-exiting`. A sheet enters for as long as its scroll takes, about half
  a second in Chromium, so that would hold the scrim back until the sheet
  was in. The backdrop keeps its color while it enters and exits, unless it
  is stacked, and drops the transition: the keyframes fade it instead. The
  shared fade-out rule skips the sheet's scrim (`:not(.sheet-scrim)`), so no
  rule has to paint the color back.

**The body scrolls once the sheet is fully open.** React Aria sets
`data-expanded` on the sheet while all of it is in view, and with no
`snapPoints` it does so at rest in all three engines, so the body's
`overflow-y: auto` is keyed on `.sheet[data-expanded] .sheet-body`: at a
partial stop a swipe on the content moves the sheet, as on iOS. The body
leaves out the `overscroll-behavior: contain` a dialog's body has. With it, a
wheel down the middle of the basic example's sheet, over its body, did
nothing in Chromium, while the same wheel over the header or the footer
dismissed it: `contain` stopped the swipe at the body, which had nothing to
scroll. Without it a swipe the body cannot take goes on to React Aria's
scroller, which has `overscroll-behavior: contain` itself, so the page behind
never moves. The docs test swipes the body. That holds where React Aria takes
its standard scroll lock. On iOS its mobile WebKit lock prepends
`@layer { * { overscroll-behavior: contain; } }` while a modal is open, and
the sheet's body, declaring none, takes it: a long body at its top keeps a
pull down to itself there instead of handing it to the sheet, as a native
iOS sheet does not. A short body is unaffected, since WebKit ignores
`contain` on a box that does not overflow. Until the sheet is fully open the
body is `overflow-y: clip`, which makes no scroll container, so a swipe still
reaches the scroller, while a long list at a partial stop neither paints
over the footer nor stretches React Aria's scroll range past the sheet.

**The sheet is no taller than the keyboard leaves.** The content caps at
`calc(var(--visual-viewport-height, 100dvh) * 0.92)`, 92% of the visual
viewport React Aria writes on the overlay. With no keyboard it equals the
`92dvh` of the sheet; with an on-screen keyboard that shrinks only the visual
viewport, as iOS does, the sheet is no taller than what is still in view. It
does not move: it stays on the layout viewport's bottom edge, under the
keyboard, unless the browser pans the view to the focused field, and that is
the unproven part. The `KeyboardUp` story writes 400px into the overlay's
`--visual-viewport-height` and finds the content 368px tall at most and the
sheet 370px with its edges. The cap is on the content and not the sheet, so
the sheet's `92dvh` and its `92vh` fallback both stay in force: a `var()` on
the sheet's own `max-height` would win over them in every browser. A real
keyboard is not proven, only the cap.

**The parts.** The grabber band is 44px tall above the header. Without the
grabber the header is the first part and takes 24px of top padding, so the
title and the close button keep clear of the 40px corners. The close button
sets the header row's height, so the title's first line steps down by
`calc((2.5rem - 1lh) / 2)` beside it and centres on it, as a drawer's does,
and its icon lines up with the padding edge through
`margin-inline-end: -0.5rem`. A hidden title with no close button and no
description leaves nothing in the header to show, so there is no header: the
hidden title sits straight in the content, out of the flow, as a drawer's
does. The body is a tab stop while it scrolls and holds nothing Tab reaches,
through the helper Dialog and Drawer share, and it draws the focus ring inset,
since it runs flush to the sheet's sides. The footer wraps a long word, as the
title, the description and the body do.

**Focus and dismissal.** The sheet focuses its `SheetContent`, the dialog,
once its enter scroll has ended, and `.sheet-content` takes `outline: none`.
`isDismissable={false}` is React Aria's `preventDismissal`: Escape, a press
outside and a swipe do nothing, React Aria draws no hidden Dismiss button, and
the close button, on by default, is the way out. A press in the toast region
never closes a sheet, as for every library modal.

**Stacking and scope.** A sheet is not built on the modal frame, so it renders
the frame's `FrameEffects` first in its content: it records what held focus
as the sheet opened, for the scope copy on the sheet, and joins the overlay
stack, which marks a second sheet's backdrop `data-stacked`. React Aria's own
stack numbers the second sheet `data-stack-index="1"`. The scope lands on the
sheet, not on the overlay or the backdrop. The overlay carries `dir` from the
locale; React Aria writes the direction on the sheet too, and keeps its
scroller left to right, since its geometry is physical.

**Motion.** React Aria drives the slide with scroll: smooth on open and close,
instant under reduced motion, where it passes no `behavior`. The backdrop's
`swipeAnimation` is `sheet-scrim-fade`, from opacity 0 to 1, which React Aria
runs on the sheet's view timeline in Chromium and WebKit and for 300ms on open
and close in Firefox. React Aria writes it inline whatever the setting, so
under `prefers-reduced-motion: reduce` the stylesheet removes it with
`animation: none !important`, the one important declaration in the core
stylesheets, and the scrim is simply there.

**Stop points.** `snapPoints` passes straight to React Aria, which marks each
stop inside the sheet with a `div[data-sheet-detent]`, the first with
`data-sheet-initial`, and opens at the first. The unit test counts the
markers. The docs test opens a sheet with stops at 40% and 100% in Chromium,
finds it resting with 40% in view and no `data-expanded`, carries it to its
full height with a wheel, and scrolls its body there. Stops under a finger,
and in WebKit and Firefox, are not proven.

**The WebKit project.** The story tests run a third Vitest project,
`storybook-webkit`, which runs only the stories tagged `webkit`, the sheet's,
in Playwright's WebKit, the engine a phone's Safari runs. It is the first
non-Chromium run in the repository. It runs on the build Playwright 1.64.0
pins, `webkit-2370`, which CI installs with Chromium; the spike ran an older
one. Its stories cover the layout, focus, the stack, the scope, a page
scrolled before the sheet opens, a dismissal by the scroller, `isDismissable`
and a focused field. A touch swipe is not among them: a story's play sends no
touch gesture, so the swipe is driven through the scroller there and by the
wheel in the docs test. The story's scroll is smooth, and that is
load-bearing. Once a sheet has scrolled out of view, React Aria's exit on
desktop Safari waits for the next `scrollend` (`isSafari() && !isIOS()`,
which Playwright's WebKit matches on Linux too); when that event fired before
the exit began, it never comes. In Linux `webkit-2370`, the build CI runs, an
instant `scrollTo` left the sheet mounted, invisible and `data-exiting`, with
focus inside it, in 6 runs of 6, and a wheel swipe in 10 of 23; the native
macOS build closed it in 18 of 18, and a smooth scroll closed it in 7 of 7 on
Linux.

**jsdom.** `packages/react/test/setup.ts` gives jsdom an inert
`IntersectionObserver` and `ResizeObserver`, no-op `Element.prototype.scrollTo`
and `scrollBy`, and a `matchMedia` that matches nothing, each only where the
environment has a DOM and lacks it. The SegmentedControl test that runs with
no `ResizeObserver` takes the stub away for its own run.

**Not proven, carried from the spike.** React Aria's iOS paths; the real
on-screen keyboard, and where the sheet sits under it; `snapPoints` under a
finger and outside Chromium; an `autoFocus` child, which takes focus before
React Aria's deferred focus; and a touch swipe in any engine but Chromium.
Three more are known: on iOS React Aria's scroll lock puts
`overscroll-behavior: contain` back on the body, so a long body at its top
keeps a pull down to itself; on desktop Safari a fast swipe can leave React
Aria's exit waiting for a `scrollend` that has passed, seen in Linux WebKit
and not on macOS, and the unseen sheet's page-sized overlay then keeps the
page blocked, with focus still in the hidden dialog; and a long body at a
partial stop is a tab stop before it can scroll, since the body is marked as
scrolling by its content and not by the stop. The docs page says the same.

## Popover

The app's popups, the account menu and the three field popups, become one
surface, `Popover`: the float fill, 24px corners, a 1px edge of ink at 12% in
both themes, the float shadow, 8px from the trigger, and no arrow. The rows,
the 8px list padding and the 4px gap between rows belong to the list inside,
so Menu records them; the popover is the chrome they open in, and it also
holds free content of its own, such as the filter panel of a chip over a list.
It is React Aria's `Popover`, which places it, flips it, caps its height and
writes its direction, so the stylesheet draws the surface and its motion and
nothing else. "Overlays" derives the shared parts: the `overlay` class, the
scope copy, the surfaces table and the layers.

**The frame in both themes.** A modal sits over a dimmed page and separates by
tone, so it takes the hairline, which is nothing in light. A popover dims
nothing and opens over any surface, another float included, such as a menu
opened from the navigation rail: in light that is white on white, and the
shadow alone does not close the shape. So it takes `--color-frame`, ink at 12%
in light and white at 12% in dark, as "Two surfaces the theme switch needed"
already says for the menu popup. The frame is a cue and not a boundary, as a
nested card's outline is: nothing depends on seeing it, and the shadow and the
fill carry the surface. Painted over the popover's own float fill, it measures
1.29 against Float in light and 1.43 in dark, which covers its own fill and a
float it opens over. On the other surfaces it is 1.13 and 1.58 on the page's
canvas, 1.24 and 1.43 on Lifted, 1.17 and 1.26 on Bone, and 1.29 and 1.26 on
Raised, light then dark; the float fill alone is 1.13 on the canvas in light
and 1.11 in dark. In forced colors it is redrawn in `CanvasText`, so the surface
keeps its shape.

**The corner and the shadow.** `--radius-surface`, the 24px step of a card, a
list and a field frame, 12px in Soft and 0 in Square, and one step under a
dialog's 40px, so a popover opened from a dialog sits inside it on the
nested-radii ladder. The shadow is `--shadow-float`, elevation level 2, the
floats' level: a popover is above the page and below every modal.

**Placement.** `bottom start`, 8px from the trigger, which is React Aria's
default `offset` and the app's gap; the popover leaves `offset` to React Aria,
so a trigger that sets its own, such as a context menu at 0, keeps it, and a
side the trigger component asks for wins over `bottom start` when the caller
names none. Where
the side it asked for has no room, React Aria flips it to the other side, and
it shifts along the trigger to stay inside its 12px `containerPadding`, its
default, so it never runs off the screen. `data-placement` says the side it
landed on, and the motion keys on it. React Aria writes the popover's height
cap inline on the popover itself, the room left on that side, and the popover
scrolls inside it (`overflow: auto`); its `max-height: inherit` takes nothing
from the cap it is given, and is there for a child that inherits it. A menu's
list does not ("Menu"). Its width caps at the viewport less
2rem, the overlay inset on both sides, so at 320px a popover is at most 288px
wide whatever it holds. In right to left `start` and `end` resolve through
React Aria, which also writes `dir` on the popover, so nothing here is
physical.

**Padding is opt-in.** A list pads itself 8px (`--spacing-part`), and a menu's
rows sit in that padding, so the popover pads nothing by default. Free content
takes `isPadded`, 24px (`--spacing-peer`), the gap between peers, as a drawer's
and a sheet's body do. `matchTriggerWidth` sets `min-width` to the
`--trigger-width` React Aria writes, so a panel under a wide trigger never sits
narrower than it, up to the viewport less 2rem (`min(var(--trigger-width),
100vw - 2rem)`, since a minimum width beats a maximum one); content wider
than the trigger still widens it. A long word
in free content, such as a share link, breaks anywhere (`overflow-wrap:
anywhere` on the surface, as a card and a dialog body set it), so at 320px it
wraps inside the 288px and never scrolls the popover sideways.

**Motion.** Opacity and a 4px slide toward the trigger, 140ms ease-out, on
React Aria's `[data-entering]` and `[data-exiting]`: a popover under its
trigger drops in from 4px higher, one above it rises from 4px lower, and one to
the right or left slides in from 4px nearer the trigger. These are the values
the motion table in "Overlays" sets for a popover and a menu, shorter and
quicker than a dialog's 8px rise in 180ms. Reduced motion turns the transition
off, in a block after the rules it overrides, and the popover is simply there.

**No arrow.** The app's popups have none: the 8px gap and the shadow tie the
surface to its trigger, and an arrow would be one more shape to keep on the
frame, the corner and the flip.

**Focus and dismissal.** Opened from a `DialogTrigger`, React Aria makes the
popover a dialog named by its trigger, focuses it, and holds Tab inside it, as
a modal dialog does: the page behind is hidden from assistive technology and
does not scroll, though nothing dims it. The container takes `outline: none`,
as "Overlays" says for the containers React Aria focuses. Escape, a press
outside it and blur close it, and focus goes back to the trigger. A menu, a
select or a combo box brings its own trigger, which hands the popover its
state and its trigger, and moves focus into its list instead.

**Scope from the trigger.** The popover copies its theme, shape and density
from the trigger React Aria hands it through `PopoverContext`, or from the
`triggerRef` it is given, and not from what holds focus: a popover opened by
its default or by the app's own state was opened by no press, so focus can be
anywhere. It sits at the inline z-index of 100000 React Aria writes, above the
modal layer, as "Token names" sets out. A popover opened with `isOpen` or
`defaultOpen` outside a trigger component has nothing to open against unless
it is given `triggerRef`, and React Aria then fails on an undefined `current`
that names nothing, so the popover throws an error that names `triggerRef`
instead, on the server and in the browser, before React Aria reads it.

**Nothing new is gated.** The surface is Float, and what it holds is ink and
slate on Float, pairs the contrast gate already holds. The frame is a cue that
the gate does not hold, by the reasoning above: its numbers are recorded there
as information, since the gate holds only minimums and every one of them would
fail a 3:1 the frame is not asked to meet.

## Menu

The app's popups, the account menu and the three field popups, share their
rows: the float fill, 24px corners, 8px of padding, 4px between rows, 40px
rows, a selected row as an ink pill with a check, a group label in the eyebrow
style, and a rule between groups. `Menu` keeps all of it, in the `Popover`
chrome ("Popover"), and draws the rows the listbox of the choice controls will
inherit: `menu.css` is where a list popup's row is derived, once. It is React
Aria's `Menu`, a true `role="menu"`. The app's account menu rejected the role
because it had no arrow keys behind it and said so; React Aria supplies them,
so the library takes the role, and focus now goes into the menu.

**The popup.** It is the popover's surface with one rule of its own:
`min-width: min(max(var(--trigger-width), 12rem), 100vw - 2rem)`. The app's
two popups measure 14.5rem and 15rem; 12rem is the floor under both, and a
trigger wider than it wins, so a menu never sits narrower than its button, up
to the popover's own cap of the viewport less 2rem, which a minimum width would
otherwise beat. The list pads itself 8px
(`--spacing-part`) and puts 4px between rows, the app's list gap, kept because
two washed rows side by side need a seam. React Aria writes the popover's
height cap inline, the room left under or over the trigger. The popover is a
flex column and the list fills it, `flex: 1 1 auto; min-height: 0` with
`box-sizing: border-box`, so under the cap the list shrinks to the room inside
the popover's 1px frame and scrolls, and the popover does not: one scroller.
The list's first rule, `max-height: inherit`, gave it the whole cap, 2px more
than that room with `base.css` and 18px more without it, so a long menu
scrolled inside the list and the popover scrolled the rest, with a second
scrollbar where scrollbars are drawn.

**The rows.**

| Part | Value | Why |
| --- | --- | --- |
| Row | `display: flex; align-items: center; gap: 0.75rem; min-height: 40px; padding: 0.5rem 0.75rem; border-radius: var(--radius-control); cursor: pointer` | the touch floor; the app's 12px gap and inline padding; the nested-radii table gives a 24px popup's options the next step, 20px, which is the control step, so a row descends in Soft and Square with the popup (a pill would not) |
| Coarse pointer | `min-height: 44px` under `@media (pointer: coarse)` | the consumer's 44px on touch |
| Label | `--text-action` (16px, 500, -3%), ink, `overflow-wrap: anywhere` | a menu item is an action |
| Description | `--text-small`, slate, under the label | hints are slate: 5.49 light and 6.94 dark on float, both gated |
| Icon | 16px, `flex: none`, slate at rest and ink on the focused row | an icon is a hint until its row is the one in hand |
| End value | `--text-small`, ink, tabular figures, `flex: none`, before the key; given preformatted, never formatted | an amount or a count belongs to the row, at its end, and reads in columns down the list |
| Shortcut | drawn as a key: 12px, weight 700, overline tracking, tabular figures, `--radius-micro`, `--color-bone` fill, slate; `margin-inline-start: auto`; `direction: ltr; unicode-bidi: isolate` | the one key look, Kbd's; at the row's end in either direction, its keys always read left to right |
| Check | Lucide's `Check`, 16px, `flex: none`, at the inline end; every row of a selectable menu or section keeps its room (`visibility: hidden`) and a selected row shows it | the width never changes as the choice moves, and color is never the only sign of a choice |
| Hover and focus (`[data-hovered]`, `[data-focused]`) | the 5% ink wash, `color-mix(in srgb, var(--color-ink) 5%, transparent)` | the wash rule; hover only inside `@media (hover: hover)` |
| Keyboard focus (`[data-focus-visible]`) | the ring, inset: `outline-offset: calc(-1 * var(--focus-ring-width))` | a scrolling list clips an outset ring |
| Selected, single | the ink fill; label, icon, end value and check in canvas; the description canvas at 70%; the key chip canvas at 20% with canvas text; the inset ring inverts to canvas | the inversion rule of "Rules every component follows" |
| Selected, multiple | the check alone, no fill | five rows filled with ink would shout and hide the wash under the pointer |
| Disabled | taupe label, icon, description, end value, key and check; no wash, and never the pill, even when chosen; `cursor: not-allowed` | the disabled idiom; the arrows pass it by; a chosen row that is disabled shows its choice by the check alone |
| Danger | label and icon in `--color-error`, no fill, focused or not | Button already gives error to destructive actions |
| Section heading | `--text-overline` (14px, 700, +4%, uppercase), slate, `padding: 0.5rem 0.75rem 0.25rem` | the app's group label in the eyebrow style, without its dot |
| Separator | `height: 1px; background-color: var(--color-divider); margin-block: 0.25rem` | a rule inside a surface |
| Forced colors | a selected row in `Highlight` and every part on it in `HighlightText`; a disabled row and its parts in `GrayText`; the other rows' parts in `CanvasText`; the key chip an island of the system `canvas` with `CanvasText`; the ring stays | a fill alone does not survive the repaint, and a part's own color would not follow its row |

The danger icon needs a rule of its own: the focused row turns its icon ink at
a higher specificity than the danger class, so a second selector names the
focused danger row's icon again, and the row stays red as the pointer or the
keyboard lands on it. The forced-colors rules are the same kind of rule. The
chosen row names its selection mode, so it is as specific as the single row's
ink fill and comes after it; with a plainer selector the ink fill won, and the
repaint turned it into the page's own background. And every part with a color
of its own needs its own forced rule: the repaint turns an author color that is
not a system color into `CanvasText`, and does not hand a part its row's
`HighlightText` or `GrayText`. Measured before the rule, the chosen row's
check, icon, second line and key were `CanvasText` on `Highlight`, about 1.1:1
in the emulated palette and 1.5:1 in Windows' Aquatic theme, and a disabled
row's parts looked enabled. So the icon, the check, the second line and the end
value take `HighlightText` on a chosen row, `GrayText` on a disabled one and
`CanvasText` otherwise, each rule as specific as the one it overrides and after
it. The key chip is an island: its own system `canvas` with `CanvasText`, `GrayText`
when disabled, which reads on any row; on a chosen row in multiple mode the
chip's bone is already forced to an opaque system `canvas`, so `HighlightText` there
would vanish. Two docs tests read each part on a chosen and on a disabled row.
A row under the pointer shows nothing in forced colors, since the wash is a
mix the repaint drops; the keyboard ring still shows. Native menus in Windows
high contrast draw the hovered row in `Highlight`, which here means the
choice, so a pointer cue there is left as an open question.

**One state for the pointer and the keyboard.** In a React Aria menu, hover
moves focus to the item under the pointer, so `[data-focused]` is set under the
pointer as well as under the keyboard and carries the wash for both, touch
included. The ring keys on `[data-focus-visible]` alone, which only the
keyboard sets, so a row under the pointer is washed and never ringed.

**Measured on the wash and on the pill.** The wash is a mix and not a token,
so its pairs cannot join the gate. They are measured with the gate's own
composite in both themes and pinned in `contrast.test.js`:

| Pair | Light | Dark |
| --- | --- | --- |
| Ink over the wash on float | 16.65 | 15.25 |
| Slate over the wash on float | 4.96 | 6.41 |
| Error over the wash on float | 6.74 | 5.02 |
| The description, canvas at 70% over ink, against ink | 8.34 | 7.31 |
| The key, canvas on canvas at 20% over ink | 9.13 | 12.37 |
| The wash against float | 1.11 | 1.14 |

Slate in dark is white at 60%, so it is painted over the wash before it is
measured, as a reader sees it; painted over float alone it would read 6.07.
The wash against float is a cue and not a boundary: the ring carries keyboard
focus and the row's own text carries the item. The pairs the rows rest on are
gated already: ink, slate and error on float, and canvas on ink.

**Choosing.** `selectionMode="single"` makes the items `menuitemradio`, and
`multiple` makes them `menuitemcheckbox`, on the menu or on one section, which
then chooses apart from the rest. A choice in single mode closes the menu, the
app's rule: a menu that stays open after a choice makes the reader wonder
whether it registered. A choice in multiple mode leaves it open for the next.
React Aria's own default closes on a press unless the selection is multiple,
on Enter always, and on Space only when nothing is chosen, so the library sets
`shouldCloseOnSelect` itself: true unless the mode is multiple, on the menu
from its mode and on a section from the section's mode, which reaches every
item through React Aria's item context. A section with no mode of its own
takes the menu's. The caller's value on the menu or the section, and an item's
own, still win.

**The keys.** All React Aria's, with one default changed: React Aria's menu
wraps from the last item to the first, and the library's stops at both ends,
so the first and the last item are felt as ends: `shouldFocusWrap` is false
unless the caller asks, as the command palette does. A
menu opened from the keyboard focuses its first item, or its last with Arrow
Up; one opened with a pointer focuses the list itself, so no row looks chosen
until one is hovered, or the chosen row when the menu itself selects. React
Aria makes the menu's popover a dialog that holds focus, so Tab stays on the
row; Escape, a choice and a press outside close the menu, and focus goes back
to the trigger.

**Names.** A row is named by its label and described by its end value, its
second line and its key, through their ids: a screen reader hears "Settings",
then "Account and billing, Command comma", and a voice user says the label.
React Aria wires the second line and the key; the end value's id goes in
`aria-describedby` ahead of them. Platform menus model a row the same way:
macOS gives the key as the item's command character and Windows as its
accelerator key, both outside the name. Axe's label-in-name check (ACT
2ee8b8, tagged WCAG 2.5.3 and on by default in axe 4.14) asks for every word a
row shows in its name, the description, the value and the key included. WCAG
2.5.3 asks it of the label, and the name here is the label, so the stories skip
that one check on menu rows alone, through one shared constant,
`MENU_ROW_A11Y` in `packages/react/src/stories/a11y.ts`. It overrides the
rule's selector with `*:not(.menu-item)`, so the rule still runs everywhere
else on the page, and every other rule runs everywhere. A row named by
everything it shows would make a screen reader read the second line as part of
the name, with no pause.

**The key's modifier.** `Mod` in a key hint is the platform's modifier, the
Command symbol on Apple platforms and Ctrl elsewhere. It is read with
`useSyncExternalStore`, whose server snapshot is "Mod", so a server's HTML
hydrates without a mismatch, and a chip that mounts in the browser, as every
menu's and every tip's does, draws the platform's key on its first paint and
never shows "Mod" for a frame.

**Links.** An item with `href` is an anchor with `role="menuitem"`, so a
modified or middle click opens it as the browser would, and a plain press
navigates through React Aria's `RouterProvider`, which Link already uses. The
library re-exports it, and the `RouterConfig` interface to augment, so an app
imports both from `@snapshot-ui/react` and always holds the library's own copy:
with a second copy of React Aria in the app, the items would read a router
context nobody provides, and every `href` would fall back to a full page load
with no error. There is no `linkComponent` prop: the item's inherited `render` prop draws a
router's own link where an app wants one, such as Next's for its prefetch on
view. The docs show the Next App Router wiring once, on the Link and Menu
pages.

**Scope and direction.** The popover's ("Popover"): the theme, shape and
density of the trigger React Aria hands it, and `dir` from the locale. Right to
left needs one rule of its own: the icon leads and the check trails by DOM
order, and `margin-inline-start: auto` puts the key at the inline end, but a
key chip of two keys in a right-to-left row would draw its comma or its
modifier on the other side, ", Ctrl" for "Ctrl ,". React Aria's `Keyboard`
already writes `dir="ltr"` on the chip, and the chip also sets
`direction: ltr; unicode-bidi: isolate`, as the numerals do, so its keys read
left to right in any direction whatever draws it.

**Nothing animates inside a menu.** The popover fades and slides in; the rows
do not move, so `menu.css` has no reduced-motion block.

## Toast

The app's toast becomes `toast()` and `ToastRegion`. The app kept events apart
from states: "Saved" is a toast, and "three fields are invalid" belongs in the
save bar. Success and info stayed 6 seconds and errors 12; an error was
`role="alert"`; the polite host was in the page before anything was put in it;
a 4px tone stripe sat at the inline start, with 24px corners, in the bottom
end corner of the viewport, 16px in; and a new save dropped the last result.
The library keeps all of it, on React Aria's `UNSTABLE_` toast parts, wrapped
entirely: the public contract is `toast(options)`, which returns an id,
`toast.dismiss(id)`, `toast.clear()` and `<ToastRegion />`. "Overlays" derives
the shared parts: the `overlay` class, the inset, the surfaces table and the
layers.

**One queue.** `toast.ts` holds one `UNSTABLE_ToastQueue` at module scope,
three toasts visible at once, so any client code calls `toast()`, the line
after `await` on a server action included, and the module imports on the
server, since the queue creates no DOM. `toast()` adds to the queue and
returns the key. React Aria puts the newest first and shows the first three,
so a new toast always shows, and once more than three are open the oldest is
hidden until one leaves. `toast.dismiss(id)` closes one; `toast.clear()`
closes every open toast one by one, through a registry of open keys, so each
`onClose` fires, which React Aria's own `clear()` does not, and then clears
the queue and the registry, the hidden toasts included; a toast an `onClose`
raises during the clear is dropped with them. A toast called with no region
mounted is queued and shows nothing, and a module flag warns once in the
console; a second flag warns once when a second region mounts, since two
regions would show and announce every toast twice. `process` is not typed in
the package, so neither warning can ask whether it is in development, and each
is one line.

**Two elements, and why.** React Aria's `UNSTABLE_ToastRegion` portals itself
to the body and renders nothing until the first toast, so it cannot sit inside
an always-mounted wrapper, and a polite live region has to exist before its
text for a screen reader to announce it reliably. So `ToastRegion` renders two
things. In place, where it is mounted, a status host, `div.toast-status-host`
with `role="status"`, `aria-live="polite"` and `aria-atomic="true"`: always
present, the server's HTML included, and hidden from sight by clipping
(`position: absolute`, 1px square, `clip-path: inset(50%)`), never by
`display`, which would take it out of the accessibility tree. It is pinned to
the start corner of its containing block (`inset-block-start: 0;
inset-inline-start: 0`): left at its static position, after the last block of
a page mounted at the root, its 1px box lengthened a page that fills the
viewport, and the page scrolled by 1px. A docs test holds a short page at
`scrollHeight` equal to `clientHeight`. And React Aria's region,
`div.overlay.toast-region`, a `region` landmark F6 reaches, portaled with the
first toast, holding `ol.toast-list` and the toasts. The region reads an empty
queue as the same empty list it renders on the server, so hydration adds no
commit of its own; React Aria's region takes one more as it learns it is on
the client, and a test counts the two.

**What the host says.** Only the latest polite toast: its title and its second
line, two blocks inside one element keyed by the toast's id, so a screen
reader pauses between them. With `aria-atomic` a new toast never re-reads the
older ones, and a repeated "Saved" is a new node, so it is announced again.
Each toast is seen once, as it arrives at the head of the queue, so one that
comes back into view when a newer one closes is not read twice, and the host
empties when its toast leaves the screen, so it never holds words nothing
shows. Two polite toasts raised in one handler render once, so only the second
is read: the host announces the latest, never a backlog. The host repeats the
words, so the title and the second line are text, and a toast's one control is
its action. An error is left to React Aria's content role, `alert`, which is
assertive and carries React Aria's `aria-hidden`-then-shown step for NVDA.
Every other tone's content takes `role="group"`, which React Aria merges after
its own `alert`, so its visible words are not a second live region and nothing
is read twice. A test holds both: a polite toast's page has one live element,
the host, and an error's region has one, its content. A toast with no second
line has no `aria-describedby`: React Aria's slot id resolves to nothing when
no description renders, and a test pins it.

**Under a modal.** Both elements carry `data-react-aria-top-layer`, the region
through React Aria and the host from the library. React Aria's hide pass keeps
such an element visible while a modal is open and walks around its ancestors,
its outside-press check ignores a press inside one, and its focus scope lets
focus move into one. So a polite toast raised while a dialog is open is
announced, a press on a toast's action or dismiss closes no dialog, and focus
can move into a toast and back. Every library modal also passes React Aria a
predicate that names `.toast-region` ("Dialog and ConfirmDialog"), which does
not depend on the attribute. The attribute is React Aria's internal contract,
so a unit test and the `AboveADialog` story pin what rests on it: with a
dialog open, the page beside the host is hidden and the host is not, and holds
the new toast's words; the region is not hidden; and a press on the toast's
dismiss leaves the dialog open. The version is pinned below.

**Timing.** Success, info and warning stay 6 seconds and an error 12, the
app's: a warning is read, not acted on, so it takes the ordinary time. A toast
with an action has no timeout, since a reader who needs the action needs the
time to reach it. `timeout` overrides, and `null` means never; zero or less
does too, since React Aria starts no timer for it. React Aria starts a toast's
timer when the toast is drawn, and a toast pushed out of sight starts its time
again when it shows again. Hover over the region and focus inside it pause
every timer, and the timers resume only when both have ended: WCAG 2.2.1 with
nothing to set. React Aria pauses when the pointer or focus enters, and a
toast that arrives after that would start its own timer as it mounts, so the
region pauses the queue again whenever the visible toasts change while it is
hovered or holds focus. It pauses from a microtask its effect queues, after
the commit: development Strict Mode runs a new toast's effects a second time
once every effect of the commit has run, which restarted a timer the effect
had already paused, and a microtask still runs before any timer falls due. A
test holds the arrival under `StrictMode`.

**The card.**

| Part | Value | Why |
| --- | --- | --- |
| Region | `position: fixed`; `inset-block-end` and `inset-inline-end` at the overlay inset; `width: min(28rem, calc(100vw - 2rem))`; `z-index: var(--z-toast)`; `pointer-events: none` | the app's corner, 16px in; the width caps against the viewport; a press between or around the toasts reaches the page |
| Toast | the float fill, `1px solid var(--color-frame)`, `--radius-surface`, `--shadow-float`, `pointer-events: auto` | a float that dims nothing and may sit over another float, as "Overlays" sets out |
| Stripe | `border-inline-start: 4px solid var(--toast-stripe)`: slate for info, then success, warning and error, keyed on `data-tone` | the app's stripe, logical so it mirrors |
| Padding | `1rem var(--spacing-peer)`, 16px by 24px | the app's 20px by 16px, regularized onto the spacing steps: 24px is the peer gap a drawer and a padded popover use, and 16px the overlay inset |
| Title | `--text-body`, ink, `overflow-wrap: anywhere` | the event, in words; a long word breaks instead of widening the stack |
| Description | `--text-small`, slate, 4px under the title, `overflow-wrap: anywhere` | hints are slate |
| Controls | the action, a secondary Button, then the dismiss, the 40px ghost IconButton with Lucide's X; `margin-block: -0.5rem; margin-inline-end: -0.5rem` | both targets stay 40px without growing the card |
| List | `flex-direction: column-reverse`, 8px apart (`--spacing-part`) | React Aria lists the newest first, so the newest sits nearest the corner and the oldest rises, as the app stacked them |

**The stripe, measured.** A 4px bar is a graphic and asks 3:1. All four colors
are gated on Float already, as text at 4.5:1, so `contrast.test.js` cites them
and adds nothing:

| Stripe on Float | Light | Dark |
| --- | --- | --- |
| Slate, info | 5.49 | 6.94 |
| Success | 7.44 | 6.34 |
| Warning | 6.33 | 8.92 |
| Error | 7.46 | 5.73 |

Slate in dark is white at 60%, so it is painted over the float before it is
measured. The toast stripe is one of the places the warning color was added
for ("Six colors added").

**The height of one line.** The spec put a one-line toast at 56px: 16px of
padding, a 24px band and 16px. The 1px frame adds 2px, so it measures 58px.
The band is the dismiss's: 40px tall, pulled in by 8px at each end, it takes
24px, more than the title's 22.4px line. Without the pull-in the card would be
74px. The `Short` story pins 58px, and the stylesheet's comment says so.

**Motion.** A fade and an 8px rise, 180ms ease, on enter only, through
`@starting-style`: React Aria's toast has neither `data-entering` nor
`data-exiting`, so the exit is instant. `@starting-style` is above the browser
floor (Safari 17.5, Firefox 129), so on Safari 16.4 and Firefox 128 a toast
simply appears. Reduced motion turns the transition off, in a block after it.

**Focus.** Each toast is React Aria's non-modal `alertdialog` with
`tabIndex="0"`, named by its title and described by its second line, and draws
the ring when keyboard focus reaches it. The region is `tabIndex="-1"`, React
Aria's, and takes `outline: none`. When a focused toast leaves by the
keyboard, React Aria moves focus to the next toast, or the previous one, or
back to where it was before the region took it; after a pointer press it goes
back, so no timer looks stuck. Each toast's dismiss is named by
`dismissLabel`, "Dismiss", and the region by React Aria's localized count,
such as "2 notifications.", unless `aria-label` names it.

**Scope and direction.** The region follows the page root and copies no scope:
a toast reports on the app, not on the card whose button raised it, and it may
outlive that card. React Aria writes `dir` on the region, and the stripe and
the corner are logical, so in right to left the stack sits in the bottom left
corner with the stripe on the right; the `ToastMirrored` story pins both.

**Forced colors.** The frame is redrawn in `CanvasText`, and the stripe with
it, so the tone is carried by the words alone, as it was in the app: the docs
ask the title to say the outcome.

**Room for a save bar.** `--toast-offset-block` is read with a fallback of 0
and declared nowhere, so a later save bar can lift the stack by its own
height.

**`maxVisibleToasts`.** The prop writes the queue's `maxVisibleToasts`, which
the queue reads each time a toast is added or closed, so a change applies from
the next toast. It is a plain instance field in 1.22.1, private only in React
Aria's types, so the library reaches it through a cast, and a region that
unmounts puts back the value it found.

**The pin.** React Aria's toast parts are `UNSTABLE_` in react-aria-components
1.22 and may change in a minor. They are wrapped entirely, and
`@snapshot-ui/react` pins `react-aria-components` to exactly 1.22.1, so a bump
is a deliberate change with the toast tests run behind it. The README says so:
an app whose own `react-aria-components` resolves to another version has a
second copy, whose providers do not reach the library's parts.

**The docs site.** The site mounts its one region in the docs layout, outside
the shell, as the page teaches. Mounted inside an example, the host sat in a
tab panel, which hides with `display: none` while its code shows, and the
other example's polite toasts went unannounced; outside the shell it is never
in the workspace the drawer makes inert either.

## CommandPalette

The app's palette was a dialog near the top of the viewport, opened and closed
by Cmd or Ctrl+K. Focus stayed in its field while the arrows moved the active
row; every typed word had to match; the last five chosen items were
remembered, and one the index no longer had was dropped rather than shown with
a stale name; Escape closed it at once; and it closed before the app
navigated, so the focus it gave back landed before the app moved it on. The
library keeps all of it, on React Aria's Modal, Dialog and Autocomplete over
the Menu's rows ("Menu"), and adds what the app's index did not need: sections,
a manual mode for results that come from a server, a loading state, and a
status line. Its look is not the app's stadium panel. It is the docs site's
search dialog, already drawn on the tokens and checked in both themes: a
floating surface takes the popup's 24px corner wherever it opens ("Overlays").

**The surface.**

| Part | Value | Why |
| --- | --- | --- |
| Scrim | `align-content: start; justify-items: center; padding: 12vh var(--overlay-inset) var(--overlay-inset)` | the docs dialog's 12vh anchor: the field stays put and the list grows down from it, which is steady to read while it changes |
| Surface | `width: min(40rem, 100%)`; `max-height: min(35rem, calc(88dvh - 1rem))`; `--color-float`, `1px solid var(--color-frame)`, `--radius-surface`, `--shadow-float`; a column that clips | the docs dialog's 640px and 560px; the height is the room under the anchor less the bottom inset, so 12vh, the surface and 1rem make the viewport; the popup's edge, corner and shadow |
| Field row | `display: flex; align-items: center; gap: 0.75rem; padding: 1rem var(--spacing-peer)`, a divider under it; the 20px slate glass, the field, the spinner while loading, then the Esc key | the docs field's 16px by 20px, regularized onto the peer step; the Esc key sits where the hand reaches to close |
| Field | `--text-body`, no border, no fill, `outline: none` | the field is the row; its focus is the line below |
| Placeholder | `--color-slate`, `opacity: 1` | the field's only visible name, so it is read: an exception, below |
| Body | `display: flex; flex-direction: column; flex: 1 1 auto; min-height: min(20rem, 50dvh)` | the docs body's floor: one height whether nothing is typed, nothing matches or the list is long |
| Rows | the Menu's list and rows, inline, with no popover; the list fills the body (the Menu's `flex: 1 1 auto; min-height: 0`) and is the one scroller, `overflow-y: auto; overscroll-behavior: contain` | the rows every list popup shares; React Aria measures a page of rows in the element it thinks scrolls, its list, so the page keys move by a page and not to the ends |
| End value | the Menu's `menu-item-end`: `--text-small`, ink, tabular figures, before the key | an amount belongs to its row, at its end, and reads in columns |
| Active row, keyboard (`[data-focus-visible]`) | the ink fill; label, icon and end value canvas; the description canvas at 70%; the key chip canvas at 20% with canvas text; no ring | DOM focus never leaves the field, so this is the keyboard user's only focus indicator and must be strong; React Aria sets `data-focus-visible` only when the keyboard moved the row |
| Active row, pointer (`[data-focused]` alone) | the Menu's 5% wash | the pointer is not choosing yet; hover moves the row, a press chooses |
| Empty line | `padding: var(--spacing-peer)`, slate, centred | a hint, centred in the body's floor |
| Status line | clipped to 1px, never `display: none` | it must stay in the accessibility tree |
| Footer | the up and down keys with "to move", the return key with "to open"; `--text-small`, slate, a divider above; `flex-wrap: wrap`; hidden under `@media (pointer: coarse)` | the docs dialog's hints; translated words wrap instead of running off the surface; a phone has no keys to hint |
| Motion | the dialog's 180ms fade and 8px rise; none under reduced motion | the Dialog's ("Dialog and ConfirmDialog") |

**The placeholder, an exception.** Placeholders are taupe, the whisper
("TextField"), because a field has a visible label above it and the
placeholder only shows an example. The palette has no visible label: its name
is the dialog's, given to assistive technology, and the placeholder is the
only words a sighted reader gets for what the field searches. So it is slate,
a hint that is read: 5.49 in light and 6.94 in dark on float, a pair the gate
already holds as text. It is the one recorded exception to the taupe
placeholder rule.

**Measured on the active row.** The canvas color on ink is gated as text:
16.25 in light and 19.31 in dark. The description on the ink fill is canvas at
70%, a mix and not a token, measured with the gate's composite and pinned by
the Menu's test for the same pill: 8.34 and 7.31. The end value at rest is ink
on float, gated. Nothing new joins the gate; `contrast.test.js` cites the three
pairs the palette rests on.

**The focus line.** The spec drew it as a border color plus a 1px box-shadow.
The token-only rule rejects any `box-shadow` with literal lengths, even in a
token color, so the line is what the docs field already draws: a
`::after` 2px tall, the ring width, laid over the divider at the row's bottom,
transparent until the field is `:focus-visible` and then
`--focus-ring-color`. Nothing moves when it shows. In forced colors a fill does
not survive, so the field's own outline comes back (`outline: auto`).

**Forced colors.** The repaint drops the ink fill, which is the only sign of
the active row, so that row is drawn in `Highlight` with `HighlightText`, and
its parts follow it, as on the Menu's chosen row: the icon, the second line
and the end value in `HighlightText`, and the key chip as its island of the
system `canvas` with `CanvasText`. Each rule is as specific as the ink rule it
overrides and comes after it. The surface's frame is redrawn in `CanvasText`.
A docs test reads every part on the active row.

**The quiet period.** The status line, `role="status"` and in the page from
the palette's first render, says the count 600ms after typing pauses; each
keystroke cancels the pending one, so it never talks over the letters being
typed. It says nothing while the field is empty, and nothing while the app is
loading: when the results land it says their count. 600ms is the quiet period
the Pagination digest chose, so the library has one number. The count is the
items the default filter keeps, or every item in manual mode. The English
default says "No results for" the query, "1 result", or the count and
"results"; `labels.status` replaces the whole function, so a translation
brings its own plurals.

**The filter.** An item stays when every word of the query, split at
whitespace, appears in its label, its second line or its keywords, through
React Aria's `useFilter({ sensitivity: 'base' }).contains`, so case and accents
do not count. React Aria's collection filter hides a section none of whose
items stay. The filter applies only once there is text. A caller's `filter` is
given the item itself and the query; `filter={null}` is manual mode, in which
the app searches, ranks and caps, and the list is what `items` holds, still
grouped into its sections. While the app loads, the empty line waits too: a
list still loading has not yet found nothing.

**The shortcut.** Tokens joined by `+`: the modifiers `Mod`, `Shift` and
`Alt`, in any order and case, then one key compared with `event.key` without
case. A key that is a Latin letter or a digit also matches by position: when
`event.key` is not itself a Latin letter or digit, `event.code` (`KeyK`,
`Digit1`) stands in. On a Persian, Arabic, Hebrew, Greek or Russian layout,
Ctrl+K reports the layout's own letter, such as noon or el, and Option on a Mac
types a symbol, so without the position the palette would never open there,
and the browser would take the key instead. The character still comes first,
so a Latin layout that moves the letters, such as Dvorak or AZERTY, matches the
letter printed on the key and not the QWERTY position. `Mod` is `metaKey` or
`ctrlKey`, either, with no platform sniffing, and a modifier that is not listed
must be up. A typo, such as `Ctrl+K`, throws as the palette mounts. One
`keydown` listener on the document, in the bubble phase, while the palette is
mounted: it leaves a key an editor has already handled (`defaultPrevented`) and
a key typed while composing, and does nothing while another of the library's
modals (Dialog, ConfirmDialog, Drawer, Sheet) is in the overlay stack, so a
confirm dialog is never skipped past. An app's own modal is not in the stack;
the docs ask it to prevent the shortcut's keydown, or to pass
`shortcut={false}` while it is open. When it acts it takes the key. It toggles:
from inside the field, React Aria hands the key on to the list, and it reaches
the listener from there.

**Close, then act.** Choosing records the item in the recents, closes the
palette, which tells `onOpenChange(false)`, and waits. The panel leaves after
React Aria's exit animation; the frame gives focus back to what opened the
palette as the panel leaves, before its unmount call fires, or React Aria's
focus scope does in the next animation frame when the frame could not; and
`onAction(item)` runs one frame after that, two after the unmount call, with
the item as the app passed it. React Aria's
`onExit` fires when the exit starts, not when it ends, so the palette waits on
the unmount instead. The app's palette closed first for the same reason: focus
given back after the app has moved it would undo the move, and the last word
is the app's. The `OnActionKeepsFocus` story pins it in a real browser: a field
that `onAction` focuses still has focus two frames later. A choice waits only
for the close it made: opening again, and any close the palette did not make
for a choice (Escape, the scrim, the shortcut), drops it, so a choice whose
panel never left, because a caller kept the palette open or it reopened during
its exit, never runs on a later, unrelated close.

**Recents.** With `storageKey`, one `localStorage` entry per key,
`snapshot-ui:recent:<storageKey>`, a JSON list of ids as strings, newest first,
cut to `recentLimit` (5). A chosen item moves to the front and never doubles.
It is read through `useSyncExternalStore`, with the `storage` event for other
tabs and an empty snapshot on the server, so the server's HTML and the first
render agree, and kept in memory while a palette with the key is on the page,
so a choice is still listed where storage refuses it. Unreadable JSON, a list
that is not one, blocked storage and a refused write mean no history and no
error. With `recentIds` the app owns the list: the palette stores nothing and
hands the new list to `onRecentChange`, in the app's own keys. Without it,
`onRecentChange` still hears each new list as stored, every id a string. Only ids still in `items` are shown,
under a Recent section, while the field is empty; their rows carry keys of
their own, `recent:<id>`, so the list's keys stay unique, and choosing one runs
`onAction` with the item, not its copy.

**The list: Menu, with ListBox in reserve.** The rows are the Menu's, a true
`role="menu"` behind the field's `aria-activedescendant`, because the palette's
items are actions. Whether a screen reader reads that pair well is the owner's
check, in VoiceOver and NVDA, before the shell ships it; it is pending. If it
reads badly, the list becomes React Aria's `ListBox` with
`selectionMode="none"` and `onAction`, which takes the same rows, at no change
to the props. The stories skip two of axe's checks, each on one element: the
Menu's label-in-name check on its rows ("Menu"), and the scrollable-region
check on the list, which is the one scroller. The field owns the list through
`aria-controls` and `aria-activedescendant`, as a combobox owns its popup,
which axe exempts; the arrows, Home, End and the page keys move the active row
and React Aria scrolls it into view, which the `Recent` story shows (Arrow Up
wraps to the last row, inside the list, scrolled) and the `Keys` story shows
for the page keys. The override keeps the select and textarea axe skips by
default (`*:not(select, textarea, .command-palette-list)`). A tab stop on the
list would make the field no longer the dialog's only one.

**Scope and direction.** The frame records what held focus when the palette
opened, before the field's `autoFocus` takes it, and copies its theme, shape
and density onto the surface: opened by a button in a dark card the palette is
dark, and opened by the shortcut from the page it is the page's. `dir` comes
from the locale. The glass is first in the row and the Esc key last, so in
right to left they swap ends; the label, the end value and the key keep their
reading order, and every value is logical.

## Tooltip

The app names the icons of its collapsed rail with a tip: ink with canvas
text, 6px corners, an arrow, a 140ms fade with a 4px slide, and a key chip for
the search shortcut. It opens after 400ms on hover and at once on keyboard
focus, with no wait while another tip is warm, stays while the pointer is on
it, closes on Escape, on a press and on scroll, and never shows for touch.
`Tooltip` keeps all of it on React Aria's `TooltipTrigger` and `Tooltip`,
which own the timing, the hover, the focus rule and the placement, so the
stylesheet draws the tip and its motion and the wrapper sets the delays, the
scope, the direction and the chip. "Overlays" derives the shared parts.

**The delays, as React Aria gives them.** `delay` is 400ms and `closeDelay`
120ms, the library's, against React Aria's own 1500ms and 500ms. React Aria
opens a tip on hover only with a mouse, since its hover ignores a touch
pointer, and on focus only when the focus is visible, so a click's focus shows
none. Once a tip has opened, React Aria keeps every tip warm: a module-level
flag, cleared by a cooldown of 500ms (`TOOLTIP_COOLDOWN` in react-stately's
`useTooltipTriggerState`) that starts when a close starts, which is when the
pointer leaves. With the 120ms close delay, the next tip opens at once for
about 380ms after the last one visibly closed, and for half a second after the
pointer left it. The app's window was 300ms. Matching it would mean writing
the state hook again, so React Aria's is kept, and the parent spec's sentence
now says "about half a second". Neither the window nor its length is a prop.

**The surface.** `--color-ink` with `--color-canvas` text, the app's tip, and
the primary button's pair: 16.25 in light and 19.31 in dark, both gated. The
tip opens over any surface, so its own edge is ink against what is behind it:
16.25 to 18.43 in light and 15.36 to 19.31 in dark on the canvas, Lifted, Float
and Raised, pairs the gate already holds as text. No border is needed to see
it. It has one all the same, `1px solid transparent`, so forced colors have an
edge to redraw (below). `--radius-micro`, the step this document gives key
hints, badges and tooltips, which keeps 6px in Soft and goes square in Square.
`--shadow-float`, elevation level 2, as every float.

**The text.** `--text-small`, 14px at 450, padded 6px by 10px. 14px is the
sentence floor; the app's 13px is under it. Light text on a dark fill renders
heavier than it measures, so 450 holds on the ink without a bolder weight. A
tip wraps at `min(20rem, calc(100vw - 2rem))`, 320px or the screen less the
overlay inset on both sides, so a description tip never runs off a 320px
screen, and `overflow-wrap: anywhere` breaks a long word inside that width.

**The arrow and the gap.** React Aria's `OverlayArrow`, holding an 8px svg
drawn pointing down for a tip above its trigger, `M0 0 4 4 8 0`, filled with
the tip's ink. React Aria places the arrow element on the side the tip
landed, centred on the trigger, and the stylesheet turns the svg for the
other three sides by the arrow's own `data-placement`. `offset` is 12px, the
gap from the tip's box to the trigger, with the arrow's 4px inside it, so the
point stops 8px short of the trigger. The tip opens above its trigger by
default and flips to the other side where the screen has no room, inside
React Aria's 12px `containerPadding`; `data-placement` says where it landed.
In right to left `start` and `end` resolve through React Aria, and `end` is
the left. It sits at the inline z-index of 100000 React Aria writes, above
every modal, as "Token names" sets out.

**The key chip.** The one key look, inverted for the ink: 12px, weight 700,
overline tracking, tabular figures, `--radius-micro`, canvas text on canvas at
20% over the ink, 8px from the text. It is the chip a chosen menu row draws,
measured the same way: 9.13 in light and 12.37 in dark, a mix and not a
token, so it is recorded here and in the contrast tests and not gated. `Mod`
is the platform's modifier after mount, through the shared `Shortcut`, and
React Aria's `Keyboard` writes `dir="ltr"` on the chip, so its keys read left
to right in either direction. That same `dir` decides its gap: a logical
margin maps by the element's own direction, so the chip's inline start is
always its left. In a left-to-right tip `margin-inline-start: 0.5rem` faces
the text. In a right-to-left tip the text sits on the chip's right, so
`.tooltip[dir='rtl'] .tooltip-shortcut` moves the 8px there with
`margin-inline: 0 0.5rem`; the wrapper always writes `dir` on the tip, and the
selector outranks the chip's own rule in any order. The `End` and
`DirFromLocale` stories measure 8px in each direction. The app's pill was a
rail-local choice.

**Motion.** Opacity and a 4px slide toward the trigger, 140ms ease-out, on
React Aria's `[data-entering]` and `[data-exiting]`: a tip above its trigger
rises from 4px lower, one below drops from 4px higher, and one to the side
slides in from 4px nearer. These are the app's values and the popover's. A
warm swap is not animated: React Aria 1.22.1 marks a tip that opens inside
the warm window, and the tip it replaces, `shouldSkipAnimation`, and writes
neither attribute on them, so the next tip appears at once and the last one
leaves at once, as the overlay spec's motion table asks. The state is React
Aria's own, and the wrapper adds nothing to it. A cold open and a plain close
fade. Reduced motion turns the transition off, in a block after the rules it
overrides.

**Closing.** The pointer leaving closes the tip after 120ms, unless it moved
onto the tip, which is hoverable (WCAG 1.4.13). Escape closes it, through a
`keydown` listener React Aria puts on the document while the tip is open,
which stops the key there, so a tip inside a dialog closes and the dialog
stays. A press of the trigger, a pointer down or a key down, closes it, and so
does blur. A scroll of a box around the trigger closes it, through React
Aria's `useCloseOnScroll`. A resize of the window does not close a tip in
React Aria 1.22.1, which only moves it; the wrapper closes it, through the
trigger's state. A resize reflows the page under the tip, whether it opened by
hover or by focus: the trigger moves, and a label it stood for may now show
beside it, as a navigation rail's does when it widens with the window. Setting
`isDisabled` then takes away the trigger's hover and focus handlers but does
not close a tip that is already open, so without this a focus-opened tip
would stay beside the visible label. It trims WCAG 1.4.13's "persistent" for a
deliberate resize, as React Aria's scroll close already does. A tip given its
own `isOpen` or `defaultOpen` keeps a state of its own, which the wrapper
leaves alone.

**Forced colors.** The repaint turns the svg's fill into a shape that may not
match the tip, so the arrow goes (`display: none`). The transparent border is
drawn in `CanvasText`, so the tip keeps its edge on the reader's background.

**Announcement.** The tip is `role="tooltip"`, and React Aria gives the
trigger `aria-describedby` while it is open, so the tip is the trigger's
description. The app hid its tip from assistive technology, because the item
already carried the same name. The library accepts React Aria's description:
a tip is supplementary, and on an icon button it mirrors the `aria-label`,
which a screen reader may read twice. Whether that reads badly is the owner's
check, in VoiceOver and NVDA, before the shell ships; it is pending. The named
fallback is to hide the tip, as the app did. Two facts read in 1.22.1 shape
it: React Aria's tip passes no `aria-hidden` through, since its DOM filter
keeps only the id, the labelling props, the `data-` attributes and the global
attributes; and a trigger's `aria-describedby` still reads a hidden tip's
text, since a description follows its reference into hidden content. So the
fallback is a change in the wrapper and not a prop a caller sets: the tip
hidden, and a trigger whose tip only repeats its name left undescribed. Hiding
the tip's own content, inside a tip that stays exposed, does empty the
trigger's description, which makes it the likely mechanism; it also leaves a
`role="tooltip"` with no name, so it is checked against axe's
`aria-tooltip-name` before it is relied on.

**A tip forced open on the server.** A portal draws nothing on the server, so
a `TooltipTrigger` given `isOpen` or `defaultOpen` renders its trigger with an
`aria-describedby` that points at a tip the server's HTML does not hold. The
reference resolves once the page hydrates and the tip mounts. No shipped path
opens a tip before a hover or a focus, and holding a forced tip closed until
hydration would need a state of its own for `defaultOpen`, so it is recorded
and not changed: until the script runs, that trigger's description points at
nothing.

**Scope and direction.** The tip copies its theme, shape and density from the
trigger React Aria hands it through `TooltipContext`, or from the `triggerRef`
it is given, and not from what holds focus: a tip opened by hover was opened
by no focus, so focus can be anywhere. A tip opened from a dark card is the
dark ink, white with black text, while the page stays light. React Aria
writes no direction on a tip, so `dir` comes from the locale.

## Compact density

A site may draw its controls tighter from one attribute, `data-density`, as it
cuts its corners from `data-shape`. `data-density="compact"` on any element
remaps three of the four tokens below for its subtree, and the fourth,
`--size-target`, is the fixed floor. No component knows which density is
active: Button, IconButton, SegmentedControl, the text input and Card read
the tokens where they had literals. The first app built on the library asked
for it, for toolbar controls of 34 to 36px.

**One axis, not sizes.** The alternative was a `size="sm"` prop on Button,
IconButton, Card, TextField and the rest. That is a prop at every call site, a
media query for touch repeated in every component's stylesheet, and nothing a
page that uses the classes without React can reach. One attribute reaches a
whole region, and the touch growth is one generated block.
`SegmentedControl size="sm"` stays as it is: it is a type and padding choice
for a toolbar, and its height now comes from the axis like every other
control's.

| Token | Comfortable | Compact | Compact, `(pointer: coarse)` | Read by |
| --- | --- | --- | --- | --- |
| `--size-control` | 40px | 36px | 44px | a button's minimum height, an icon button's width and height, the `sm` segmented track |
| `--size-field` | 48px | 36px | 44px | the text input's height, the `md` segmented track |
| `--size-target` | 40px | 40px | 40px | the floor every hit area is extended to |
| `--spacing-card` | 32px | 20px | 20px | a card's padding and its header band's bleed |

**40 and 48 are today's literals.** A button's minimum height and an icon
button were 40px, and the input 48px. The `md` segmented option is 2.5rem in a
track of the option plus 0.5rem, 48px, and the `sm` option 2rem in a 40px
track, so the two segmented tracks are exactly `--size-field` and
`--size-control`. Comfortable draws exactly as 0.1.0 did.

**36, not 32.** The first app's toolbar controls are 34 to 36px. 36 also keeps
the hit-area extension at 2px a side, so two controls 8px apart, the part
step, never overlap. At 32 the extension would be 4px a side, which touches at
an 8px gap and overlaps under it.

**44 on a coarse pointer, and only in compact.** 44px is the first app's
number, and the target WCAG 2.5.5 asks for. It applies only within compact, so
on a touch screen a compact control is taller than a comfortable one. The
inversion is deliberate, and the theming page states it. Comfortable keeps this
document's 40px floor and does not change on touch: growing it would change the
sizes 0.1.0 shipped, and 40px is already well past the 24px of WCAG 2.5.8.

**20px of card padding** is the first app's number, and the value the docs
site already writes by hand for its cards under 768px.

**The hit area.** A control drawn under the target extends its hit area with a
pseudo-element, as "Rules every component follows" asks, and one formula
serves every control:
`inset-block: min(0px, (100% - var(--size-target)) / 2)`. A positioned
pseudo-element measures from inside its control's border, so 100% is the
padding box, and the formula reads it rather than the token: a token-based
formula left a bordered 36px compact button or icon button hit at 38px, its
padding box plus 2px a side. With the padding box, a bordered 36px compact
control is hit at 40px, 2px a side past its border box; a bordered 40px control
at exactly its border box; and one 44px on touch at its own size. A segmented
option has no border, so 100% is its height: 4px a side for the 32px option of
a comfortable `sm` track, as before; 6px for a 28px compact option, 2px past
its track as a button's is; and nothing for an option 40px or taller. `--size-target` has no density modes because it is the floor itself.
If compact lowered it, the formula would lower every hit area with it, and a
compact control would be a smaller target, which is the one thing density must
not change.

**The card.** Compact takes the card's padding, its header band's bleed and the
header's bottom margin to 20px. The space under the title, above the header's
rule, is `min(var(--spacing-peer), var(--spacing-card))`: 24px in comfortable,
as before, and 20px in compact, so a compact card's own spacing is 20px
everywhere with no second token. The body's row gap stays 24px, the peer step,
and its column gap 32px, the separate step.

**Stacked segmented rows** are `max(var(--size-target), var(--size-control))`
tall in both sizes: 40px, and 44px in compact on a coarse pointer. A stacked row
never drops under the target, so neighboring rows' hit areas never overlap.

**The generator's refinement.** Density is generated as shape is. Each token
carries its compact value beside its base value in `tokens.json`, and the
build writes a `[data-density="compact" i]` block and a
`[data-density="comfortable" i]` reset after the shape blocks. The touch
growth is a refinement, `compact-coarse`: a second value that the build writes
again under its media query,
`@media (pointer: coarse) { [data-density="compact" i] { ... } }`, after the
compact block, so on a touch screen it wins. It holds only the tokens that give
it a value. The card's padding has none, so it keeps its compact 20px on touch.
A token with a refinement value and no value for the variant it refines fails
the build, naming the token, because the media block would then change a value
that nothing set: a refinement is its variant again under a condition, and
cannot stand alone. `tokens.js` lists it beside the variant, as
`tokens.size.control.modes.density['compact-coarse']`, and a reader resolves
it as the CSS does, falling back to the variant and then the base:
`modes.density['compact-coarse'] ?? modes.density.compact ?? value`. So the
card's padding on touch reads its compact 20px.

**Scope.**

- **Regions.** `data-density="compact"` on any element compacts its subtree,
  and `data-density="comfortable"` inside it restores the defaults. Matching
  ignores case. A missing or unknown value changes nothing: the subtree keeps
  the density around it, which is comfortable at the root, with no script.
- **Phone-wide compact is the site's rule, not an axis value.** The tokens are
  public, so a site sets them under its own media query, where it knows the
  width: `@media (width < 768px) { :root { --spacing-card: 20px; } }` is what
  the docs site does for its cards, and a site that wants every control compact
  on a phone sets `--size-control` and `--size-field` the same way. There is no
  `data-density="auto"` tied to a breakpoint: an attribute cannot respond to
  the viewport without script, and the server cannot know the viewport.
- **Popups keep their trigger's density.** A menu, a select's popup or a
  tooltip portals to the body, outside the region it opened from. The overlays'
  scope hook copies `data-density` onto the overlay's root with the theme and
  the shape ("Overlays"): from the trigger for a positioned overlay, and from
  what held focus when it opened for a modal. Only parts that read the size
  tokens change in a compact scope. A menu row's own 40px, and 44px on a coarse
  pointer, are the overlays' minimums and are not density-driven.
- **Comfortable does not change on touch.** A touch screen with no
  `data-density` draws 40px controls, as 0.1.0 does.

## Floating chrome and the shell

The shell, `AppShell` with its rail and its tab bar, shares three values with
the overlays and with the page, and the library names them.

**The inset.** `--spacing-inset` is 16px, how far floating chrome sits clear of
the viewport's edge: the rail, a drawer, the skip link, and the overlays' edge
inset, which is the same 16px. It is the one step the spacing rhythm skips:
8px, 24px, 32px and 48px are the part, peer, separate and page steps, and 16px
is none of them. It is recorded as the rhythm's one exception, for two reasons.
Chrome kept clear of the viewport's edge is a different thing from the space
between two parts of a page, so it should not move when a rhythm step does.
And 16px is what the docs rail, the app's rail and the app's save bar all keep.

**The rail's width.** `--container-sidebar` is 20rem, the rail's full width
with its insets, and the workspace is offset by it. Under
`data-sidebar="collapsed"` it is 6.5rem. These are the docs rail's 320px and
104px. They are rem so that a larger root font widens the expanded rail and
gives its wrapped labels room; the collapsed rail gains room it does not need,
which is harmless. The collapsed width comes from a generated `sidebar` axis,
built as shape and density are: `[data-sidebar="collapsed" i]` remaps the one
token, and `[data-sidebar="expanded" i]` restores it for a nested subtree. So
the collapsed width is in `tokens.js`, as
`tokens.container.sidebar.modes.sidebar.collapsed`, and in no component's
stylesheet, and `AppShell` writes `data-sidebar="collapsed"` while collapsed
and never `expanded`. A server paints the right width from a prop, a pre-paint
script can set the attribute on `<html>`, and nothing is measured.

**The chrome's layers.** `--z-chrome` is 30, for fixed chrome: the rail, its
collapse button, the tab bar and a save bar. `--z-header` is 20, for a sticky
page header, above the page it scrolls over and under every piece of fixed
chrome. Where both sit among the overlays is the ladder in "Token names": under
every modal, so a modal always covers the chrome. A page's own sticky elements,
such as a table's header row or a toolbar, use `--z-header` or less, so they
scroll under the chrome and never over it.
