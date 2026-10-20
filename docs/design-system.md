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

The preview frame keeps the 24px surface step, never the section's own
40px, and where it meets the section's corner it takes the section's radius
less the gap between them; see Nested radii below.

## Nested radii, derived

This document gives the radius scale but not what happens when one rounded
surface sits inside another, and a settings panel does that constantly: a
field's frame inside a section, a picture inside a card, an option inside a
popup.

**Rounded inside rounded is concentric.** The inner curve shares the outer
curve's center, so the band between the two edges keeps one width all the way
round the corner. The inner radius is the outer radius less the gap between
the two border boxes, which is the holder's padding plus its drawn edge, and
never less than 0:

```css
border-radius: max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)));
```

Equivalently, the outer radius is the inner one plus the gap. An inner corner
as round as its frame reads as swollen and pinches the band at the corner; a
much sharper one reads as a box dropped in and bloats it. Both shipped: 24px
icon options in a 24px popup, and a 6px picture in a 24px card. The first
version of this section stepped down one step of the scale instead, 40px to
24px to 20px, which matches the gap only by chance: a 24px popup with 9px of
edge and padding holds 15px rows, not 20px ones.

**Surfaces take the formula; controls move out of the corner.** The formula
is for what fills to the holder's edge: a row, a tab, an option, a frame, a
nested card, a list, a code block, a field's own button. A button, a field, a
switch or a chip that would sit inside a holder's corner curve keeps its own
uniform shape and moves out of the corner instead, as Apple and Material keep
content clear of a rounded corner. A control is never given one corner smaller
than its others: a button with three 20px corners and one 7px corner reads as
damaged, not concentric.

**A control moves down, not in, where a column stands above it.** A control
clears the corner by clearing it on one axis, and the axis is chosen so the
control keeps its alignment. Where the holder has a content column the control
lines up with, as a dialog's or a side panel's fields above their actions, the
holder's block-end padding becomes the corner inset and its inline padding
stays the padding, so the trailing action's end stays on the column's end
edge. Material, Apple's guidelines and Fluent all keep a trailing action on
that edge; one that stops short of the fields above it reads as a layout bug.
Only a holder that is a single row, too short to clear its curve vertically,
moves its controls inward: the bulk bar, SaveBar, a toast and UploadTray's
panel folded to its header.

| holder | its corner | edge and padding | part | Rounded | Soft | Square |
| --- | --- | --- | --- | --- | --- | --- |
| Card, StatTile | stadium | 1 + 32px (20px compact) | a card or tile in it | 7px (19px compact) | 6px, the micro floor | 0 |
| Popover, CommandPalette | surface | 1 + the list's 8px | a row, the filter field | 15px | 3px | 0 |
| a menu row | 15px, 3px | 12px | its key chip | 3px | 0 | 0 |
| TabList | surface | 4px | a tab | 20px | 8px | 0 |
| SegmentedControl's track | pill | 1 + 3px | an option | 20px | 8px | 0 |
| a field | pill | 6px | its field button | a circle | 6px | 0 |
| MultiSelect's frame | half a field | 6px | a tag | 18px | 6px | 0 |

And the controls that move, by the corner inset (below):

| holder | control | which way | where it stops | Rounded | Soft | Square |
| --- | --- | --- | --- | --- | --- | --- |
| Dialog | the last action | down | the panel's foot pads to the corner inset | 39px under it, not 32px | as before | as before |
| SidePanel | the footer's last action | down | the footer's foot pads to the corner inset | 39px under it, not 24px | as before | as before |
| SidePanel | a field or button at the body's foot | down | the body ends at the corner inset | 39px under it, not 24px | as before | as before |
| Drawer | the footer's content | down | the footer ends at the corner inset | 39px under it, not 24px | as before | as before |
| a card a LineChart ends | the table toggle | down | the toolbar keeps the corner inset under it | 39px under it, not 32px | as before | as before |
| Card | the list's first or last row's controls | down | the row's block padding grows by the corner inset less the card's padding | 7px, 19px compact | as before | as before |
| Card | CardActions beside the title | down | the actions and the title take a top margin of the corner inset less the card's padding; under 24rem nothing moves | 7px, 19px compact | as before | as before |
| Card | a field's last offer | down | the offer's block-end padding grows by the corner inset less the card's padding, plus what the button's box hangs under the line | 17px, 27px compact | as before | as before |
| Card | a repeater's Add | down | the foot's block-end padding grows by the corner inset less the card's padding | 7px, 19px compact | as before | as before |
| DataTable's bulk bar | its buttons | in | each end pads to the corner inset | 23px, not 8px and 16px | 11px | as before |
| SaveBar | its buttons | in | each end pads to the corner inset, as the bulk bar's | 23px each side | 16px and 11px | 16px and 8px |
| Toast | the dismiss | in | the controls stop at the corner inset | 1px past the padding, not 8px | as before | as before |
| UploadTray's panel | the header's trailing button | down | the header's block-start padding is the corner inset | 23px over it, not 8px | 11px | as before |
| UploadTray's panel | the last row's trailing button | down | its row's block-end padding is the corner inset | 23px under it, not 10px | 11px | as before |
| UploadTray's panel, folded | the header's trailing button | in | the header's end padding is the corner inset | 23px, not 8px | 11px | as before |

**It is a calc on the tokens.** No part writes the number. Each value is the
holder's token less a length, so Soft and Square follow by construction: in
Square every token is 0 and every part is 0, and Soft's smaller scale gives
smaller parts. A pill is the same rule and needs no case of its own: the
browser draws a 999px corner at half the box, so a field button 6px inside a
48px field is 999px less 6px, drawn at 18px, half of its 36px, which is the
field's 24px less the 6px gap. A pill in a pill is concentric whenever it is
centered with an even gap.

**The holder names its corner.** A holder declares `--holder-radius`,
`--holder-border` and `--holder-pad` and draws its own corner, edge and
padding from them, and a part in it reads the three. The holders are Card,
StatTile through Card, Dialog, Drawer, Sheet, SidePanel, Popover and its
padded variant, CommandPalette, Toast, the bulk bar, TabList, SaveBar, and
UploadTray's panel and phone bar. Each also
names its corner inset, `--holder-corner-inset`, the padding or the radius
less the edge, whichever is more:
`max(var(--holder-pad), calc(var(--holder-radius) - var(--holder-border)))`.
A control that far from the holder's edge on either axis is clear of the
corner curve. It is a calc on the tokens too: in Square it is the padding, so
nothing moves, and in Soft it is the padding wherever the padding already
clears the smaller curve. A custom
property cannot read the value it overrides, so a part that holds parts in
turn names its own radius, as a menu row's `--menu-item-radius` does, and a
card in a card writes its value on the
tokens rather than on the outer card's properties, which it overrides. A
field's corner is `--input-radius`, the pill unless a holder sets it, as the
filter row in a popup does, and the field button inside reads it.

**An app's own content follows the same rule.** The library sets the corners
and insets of the parts it places, but it cannot know where an app puts a
button or a field in a card's body. A surface an app places in a holder's
corner takes the formula from the holder's properties; a control stops at the
holder's corner inset, below it rather than beside it, so it stays on the
column's edge: a button or a row of actions at the foot of a card takes
`margin-block-end: calc(var(--holder-corner-inset) - var(--holder-pad))`. The
stories do exactly this, from `packages/react/src/stories/corner.ts`, and so
do the docs examples.

**Sharing a corner, or sitting further in.** The rule binds a corner when the
part's corner lies within the holder's curve: both gaps at that corner, inline
and block, are smaller than the holder's radius. There a surface, a row or a
frame takes the formula, on every corner, so no row differs from the next by
where it falls; a control is not left there at all, it is moved out. A part
further in, with a gap at least the holder's radius on either side, is clear
of the curve and keeps its own shape: a button in the middle of a card stays a
button, and a nested card in Soft, 33px inside a 16px curve, keeps a small
corner of its own.

**Text-sized parts keep the micro step, never rounder.** A key chip, a badge,
a checkbox and a title's focus ring keep `--radius-micro`, which is under the
formula almost everywhere. Where the formula is smaller, they take it, so a
key chip in a 15px row is 3px, `min(var(--radius-micro), ...)`, and an inner
corner is never rounder than the corner around it. A month grid's cell is one:
two thirds of the micro step, under the formula of every holder it can sit in.

**Dots and circles keep their shape.** A dot, on `--radius-dot`, is round by
meaning, and a pill drawn on a square box is a circle by its size: a field
button, an icon button, the dialog's well, an avatar. A circle's radius is
half its side, not a choice, so it is not stepped; where it sits in a corner,
its placement sets the band, as a field button's 6px does. A tag's remove
button and a filter chip's clear circle stay circles in every shape but
Square. A part that is a circle in Rounded and a rounded square in Soft takes
the formula, which leaves the circle alone in Rounded and fixes the square in
Soft: a field button is 6px in Soft.

**Floating surfaces are not nested.** A popover, a menu, a toast and a dialog
sit above the page rather than in it, so each starts a ladder of its own
wherever it opens: a 24px popup opened from a 40px dialog keeps its 24px, and
its rows step from there.

**Flush edges are clipped, not rounded.** A part flush with its holder's edge,
a gap of 0, would need the holder's own radius. It stays square and the
holder clips it to its corner, as the picture at the top of a file tile is
clipped and as the Drawer clips its body. `overflow: clip` with
`overflow-clip-margin: content-box` would clip to the concentric curve of the
padding box, but Safari does not support it, so nothing relies on it.

**Uneven padding subtracts the smaller side.** A holder padded 16px by 24px
would need an elliptical inner corner to be exact. In practice the formula
subtracts the smaller gap, which keeps the curve concentric at the tighter
edge, where a mismatch shows. The edge counts only where it is drawn: 1px for
the framed holders and 0 for the tab track, which has none.

**Deeper nesting keeps subtracting.** Each level takes its own gap from the
level above: a 24px popup, a 15px row, a 3px key chip. Where the result
reaches 0 and the part should still read as rounded, it takes the micro step
instead of a sharp corner, which is why a card or a tile in a card is
`max(var(--radius-micro), ...)`, or the inner padding is reduced.

**Where a ladder starts.** A panel section, a dialog and the rail are 40px. A
field frame, a card, a list and a popup are 24px where nothing holds them.
The rule runs from a holder to the parts in its corners and from a control to
its own parts. A control never changes size because of where it is placed;
only the corner that meets a holder's curve changes.

**The audit.** `apps/storybook/tests/concentric` renders every story in
Rounded, Soft and Square and measures every rounded element whose corner lies
within its nearest rounded ancestor's curve (or the frame it is drawn over, as
a field button is over its input), against the formula, within 1px. A part
there whose corners differ fails outright, since a control is moved out rather
than given one smaller corner, and a control outside every curve passes. It
skips dots, circles, fixed surfaces and text-sized parts that are sharper than
the formula, and it runs in CI, as does the same check over the docs site's
pages.

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

Thirteen values have no name in the document, so the library gives them one:

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
- `--container-page` is 82.5rem (1320px), the page column's width with its
  inline padding: the docs site's content column, whose cap it was before it
  had a name. Its content is 1256px between 32px of padding, inside the
  document's 1200 to 1280px content cap. "PageHeader" derives it.
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
- `--ease-emphasized` is `cubic-bezier(0.2, 0, 0, 1)`, `--duration-expand` is
  300ms and `--duration-collapse` 250ms: the motion of a container that changes
  size in place, the rail first. The document draws a still page and names no
  motion, so these come from Material 3's emphasized curve and its medium
  durations, derived in "The rail's motion". They are in `tokens.js` and
  `tokens.css` and not in the Tailwind theme, since a component reads them by
  name as a transition's curve and duration. A duration is written in
  `tokens.json` as `{ "value": 300, "unit": "ms" }`, and the build writes it as
  `300ms`.

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

A nested radius is a calc on these tokens (Nested radii, derived), so it
holds in every shape. Dots never change: a square radio would read as a
checkbox, so roundness there is meaning.
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

**A pending button that leaves.** React Aria's live announcer says a
focused button's pending start and end by ids in the button, its label's
and its spinner's or its own, and keeps each sentence on the page for
seconds (`dist/private/live-announcer/LiveAnnouncer.mjs`). A button that
unmounts in that time, as a dialog's Save does when its save settles and
closes the dialog, left a sentence naming ids that had gone: it named
nothing, and axe flagged it (`role-img-alt`). So a button that has been
pending, as it unmounts and while its nodes are still in the page, gives
each sentence naming its ids the words those ids hold, as the sentence's
own `aria-label`, and looks once more 100ms later, since React Aria waits
that long before a page's first sentence. The log reads only what is
added, so the words are not said again. A button that was never pending
looks for nothing (settings plan, spec correction 21). It adds 268 B to
`{ Button }` (771 B) and to every part that draws one, which takes
`{ UploadTray }` to 9.07 kB and `{ SaveBar }` to 5.57 kB, so the rule sets
their limits at 10 kB and 6.5 kB.

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
- **A word stays whole, and so does the badge's width in a row.** The first
  rule broke a long label anywhere (`overflow-wrap: anywhere`), so a long run
  of letters could not push a narrow screen sideways. But anywhere also makes
  one letter the badge's min-content width, the floor a flex row shrinks an
  item to, so beside a title that wrapped on a 390px phone, "New" was set as
  "NE" over "W". The badge now breaks with `overflow-wrap: break-word`, which
  leaves the longest word as its min-content width: a flex row stops shrinking
  the badge there, and a holder of its own passes the same floor up, so no
  `shrink-0` is needed at the call site. A label of several words still wraps
  between them when its holder is narrower than the whole label, and a single
  word longer than the badge, which `max-width: 100%` keeps to its holder,
  still breaks inside the outline, so nothing pushes the page sideways.
- **An inline block, not an inline flex.** The label of an inline flex box is
  an anonymous flex item whose floor is its own longest word, so a word longer
  than the box spilled out of the outline instead of breaking. As an inline
  block the label is set in the badge's own lines and break-word reaches it. A
  badge holds a word or a number, so it lost nothing to the flex box.
- **No floor of its own.** `flex-shrink: 0` keeps a label of several words on
  one line, squeezing the title beside it to a letter a line, and only the
  badge given straight to the row, not one in a holder. A `min-inline-size` of
  `min-content` outranks `max-width`, so a long word would push the page
  sideways. The automatic minimum of a flex item is already the longest word,
  capped by `max-width`, so the badge declares neither.
- **The label caps the floor at 16em.** A holder sized by its content, such as
  a grid column of `auto` or `1fr` or a flex item left at its automatic
  minimum, takes the badge's min-content width as its own floor, so with
  break-word alone one long web address widened the docs preview at 320px to
  838px and pushed the page sideways. A percentage max-width counts for
  nothing in that floor (CSS Sizing treats it as `none` there), so only a
  length caps it, and the badge's own `max-width` has to stay 100% to keep it
  inside a narrow holder. So the label is a part of its own, `.badge-label`,
  a block with `max-width: 16em`, about twenty letters at the badge's 12px: a
  word up to that stays whole, a longer run breaks at it, and a holder sized
  by its content never takes more than 16em and the badge's padding from a
  badge, which fits a 320px phone inside a card. A label of several words
  wraps at 16em too, which a label that should be a word or a number never
  reaches. Markup without the label part keeps the word floor but not the cap.
  Where the library itself sets a badge nothing moves: a tab and the docs
  rail's version keep theirs on one line with `nowrap`, FilterBar's count is a
  number, and a DataTable's fixed columns cap the badge at the cell. StatTile,
  the Sidebar, CollapsibleCard and FilterChip draw no badge of their own.

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
  Link and Kbd do), so one such word wraps inside its part and the page
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

**The changed dot** (documents spec, ruling 16; spec corrections 2, 3 and 48
to 51). A field named only by `aria-label` or `aria-labelledby`, as a cell of
a review grid is, has no label row for the chip, and the changed edge alone is
a change of hue, which WCAG 1.4.1 forbids as the only cue. So every framed
field with `isChanged` (TextField, TextArea, NumberField, Select, ComboBox,
MultiSelect, DateRangePicker and DatePicker) writes `data-unlabelled` while it
has no label and, while changed, unlabelled and valid, renders
`span.field-changed-mark`: the chip's 6px dot, holding the word "Changed"
(`changedLabel`) for a screen reader, named in the control's
`aria-describedby` through `useChangedDescription`, so the field reads
"Changed" after its name.

- **Clay, not light signal orange** (spec correction 2). The spec named the
  chip's dot light signal orange; the chip's dot is `currentcolor`, which is
  clay, and light signal orange measures 2.87 on the raised fill in light,
  under the 3:1 a graphic needs. Clay means exactly unsaved and measures 7.04
  and 6.02 on raised and 7.04 and 6.82 on float, gated as text, which is
  stricter. The changed edge stays light signal orange.
- **Its place.** On the frame's first line,
  `calc((var(--size-field) - 0.375rem) / 2)` down, 1.5px less inside a frame
  drawn with `.input`, whose box starts inside the changed edge; a text area's
  on its first line, past its padding, edge and half a line.
  `--field-changed-mark-end` in from the frame's inline end, which each field's
  file sets: a part step before the 36px field button 6px in (ComboBox,
  MultiSelect, DateRangePicker, DatePicker), before the Spinner while options
  load, before a select's chevron, past a number field's steppers and end
  symbol, and 1.5rem, the text's own padding, in a text input and a text area.
  The frame's inline-end padding grows by the dot and a part step while it
  shows (a select's chevron takes the step as its margin), so typed text never
  runs under it. Inside the frame where the frame can hold an element (the
  date frames, the multi-select's, the number field's and the combo box's
  controls); as the field's next child where the control is the frame (the
  text input, the text area) and where the frame is a button (Select), whose
  text would otherwise join its visible name.
- **The hidden word.** The dot clips its own text: `overflow: hidden`,
  `color: transparent`, `white-space: nowrap` and `font-size: 0`, so axe
  measures no text of it, and it takes no pointer. The word is read through
  `aria-describedby`, which reads an element's text whatever its size.
- **It leaves while invalid**, by any cause, as the chip does: it reads
  `FieldErrorContext`, since validation React Aria runs is not something the
  field's props can see, and an element named in `aria-describedby` is read
  even when hidden. The error edge, line and description stand alone.
- **Forced colors.** Out of the repaint, `forced-color-adjust: none`, drawn
  `canvastext`, so the dot keeps a fill and its word stays unseen.
- **Its corners.** The dot is a dot: `--radius-dot`, round in every shape, as
  the chip's own dot is, never a nested surface's concentric radius (spec
  correction 52).

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
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule, no part inside has a fill of its own, and a disabled chosen
option, canvas on `GrayText`, is drawn the same way. The docs check what
Chromium draws.

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
- **It names its fill for a table.** The card sets `--data-table-surface:
  var(--color-lifted)` (accounts plan, spec correction 74), so a DataTable in
  it draws its sticky header row, and a Meter in its rows its cuts, in the
  card's own fill with no wrapper from the app. Anything inside the card that
  paints a fill of its own, as the docs site's canvas stage does, sets it
  again. No baseline moved: the one story with a table in a card set the same
  value by hand, and now does not.
- **The header is a div.** A `<header>` outside sectioning content is the
  page's banner. A card is a div unless it is told otherwise, so every card
  header at page level would add a banner, and axe fails two of them as
  duplicate landmarks. The title is what names a card, so the structure is
  carried by the heading and not by the wrapper.
- **The title's level is not its look.** The app's section title was always an
  `h2`. In a library the card cannot know where it sits in the page's outline,
  so `level` picks the element, `h1` to `h4`, and the type stays the h3 step at
  every level, so the same card looks the same wherever it is placed.
- **A card in a card is concentric with it.** The app never put a card in a
  card. The library does, and Nested radii says what to do: the inner card
  takes the outer card's radius less its edge and padding,
  `max(var(--radius-micro), calc(var(--radius-stadium) - 1px - var(--spacing-card)))`,
  7px in Rounded, 19px compact, the micro step in Soft, where the gap passes
  the outer curve, and 0 in Square. The rule is those two placements and not
  any descendant: a card that sits on a
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

**Actions in a plain card's header.** The first consumer's Details card puts
Edit in its header, with Merge and Remove in a More menu beside it, as GOV.UK's
summary card puts its card-level actions there. `CardActions` is a
`div.card-actions` placed after `CardTitle` and `CardNote`, so the reading
order is the title, the note, then the actions; it adds no role, and the app
names each button ("Edit details"). It is static. Seven things were derived
(accounts plan, spec corrections 8 to 13 and 30 to 33).

- **At most two visible actions.** Polaris, Primer and Atlassian keep a card
  or a page header to one or two visible actions and put the rest in a menu.
  Three buttons did not fit beside a 12rem title in a card under 566px, so
  they wrapped among themselves and parted the note from its title. For three
  or more, show the first and a More menu.
- **A grid, not CollapsibleCard's flex row.** CollapsibleCard wraps its title
  and note in a heading block and lets a flex row wrap the actions under it.
  A plain header holds the title and the note as siblings, and a flex row of
  three siblings cannot put the actions beside the title and the note under
  it, then the actions under the note, without reordering them. So a header
  holding actions is a one-column grid and a size container, `card-header`:
  from 24rem of its content box the actions take a second column at the end,
  spanning the title's row and, when there is one, the note's, so a second
  line of actions never pushes the note down; under it nothing places them
  and they follow the note at the inline start, the reading order. A
  container query cannot style the container it measures, so the header's
  own columns never change: the second column is an implicit one that exists
  only while the actions are in it, so a narrow header keeps no gap for it.
  24rem is the width at which a 12rem title, the peer step and an Edit and a
  More button fit side by side.
- **The title keeps 12rem beside them.** CollapsibleCard's heading never goes
  under 12rem (192px holds a typical title on one line). Here the actions'
  column is capped at `calc(100cqi - 12rem - var(--spacing-peer))`, so two
  buttons that do not fit wrap among themselves at the end, as Edit and
  Remove do in a 450px card, and the note still follows the title by the
  header's 8px gap. A single button wider than what is left takes its own
  width (`min-inline-size: min-content`) and narrows the title rather than
  overlapping it. A button's label wraps inside it (`white-space: normal`),
  so a long one never widens the card.
- **Level with the title's first line.** Beside the title the actions are
  start-aligned and at least a control high, and the title's first line is
  centred on a control's height by a top margin of
  `(var(--size-control) - 1lh) / 2`, 5.6px and 3.6px compact. So the actions
  are level with the title's first line, within a pixel, however many lines
  it takes. No row has a fixed height: a row fixed at 40px let a title that
  wraps to two lines (57.6px) run over the note.
- **The corner, down, and only where the corner is.** Beside the title the
  actions sit at the card's top end: 1 + 32px from the top and the end in
  Rounded comfortable, inside the 40px curve on both axes. The record's rule
  moves a control down where a column stands under it, and the actions end on
  the body's column edge, so inside the 24rem query the actions take a top
  margin of `calc(var(--holder-corner-inset) - var(--holder-pad))` and the
  title the same plus its centring margin: 7px in Rounded and 19px compact, 0
  in Soft and Square, as UploadTray's panel moves its header's trailing
  button. The first control's top is then 1 + 32 + 7 = 40px from the card's
  outer edge in Rounded comfortable and 1 + 20 + 19 = 40px compact, at or past
  the 39px corner inset. Under 24rem the actions follow the note, far from
  the corner, so nothing moves: the title and the note sit where a header
  without actions draws them. Actions with no title or note above them, the
  header's first child, take the same top margin at every width.
- **An intrinsic inline size of 0.** The library's rule for every size
  container: its `contain-intrinsic-inline-size` is 0, and a holder that takes
  the width of its content gives the part a width. A size container takes no
  width from what it holds, and any stand-in it names becomes its holder's
  min-content: 20rem on this header made the card 386px, which scrolled a
  320px page 82px sideways from a `flex: 1` wrapper, and 484px with two cards
  side by side. So a card that holds only a header with actions and sits
  where it takes the width of its content, in a flex row, is given a width by
  the app. DescriptionList, MonthGrid, and from 0.8.0 StatTile and DataTable,
  which named stand-ins of 16rem and 12rem, follow the same rule (spec
  correction 63).
- **Docs examples give a holder its width.** The docs stage centres its
  example (`display: grid; place-items: center`), so an example's root is a
  holder that takes the width of its content, and the rule above applies to
  it. MonthGrid's three examples put the grid straight in a Card with no
  width: the card drew at its padding, 66px wide at 1280px and 42px at
  375px, the grid 0, its title broken letter by letter. The fix is in the
  docs, not in the ruling: each card takes `width: 100%` up to `40rem`, the
  40rem card the MonthGrid record measures, and the stage centres it, as the
  fields' 24rem and Card's 560px examples already did. Measured after: the
  card 640px and the grid 574px at 1280px, 267px and 225px at 375px. A
  stage rule that stretches a root with no width of its own was the other
  way, and was not taken: CSS cannot tell such a root from a button sized by
  its content, and the Code tab would hide the width an app has to write.
  The width in the example's own code is the contract, taught where it is
  read. The audit of every example, the recipes included, found no other:
  StatTile, DataTable, DescriptionList, the card header, Pagination, SaveBar,
  FileDropZone and Sidebar examples were already given a width, and Gauge,
  Sparkline and LineChart are not size containers. The docs e2e
  `previews.spec.ts` guards it on every page with a Preview at 1280px and
  375px: it fails when a size container on a stage is under 8rem and widens
  once the stage stretches its example, or when a word of up to 15 letters
  breaks across lines.
- **CollapsibleCard is not matched.** Every rule names `.card > .card-header`,
  and CollapsibleCard's header sits in `.card-disclosure`, so its header, its
  flex row and its baselines are unchanged (plan open question 2). Its header
  takes no size container for the reason its own record gives: a folded card
  whose header gave no width would shrink to its padding.

Measured in Chromium, WebKit and Firefox by the stories `ActionsWrap` (a long
title on a phone, every shape and density: the title and the note where a card
without actions has them, the actions under the note at the start, nothing
overlapped, one radius on each control, none in a corner curve),
`ActionsClearOfCorner` (a 40rem card, every shape and density: one line level
with the title's first line, on the body's end edge, 40px from the edge in
Rounded by their margins), `ActionsInTheMiddle` (cards 450px to 566px: the
note follows the title by the header's gap), `ActionsAlone` and
`ActionsOnANarrowPhone` (320px: no sideways scroll, a long label wrapped in its
button). Screen readers are not yet verified (owner action 3).

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
where a shadow shows nothing. Parts are concentric with their surface
(Nested radii): a 24px popup holds 15px rows, its radius less its edge and
the list's padding, and a dialog's last action keeps its own corner and sits
above the dialog's corner inset, clear of its curve and still on the fields'
end edge. Soft and Square follow by construction.

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
`--radius-stadium`, and its parts are concentric with it where they meet its
corners: the well is a circle, and the panel's foot pads to its corner inset,
39px in Rounded, so the last action keeps its own corner, sits clear of the
panel's curve and keeps its end on the fields' edge. Soft and Square follow by
construction.

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

**Nothing to reach while it rises.** React Aria moves focus in, and hides
the page with `ariaHideOutside`, only once the enter scroll has ended. A list
or popover opened from the content during the slide portals outside the
sheet, so on entry it was made inert with focus in it, and focus fell to the
page with the list left open. While the overlay's render props say
`isEntering`, the React Sheet sets `inert` on `.sheet-content`, so neither a
Tab from the trigger behind nor a press reaches the content until the sheet
has entered. A press then lands on the sheet itself, inside React Aria's
`[data-sheet-scroll]` scroller, so a swipe still scrolls it. The CSS keeps
`pointer-events: none` on `.sheet-content` while the overlay is
`[data-entering]`, as a backup for markup without the attribute. The
Chromium story `PressWhileEntering` presses where a Select's trigger is
mid-slide, through the browser's hit test, and finds focus in the sheet once
it has entered and the list opening normally at rest. `TabWhileEntering`
opens the sheet with Enter, finds the content inert during the slide, Tabs
twice and finds focus still outside the sheet and no list open, then finds
the attribute gone and focus in the sheet at rest.

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
| Row | `display: flex; align-items: center; gap: 0.75rem; min-height: 40px; padding: 0.5rem 0.75rem; border-radius: var(--menu-item-radius); cursor: pointer` | the touch floor; the app's 12px gap and inline padding; the corner is concentric with the popup, `max(0px, calc(var(--radius-surface) - 1px - var(--spacing-part)))`, 15px in Rounded and 3px in Soft, so a row follows the popup in every shape (a pill would not) |
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
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule; a chosen row's ring is `HighlightText`. The docs check what
Chromium draws.

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

**Room for a save bar.** `--toast-offset-block` is read with a fallback of 0,
so a later save bar can lift the stack by its own height. The bottom tab bar
declares it below 1024px, on the root while a bar is on the page, so a toast
rises above the bar instead of covering it.

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
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule; the active row's ring is `HighlightText`. The docs check what
Chromium draws.

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
`--size-control`. Comfortable draws exactly as 0.1.0 did at the default 16px
root font size. The segmented heights were rem and are now the px size tokens,
as the button's 40px always was, so under a larger root font they no longer
grow with the text; a page that raises the root size sees shorter segmented
tracks than 0.1.0 drew.

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

**Who owns the state.** `AppShell` holds the collapsed state and the drawer
state, controlled or uncontrolled. The workspace's offset depends on the first
and the header's menu button on the second, and both live outside the rail, so
neither can be the rail's alone. `useAppShell()` hands both to the parts and to
an app's own header or palette, and throws outside a shell.

**One rule for the first paint.** The collapsed width is CSS on
`data-sidebar="collapsed"` on any ancestor of the rail. The root carries the
attribute while collapsed, from a prop a server layout reads from its cookie,
and a pre-paint script can set the same attribute on `<html>`: one rule serves
both. The root never writes `expanded`, so it never resets an attribute set
higher up. Nothing is measured, and `matchMedia` and `popstate` are effects.

**The frame.** In DOM order: the skip link, the rail as given, the workspace
holding `<main>`, the tab bar as given, and the `floating` slot as given.
The header wrapper is `<main>`'s first child (documents plan, spec
correction 93, the owner's decision): the page's title and actions belong
to the page, so the skip link lands on the title, and a `header` there is
not a banner landmark. The wrapper is sticky at `--z-header` and draws
nothing; the look is the header's. `<main>` has `tabIndex={-1}` so it takes
the focus the skip link sends, and no outline, so the landing never rings
the whole page.

**The header's height.** Once hydrated, the shell measures its header
wrapper and writes the height as `--page-sticky-top` on `<main>`, under
which the page's sticky parts stick. Nothing is measured for the first
paint; an estimate on the shell's own `style` holds until the measurement,
and `measuresHeader={false}` leaves the offset to the app (spec correction
94). Nothing is written on the root element and the root's scroll is never
padded (spec correction 121, replacing correction 95's
`--app-shell-header-block-size`): a browser applies root scroll padding to
every focus scroll, and Shift+Tab onto the stuck header's own button
scrolled the page up by 340px, while a shell in a docs example, as the
page's outermost, added its header to the docs' 150px heading offsets.

**Focus clear of the header** (WCAG 2.4.11, spec correction 121). The
header wrapper registers itself as top chrome with the shared focus clear,
`utils/focus-clear.ts`, while the shell has a header, whether or not it
measures. Two frames after a focus, a control wholly or partly under the
stuck header is scrolled down by the least that brings its top to the
header's bottom, with no gap, the edge DataTable's rows and a SidePanel
stick at; a control in the header itself is pinned there, so focus on it
never moves the page. `FocusClearOfHeader` and `FocusInStuckHeader` pin
both in three engines. `{ AppShell }` measures 2.07 kB with the shared
focus clear, over its 1.5 kB limit, so the rule rounds up to 2.5 kB and
adds 0.5 kB: 3 kB.

**The skip link** is the first tab stop, clipped out of sight until it is
focused. Focused, it is an ink pill with canvas text in the `--text-action`
step, 40px tall, `--spacing-inset` from the corner, over the rail's corner at
`--z-chrome` plus one, with the inverted canvas ring at -4px an ink fill takes.

**Two properties of the shell's own.** `--app-shell-sidebar` is the workspace's
inline offset: the rail's token with a rail from 1024px up, else 0. The token
itself is never overridden by a media query; the shell's property is.
`--app-shell-inset-block-end` is the workspace's bottom padding: the tab bar's
4rem plus the safe area below 1024px with a tab bar, else 0. A future save bar
adds to it rather than declaring its own. 1024px is `--breakpoint-md` written
out, and 4rem is written in the tab bar's stylesheet too; a test keeps both
equal.

**The floating slot.** `floating` holds chrome that outlives every page, the
upload tray first. It renders after the workspace and the tab bar, outside
`<main>`, with no wrapper of its own, so a fixed part in it reads the shell's
`--app-shell-inset-block-end` and `--app-shell-sidebar` and takes the shell's
theme, shape and density; it is never a landmark inside main, and a client
navigation, which keeps the root layout, keeps it. A part that may be mounted
with or without a shell reads the shell's state through an internal
`useOptionalAppShell()`, which returns null outside one; `useAppShell()` still
throws there.

**When the drawer closes.** As the window widens to 1024px, where the rail is
no longer a drawer, and on Back and Forward. Escape, the scrim and a press on
an item are the Sidebar's. The shell cannot see the router, so anything else
that navigates calls `closeDrawer()` from `useAppShell()`; it is a no-op while
the drawer is closed.

**One controlled-or-uncontrolled hook.** The two states come from a private
`useControllableState`, in React Aria's shape (`isX`, `defaultX`, `onXChange`).
It is hand-written because the library does not depend on `react-stately`. Its
setter tells the callback only when the value would change, and never moves a
controlled value: the owner decides in the callback.

## Sidebar

The source app's rail and the docs site's rail become `Sidebar` and its parts.
What both did, the library keeps: a float rail 16px clear of the viewport on
three sides, with the hairline, the stadium corner and the level 1 lift; the
collapse to a 72px column of 40px icons, remembered by whoever owns the state;
labels hidden from view and never removed, so no name depends on the state;
the names as tooltips while collapsed, the search's shortcut on its tip; a
collapse button drawn small and hit at 40px whose name flips; group labels
with a dot that lights light signal orange, and turns the label ink, while the
group holds the current page; the current item as an ink pill with canvas text
and `aria-current="page"`; a drawer below 1024px that ignores collapse; the
current item revealed on load through `scrollTop` with a 40px margin; long
labels that wrap; and reduced motion stopping the width change and the slide.

**Where it departs from the docs rail.** The document decides where the two
disagree. Items are 8px apart, the document's "one nav item to the next", not
2px. Items are 16px, the `--text-action` step, not 15px. Group labels are 14px,
the `--text-overline` step for an uppercase column header and the document's
minimum for words, not 12px. The hover is the 5% ink wash, the document's hover
on a float surface; the docs used the canvas fill, which measures the same
strength. Labels wrap where the docs cut them with an ellipsis. The collapse
button sits on the rail's edge, and no corner animates.

**The rail's own constants.** Four custom properties on `.sidebar`, each with
its reason. The gutter, `--sidebar-gutter`, is 12px, half the peer step, the
one inset the docs rail and the source both use for every gap inside the rail:
the nav's padding, the search pill's margin, the gap from icon to label and
the group label's inset; the head and the foot sit at two gutters, 24px, the
peer step. The icon, `--sidebar-icon`, is 20px. The pill inset,
`--sidebar-pill-inset`, is 10px, `(--size-target - icon) / 2`, which centers a
20px icon in a 40px pill, so a group label's first letter, an expanded item's
icon and a collapsed item's icon share one axis. The row,
`--sidebar-row`, is `max(--size-target, --size-control)`: 40px in comfortable
and in compact, 44px in compact on a touch screen. A navigation item is a
reading target and never shrinks below the 40px floor.

**Items.** `--text-action` with a 1.25 line height, so a 20px first line sits
beside the 20px icon and a wrapped label grows the row with the icon beside its
first line. The count is plain text at the row's end in slate, `--text-small`
at 700 with tabular figures, and canvas on the current item: an outline inside
a pill would be a pill in a pill. Collapsed, the count is an 8px dot on the
icon's top-end corner, ink, and canvas on the current item, its number clipped
inside it and still in the name.

**The group dot** is 6px of ink at 25% over float, a navigation cue beside a
label that carries the words, recorded and not gated. The current group's dot
is light signal orange, the attention cue.

**The collapse button** is drawn at 32px on the float fill with the frame
edge and the level 1 lift, and hit at 40px through a pseudo-element. It
straddles the rail's end edge 24px from the top; its inset is measured from the
rail's padding box, so its middle sits on the inner side of the 1px border. The
chevron turns 180 degrees when collapsed and is mirrored under `[dir='rtl']`
after the turn, so it points at the rail in both states and both directions.
The spec's `z-index: 1` on it is dropped: the rail's own `--z-chrome` makes the
stacking context it paints in, and nothing earlier in the rail overlaps it.

**Measured pairs.** Ink on float 18.43 in light and 17.42 in dark (the items,
the brand); slate on float 5.49 and 6.94 (the counts, the group labels, the
search label); canvas on ink 16.25 and 19.31 (the current item). All three are
gated already as text and cited by the contrast test, not added. The spec gave
slate on float in dark as 6.44, which is slate on bone; the gate measures 6.94,
as the dialog's description records. Recorded as cues and not gated: the 25%
ink dot on float, 1.74 and 2.27; light signal orange on float, 2.87 and 6.07;
the 5% ink wash on float, 1.11 and 1.14; the collapse button's frame edge on
float, 1.29 and 1.43, which its lift and its chevron show.

**The focus ring stays outset** on every item, the current one included: an
ink ring outside an ink pill reads against the float surface, and nothing in a
static group clips it, with 12px of nav padding (15px collapsed) against a 4px
ring. The inset ring arrives with foldable groups, whose fold clips, inverted
to canvas on the current item as the segmented control's is.

**The 3px travel.** Collapsed, the nav pads 15px instead of 12px so a 40px item
centers in the 70px inside the 72px rail's 1px border, and the icon moves 3px
inward as the rail narrows, on the rail's own curve; under reduced motion it is
an instant step.

**Concentric corners** (patch 0.6.2). A rounded part inside the rail takes
the rail's corner less the gap between them, never its own token copied: the
gap is the rail's 1px edge plus the part's inset, the smaller side where the
insets differ, and the part is never rounder than its own shape and square at
0 or less. `.sidebar` holds the rail's corner less its edge,
`--sidebar-corner`, and the two insets, `--sidebar-nav-inset` (12px, 15px
collapsed) and `--sidebar-search-inset` (12px, and collapsed the inset that
centers the 40px pill); the nav pads by the first and the search pill sits in
by the second, so the corner follows the inset in both states. A nav item and
the search pill draw `min(pill, max(0px, corner - inset))`: 27px in Rounded,
so a 40px row still draws as a pill, 3px in Soft, and 0 collapsed, where the 15px inset meets the rail's 15px corner
less its edge, and 0 in Square. One level further in, the search's key chip takes
the search pill's corner less its 1px edge and its padding, at most
`--radius-micro`. The drawer copy sits in the Drawer's panel, which has the
same stadium corner and 1px edge, so the same formula holds there. Shapes that
keep theirs: the rail itself, the collapse button, which stands outside the
rail's edge, the count and group dots, and an avatar the app puts in the
footer. The brand row and the footer draw no surface of their own. The
CollapseMotion story checks every part against the rule in Rounded, Soft and
Square, expanded and collapsed, and the docs test does the same for the docs
rail, whose links, search, key chip and version badge follow the same rule
from `--rail-corner`, `--rail-nav-inset` and `--rail-search-inset`.

**The rail's motion** (patch 0.6.2). Recorded frame by frame in Chromium at
1280px, the old collapse and expand were what a reader called flashy, for five
reasons. Collapsing, every label vanished in the first frame and every icon,
the brand mark, the search and the group dots jumped to the middle of the rail,
still 288px wide, 111px to the right, then slid back left with the edge.
Expanding, the labels came back at full opacity in the first frame into a 72px
rail, so "Transactions" wrapped a letter to a line, its row grew from 40px to
260px, the brand, the search label and the account name stood in vertical
columns and the nav scrolled sideways for three frames. A group label lost its
text line when collapsed, 22px to 14px, so every link below it jumped 8px a
group in the first frame both ways. The workspace's margin, the rail's width
and the chevron each ran 200ms of `ease`, a curve with no character. And the
docs rail did the same, with its group names wrapping and its labels' ellipsis
changing every frame.

What polished rails do, and what the library now does. Material 3 moves a
container that changes size in place on its emphasized curve,
`cubic-bezier(0.2, 0, 0, 1)`, over its medium durations, 250ms to 400ms, with
what arrives a little slower than what leaves. Linear, Notion and the new
GitHub navigation let the content beside the rail keep step with its edge.
Apple's sidebars and VS Code's never re-center an icon as the pane changes
width. So:

- One curve for every property that moves, `--ease-emphasized`, and the
  duration of the state the rail moves to: `--duration-expand`, 300ms,
  opening, and `--duration-collapse`, 250ms, closing. A transition reads the
  new state's values, so `.sidebar` sets `--sidebar-duration` to the first and
  the collapsed rule to the second, and every part reads it: the rail's width,
  the chevron's turn, the head's, the search pill's, the nav's and the group
  label's insets, the group dot's margin and the labels' fades. The workspace's
  margin takes the same pair, so the 16px between the rail and the page holds
  through the motion.
- Nothing re-centers. A collapsed item fills the nav, so its pill narrows with
  the rail and its icon stays at the start, settling 3px inward with the nav's
  padding; the brand mark settles 1px through the head's padding, the search
  icon 2px through the pill's margin and padding, and the group dot slides onto
  the rail's axis through the label's padding. The count's dot is placed from
  the icon's start, not the item's middle. The footer centers the app's
  collapsed content in the collapsed rail's inside width from the first frame,
  at the start, so it rests while the rail closes around it.
- One vertical rhythm for both states: collapsing changes the rail's width and
  nothing else, as in Linear, Notion, VS Code, GitHub's navigation and Material
  3's navigation rail. The head keeps its row, the search keeps the expanded
  field's 40px row and place, collapsed a 40px pill around its icon on that
  row, a group heading keeps its row with its dot on it, and every link and the
  footer keep their top; the stories and the docs test hold every icon's top
  within 0.5px in both states and in every frame between.
- The labels stay in the flow, one line high, and are hidden by opacity, so no
  name changes: they fade out over the first 40% of the closing while the edge
  carries them off, and fade in from a quarter of the opening over half of it,
  once the edge has mostly passed. A group keeps its row, so the list never
  moves up or down, and the collapsed list is 8px taller per group than it was.
- No text wraps on the way. The rail copy is a size container, and below its
  expanded width, which it is only while moving and while collapsed, the head,
  the search, the nav and the footer do not wrap and each label is cut at its
  own box. The width is the token's 20rem less the two 16px insets and the two
  1px edges, since a container query measures inside the border; a test keeps
  it equal. A long label wraps again in the frame the rail reaches its width.
  The list is one `minmax(0, 1fr)` column, so an unwrapped label never holds an
  item wider than the nav.
- The page beside the rail reflows as the margin moves, as Notion's and
  Linear's do, rather than sliding a settled layout: a slide either opens a gap
  at the page's far edge or pushes the page past the viewport for the length of
  the motion. A DataTable crossing its 48rem or 40rem threshold changes once per
  motion and never back; at 1100px the category column comes in 32ms into the
  closing and leaves 176ms into the opening.
- Reduced motion sets `--sidebar-duration` to 0s, so every part, the fades
  included, steps in one frame, and the rail and the chevron keep
  `transition: none`. The fold for an open SidePanel still moves the rail and
  every part at once, by one rule that names them all, from the script's
  `data-sidebar-folded` and from the server's HTML.

The docs rail follows the same rules with the same tokens, on its own
`--rail-duration`, and the site's reduced-motion rule stops it as before. Its
links never wrapped, so it needs no size container: from 1024px up its group
names do not wrap either and its labels clip with no ellipsis, at rest too,
since every name fits the expanded rail. Its version badge and its key chip
keep their one line and their size, faded and cut by the edge: free to shrink,
the badge wrapped a letter to a line in the 72px rail and pushed every icon
below it 81px down. A
container query there, matched by the drawer's elements with no container
around them on a phone, left a tab row on the page at its start in Chromium
after the row had scrolled to its selected tab, so the docs rail has none.

**Two copies of the rail.** The rail renders at every width, and below 1024px
it is `display: none`, out of the tab order and the accessibility tree. While
the drawer is open a second copy of the same slots and children renders inside
it, under a context that says it is not collapsed and is in the drawer, so it
ignores `data-sidebar="collapsed"` wherever that is set, on `<html>` included;
every collapsed rule is scoped `:not(.sidebar-drawer)`. Every id the library
writes comes from `useId`, so the copies never share one, and only the class
reaches the drawer copy: an `id` or another attribute an app sets on `Sidebar`
stays on the rail. An app's own slot contents render twice too, so their ids
come from `useId`, which the sidebar page says.

**The Drawer adaptation.** The Sidebar renders the shipped `Drawer` with the
title hidden and no close button of its own, so the Drawer draws no header at
all: the hidden title names the dialog "Menu" and sits out of the flow. The
close button is the drawer copy's, at the end of its head. The panel takes the
class `sidebar-drawer-panel`, and `sidebar.css` restyles only `.drawer-body`
under it, the part the drawer page lets a class on the panel restyle, into a
column with no padding that the rail copy fills, and names no other part of the
Drawer. The Drawer keeps its 320px width, its dramatic shadow and its slide,
and gives focus back to the menu button in the next animation frame. The
drawer copy's current item carries `autoFocus`, which React Aria applies after
the Drawer has recorded the trigger as the origin of its theme scope. A press
on any item in the drawer, the page already open included, closes it, and so
does a press on the brand, which also navigates.

**The count and the name.** The name of a counted item is "Transactions, 12 to
review": the number is drawn and the words are visually hidden, so the row
shows "12" and the name says what it counts. A browser's name joins a link's
parts as the page lays them out, and puts a space at the edge of every flex
item and every hidden box, while jsdom trims each element's text. A hidden
comma before the count, as the spec first drew it, read "Transactions , 12 to
review" in Chromium and "Transactions,12to review" in jsdom. So the comma ends
the label, inline and drawn at `font-size: 0` by `.sidebar-comma`, and plain
spaces sit between the label, the number and the hidden words: the name is the
same in Chromium, in Playwright and in jsdom. Those are the engines it is
verified in; Firefox and WebKit name computation is not yet checked. The search pill names itself the
same way, "Search or jump to, Mod K", with its key chip as part of its text,
so the visible words are in the name as the docs' label check asks.

**The shortcut.** The search's chip is the shared `Shortcut`, with the
classes `kbd sidebar-search-shortcut`: `Mod` is "Mod" in the server's HTML and
becomes the platform's modifier after the page hydrates, and the collapsed
tooltip passes the same string. Collapsed, the chip is clipped with the labels,
not removed with `display: none`, so the search keeps its whole name, "Search
or jump to, Ctrl K" or the Command symbol and K, in both states; a docs test
checks it in the browser, since jsdom applies no stylesheet.

**The size.** The Sidebar's size limit is 4.5 kB, above the spec's 3 kB
budget, because the entry bundles the Drawer and the Tooltip with the rail's
own parts; it measured 3.57 kB.

**The tooltips** are the shipped `Tooltip` and `TooltipTrigger`, as built:
the brand, the search, every item and the collapse button sit in a trigger
whose `isDisabled` is true unless the rail copy is collapsed, so no tip exists
while expanded or in the drawer, and each tip takes `placement="end"`. The tip
copies its theme, shape and density from its trigger, so a tip from a compact
rail is compact. React Aria passes no `aria-hidden` to a tip, so it is the
trigger's description while open and a screen reader may hear the name twice,
which the overlays record accepts.

**The reveal.** On mount each copy finds its `[aria-current="page"]` item and,
when the nav has a height and the item's bottom is below the nav's visible
bottom, sets `scrollTop` to the item's `offsetTop` less 40px. `.sidebar-nav` is
`position: relative`, so `offsetTop` is measured from the nav. `scrollTop` and
never `scrollIntoView`, which scrolls every ancestor; once per mount, since
after that the reader chose the item.

**Forced colors.** The current item is `Highlight` with `HighlightText`,
drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium draws
a backplate in the system's background color behind each run of text,
which blanked the label. Its ring stands outside the pill, on the rail, so
it is named `Highlight`. The group's current bar is `Highlight`, and the
collapsed count dot `CanvasText`, `HighlightText` on the current item.

**The collapse button before hydration** (patch 0.6.1). From 1024px to
under 1440px the stylesheet draws the rail folded beside an open SidePanel
from the server's HTML on, and the server cannot see the width, so its
button cannot know whether it collapses or expands the rail. Unless the
reader's collapse is known on the server, the button holds both names,
`span.sidebar-collapse-name` with `data-name="collapse"` and
`data-name="expand"`, and the stylesheet keeps the one for the rail as
drawn in the tree and the other `display: none`, with the collapsed rules
and the fold's copy of them; it claims no `aria-expanded` until the script
knows the state, since a state it cannot know would be wrong at some
width. Once hydrated the button takes one name and its state. A collapse
the reader chose is known on the server, which says "Expand the menu" and
`aria-expanded="false"`.

## BottomTabBar

The phone's destinations become `BottomTabBar` and `BottomTabBarItem`: three
to five tabs, each an icon over a one-line label with an optional count, the
page shown as an ink pill with canvas text and `aria-current="page"`, and the
rest of the app behind a More button that opens a sheet. A named nav of plain
links in tab order, with no tab roles.

**Docked, not floating.** The document's own nav is a floating pill, and the
bar departs from it on purpose. The safe area lives at the device's edge, and
a bar docked flush with that edge pads it inside itself, where a floating bar
would sit above it with a gap of page showing beneath. Floating also costs
about 8px of label room per tab, the inset on each side shared out, and that
decides whether "Transactions" fits four tabs at 375px: docked it has 83.8px
for its 77.3, floating it would have missed by 1.5px. So the bar is the float
fill with a hairline top edge, no radius and no shadow: the shadow tokens cast
downward and show nothing at a bottom edge, and the float fill on canvas
separates by tone in light and the hairline in dark.

**The 56px item and the 64px bar.** An item is 56px tall, over the consumer's
44px target and the 40px floor: the 20px icon, a 4px gap and a 20px label
line, with 6px above and below. The bar is 64px, `--tab-bar-height`: 4px of
padding above and below the items, the 1px hairline counted in the 4px above,
since a border on a bar whose height is a promise would add a pixel the page
does not reserve. `app-shell.css` reserves the same 4rem plus the safe area
under the page, and a test keeps the two equal. The two inline paddings are
`max(0.25rem, env(safe-area-inset-left, 0px))` and its right twin, physical
because the insets are.

**The label** takes the `--text-small` step's size and line height with the
action weight, 500. At 450, the body weight, 14px on a white bar reads light,
and a destination's name is an action. Inside the pill the item pads 4px each
side. It is one line with an ellipsis as a last resort, the one label in the
library that is cut rather than wrapped, because a tab has one line of room
and its accessible name always holds the whole label.

**The chip.** A count is a solid disc at the icon's top-end corner, because a
number cannot sit beside a stacked label: ink with canvas numerals, 18px tall
with 12px numerals at 700, the Badge's and Kbd's size, tabular. A 2px float
border cuts it from the icon, a border rather than a box-shadow, which the
token rule forbids. It is a chip and takes the pill radius, so it follows the
shape; a dot is only the collapsed rail's 8px mark. On the current item it
inverts to canvas with ink numerals and an ink border, so it reads inside the
ink pill.

**The count and the name.** The chip sits in the icon's box, which is hidden
from assistive technology, so it is decoration; the name's count comes from
visually hidden words after the label, and the number is in the DOM twice,
once drawn and once read. A browser joins a link's parts as the page lays them
out and puts a space at the edge of every flex item and every hidden box: a
hidden ", 12 to review" after the label, as the spec drew it, reads
"Transactions , 12 to review" in Chromium. So, as on the rail, the comma ends
the label, inline and drawn at `font-size: 0` by `.tab-bar-comma`, and a plain
space comes before the hidden "12 to review": the name is "Transactions, 12 to
review" in Chromium, in Playwright and in jsdom.

**Capacity, measured.** Sofia Sans at 14px and weight 500, in headless
Chromium: "Transactions" 77.3px, "Documents" 70.4, "Accounts" 57.5, "Settings"
50.9, "Insights" 48.4, "Home" 35.9, "Goals" 33.5, "More" 30.6. A label's room
is `(width - 8) / n - 8`, the bar's 4px each side and the item's 4px each
side: 70, 83.8 and 87.5px for four tabs at 320, 375 and 390px, and 54, 65 and
68px for five. So four tabs hold "Transactions" from 350px and never at 320px,
where it ellipsizes, and five hold labels up to about 60px at 375px. The
spec's item rule wrote 8px inside each side, which leaves 75.8px at 375px and
cuts "Transactions"; its own sums count 4px, which the item takes.

**Measured pairs.** Slate on float 5.49 in light and 6.94 in dark, the resting
label and icon, over 4.5 for text and 3 for an icon; the spec's 6.44 is slate
on bone, as the sidebar's record says. The current item and the chip on it
and off it are canvas on ink and ink on canvas, 16.25 and 19.31. All three are gated
already as text and cited by the contrast test, not added. The hover's 5% ink
wash on float is a cue, 1.11 and 1.14, and not gated.

**States.** Hover is the wash and ink text inside `@media (hover: hover)`,
never on the current item; a press shows the same look, because touch has no
hover. The current rule comes after both. A button item with `isCurrent`
carries `data-current-action`, since React Aria's `data-current` belongs to
links, and never `aria-current`: a button is not the page shown. The focus
ring is the token ring outside the item, and on the current item it inverts to
canvas and goes inside, the segmented control's rule, because an ink ring on
an ink pill is 1:1.

**A dialog trigger.** In a `SheetTrigger` or a `DialogTrigger`, a button item
takes `aria-expanded` from React Aria and opens the overlay. React Aria 1.22
adds `aria-haspopup` for menus and listboxes alone, since screen readers
announce any value as a menu, so the item carries none unless the app passes
it.

**Forced colors.** The current item is `Highlight` with `HighlightText` and
its inset ring `HighlightText`; the chip is `CanvasText` on a `canvas` border
with `canvas` numerals, and on the current item `HighlightText` with
`Highlight` numerals and border. Fills alone would be dropped by the repaint.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule. The docs check what Chromium draws.

**Wide screens.** From 1024px up the bar is `display: none`, with no script,
so it leaves the accessibility tree too, and a rail's nav and the bar's are
never both in it. The width is `--breakpoint-md` written out, tied to the
token by a test. The shell's reserve is one property,
`--app-shell-inset-block-end`, which a save bar will add to rather than
declare its own.

**Three to five.** The bar warns once per mount, in an effect, through
`console.warn`, when it holds fewer than three or more than five items, and
still renders them. A ref keeps Strict Mode's second effect quiet, and a
server never runs effects, so it never warns there. There is no
development-only gate, because `process.env` is not typed in the package.
It counts what the bar draws, not `Children.count`: a fragment's items count
one by one, and a slot that renders nothing, such as `{isAdmin && <Item />}`
while false, counts as none, so four items passed in one fragment never warn.

**Disabled.** A button item with `isDisabled` is taupe, the color of disabled
text, with the default cursor and no hover or press wash.

**Not in this release.** When the Android soft keyboard opens, the layout
viewport shrinks and a fixed bar rides up above the keyboard. Recorded for a
later minor.

## Avatar

A person, a merchant or a bank: `Avatar`, an image over its initials, at
three sizes and two shapes, with one neutral fallback for everyone and a
decorative form for an avatar beside its name. The document has no avatar,
so this one is derived.

**Sizes.** `sm`, `md` and `lg` are 24, 32 and 40px boxes, set by
`--avatar-size`. The initials are 12px at 700 in `sm`, the floor for short
uppercase text and the weight the floor asks for, and 14 and 16px at 500 in
`md` and `lg`, the action weight, since two letters at 450 read light on
bone. No 600.

**Shapes.** `circle` takes `--radius-pill` and `square` takes
`--radius-micro`, the nested-radius step for a small mark, so a logo reads
as a tile and not a person. Both follow the shape axis. In Rounded the circle
is a circle and the square has 6px corners; in Soft the pill is 12px, a
circle at 24px and a rounded square at 32 and 40px, and the square keeps its
6px; in Square both are square.

**One neutral fallback.** Every avatar without an image is bone with ink
initials. A color per name would need a categorical palette, which belongs
to phase 6, and a color that identifies a person carries a meaning the name
already carries. Ink on bone is 16.76 in light and 15.36 in dark, gated
already as text and cited by the contrast test, not added.

**The ring.** A 1px `--color-frame` edge over the image, so a white logo on a
white card keeps its edge. It is a `::after` border, after the image in paint
order, with `border-radius: inherit` and no pointer events, because the
token rule allows a `box-shadow` only as `none` or a `var()`, so an inset
shadow cannot draw it. It is a cue, not a boundary: the frame over lifted
measures 1.28 in light and 1.43 in dark, recorded and not gated.

**The image and its state.** The initials are always in the DOM, hidden from
assistive technology, and the image comes after them, absolutely placed over
the whole box with `object-fit: cover` and an empty `alt`, so the layout
never moves. It is `opacity: 0` until it is known to have loaded, when it
carries `data-loaded`; an image that fails is removed and the initials it
covered stay, so a broken image never shows its icon. The state is keyed to
`src`, so a new address starts again at loading and never shows the last
image's verdict. The spec drew the image over the initials on the server and
also kept it invisible until `onLoad`; both cannot hold before any script
runs, so before hydration the initials show. An image that loaded or failed
before React listened fires no event React hears, so a ref callback reads
`complete` and `naturalWidth` as the image mounts, and the update returns
the same state when nothing changed, so a ref callback that runs again never
renders again. That one piece of state makes Avatar a client component.

**Initials.** `initials` when given and not blank, since an empty or
all-space `initials` would draw an empty circle; otherwise the first
character of each of the first two words of `name`, split on whitespace after trimming, taken
with `Array.from` so a character outside the basic plane counts as one, and
uppercased with `toUpperCase()`, which is not locale-aware, is enough for
initials and needs no `Intl`. "Ada Lovelace" is AL, "Northwind" is N, "Mary
Ann Evans" is MA and "علی رضایی" is عر. A code point is not always one visible
character: a decomposed accent, an emoji joined with zero-width joiners or a
Devanagari cluster is cut part way, so an app with such names, or any stricter
rule, passes `initials`.

**An image that settled before hydration.** Its state is read as it mounts,
since it fires no event React hears. A natural width above 0 means it loaded.
A width of 0 is not a failure on its own: the standard gives an SVG with only a
`viewBox` no natural width, and most merchant and bank logos are such SVGs, so
the image is decoded and its decode decides. A verdict for an address the image
no longer shows is dropped, and a new address forgets the last verdict, so an
address that failed once is tried again when it comes back.

**The name.** It comes from `name` alone: an `aria-label` a caller passes is
replaced, and a decorative avatar drops any role or name it was given. A blank
`name` hides the avatar as if decorative, since an image with no name fails
WCAG 1.1.1.

**Names.** The root is `role="img"` named by `name`; with `isDecorative` it is
`aria-hidden` with neither, for a name already in the text beside it.

**Forced colors.** The fill is a background, which the repaint drops, so the
initials take `CanvasText` on `canvas` and the ring `CanvasText`. An image is
shown as it is.

**Import order.** `avatar.css` is imported after `tab-bar.css`, the first of
the home files, and a test keeps the stat tile, the meter and the charts after
it in that order once they exist. The tooltip's test, which allowed only the
shell files after the last overlay file, now allows the home files too.

**The size.** The size limit is 1.5 kB: the entry measured 616 B, and the
rule rounds up to 1 kB and adds 0.5 kB.

## StatTile

One headline figure: `StatTile`, an overline label, the value, a change line,
a caption and a small trend, on the Card's surface. The document's token
table names the overline step for "Uppercase column headers in tables and
stat tiles", and has no tile of its own, so this one is derived.

**A width from its holder** (0.8.0, spec correction 63; it was a stand-in
of its own from patch 0.6.1). The tile is a size container, so it takes no
width from its content. 0.6.1 named `contain-intrinsic-inline-size:
calc(16rem - 2 * var(--spacing-card) - 2px)`, a whole tile of 16rem, so a
tile in a flex row or an `auto` grid column was not its padding wide. A
stand-in width is also the tile's min-content width, which a `flex: 1`
item or a `1fr` track keeps as its narrowest: two tiles two up in their
own wrappers made a 288px column 512px wide and scrolled a 320px page
200px sideways. So the tile follows the library's rule for every size
container (CardActions, "An intrinsic inline size of 0"): its intrinsic
inline size is 0. A block, a `flex: 1` item or a `1fr` track gives it its
width, as before. Placed straight in a flex row, a tile was 16rem from
0.6.1's stand-in, and with an intrinsic width of 0 it would be its padding
wide, 66px, which undid that fix; so the tile takes `flex: 0 1 16rem`
(spec correction 69): in a flex row it is a whole 16rem tile and shrinks
from there in a narrower row, and its min-content stays 0, so nothing is
pushed sideways. The basis does nothing in a block or a grid, where tiles in
a row still stretch to one height. In a flex column the basis is a height,
so a tile there takes `flex: none` from the app, which the docs and the
changeset say; an `auto` grid column gives it no width, so the app gives it
one. A figure is never
broken, so a figure wider than its tile runs past it; two up at 320px a
tile holds about 74px of content, a figure of three or four characters.
The `InAFlexRow` story puts three tiles straight in a wrapping flex row and
checks each is exactly 16rem; `OnANarrowPhone` (three engines)
puts tiles in a `flex: 1` wrapper, a `1fr` grid and two up at 320px in
every shape and density and finds no sideways scroll and each tile filling
its holder, where the stand-in scrolled 200px. Measured at CI's tolerance
on a local build before and after, no existing baseline moves: every
StatTile story gives its tile a width.

**Surface.** The Card's: Lifted, the 1px hairline, `--radius-stadium` and
`--spacing-card`, so a tile follows density with no token of its own: 32px
of padding, 20px in compact. A tile directly in a `.card`, or anywhere in a
`.card-body`, is concentric with the card, its radius less the card's edge
and padding with the micro step as a floor, and takes the frame edge, by the
Card's own rule for a card in a card.

**Label.** `--text-overline` (14px, 700, uppercase, tracked), slate. With
`level` it is an `h2`, `h3` or `h4` in the page's outline and looks the same;
without it, a `p`.

**Value.** `copy-numeral-sm`: 32px at 500, tabular, `nowrap`, left to right
and isolated, so "+$1,980.00" reads left to right in a right-to-left page.
The document prefers proportional figures for a figure that stands alone;
the numeral record chose tabular for every numeral, so tiles in a row align,
and the tile keeps that. Ink.

**Rhythm.** 8px (`--spacing-part`) from the label to the value and from the
value to the change line, and 4px from the change line to the caption, so
the caption reads as the change's footnote.

**The change line.** `--text-small`, slate for `neutral`, `--color-gain` for
`gain` and `--color-warning` for `warning`, the arrow in the same color. The
tone is the app's choice and never follows the direction (ruling 4): "Down
12%" is good for spending and bad for income, so a red down or a green up
would be wrong half the time, and error and success already mean a failed
and a finished action. `gain` is only for money that arrived and `warning`
only for a state that needs a look; signal orange and clay appear nowhere.
The sentence carries the meaning and the arrow repeats it, so the state is
never color alone.

**The arrows.** Inline SVG with Lucide's geometry, 24 by 24, stroke 2, round
caps and joins, `currentColor`, drawn at 16px: up `M12 19V5` and `m5 12 7-7
7 7`, down `M12 5v14` and `m19 12-7 7-7-7`, flat a dash, `M5 12h14`.
lucide-react's `Icon` is a client module, so a Lucide arrow would make the
unlinked tile a client tree; the glyphs are drawn in the static module
instead. The arrow is `aria-hidden`, sits level with the first line of a
sentence that wraps, and is never mirrored in right to left: up and down
have no reading direction, and the dash is symmetric.

**The trend.** The slot is at the inline end of the value's row, 96 by 32 at
most, 24px (`--spacing-peer`) from the value, and comes after the value in
the DOM, so a trend that names itself is read after the figure. The tile is
a size container (`container: stat-tile / inline-size`), and under 18rem of
content the body is one column with the trend after the caption, at the
inline start. A container query measures the content box, so 18rem is a
354px tile in comfortable and 330px in compact; 288px holds a `numeral-sm`
figure such as "$12,345.67" (167px tabular at 32px), the 24px gap and the
96px trend. A query on the tile, never on the viewport, so a tile in a narrow
column moves too. The consequence: a size container takes no width from its
content, so a tile takes its width from its column. Lay tiles in a grid such
as `repeat(auto-fit, minmax(16rem, 1fr))`, never in a row sized by content.
The docs' `.tile-row` caps the minimum, `minmax(min(16rem, 100%), 1fr)`: at
320px the stage is narrower than 16rem, and the plain minimum pushed the page
27px sideways, so a column narrower than 16rem holds one tile.

**The link.** With `href` the whole tile is React Aria's `Link`
(`a.stat-tile`), so a press routes through `RouterProvider` and a modified
press falls through to the browser. Its name is its content: the label, the
value, the change and the caption, in that order. Every line is a block (a
`p`, or the heading), never a `span`, because name computation puts a space
between blocks and none between inline elements. The spec named the link by
the label, the value and the change and put the caption in
`aria-describedby`; axe's `label-content-name-mismatch` fails a link whose
name leaves out text it shows, so the caption is in the name and there is no
description. A link cannot hold a link or a button, so on mount a linked
tile looks for a focusable element inside itself and, once per mount, warns
in the console: "StatTile with href holds a focusable element; a link cannot
hold a link or a button. Move it out of the tile."

**Static and client.** One module cannot be both. `StatTile.tsx` carries no
directive and imports no React Aria: a server component renders a tile
without `href` with no client JavaScript, and its HTML holds no React Aria
attribute. With `href` it hands its content to `StatTileLink.tsx`, a private
client module that is the link and owns the warning.

**Hover and press.** A linked tile takes the 5% ink wash over Lifted on
hover, inside `@media (hover: hover)`, and on a press, since touch has no
hover to show it. No lift and no shadow: the tile is a surface, not a
button. Cursor pointer. The focus ring is the token ring outside the tile.
The washed tile also sets `--chart-surface` to the same mix, so a
sparkline's end dot keeps a ring in the tile's color.

**Contrast.** On Lifted, gated already as text and cited by the contrast
test, not added: ink 17.84 in light and 17.42 in dark, slate 5.31 and 6.94,
gain 7.20 and 8.04, warning 6.12 and 8.92. On the hover wash, a mix and not
a token, so measured and recorded, not gated: slate 4.80 and 6.41, ink 16.11
and 15.25, gain 6.50 and 7.05, warning 5.53 and 7.81, each above the text
minimum.

**Forced colors.** The edge is `CanvasText` and a linked tile's ring is
`Highlight`. The text takes the reader's colors; the arrow is `currentColor`
and follows them.

**Where the build departs from the plan.** The stories set Storybook's
`padded` layout: under the default `centered` one the canvas shrinks to its
content, and a size container has none, so every tile drew as its 66px of
padding. Padded, a tile is 384px at 1280 (318px of content, the trend in the
value's row) and 343px at 375 (277px, the trend under the caption), and the
`RightToLeft` play measures the content width to know which layout to
expect. `StatTile` leaves `ref` in the attributes it spreads rather than
naming it, as `Card` does, since the React hooks lint reads a named ref passed
to `createElement` as a read during render. `StatTileLink` casts the tile's
HTML attributes to React Aria's link props. The cast does more than widen the
focus handlers' event type: React Aria's `Link` forwards only some DOM
attributes (`id`, `data-*`, `lang`, `dir`, `hidden`, `style`, the naming
attributes, `aria-current` and the event handlers), so others, such as
`title` or `role`, reach a plain tile and are dropped from a linked one. The
props page says so, and a test pins it, so a later React Aria that forwards
more is noticed.

## Meter

Spending against a budget: `Meter`, segments stacked in one bar, a marker
for today's pace, the label and the value text above the bar, and an
optional legend. The document has no meter of its own, so this one is
derived.

**The pattern by hand.** The WAI-ARIA meter pattern, written in the static
module, not React Aria's `Meter`: that one takes one value, where this one
stacks several, and it builds its own `aria-valuetext` with `Intl`, where
every figure here is the app's string. `aria-valuemin` is 0,
`aria-valuemax` is `max`, `aria-valuenow` is the sum of the segments, each
floored at 0, capped at `max` (0 when `max` is not over 0), and
`aria-valuetext` is `valueLabel`, so a screen reader reads "$1,020 of
$1,200" and never a percentage. The visible value text is `aria-hidden`,
since the meter reads it. `useId` is the module's one hook, and the server
build exports it, so a server component renders the meter with no client
JavaScript.

**The role on the bar.** `meter` has presentational children, so a legend
inside a `role="meter"` element would be lost to assistive technology. The
root is a plain `div.meter`; `div.meter-bar` is the meter, and the legend is
a list beside it. The bar is named by `aria-labelledby` when it is given,
else by `aria-label`, else by the visible label through its id. A blank
`aria-labelledby` or `aria-label` (empty or only spaces) falls through to
the next, and a meter given no name at all, which the types forbid but an
empty label can still reach, is named by its value text, so the bar never
goes unnamed. With `pace` the bar is described by the pace label, a hidden
span after the bar; a blank pace label draws the marker alone, with no
description and no legend key.

**The track.** 8px tall, `--radius-pill`, in the frame color, ink at 12%,
the unfilled remainder. It is a flex row that clips its segments, so the
first segment's start takes the track's radius; the last segment's end
takes it too, and the joins between segments stay square.

**The looks.** `fill` is solid ink, for spent; `hatched` is ink stripes 2px
wide every 6px at 45 degrees, a `repeating-linear-gradient` over the track,
for held, committed but not gone. Both read `--meter-ink`, which is ink on
the root and `--color-warning` under `[data-over]`, so one property turns
both looks warning over the limit. Exactly `max` is not over. Over the limit
the words are the app's, and `valueLabel` must say "over"; the docs and the
changeset say so, since the color is never the only signal. Error, success,
signal orange, clay and taupe appear nowhere. The hatch also means a
previous period in a bar chart (`look: 'hatched'`, "BarChart"): the same
stripes in the series' color, the same meaning, the same thing and not the
main amount.

**The geometry.** Each segment's width is its share of `max`, stacked from
the inline start, written as a percentage with at most three decimals in
`style={{ inlineSize }}`. What passes `max` is clipped, accounting for what
came before, so the stack never draws past the track, and a segment left
with no width is not drawn, so it draws no stray spacer. The legend lists
every segment. Nothing is measured.

**Spacers and rings are borders.** The token rule allows no inset or spread
shadow, so the 2px cut between two segments is a `border-inline-start` on
every segment after the first, inside its width, with the fills clipped to
the padding box; and the pace marker's 2px ring is its border. Both are in
`var(--meter-surface, var(--color-lifted))`: read with a fallback and never
declared by the meter, so an app sets `--meter-surface` once on any ancestor
(a canvas section) and every meter inside follows, where a value declared on
the meter would beat it. DataTable sets it for its rows, each to its own
fill, hovered and selected included (DataTable, "A meter in a row").

**Held, printed.** A printed page drops backgrounds, which loses the fill as
well as the hatch, so `.meter` sets `print-color-adjust: exact` and its
`-webkit-` form. The held segment also keeps a 1px edge in `--meter-ink`,
a border on its `::after`, which an absolute child draws inside the padding
box, so inside the spacer: the held amount still shows its extent where
backgrounds are not painted.

**The pace marker.** 2px of ink 16px tall, centred on the track, in a 2px
ring of the surface, so it reads over the fill and over the track alike. It
is HTML placed by `inset-inline-start` at `pace.value / max`, clamped to 0
to 100%, with its 3px half-width taken back by `margin-inline-start`, so its
centre is the pace. It is never warning: the pace is not over anything.

**The label row.** The label at `--text-small` weight 500 in ink at the
start, and `valueLabel` at `--text-small` in slate with tabular figures at
the end, 8px (`--spacing-part`) above the bar. The row wraps, and a long
word breaks anywhere.

**The legend.** With `hasLegend`, a list under the bar: per segment a 12px
swatch in its look on the micro radius, its label in slate and its value in
ink with tabular figures, then the pace marker's key, a 2px ink line, and
its label. The swatches are `aria-hidden`.

**Contrast.** The label is ink and the value text slate on Lifted, gated
already as text and cited by the contrast test, not added. The track is a
mix, so its pairs are measured and recorded, not gated. On Lifted the ink
fill against the track is 13.88 in light and 12.19 in dark, the warning
fill 4.77 and 6.24, each past the 3:1 a graphic needs; the track against
Lifted is 1.28 and 1.43, a cue and not a boundary, since the value text
carries the meter's extent. On canvas the ink fill is 12.69 and 14.19, the
warning fill 4.36 and 7.27, and the track 1.28 and 1.36.

**Forced colors.** The fills are backgrounds and the stripes an image, which
the repaint drops. The fill segment and the fill and pace swatches become
`CanvasText`; the stripes opt out of the repaint
(`forced-color-adjust: none`) and are drawn again as `CanvasText` on
`canvas`, with their edges named `CanvasText`; the track takes a 1px
`CanvasText` outline, so its end shows; `--meter-surface` is `canvas`, so
the spacers and the ring are the reader's background; the marker is
`Highlight`. The over state keeps its words.

**Right to left.** The track is a flex row and every offset is logical, so
the bar fills from the inline start, the right, and the marker mirrors with
it. The hatch keeps its 45 degrees: it is a texture, not an arrow.

**Where the build departs from the plan.** The plan has `useId` run under
the server-build test because the server build exports it. It does, but
`server-components.test.tsx` renders with `react-dom/server`, which sets the
dispatcher of the ordinary React, so the server build's own `useId` found
none and threw. The test's React mock now keeps the server build's exports
and takes each hook it exports (`use`, `useCallback`, `useDebugValue`,
`useId`, `useMemo`) from the ordinary React, so the list of names, which the
guard checks, is still the server build's. The blank-name fallbacks above
are an addition, so the bar is never unnamed. The size limit is 1.5 kB,
above the spec's 1 kB budget: the entry measured 795 B, and the rule rounds
up to 1 kB and adds 0.5 kB.

## Charts

The charts live in their own package, `@snapshot-ui/charts`, the package the
parent spec names for phase 6 (the owner's ruling 1 in the home spec).
Putting them in `@snapshot-ui/react` now would make phase 6 move the
imports, a breaking change for the consumer. The package depends on nothing
at run time but React, its one required peer; `@snapshot-ui/core` is an
optional peer. React DOM is not a peer: no chart imports it (no portal, no
`flushSync`), and a peer the code never imports would only be a constraint
on the app. It copies `cx` and the `AriaName` type rather than importing
`@snapshot-ui/react`, so neither package depends on the other. Its CSS is
`charts.css` in core, imported by `styles.css` after `meter.css`, so an app
still loads one stylesheet. It is versioned on its own, outside the fixed
group of core and react, and starts at 0.1.0.

**Drawing without measuring.** Every chart is an `svg` with
`viewBox="0 0 100 100"` and `preserveAspectRatio="none"`, stretched to its
box, so the geometry is a pure function of the props and the server's HTML
is final. Every stroke carries `vector-effect: non-scaling-stroke`, so a
stretched line keeps its width; the CSS test checks that every rule that
sets `stroke-width` sets it too. Anything that must keep its shape, a dot, a
label, the readout, is HTML placed over the svg by percentage with logical
insets, never an svg mark, which the stretch would turn into an ellipse.
Nothing reads layout at render. Risk R1 is that a transform on a stretched
svg breaks the non-scaling stroke; the only transform is the flip below, and
the visual baselines at 375 and 1280 catch a distorted line.

**Direction from the `dir` attribute.** Time runs from the inline start
(ruling 3), so in a right-to-left page the newest value is at the left. A
static chart cannot read React Aria's locale, and `:dir()` is past the
browser floor, so `charts.css` sets `--chart-flip` to `1` under
`:where([dir='ltr' i])` and `-1` under `:where([dir='rtl' i])`, the card
chevron's pattern, and mirrors the svg with `scale: var(--chart-flip, 1) 1`.
The nearest attribute wins, since a custom property inherits, so a
`dir="ltr"` region inside a right-to-left page draws left to right; with no
attribute at all the fallback is 1. The HTML marks follow by their logical
insets, with no flip of their own. Logical insets read the computed
`direction`, which `dir="auto"` or a CSS `direction` can change with no
attribute, so the same two rules set `--chart-direction` to `ltr` or `rtl`,
and every box that holds HTML over a drawing (`.sparkline-plot`,
`.line-chart-plot`, `.line-chart-x`) takes
`direction: var(--chart-direction, ltr)`: the marks and the svg read one
attribute and always agree. The domain and the path are the same in both
directions.

**Series colors.** A line chart draws at most two series: the first ink,
the second slate in a thinner stroke. The categorical palette, for a chart
of more peers, is the four chart tokens, whose derivation and checks are
"Chart palette" below. The stroke widths are literals in `charts.css`,
since two size tokens are not worth adding.

**Which color a series gets** (the insights spec, section 5.4). Color goes
by meaning first, then by identity:

| The chart | Series colors, in order, unless a series sets `color` |
| --- | --- |
| One series | ink |
| Two series, grouped | ink, slate: the story and its context, LineChart's emphasis form |
| Two to five, stacked | `chart-1`, `chart-2`, `chart-3`, `chart-4`, then slate |
| A series with `look: 'hatched'` | the color of the first series with `look: 'fill'`, striped |

A bar chart's `color` pins a series to its color, so it keeps it when
another series is filtered out. `color` takes `'ink'`, `'slate'`, `'gain'`
and the four slots, `'chart-1'` to `'chart-4'`, each drawn by a
`[data-color]` rule in `charts.css` that sets `--bar-chart-color`; the
stacks that give a series a slot without being asked come with the
stacked layout. `gain` is for a series that is money that
arrived, labelled so ("Income"), drawn beside an ink "Spending" and never
beside a palette color. There is no color for money out: spending is ink,
and a negative is its series' color below the zero line, never error,
since nothing failed (NumberField's rule). Error, success, warning, clay,
the two signal oranges and taupe are not in the `ChartColor` type.

**The surface.** A ring or a spacer is a border in the surface the chart
sits on, `var(--chart-surface, var(--color-lifted))`: read with a fallback
and never declared by a chart, so an app sets `--chart-surface` once on any
ancestor and every chart inside follows. No shadow draws a ring, as the
token rule requires. A dot and its ring are backgrounds, which a page
printed without backgrounds drops, so `.sparkline` and `.line-chart` set
`print-color-adjust: exact`, as `.meter` does.

**The foundations.** Pure modules, private to the package in 0.1.0.
`linearScale(domain, range)` maps a value linearly and sends every value to
the middle of the range when the domain has no width.
`extent(values, { includeZero })` is the least and the greatest finite
value, NaN and the infinities ignored, with 0 among them when asked, and
undefined when there is none. `niceDomain(min, max)` rounds outward to four
steps: the step is the smallest of 1, 2, 2.5, 5 and 10 times the power of
ten under a quarter of the span that is at least that quarter, each end is a
multiple of it, and each number is cleaned with `toPrecision(12)` so float
noise never reaches the page; equal ends give `[0, 1]` at zero and a domain
from zero otherwise. `linePath(points)` writes straight segments only,
because a smoothed line invents values between the points; a null breaks the
line into subpaths, and a point alone between two breaks is a zero-length
segment that round caps draw as a dot. `areaPath(points, baseline)` closes
each run of two or more points down to the baseline. Numbers are written
with at most three decimals and no trailing zeros, commands with no space
before them and a space between x and y: `M0 100L50 50L100 0`.

## Sparkline

A figure's shape over time, small enough to sit beside the figure:
`Sparkline`, the first chart of `@snapshot-ui/charts`. The document has none
of its own, so this one is derived.

**Static and decorative.** No hook and no client directive, so a server
component renders it with no client JavaScript. It is hidden from assistive
technology (`aria-hidden`) by default, since the tile beside it says what it
means. Given an `aria-labelledby` or an `aria-label` it is one `role="img"`
with that name, `aria-labelledby` first; a blank name, empty or only spaces,
falls through to the other, and with neither it stays hidden, so it never
becomes an image with no name. The svg inside is hidden either way.

**The root is a span** (spec correction 12). The end point is HTML over the
svg, which an `svg` root cannot hold, so the root is `span.sparkline`, which
takes `className`, `ref`, the other attributes and the name; inside it,
`span.sparkline-plot` holds the svg and the end point.

**The box.** 96 by 32 by default, `inline-block` on the middle of the line.
The plot is inset 6px on every side, half the end point's 12px box, so the
dot and its ring stay inside the sparkline's own box at either end and at
the top or bottom. A width and a height from the app stretch it; the line
stays 2px and the dot round.

**The domain is the extent.** A sparkline shows a shape, not a magnitude, so
y runs from 100 at the least value to 0 at the greatest, not from zero. x is
the value's place, `i / (n - 1)` of the width, and the middle for one value.
A flat series has a domain of no width and draws at mid-height. No data
draws an empty box; one value draws only its dot, at the middle, since a
line needs two. A value that is not a finite number is a gap that breaks the
line, as a null is in the line chart, and the end point is drawn only when
the last value is one.

**The look.** The line is 2px ink with round caps and joins. `hasArea` fills
under it with ink at 10%, `color-mix` over transparent, down to the bottom
of the plot, drawn before the line so the line lies over it. The end point,
on by default, is 8px of ink in a 2px border of `--chart-surface`,
`--radius-dot`, centred on the last point by negative logical margins. It is
`box-sizing: content-box`, as the meter's pace marker is, so the ring sits
outside the 8px whether or not `base.css` makes every box border-box.

**Contrast.** The line and the dot are ink, which the gate holds as text on
Lifted, Float and canvas, so the charts add no pair; the contrast test cites
the three. Measured: ink on Lifted 17.84 in light and 17.42 in dark, on
Float 18.43 and 17.42, on canvas 16.25 and 19.31. The wash is a mix, so it
is measured and recorded, not gated: against Lifted it is 1.23 and 1.34, a
cue and not a boundary, and the line over it on Lifted is 14.50 and 13.04,
far past the 3:1 a graphic needs.

**Forced colors.** The line is `CanvasText`, the wash is dropped
(`fill: none`), and the dot is `CanvasText` in a `canvas` ring.

**Right to left.** The svg is mirrored by `--chart-flip`, so the oldest
value is at the right and the newest at the left, and the end point sits at
`inset-inline-start: 100%`, which is the left edge under `dir="rtl"`.
`--chart-flip` is set only by a `dir="ltr"` or `dir="rtl"` attribute, and
since the line chart's task the plot's direction is set by the same
attribute (`--chart-direction`), so under `dir="auto"` or a CSS `direction`
with no attribute the dot and the line still agree; the docs still ask for
an explicit `dir`, since without one the drawing runs left to right. A
domain wider than a number can hold, such as -1e308 to 1e308, is scaled by
halves, so no point is ever NaN.

**Where the build departs from the plan.** The size limit is 1.5 kB, above
the spec's 1 kB budget: the entry measured 843 B, and the rule rounds up to
1 kB and adds 0.5 kB. A value that is not finite is a gap, and the
blank-name fallback hides the sparkline rather than leave an unnamed image;
both are additions. The changeset also names the `SparklineProps` export and
`--chart-surface`, which the plan's text left out and the plan's changeset
rule asks for. The plan's CSS gave the end point no `box-sizing`, and under
`base.css`, which makes every box border-box, its 2px border ate into the
0.5rem: the dot drew 8px across with 4px of ink, 2px off its point, which
the `Wide` and `RightToLeft` stories caught. It is `content-box` now, and
the CSS test pins it.

## LineChart

The month as a line: `LineChart`, the second chart of `@snapshot-ui/charts`.
The document has none of its own, so this one is derived from the home
spec's section 9 and the owner's rulings 2 and 3.

**Anatomy.** `figure.line-chart`, named by its `aria-label` or
`aria-labelledby`, which the types require, holds `div.line-chart-chart`
and, after it, the table, the toolbar with the toggle, and a `noscript`.
The chart view holds the legend (`ul.line-chart-legend`, two series only),
the plot and the x axis (`div.line-chart-x`, hidden from assistive
technology). The plot, `div.line-chart-plot`, holds the svg, an HTML
overlay (`div.line-chart-overlay`, hidden) with the y labels, the
crosshair, the dots and the readout, and the visually hidden live region.
`className`, `ref` and the other attributes go on the figure, which says
which view is shown in `data-view`. The plot is 240px tall by default
(`height`, as `block-size`) and as wide as its container.

**The series.** One or two: the first is the story, a 2px ink line, and
the second is context, a 1.5px slate line drawn before the first so ink
lies on top. Both have round caps and joins and
`vector-effect: non-scaling-stroke`. Straight segments only, from
`linePath`, since a smoothed line invents values. A `null` point, a point
past the x labels, and a value that is not a finite number are gaps that
break the line. `hasArea` fills under the first series with ink at 10%,
down to the bottom of the plot, drawn first.

**Gridlines and the baseline.** A 1px `--color-divider` line at each
`yTicks` value inside the domain, and a 1px `--color-frame` baseline at
the domain's minimum, always drawn. Both are cues, not boundaries. No
vertical gridlines.

**Axis labels are HTML.** The y labels sit at the inline start above their
gridline (`translate: 0 -100%`), only when the app passes `yTicks`, and
the plot gains 1.25rem above it for the top one. The x labels sit under
the plot at `xTicks`, or the first, the middle and the last index by
default, centred on their position by `translate` times `--chart-flip`;
the first and the last are marked `data-edge` and kept inside the plot.
They are HTML and not svg text so they never stretch and they follow the
page's font: `--text-small`, slate, tabular figures. Every label is the
app's string, hidden from assistive technology, since the readout and the
table carry the same strings.

**The default domain** runs from zero to the nice ceiling of the data
(`niceDomain` over the extent with zero included), below zero for negative
data, and `[0, 1]` with no data. A nice ceiling past the largest number
falls back to the data's own extent, a `yDomain` that is not finite is
ignored, and a value far outside a given domain is drawn at most 1e6 past
the plot, so no coordinate is ever NaN or an infinity.

**One tab stop, not a tooltip per point.** Thirty-one tooltips would be
thirty-one tab stops (spec 4). The plot is `tabIndex={0}`, `role="group"`,
and `aria-roledescription` from `labels.roleDescription`, "chart" by
default, named as the figure is; a name that is blank falls to the other,
and with neither the series' column headers in the table name it, so the
group is never unnamed. The tab stop is set after mount, by state an effect
sets: the server writes no `tabindex`, so with scripts off the plot, whose
keys need them, is no dead tab stop. Focus activates the newest position
with data, unless a pointer already holds one, and blur ends it; a plot
focused before it had data takes the newest position on its first key.
Left and Right move to the previous or next position with data, Home and
End to the first and the last, Page Up and Page Down seven positions,
landing on the nearest position with data in that direction or at the
end, and Escape hides the readout, keeping the crosshair, until the next
move. A key that goes nowhere, Right at the newest day or End when there,
is not a move and leaves the readout hidden. The Escape that hides it is
stopped as well as prevented, since React Aria's overlays close on an
Escape that reaches them whether or not it was prevented, so a chart in a
dialog or a sheet hides its readout first; a second Escape, with nothing
to hide, is left to whatever holds the chart. A key with Alt, Control or
Meta is the browser's or the page's and the chart does nothing with it.
Every key the chart uses is `preventDefault`ed. The one lint exception
sits on the plot, split over two comments because the tab-index rule
reports the attribute's line.

**The keys in both directions.** In right to left Left is the next, newer,
position, as drawn. The direction is read at the key press from the
nearest `dir="ltr"` or `dir="rtl"` attribute,
`closest("[dir='ltr' i], [dir='rtl' i]")`, exactly the attributes
`--chart-flip` comes from, so `dir="auto"` is looked past by both. The
pointer reads the same attribute.

**The readout** is a float panel (Float, the 1px frame edge,
`--radius-surface`, `--shadow-float`, `--text-small`) at the active x: the
x label in slate, then one line per series with a point there, the value
first in 500 and tabular, then the series' label in slate. It never covers
the point it describes, and it is placed from known values with no
measurement: each dot's y, the plot's `height` and the number of lines.
Above the highest active dot (`data-place="above"`), its bottom inset at
that y and a 0.625rem margin over it (the dot's 6px radius and 4px of
air), when the lines fit there at 20px each, with 14px of padding and
border and the gap; else below the lowest active dot (`"below"`), its top
inset at that y, so it covers neither series' dot; else on the side with
more room. Anchored by the edge nearest the dots, it grows away from them,
so a panel taller than the estimate, wrapped or at a larger text size, may
reach past the plot but never over a dot. Oct 18 in the docs, $77.90 on $0
to $100, is 53px under the top of a 240px plot, short of the 64px one
series needs, so its readout sits under the dot. A dot drawn past the plot
anchors at its edge. Across, it is centred on the x, and in the oldest
quarter it starts at the x (`data-align="start"`) and in the newest it
ends there (`"end"`), a `--spacing-part` off it. It is `max-content` wide
up to `min(16rem, 50%)` when centred, since half the plot lies on either
side of an x in the middle half, and `min(16rem, 75% - --spacing-part)` at
the ends, so it stays inside the plot at any width, and its text wraps
within that width (`overflow-wrap: anywhere`) rather than running past its
border. The crosshair is a 1px slate line, and each series with a
point there has a dot: 8px of its color in a 2px border of
`--chart-surface`, `content-box` as the sparkline's end point is. Nothing
transitions.

**The announcement** (risk R2). After a key move or focus, once the
position rests 150ms, the live region (`aria-live="polite"`,
`aria-atomic`) takes the day and then each series with a point there; a
move inside the rest restarts it, so a held key is heard only where it
stops, and blur or unmount cancels it. A pointer is not announced, and a
pointer that takes the position empties the region, so a key that lands
back on the day last announced is still a change the reader hears. The
library writes no punctuation of its own into it (the plan's open
question 2): the day and each series are separate elements, each
`display: block`, so they are read as separate lines, and inside a
series' line its label and value are joined by a space only. A Persian
page that also passes `labels.roleDescription` hears its own words and no
English: no colon or comma, and no "chart". No `labels` entry is needed
for joiners. The check in VoiceOver and NVDA is not yet
verified; it is owed before the release (owner action 3).

**The pointer and touch.** A mouse or a pen over the plot activates the
position with data nearest its fraction of the plot's width from the
oldest side, read from `getBoundingClientRect` in the handler, so the hit
area is the whole column of each day and never the 2px line; leaving
clears it unless the plot has focus. A touch press does the same and
holds the position until a press anywhere outside the plot, listened for
on the document only while a touch holds.

**The table** (ruling 2). A toggle under every chart, a plain
`button.button.button-tertiary` (the tertiary look comes from its native
states as well as React Aria's), swaps the chart view and the table with
the `hidden` attribute, reads "Show as table" or "Show as chart", and
keeps focus. The table has an empty corner cell, a column header per
series and a row header per x label, every cell the app's value label and
empty for a gap. It is named as the chart is (spec correction 11): by a
caption that repeats the `aria-label`, or, for a chart named by
`aria-labelledby`, by the same id and no caption. Both views render on the
server, and `charts.css` says `display: none` again for each under
`[hidden]`, since its own `display` would beat the user agent's.

**Scripts off.** The `noscript` holds `p.line-chart-noscript` and a second
copy of the table, shown and with no ids. A browser running scripts does
not parse it and React renders none of it on the client, so there is one
table in the DOM; with scripts off the plot, the inert toggle, the note and
the shown table are what a reader gets, and the plot is no tab stop. The
four strings the chart writes, `labels` (the toggle's two, the note, and
the plot's role description), are all replaceable, and the type requires
all four together so no English is left on a translated page.

**Contrast.** The ink line is 17.84 and 17.42 on Lifted and 18.43 and
17.42 on Float, which is also the readout's text. The slate line, the
crosshair and the labels are 5.31 and 6.94 on Lifted, 5.49 and 6.94 on
Float, and 4.84 and 7.26 on canvas: all gated as text, so past the 3:1 of
a graphic. The gridline is 1.23 and 1.34 against Lifted and the baseline
1.28 and 1.43, cues measured and recorded, not gated. No pair is added to
the gate.

**Forced colors.** The first line and its key are `CanvasText`; the second
line, its key, the gridlines and the baseline are `GrayText`; the wash is
dropped; the crosshair and the dots are `Highlight`, the dots in a
`canvas` ring; the focus ring is `Highlight`.

**Right to left** (ruling 3). The x axis runs from the inline start, so
the newest day is at the left under `dir="rtl"`: the svg is mirrored by
`--chart-flip`, the marks and labels follow by their logical insets in the
plot's `--chart-direction`, and the x labels' and the readout's
translations are multiplied by `--chart-flip`. The figures inside the
app's strings are the app's.

**Where the build departs from the plan.** `announcement()` is
`readingsAt()`, which returns each series' label and value, and the live
region renders the parts as elements instead of one joined string, so no
English punctuation reaches another language (open question 2). The
public types take `readonly` arrays. A blank name falls back, and with no
name at all the series name the plot. A value that is not finite is a
gap, coordinates are kept finite, `xTicks` that are not whole indices
inside the labels are dropped, and a series with no point draws no path.
The dot is `content-box`, the live region's parts are `display: block`,
and the plot and the x axis take `--chart-direction`, which the plan did
not have. The lint exception is two comments, not one. React DOM was
dropped as a peer. The size limit is 4 kB, the spec's budget: the entry
measured 3.03 kB, and the rule rounds up to 3.5 kB and adds 0.5 kB.

**After review.** The readout first sat at the top of the plot, over the
newest days' dots; it is placed above or below them now, from known
values, and wraps inside the plot. `aria-roledescription` was a fixed
English "chart"; it is `labels.roleDescription`, so `LineChartLabels` has
four strings. The Escape that hides the readout is stopped as well as
prevented, which a story with the library's Dialog around the chart
checks (`apps/storybook/stories/`, whose stories may import both
packages, as neither package's own may). Keys with Alt, Control or Meta
are left alone, a key that does not move keeps the readout hidden, the
first key in a plot focused before its data came takes the newest day,
and a pointer clears the last announcement. The tab stop is set after
mount, so the server's HTML has none. The entry measures 3.25 kB now,
inside the same 4 kB.

**States** (the insights spec, section 7.9, and the owner's ruling 10).
`status` is `'ready'`, `'loading'`, `'empty'` or `'error'`, BarChart's
frame through the shared pieces: the plot keeps its place and its height,
its gridlines, their labels and the x labels the app passes, so the page
does not move when the data arrives. Loading draws one still placeholder,
`span.skeleton.line-chart-skeleton`, over the plot's whole box under the
gridlines' labels, in Skeleton's fill and pulse, hidden from assistive
technology, with no legend, toggle or table, and nothing marked busy:
the region that says the state is inside the plot, and a reader may hold
back a busy subtree's changes until it is no longer busy (the plan's spec
correction 31). Empty and error draw `statusContent` or `p.line-chart-message`,
the message the bar chart shares (`:is(.line-chart-message,
.bar-chart-message)`), slate for empty and `--color-error` for a load
that failed, the one meaning that color has, and keep the hidden table
with no toggle. The three strings are `statusLabels`, `ChartStatusLabels`
with English defaults, a prop of their own, since `LineChartLabels` is
required whole and growing it would break every app that passes it. The
state is said once through the plot's own polite region, the one that
announces positions, which is in the page from the first render, so the
word is heard when it arrives and a change from ready to an error is
heard too. The plot is no tab stop while it shows a state
(`tabIndex={-1}` after mount), so focus on it stays there and never falls
to the body, and its keys and pointer do nothing; a status change lets go
of the position active and announced before it. The ready face is the
same byte for byte (`same-markup.test.tsx`, unchanged): `data-status` is
written only for a state (the plan's spec corrections 21 and 31).
The entry measures 4.06 kB with the states, and its limit is 5 kB by the
rule (correction 9).

## SearchField

A search box: `SearchField`, the text input's pill with a magnifier at its
start and a clear button at its end once there is text, Escape to clear
and Enter to submit. The document draws the palette's field and no search
box of its own, so this one is derived from the input.

**The control.** The `.input` pill, unchanged: `--size-field` tall (48px,
36px compact), the raised fill, the boundary edge, and the hover, focus,
disabled and invalid edges `input.css` draws through the field's root.
`search-field.css` sets three properties on it in one class after
`input.css`, which beats the input's by order and none of its states:
`padding-inline: 3rem`, over the input's 1.5rem; `display: block`, so the
control around it is as tall as the input whatever line height it sits
in; and `appearance: none`, since WebKit's searchfield appearance can draw
padding and corners of its own. At the start, 3rem clears the 20px
magnifier set 16px in and leaves 12px before the text; at the end it
clears the clear button, 36px set 6px in, with 6px to spare.

**The magnifier.** Lucide `Search` at 20px, slate, at
`inset-inline-start: 1rem`, centred on the block axis, hidden from
assistive technology and taking no pointer events, so a press on it
lands in the input. Taupe on a disabled field.

**The field button.** A new shared class in `input.css`, `.input-button`,
for a button inside a field: this clear button, and the combo box's button
later. A ghost a field step smaller than the field,
`calc(var(--size-field) - 0.75rem)`, so 36px and 24px compact, concentric
with the field, its `--input-radius` less the 6px gap (a circle in Rounded,
6px in Soft), set `0.375rem` in from the field's inline end and centred
by `inset-block: 0` and `margin-block: auto`. Its glyph is 16px and slate,
and turns ink under the 5% ink wash on hover, inside `@media (hover:
hover)`, and on a press, since touch has no hover to show it. The ring is
the token ring outside it. Disabled, the glyph is taupe and the cursor
not-allowed. A `::before` takes the hit area to `--size-target` in both
axes by the formula every control shares, so a compact button is still
hit at 40px.

**The clear button.** It leaves the layout while the field is empty
(`.search-field[data-empty] .search-field-clear { display: none }`), so an
empty field has no stray target, and on a read-only field
(`data-readonly`), whose text cannot be cleared. The button sits on the
input, so a pointer on it has left the input: the input keeps its hover
edge there, inside `@media (hover: hover)`, in a rule of one class's
weight, so the focus, disabled, changed and invalid edges still win. React Aria keeps it out of the tab order,
because Escape does the same from the field, and a press clears the text
and leaves focus in the input. Its name is the library's "Clear search",
or `clearLabel`: React Aria's own name is localized, but has no Persian, so
an `aria-label` replaces it and a Persian page passes its own. The
browser's own cancel button is hidden
(`::-webkit-search-cancel-button { appearance: none }`), so there is one
clear control.

**The unlabelled placeholder.** Under a visible label the placeholder is
the input's taupe, the whisper color. A field in a toolbar has no label
row and is named by `aria-label`; its root then carries `data-unlabelled`
and its placeholder is slate, because it is the only words a sighted
reader gets. Disabled, it is the input's taupe again, the disabled text. It is the exception CommandPalette recorded for its own
field. Slate on raised is 5.49 in light and 6.44 in dark, the resting
magnifier and clear glyph too, and is gated as text already. The hovered
glyph, ink over the 5% wash on raised, is 16.65 and 13.24: the wash is a
mix, so the pair is measured and recorded, not gated. No pair is added to
the gate.

**No changed state, no debounce.** A query is not saved data, so the
field has no `isChanged` and its label row holds the label alone. It has
no debounce either (ruling 6): an app that keeps the query in its URL
passes `value` and writes the URL after its own pause in `onChange`, or
in `onSubmit`, and the docs page shows both with the Next App Router.

**Right to left.** Nothing is mirrored. A magnifier and a cross have no
reading direction; the logical insets put the magnifier at the right and
the clear button at the left.

**Forced colors.** The magnifier and the clear glyph are `CanvasText`, and
`GrayText` when disabled; the input keeps `input.css`'s rules.

**The docs search row.** The docs site's own search dialog drew its row
with a class named `.search-field`, which would have restyled the
library's part on its own page (padding, a divider, a focus line and a
20px glyph). It is renamed `search-dialog-field` in the same change, and
the docs test checks that each keeps its own look (spec correction 1).

**Import order.** `search-field.css` is imported after `charts.css`, the
last of the home files, and a test keeps the select, the combo box, the
multi-select, the tabs and the pagination after it in that order once
they exist. The tooltip's test, which allowed only the shell and home
files after the last overlay file, now allows the picker files too, and
the text area's test, which forbids it any property an input state sets,
no longer counts the field button's rules as input states.

**The size.** The size limit is 1.5 kB, the spec's budget: the entry
measured 514 B, and the rule rounds up to 1 kB and adds 0.5 kB.

## Select

A field that chooses one value from a list: `Select`, the text input's
pill drawn on a button, showing the chosen option's icon and label and
opening the Menu's rows in a popover under it. Its rows are two shared
parts, `PickerOption` and `PickerSection`, which the combo box and the
multi-select reuse.

**The trigger.** A button wearing `.input select-trigger`, so the pill is
the input's: `--size-field` tall (48px, 36px compact), the raised fill,
the boundary edge, and every hover, focus, disabled, changed and invalid
edge `input.css` draws through the field's root, written once. The root is
`.field.select`, which carries `data-changed` and React Aria's
`data-invalid`, `data-disabled` and `data-open`. `select.css` lays the
trigger out as a row of the value and the chevron in one-class rules after
`input.css`: `display: flex`, `gap: var(--spacing-part)`, `padding-inline:
1.5rem 1rem` (the chevron needs less room at the end than text at the
start), `text-align: start`, and a pointer cursor only while enabled, so a
disabled trigger keeps the input's not-allowed cursor.

**The value.** The chosen option's icon and label, in ink, on one line,
ellipsized (`min-width: 0`, `white-space: nowrap`, `text-overflow:
ellipsis` on the label). React Aria's `SelectValue` renders the chosen
option's own content in the trigger, which for `PickerOption` is the
whole row: its label and hint as slots, its end value with an id, and its
check. Hidden by CSS, the end value's id would still be written twice
while the list is open, and the option's description would resolve to
whichever came first. So the trigger draws the row by render, not by CSS:
`Select` provides a private context around its value, inside which an
option draws only `span.menu-item-icon` and `span.select-value-label`, with
no slot, no id, no hint, no end value and no check (spec correction 2).
The trigger is named by its value and its label, in React Aria's order:
"Groceries, Category".

**The placeholder.** "Choose an option" until something is chosen, or the
`placeholder` passed, in slate, labelled or not. React Aria marks it
`data-placeholder`. An input's placeholder is an attribute, which axe
never measures, so a field's placeholder can be taupe, the whisper. This
one is the trigger's visible text, the button's own words, and must meet
text contrast: taupe on raised is 1.58 in light and 3.68 in dark, so it is
slate, 5.49 and 6.44, and axe checks it with no exception in the stories or on the
docs page (open question 3). A disabled trigger's placeholder and value
are taupe, the disabled text, which WCAG exempts.

**The chevron.** Lucide `ChevronDown` at 16px in slate at the trigger's
end, hidden from assistive technology. It turns half a turn while the list
is open (`rotate: 180deg`, 140ms), and not at all under reduced motion; it
is the only thing in the pickers that moves. An option's icon in the
trigger is the Menu's 16px slate icon. Disabled, both are taupe.

**The list.** The Menu's float panel and rows, with no row CSS of its own:
`Popover.menu-popover.select-popover` holding `ListBox.menu.select-list`.
`PickerOption` is MenuItem's anatomy without the key hint, the danger
variant or a link: an icon, a label that names it, a hint under it, a
preformatted end value, and a check whose room every row of a selecting
list keeps; the chosen row is the ink pill with its check. It omits every
link prop (`href`, `hrefLang`, `target`, `rel`, `download`, `ping`,
`referrerPolicy` and `routerOptions`), since an option that navigates is a
menu item (spec correction 6). The end value describes the option ahead of
its hint, as on MenuItem; React Aria's option writes its own
`aria-describedby` over the one it is given, so the option joins the end
value's id to it through React Aria's `render` prop, on the element
itself. `PickerSection` is MenuSection's look, an overline heading that
names the group.

**The popover.** At least the trigger's width (`matchTriggerWidth`) and at
least 12rem, capped at the viewport less 2rem, under the trigger at its
start. React Aria's `maxHeight` is 320px, about seven rows with hints, so a
long list scrolls inside a panel that stops short of the screen's edge; the
list is the one scroller. It is a popover at every width (ruling 2): React
Aria flips it above the trigger when there is more room there, caps its
height to the room left and keeps it 12px inside the viewport.

**The filter.** From 9 options, counted from React Aria's collection,
which counts items and never headings, inside sections too, the list sits
in React Aria's `Autocomplete` under `div.select-filter`, a `SearchField`
named and placeholdered "Filter" (`labels.filter`). `isFilterable` turns it
on for a shorter list or off for a longer one (ruling 7). An option stays
when every whitespace-separated word of the text appears in its text
value, at base sensitivity, CommandPalette's rule, so case and accents do
not count; a section with nothing left hides. The list mounts each time it
opens, so the text is empty on every open. The row pads
`var(--spacing-part)` with a 1px divider under it and sets `--size-field:
var(--size-control)` for its subtree, so its field is 40px (36px compact):
a field inside a popup is one step smaller than a field on the page, read
from the tokens. It is unlabelled, so its placeholder is slate. Focus goes
to the field, the arrows move a virtual focus through the list, Enter
chooses the active option, and Escape clears the text first and closes
on the second press.

**On a coarse pointer** the filter does not take focus as the list opens,
so a phone's keyboard does not cover a list that is often short enough to
scroll (ruling 7). The check reads `matchMedia('(pointer: coarse)')` in
`onOpenChange`, an event, never while rendering; React Aria calls it for
an open the user starts, and the choice goes back to the default as the
list closes, so a list opened by `defaultOpen` or by the app's `isOpen`
focuses its filter, after a touch open too (spec correction 3). Where no
`matchMedia` exists, as in a test environment, the pointer reads as fine.
Where focus lands then was
settled by a spike: with the field's autofocus off, React Aria leaves focus
on the popover, where the arrows reach nothing. So the filter's
`Autocomplete` also turns off its virtual focus there
(`disableVirtualFocus`): the options take real focus, as an unfiltered
list's do, focus starts on the list, the arrows move through it, Enter
chooses, and Escape closes and gives focus back to the trigger. The field
is one tap away. This also keeps the active descendant, which mobile
screen readers follow unevenly (risk R3), off the touch path.

**The empty line.** `div.picker-empty`, "No matches" or `labels.empty`:
`padding: 0.5rem 0.75rem`, `--text-small`, slate. The combo box and the
multi-select share it.

**Keys.** Closed, Enter, Space and the up and down arrows open the list;
a letter chooses the next option starting with it without opening; and
Left and Right choose the previous and the next option without opening,
which React Aria does in single mode (spec correction 4). They are
physical keys and do not follow the reading direction. Open, the arrows
stop at the ends, Home and End jump, the page keys move a page, a letter
finds an option when there is no filter, and Enter or Space chooses and
closes. Tab does not close the list, as in the Menu: the popover is modal
and React Aria holds focus in it (spec correction 27). Escape closes and
gives focus back to the trigger.

**Forms and the server.** `name` submits the chosen key through React
Aria's hidden select, which follows a native form reset. A Select has no
clear action of its own: an app that needs "Any" adds it as an option.
React Aria builds the collection by rendering the Select's children once
into a template, so the field's label row is drawn there too, where
nothing reads it. React Aria's popover renders its content in that
template too, so the Select puts a bare list there, without the popover,
the filter or its collator, and renders them only with the Select's state.
On the server the trigger already shows the chosen
option's label, or the placeholder, and the hidden select; the popover
renders nothing until it opens. React Aria makes a collator while a
Select renders, for the closed type-to-select, on the server too (spec
correction 5, risk R1): it compares and writes nothing, and the server
test renders a Select under `en-US` and `fa-IR` and finds the same HTML.

**Measured pairs.** The value, ink on raised: 18.43 in light and 15.36 in
dark. The placeholder, the chevron and an option's icon, slate on raised:
5.49 and 6.44; the filter's placeholder is the same pair. Both are gated as text, and so
are the rows on float and canvas on the ink pill. The filter's divider on
float is 1.23 and 1.34: a separator inside the panel, not a control's
boundary, so it is recorded and not gated. No pair is added to the gate.

**Right to left.** The label and the value start at the right, the
chevron sits at the left and is not mirrored, since it points down, and
the popover aligns to the trigger's right edge, its start, through React
Aria.

**Forced colors.** The chevron and an option's icon in the trigger are
`CanvasText`, and `GrayText` when disabled; the trigger keeps
`input.css`'s rules and the rows keep the Menu's.

**The size.** The size limit is 3 kB for `Select`, `PickerOption` and
`PickerSection` together, the spec's budget: the entry measured 2.46 kB,
and the rule rounds up to 2.5 kB and adds 0.5 kB.

## ComboBox

A text field that filters a list as you type and chooses one option:
`ComboBox`, the text input's pill with the shared field button at its
end, opening the Select's list under it. Its rows are the Select's
`PickerOption` and `PickerSection`.

**The control.** The root is `.field.combo-box`, which carries
`data-changed`, `data-loading` and `data-unlabelled` from the wrapper and React Aria's
`data-open`, `data-invalid` and `data-disabled`. Under the label row sits
`div.combo-box-control`, positioned, holding the library's `Input` as
`input.input.combo-box-input` (role `combobox`), the Spinner while options
load, and `Button.input-button.combo-box-button` with Lucide `ChevronDown`.
The input wears `.input`, so every hover, focus, disabled, changed and
invalid edge `input.css` draws reaches it through the field's root,
written once. `combo-box.css` only pads its text clear of the button,
`padding-inline-end: 3rem`, and of the Spinner and the button while
options load, `4.5rem`, in one-class rules after `input.css`, so they beat
the input's padding and none of its states. The placeholder is the
input's own, taupe, the whisper: an input's placeholder is an attribute,
which axe never measures, and the label above the field names it. It is
taupe only while a visible label names the field: where only an
`aria-label` or `aria-labelledby` does, the root carries `data-unlabelled`
and the placeholder is slate, since it is then the only words shown, the
exception the search field, the command palette and the multi-select
recorded. Disabled, it is taupe again. A
disabled field's text is taupe, the disabled text.

**The field button.** `.input-button`, from the search field: a ghost
circle `calc(var(--size-field) - 0.75rem)` across (36px, 24px compact), 6px
in from the pill's end, its 16px glyph slate, hit at 40px. It is named
"Show options" and the field's label (`labels.open`), the library's words
in place of React Aria's, so a Persian page can name it. React Aria keeps
it out of the tab order and takes no focus on a press, since the down
arrow does the same from the field, and holds it pressed while the list
is open, so it shows the wash and its ink glyph then.

**The Spinner.** The 24px Spinner (`size="md"`), named "Loading"
(`labels.loading`), in `span.combo-box-spinner`: absolute, centred on the
block axis, its inline end at `calc(var(--size-field) - 0.25rem)`, which is
the button's 6px inset and its width plus 2px, so it sits 2px before the
button in every density. It takes no pointer, and it draws in
`currentColor`, the field's ink.

**The list.** The Select's, with no CSS of its own:
`Popover.menu-popover` holding `ListBox.menu.combo-box-list`, the Menu's
float panel and rows, at most 320px tall. React Aria positions and sizes
the list against the element its `GroupContext` ref holds, else against
the input. The control takes that ref, so the list opens under the whole
control at its start and is at least as wide as it (the control's width
is `--trigger-width`, which `menu-popover` reads). React Aria's `Group`
would also take the ref, but it brings a group role and a focus-within
`data-focus-visible`, which `.input`'s focus rule would turn into a ring
around the whole control; so the control is a plain `div` that reads the
ref from `useSlottedContext(GroupContext)` (spec correction 7). The
multi-select's frame does the same.

**Opening and choosing.** Typing opens the list filtered by the text,
React Aria's `contains` at base sensitivity, so case and accents do not
count; the button and the down arrow open it with every option. Focus
stays in the input and the active option moves virtually, by
`aria-activedescendant`; the arrows stop at the ends, and Home, End and
the page keys jump. Enter or a press chooses and closes, and the input
shows the option's text. Escape closes the list and puts the chosen text
back in one press: React Aria reverts the text as it closes, so the
second Escape the spec described has nothing left to do. Tab chooses the
active option, closes the list and moves on; with no active option it
puts the chosen text back. Leaving the field puts the chosen text back,
unless `allowsCustomValue`, and so does scrolling the page while the list
is open: the popover is not modal, and React Aria closes such a popover
when the page under it scrolls. It ignores scrolls while the visual
viewport resizes, for 500ms after each resize (`useOverlayPosition`), so
the soft keyboard opening on a phone, which resizes and scrolls the
visual viewport, repositions the list and does not close it; phones are
covered. With the input uncontrolled, emptying it
clears the value.

**Nothing matches.** `allowsEmptyCollection` is on by default, so the
list stays open with `div.picker-empty`, the Select's slate line, saying
"No matches" (`labels.empty`), or "Loading" (`labels.loading`) while
options load and the list has none yet, instead of vanishing, which
reads as a broken field.

**Manual mode.** For options from a server the app passes `items` and
`inputValue`, fetches in `onInputChange` and sets `isLoading` while it
waits. React Aria does not filter items the app controls, so the server
filters, ranks and caps, and the list keeps what it has until the new
results arrive. While the list is open React Aria hides everything but
the input and the list from assistive technology, the Spinner too, which
is why the empty list says "Loading" itself. React Aria puts the chosen
text back from the items, so the docs' example keeps the chosen item
among them whatever the last search found, skips the search a choice's
own text would start, and drops an answer to an older request.

**The server.** React Aria builds the collection by rendering the
combo box's children once into a template, and its popover renders its
content there too. The combo box puts a bare list there, without the
library's popover and its focus handling, and renders the popover only
with the combo box's state, as the Select does. On the server the input
already holds the chosen option's text and the button its name; the list
renders nothing until it opens. React Aria makes a collator for its
filter while a combo box renders, on the server too (risk R1): it
compares and writes nothing, and the server test renders a combo box
under `en-US` and `fa-IR` and finds the same HTML.

**Words.** The library writes three of its own, every one replaceable
through `labels`: `open`, "Show options"; `empty`, "No matches"; and
`loading`, "Loading". React Aria announces the number of options as the
list opens, the option as the active one moves, and the choice, in its
own strings. react-aria 3.53.1 ships them in 34 locales, Arabic and
Hebrew among them and no Persian, so on a `fa-IR` page they stay English
(spec correction 8).

**Screen readers.** Virtual focus is what VoiceOver on iOS follows
unevenly (risk R3). ComboBox with VoiceOver on iOS and TalkBack on
Android (the option read as the arrows move, a choice, the count): not yet
verified.

**Measured pairs.** The text, ink on raised: 18.43 in light and 15.36 in
dark, and the Spinner, which draws in it. The button's glyph at rest,
slate on raised: 5.49 and 6.44; pressed
or hovered it is ink on the 5% wash, 16.65 and 13.24, as the search
field's. The rows and the empty line are the Select's, ink and slate on
float. All of it is gated as text but the wash, a mix, which is
recorded. The placeholder, taupe on raised, is 1.58 and 3.68: under the
text minimum, which is why it is never the field's only label; it is
recorded and not gated. The unlabelled placeholder, slate on raised, is
5.49 and 6.44, gated as text already. No pair is added to the gate.

**Right to left.** The label and the text start at the right, the button
sits at the left, 6px inside the control, its chevron unmirrored since
it points down, and the list aligns to the control's right edge, its
start, through React Aria. Nothing in `combo-box.css` is physical.

**Forced colors.** The input keeps `input.css`'s rules, the button
`.input-button`'s, `CanvasText` and `GrayText` when disabled, and the rows
the Menu's; the Spinner's `currentColor` is the reader's text color.

**The size.** The size limit is 2.5 kB for `ComboBox`, the spec's
budget: the entry measured 1.9 kB, and the rule rounds up to 2 kB and
adds 0.5 kB.

## MultiSelect

A field that chooses several values from a list: `MultiSelect`, the
ComboBox in React Aria's multiple mode (ruling 1), its chosen values drawn
by `ComboBoxValue`'s render function as a React Aria `TagGroup` of bone
tags, in a frame that wears the text input's edge and grows a row at a
time. Its rows are the Select's `PickerOption` and `PickerSection`, and
its list is the ComboBox's.

**The spike (risk R2).** Before any wrapper code, React Aria's own
`ComboBox`, `ComboBoxValue`, `TagGroup`, `TagList`, `Tag`, `Input`,
`Button`, `Popover` and `ListBox` were driven with no wrapper, and the
tests stay in the suite (`multi-select/multiple-mode.test.tsx`) as the
record of what the wrapper relies on. Each held on react-aria-components
1.22.1: a form gets one hidden input per chosen key under the field's
`name`, `['food', 'rent']`, and one empty value when nothing is chosen,
`['']`; a choice keeps the list open and empties the input, by Enter and
by a press; after a tag is removed by Backspace or Delete, focus goes to
the next tag, or the previous one when it was the last; when the last
tag goes, React Aria focuses the tag grid itself, now an empty group; and
React Aria does nothing with Backspace in the input, so an empty input's
Backspace leaves the value alone. The fallback the spec held back, single
mode with a hand-kept list, was not needed.

**The frame.** The root is `.field.multi-select`, which carries
`data-changed`, `data-loading` and `data-unlabelled` from the wrapper and
React Aria's `data-open`, `data-invalid` and `data-disabled`. Under the
label row sits `div.input.multi-select-control`, the drawn frame: it is
`.input` on a `div`, so the hover, disabled, changed and invalid edges
`input.css` draws reach it through the field's root, written once. It
holds `ComboBoxValue.multi-select-value` with the tags, then the input,
`input.multi-select-input`, which has no edge or fill of its own, then
the Spinner while options load and the ComboBox's field button. The
frame takes React Aria's group ref, so the list opens under the whole
frame at its start and at least as wide as it, rather than under the
input at the input's width; it is a plain `div` and not React Aria's
`Group`, whose focus-within `data-focus-visible` would ring the whole
frame while a tag holds focus (spec correction 7). A press on the
frame's empty room, outside a tag, the input and the button, focuses the
input. Its rules are one class, after `input.css`, so they beat the
input's box and none of its states: `display: flex; flex-wrap: wrap;
gap: 0.25rem`, `height: auto` and `min-height: var(--size-field)`, and
`padding-inline: 0.5rem 3rem`, 4.5rem while options load.

**One row, a field tall.** A 36px tag in a frame with the spec's 6px of
block padding and a 1px edge is 50px tall, and 51px with the 1.5px edge
a focused, changed or invalid frame draws. So the block padding is
`calc(0.375rem - 1.5px)`, 4.5px, and `min-height` holds a one-row frame
at `--size-field`, 48, 36 or 44px, with either edge (spec correction 10).
The button and the Spinner stay level with the first row however many
rows the frame grows to, with either edge. A one-row frame centers its
row in the content box `min-height` holds, so a 1px edge leaves half a
pixel above the row that a 1.5px edge does not, and a wrapped frame has
no room to spare, its first row on the padding: no fixed offset fits
all three. So the button is centered, `margin-block: auto`, between
`inset-block-start: calc(0.375rem - 1.5px)` and an end that is the
padding's bottom while the frame is one row and the first row's bottom
once it wraps: `calc(0.375rem - 1.5px + clamp(0px, (100% + 1px -
var(--size-field)) * 100, 100% + 3px - var(--size-field)))`, where
`100% + 3px - var(--size-field)` is the room beyond one row and its
padding, 0 to 1px for one row and a row and more once wrapped, and the
clamp turns it into nothing for the first and all of it for the second.

**The corner.** `min(var(--radius-pill), calc(var(--size-field) / 2))`:
a full pill while the frame is one row, 24px on a 48px frame, and the
24px surface step once it wraps, as TextArea's frame is, instead of a
stadium that clips the tags at its ends. Soft and Square take their own
smaller pill. The halving is written in `calc()`, since the token rule
reads a bare `/ 2` as a literal radius (spec correction 11).

**The focus ring.** While the input has keyboard focus the frame draws
`.input`'s focus edge and ring, by
`.multi-select-control.input:where(:has(.multi-select-input:is(:focus-visible, [data-focus-visible])))`.
Written plainly the `:has()` weighs three classes, the weight of the
changed edge, and coming later it would replace a changed or invalid
edge with the focus edge, which `input.css` never does; in `:where()` it
weighs two, so it beats the hover edge by order and loses to the changed
and invalid edges (spec correction 12). It is never `:focus-within`: a
focused tag rings itself, outside its pill, and the frame draws nothing.

**The tags.** Built from `state.selectedItems`, React Aria's nodes, by
`key` and `textValue`, in the order chosen: `ComboBoxValue`'s own values
are the options' object values, `null` for static children (spec
correction 13), so an option whose label is not a string needs a
`textValue`, which its tag shows. `TagGroup.multi-select-tags` is named
"Selected" (`labels.selected`) and the field's label, "Selected
Categories"; with no visible label, "Selected" and the field's
`aria-labelledby`, or "Selected" joined to its `aria-label`, never
"Selected" alone, and holds `TagList.multi-select-tag-list`, a `grid`, of
`Tag.multi-select-tag`. A tag is concentric with the frame, the frame's
corner less the 6px between them, a pill in Rounded and 6px in Soft,
`calc(var(--size-field) - 0.75rem)` tall, 36px and 24px
compact, `padding-inline: 0.75rem 0.25rem`, on bone, its label in
`--text-small` at 500, ink, one line and ellipsized past 12rem; its
whole text stays its name. The value and the group are `display:
contents`, so the tags flow in the frame; the grid keeps its box, since
an element with a role never leaves the box tree. Nothing collapses into
"and 3 more": the frame grows a row at a time.

**The remove button.** `Button slot="remove"`,
`.multi-select-tag-remove`: a 20px ghost circle with a 12px slate `X`,
ink on the 5% wash when hovered or pressed, named "Remove" and the tag
(`labels.remove`; React Aria reads it with the tag's text, "Remove
Food"). Its hit area is extended to 24px by a pseudo-element, which meets
WCAG 2.5.8 next to a neighbor 4px away because the extension stays
inside the tag's own padding; it is not extended to 40px, which would
cover the next tag. It is out of the tab order, so the tags are one
stop: React Aria's tag grid would otherwise move Tab from a tag into its
button, and Backspace or Delete on the tag does the same.

**Choosing.** A press or Enter toggles an option, and the list stays
open for the next: React Aria closes on a choice in single mode only.
The input empties, so the next search starts clean, unless the app
controls both `value` and `inputValue`, when it empties the text in its
own `onChange` (spec correction 14). A chosen row shows the check alone,
no ink pill: the Menu's multiple rule. One Escape closes the list and
empties the input. Tab and Shift+Tab close the list and move on, and
never change the value: in multiple mode React Aria's Tab commits the
active option, which toggles it, so a Tab after Enter would undo the
choice. The frame clears the active option in the capture phase before
React Aria's handler runs, which sends its commit down the path that
closes the list and toggles nothing. Typed text is dropped on leaving
the field.

**Removing and focus.** A tag's remove button; Backspace or Delete on a
focused tag; and Backspace in an empty input, which first focuses the
last tag and removes it only on a second press, so one key never loses a
value unseen. After a removal focus goes to the next tag, or the
previous one when it was the last, React Aria's list state; when none is
left the tag group leaves the page, and the wrapper hands focus to the
input once it has. The tags are one tab stop before the input, and the
arrows move between them in the drawn direction.

**While the list is open.** React Aria hides all but the input and the
list from assistive technology, the tags too, and leaves them focusable
by design. They stay in reach: a press on a tag's remove button removes
it and the list closes, and Shift+Tab from the input reaches the tags
and closes the list. Axe's `aria-hidden-focus` is skipped on
`.multi-select-value` alone in the open stories and tests, by the
rule's selector, as `MENU_ROW_A11Y` scopes its own exception. A
Backspace in the empty input closes the list first and focuses the last
tag once the tags are read again.

**Read only.** `isReadOnly` keeps the tags a grid, focused and read,
with no remove buttons, no `onRemove` and no Backspace removal from the
input, so React Aria's "Press Delete to remove tag." is not read either.

**Disabled.** The frame's disabled look, the input disabled, and the
tags taupe with no remove buttons. React Aria's tag grid keeps itself in
the tab order even with every tag disabled, so a disabled field draws
its tags in a `group` named as the grid is, with `aria-disabled`, read
and never focused: a `list` takes no `aria-disabled`, and that attribute
is what says the taupe text is disabled text.

**The placeholder.** The input's own, shown only while nothing is
chosen: taupe, the whisper, under a visible label, and slate where only
an `aria-label` names the field (`data-unlabelled`), the exception the
search field and the command palette recorded, since the placeholder is
then all that says what the field is for. Taupe again while disabled.

**Forms and URL state.** `name` submits one value per chosen key through
React Aria's hidden inputs, and a form's reset puts the default values
back. `value` is `readonly Key[]` and `onChange` receives `Key[]` (spec
correction 9). For URL state the app passes `value` from a repeated
parameter or a comma-joined one and writes it in `onChange`.

**The server.** The frame renders in Node with a tag per chosen option
and a hidden input per key, and no list; the popover renders only with
the combo box's state, never in React Aria's hidden collection pass, as
ComboBox's does.

**The input's description.** React Aria describes the input by
`ComboBoxValue`'s element, so a screen reader hears each tag's text and
its remove button's name after the field (open question 4). How it
sounds is recorded with the screen-reader check below.

**React Aria's words.** Beside ComboBox's announcements, React Aria
describes a focused removable tag with its own "Press Delete to remove
tag.", from the same locales, which have no Persian, so on a `fa-IR`
page it stays English as they do.

**Measured pairs.** The tag's text, ink on bone: 16.76 in light and
15.36 in dark. The remove glyph at rest, slate on bone: 4.99 and 6.44, a
graphic that needs 3:1 and has the text minimum. Both are gated. The
hovered or pressed glyph, ink on the 5% ink wash over bone: 15.15 and
13.24, a mix, recorded and not gated. Bone against raised, the tag on the
frame: 1.10 and 1.00, a cue that the tag's own text carries, never a
boundary anyone has to find. The frame's text, button and placeholder
are the ComboBox's pairs on raised; the unlabelled placeholder, slate on
raised, is 5.49 and 6.44. No pair is added to the gate.

**Right to left.** The tags run from the frame's right, the button sits
at the left, 6px inside the frame's edge, its chevron unmirrored, and
React Aria's arrows between tags follow the locale, so under `fa-IR`
Arrow Left moves to the next tag. Nothing in `multi-select.css` is
physical.

**Forced colors.** The bone fill does not survive, so a tag takes a 1px
`CanvasText` border and its remove glyph is `CanvasText`; a disabled tag
is `GrayText`, edge and text. The frame keeps `input.css`'s rules.

**Screen readers.** MultiSelect with VoiceOver on iOS and TalkBack on
Android (the option announced as the arrows move, a choice, a tag's
removal, what the input's description reads): not yet verified (risk R3).

**The size.** The size limit is 3.5 kB for `MultiSelect`, the spec's
budget: the entry measured 2.72 kB, and the rule rounds up to 3 kB and
adds 0.5 kB.

## Tabs

Views of one page as a row of pills: `Tabs`, `TabList`, `Tab` and
`TabPanel`, React Aria's tabs with the library's classes. "Still missing"
derived them with the Design panel's Colors card, and this is the record.

**The track.** The segmented control's row, without its field: the
`TabList`, `.tab-list`, is a `role="tablist"` row of 40px tabs,
`--size-control`, concentric with a track padded 4px with the surface corner,
`--radius-surface`, 24px Rounded, 12px Soft and square Square, on canvas
with no edge. A tab switches what is shown and holds no value, so the
track does not read as a field. On a card it shows as a tint, canvas on
lifted, 1.10 in light and 1.11 in dark, a cue the pills carry and never a
boundary anyone has to find; on the page's own canvas it disappears and
the pills carry the row. The row is horizontal only: `orientation` is
not in the props.

**A row that does not fit.** The track scrolls inline inside itself,
`overflow-x: auto` with the thin scrollbar in `--color-scrollbar`, and a
tab never wraps or shrinks (`white-space: nowrap; flex: none`), so a long
row scrolls and the page never scrolls sideways; the root's single
column is `minmax(0, 1fr)` for the same reason. The track's 4px of
padding is the room a focus ring stands out, 2px of ring 2px off, so a
ring on the first or last tab is not cut by the scroll box.

**The scroll after mount.** After the first paint that holds the
selected tab, once, `TabList` brings it into the row's view by moving
the row, `list.scrollBy({ left })` by the distance from the tab's edge
to the row's padding edge, in either direction (spec correction 18).
`scrollIntoView` would scroll every scrolling ancestor, the page
included, so a row below the fold would move the page on load. React
Aria builds its collection after its first render on the client, so the
effect is keyed to the tab list's state, its selected key and its size,
and runs until the selected tab is there. A tab that takes focus later
scrolls into view as the browser does for focus. The selection can also
move later from outside the row, as Back does with link tabs: each time
the selected key changes and the selected tab does not hold focus, the
row brings it into view the same way. The condition is the selected tab
and not the whole row because after a press on a link tab focus stays on
that tab, so Back would otherwise leave the new selection out of view;
when the selected tab holds focus the browser has shown it already. A
row mounted hidden, in a closed section or a panel not yet shown, has no
width and every box at zero, so while `list.clientWidth` is 0 nothing is
measured and the key is not marked as shown; a `ResizeObserver` watches
the row and brings the tab into view once it is drawn, then disconnects.
Nothing is measured before the first paint. The server's HTML
shows the start of the row and the selected tab arrives on hydration
(R6). The harness shoots at 1280 and 375px and Storybook renders on the
client, so the `Overflow` story records the look after, eight tabs in a
20rem box with the last selected, and the docs' test with JavaScript off
records the look before: the server's row starts at its first tab, its
last past the row's end (spec correction 19).

**A tab.** `.tab`: `min-height: var(--size-control)`, 40px and 36px
compact, `padding-inline: 1rem`, `--radius-pill`, `--text-action` at its
500 weight, slate at rest. It is hit at the target by the formula every
control shares, `inset-block: min(0px, (100% - var(--size-target)) /
2)`, so a 36px compact tab reaches 2px into the track's padding. A tab is
a `div`, or an `a` when it has `href`.

**Hover and press.** The 5% ink wash with the text turned ink, inside
`@media (hover: hover)`, never on the selected or a disabled tab; a
press shows the same look on any pointer. Slate on the wash over canvas
measures 4.38 in light, under the 4.5 text minimum, and 6.93 in dark;
ink on it is 14.70 and 17.41. SegmentedControl turns its hovered option
ink for the same reason (spec correction 16).

**Selected.** The ink pill with canvas text, `[data-selected]` beside
`[aria-selected='true']`, so the server's HTML and a hand-written row
draw it the same: canvas on ink, 16.25 in light and 19.31 in dark,
gated. Keyboard focus on an unselected tab is the standard ring outside
it; on the selected tab the ring inverts to canvas and stands inside the
pill, as far in as the standard ring stands out, SegmentedControl's
rule, since an ink ring around an ink pill reads as part of it.

**Disabled.** Taupe text, `cursor: not-allowed`, and no wash. React
Aria's arrows skip a disabled tab, and a single disabled tab is never
selected. A whole row with `isDisabled` keeps its selection, and taupe on
the ink pill would be 11.65 in light, reading as live, and 1.00 in dark,
gone, so a disabled tab
that is selected is SegmentedControl's chosen disabled option: a taupe
pill, `--color-taupe`, with the disabled fill, `--color-disabled`, for
its text. The text on the pill measures 1.44 in light and 3.43 in dark
and the pill on the track 1.40 and 3.81, recorded, since disabled is
outside the text and graphic minimums. The `Disabled` story draws a row
with one disabled tab and a whole disabled row.

**The changed dot.** `isChanged` is for a tab whose panel holds unsaved
edits, and only that: clay means unsaved. A 6px dot, `--radius-dot`,
clay, `margin-inline-start: var(--spacing-part)`, after the name and
centered on its line. Clay on the canvas track is 6.20 in light and 7.57
in dark, gated. On the selected ink pill clay would be 2.62 and 2.55,
under the 3:1 a graphic needs, so there the dot takes a canvas ring the
focus ring's width, `outline: var(--focus-ring-width) solid
var(--color-canvas)`, which carries its shape at 16.25 and 19.31. The
dot is drawn and hidden, `aria-hidden="true"`; the words, "Changed" or
`changedLabel`, sit in a `hidden` span the tab's `aria-describedby`
names ahead of the caller's own ids. A description reads a hidden
element it names directly, so a screen reader hears "Rules, tab, 2 of 4,
Changed" and the name stays "Rules"; a visually hidden span would join
the name instead (spec correction 15). On a disabled selected tab's
taupe pill the dot keeps its canvas ring: clay on the pill is 4.45 in
light, which reads without the ring, and 1.99 in dark, where the ring
on the pill, 3.81, carries the shape; the clay inside the ring is clay
on canvas, 6.20 and 7.57, either way. A count or a "new" marker goes in
the tab's name, in a `Badge`, never in clay.

**A badge in a tab.** `.tab .badge { color: inherit; }`: a badge takes
the tab's color, and its edge follows, since badge.css draws the border
in `currentColor`. In its own slate it would be 3.36 on the selected ink
pill in light and 1.00, gone, in dark, and 4.38 on the hover wash in
light, under the text minimum; in the tab's color it is slate on canvas
at rest, canvas on ink selected and ink on the wash under the pointer,
the pairs below. A tone class on a badge in a tab gives way to the
tab's color for the same reason: link, success, warning and error are
not measured on ink. The `WithBadge` story selects the tab with the
badge and runs in the light and dark projects under axe.

**Link tabs.** Tabs whose views each have a URL (ruling 3): each `Tab`
has `href`, which React Aria renders as an anchor with the tab role; the
app passes `selectedKey` from the URL, no `onSelectionChange`, and
`keyboardActivation="manual"`. The arrows then move focus and load
nothing, and Enter, Space or a press opens the focused tab's link
through `RouterProvider`, React Aria's link behavior for tabs, and puts
the selection back where the URL has it. React Aria leaves Space's
default to the anchor, and Chromium then scrolls the page as well, so a
link tab stops that default itself. The app renders one `TabPanel`
whose `id` is the selected key, holding the route's content, so
`aria-controls` points at what is there. A modified or middle click
opens the link as the browser would. A site's top navigation between
whole pages is a row of plain links with `aria-current="page"` instead.

**Keys.** React Aria's, pinned by the unit tests and the `Keys` story.
Left and Right move between tabs in the drawn direction, so under a
right-to-left locale Left moves to the next tab; they wrap from the last
tab to the first and skip a disabled tab; Up and Down do nothing in the
horizontal row. Home and End jump to the first and the last. With
automatic activation, React Aria's default, the tab focused is
selected; with manual activation Enter or Space selects it, or follows
its link. Tab enters the row at the selected tab and moves on into the
panel, which React Aria makes a stop of its own when it holds nothing
focusable.

**The panel.** `.tab-panel` sits `--spacing-peer` under the track and
spans the root. Only the selected panel is mounted, unless
`shouldForceMount` keeps the others; React Aria renders a force-mounted
panel that is not selected with `inert` and `data-inert` and nothing
that hides it, so `.tab-panel[data-inert] { display: none; }` does (spec
correction 17). A panel that takes focus shows the standard ring on
keyboard focus only.

**Measured pairs.** Gated: slate on canvas, a resting tab, 4.84 in light
and 7.26 in dark; canvas on ink, the selected tab and the dot's ring,
16.25 and 19.31; clay on canvas, the dot, 6.20 and 7.57. Measured and
recorded, not gated: ink on the 5% wash over canvas, a hovered tab,
14.70 and 17.41; slate on that wash, 4.38 and 6.93, the reason a hovered
tab turns ink; clay on ink, 2.62 and 2.55, the reason for the dot's
ring; the canvas track on lifted, 1.10 and 1.11; slate on ink, 3.36 and
1.00, the reason a badge in a tab takes the tab's color; on the taupe
pill of a disabled selected tab, the disabled fill as text 1.44 and
3.43, the pill on the track 1.40 and 3.81, and clay 4.45 and 1.99. No
pair is added to the gate.

**Right to left.** The row runs from the right through logical
properties, and the dot sits at the name's left. Nothing is mirrored.

**Forced colors.** The selected tab is `Highlight` with `HighlightText`,
and its inverted ring `HighlightText`; a disabled tab is `GrayText`, and
a disabled selected one a `GrayText` pill with `canvas` text,
SegmentedControl's rule; the dot is `CanvasText`, and `HighlightText`
ringed in `Highlight` on the selected tab.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule, no part, such as a badge, has a fill of its own, and a
disabled selected tab, canvas on `GrayText`, is drawn the same way. The
docs check what Chromium draws.

**The server.** The row renders in Node with every tab, `aria-selected`
on the selected one, the dot and its words, and the selected panel; the
scroll is an effect, which a server never runs.

**The docs' own tabs.** The docs site's Preview and Code tabs are this
part (spec correction 1): `<Tabs className="preview">` with the
`TabList` in the preview's head and both panels force-mounted, so both
stay in the page as before, the one not selected inert and hidden. The
docs' own `.tabs` and `.tab` rules are gone, so no docs page draws a
second tab look (risk R4), and its tabs grow from the docs' 36px to the
part's 40px. A preview whose example holds nothing focusable is now a
tab stop of its own after the row, React Aria's panel rule.

**Screen readers.** Tabs with a changed dot in VoiceOver on macOS and
NVDA: not yet verified (risk R3).

**The size.** The size limit is 2.5 kB for `Tabs, TabList, Tab,
TabPanel`: the entry measured 919 B under the spec's 1.5 kB budget, and
1.38 kB once the tab stop and the click with no pointerdown came in patch
0.6.1, which the rule rounds up to 2 kB and adds 0.5 kB.

**The tab stop before hydration** (patch 0.6.1). React Aria gives the row
its tab stop in an effect, by setting its focused key to the selected tab,
so the server's HTML, and every render before that effect, had every tab
at `tabindex="-1"`: the row could not be reached by Tab, and axe reported
a row that overflows as a scrollable region no key reaches
(`scrollable-region-focusable`). React Spectrum collapses an overflowing
row into a picker, Radix leaves the row as it is, MUI scrolls a wrapper
around a tablist whose selected tab holds `tabIndex` 0 from its first
render, and GOV.UK stacks its tabs as links on a phone. The library keeps
the row as its own scroller and gives it MUI's stop: while React Aria has
no focused key that names an enabled tab, the selected tab is the stop,
or the first enabled tab when the selected key names none, as a URL's can.
That is the tabs pattern's one stop, so no second stop is added for the
scrolling region, and axe finds it: the region holds a focusable element.
Once React Aria has its key, its own `tabIndex` stands.

**A click with no pointerdown** (patch 0.6.1). React Aria starts a press
on pointerdown and cancels a click on a link tab it saw no press for, the
anchor's own navigation with it, so such a click opened nothing. A real
click reaches a tab that way when its pointerdown came before React
listened, as a touch that begins before hydration and ends after it
does, and React Aria draws every tab again just after hydration, so the
touch ends on a new element that saw none of it. Such a click is sent
again as a click with no pointer, the click React Aria follows as a
screen reader's: it selects the tab or opens its link once, through the
`RouterProvider` or natively. React Aria's own clicks pass: a keyboard's
or a screen reader's has no click count, and the click it sends to open
a link natively has no view, so it is never cancelled in turn. A
modified click on a link tab stays the browser's, a new tab or window. A
mouse press held across hydration still opens nothing: the browser sends
no click when the pressed element is replaced, and guessing the target
from what stays active could open the wrong tab or open a link in place
of a new window. A DataTable row's link is React Aria's Link, which
already follows a click with no pointerdown. The docs check a touch
across hydration, holding the server's element until it leaves the page,
and count the navigations: exactly one.

## Pagination

Pages of rows: Previous, numbered pages with gaps and Next beside the
range the app writes, as `Pagination`. "Still missing" derived it with
the Design panel's Colors card, and this is the record.

**The shell on the server.** Ruling 4: the part a server page renders.
`pagination/Pagination.tsx` has no hooks, no client directive and no
React Aria import, so a server component renders it and passes it
functions. It computes the page items, clamps the page, and calls
`getPageHref`, `pageLabel` and `labels.page` where it renders; its three
client leaves receive only strings, numbers, booleans and the children
it renders (the chevrons and the words). `PaginationLink` is React
Aria's Link, so a press routes through `RouterProvider`;
`PaginationButton` is React Aria's Button, for button mode, which takes
`onPageChange` and belongs in a client component, since a function
cannot cross to the client; `PaginationStatus` is the spoken range. None
is exported. The two chevrons are inline SVG with Lucide's own geometry,
`m15 18-6-6 6-6` and `m9 18 6-6-6-6`, 24 by 24, stroke 2, round caps
and joins, `currentColor`, since a Lucide icon is a client module and
would make the shell one (spec correction 20).

**Markup.** `nav.pagination`, named by `labels.navigation`, which is why
`aria-label` is not in the props, and carrying the range as
`data-range`, holds `div.pagination-box`, the size container, around
`div.pagination-row`, and then the status (patch 0.6.1, "A width of its
own"). The row holds `p.pagination-range`, the visible range, and,
while there is more than one page, `ol.pagination-list` of
`li.pagination-item` with `data-kind` `step`, `page` or `gap`: Previous,
the pages and gaps, Next. With one page or none the range shows alone.
The range is slate at the `--text-small` step with tabular figures, and
it is the app's sentence, so it wraps between words inside the row,
`min-width: 0; overflow-wrap: break-word`, and breaks a word only when
that word alone is wider than the row. It was `anywhere` until patch
0.6.1, which also lowers the range's min-content width to one letter, so
a parent that sized the nav from its content drew the range a letter a
line (below).

**Seven slots.** `pageItems` gives the first page, the last, the current
one with `siblingCount` each side (1 by default), and a gap where pages
are left out; a gap that would stand for one page shows that page
instead. The row always has `2 * siblingCount + 5` slots, seven by
default, wherever the current page is, so the controls never move under
the pointer as the page changes; every page shows when there are no more
pages than slots. Page 1 of 26 is `1 2 3 4 5 … 26`, page 12 is
`1 … 11 12 13 … 26`, page 26 is `1 … 22 23 24 25 26`.

**A control.** `.pagination-control`: a 40px pill, `--size-control`
(36px compact), at least as wide as it is tall, `padding-inline: 0.5rem`,
`--radius-pill`, transparent, ink text at the `--text-action` step and
its 500 weight, with tabular figures. It is hit at the target by the
formula every control shares, `inset-block: min(0px, (100% -
var(--size-target)) / 2)`, so a 36px compact control is hit at 40px. A
page's text is `pageLabel(n)`, `String(n)` by default, isolated with
`unicode-bidi: isolate`, so digits in any script read as one run in
either direction; its name is `labels.page(pageLabel(n))`, "Page 3",
which contains the text you see. A gap is a slate ellipsis,
`span.pagination-gap`, hidden from assistive technology.

**Hover and press.** The 5% ink wash inside `@media (hover: hover)`, and
the same on a press on any pointer, never on the current page or a
disabled step. Ink on the wash is 14.70 in light and 17.41 in dark over
canvas, and 16.11 and 15.25 over lifted, so the text stays ink.

**The current page.** The ink pill with canvas text, matched as
`aria-current` ("page" on a link, "true" on a button) or React Aria's
`data-current`, so the server's HTML draws it. A press on it calls
nothing in button mode. Keyboard focus on another control is the
standard ring outside it; on the current page the ring inverts to canvas
and stands inside the pill, SegmentedControl's rule.

**The steps.** `pagination-control pagination-step` with `data-step`,
`padding-inline: 0.75rem`, a 16px chevron and the word,
`span.pagination-step-label`, which names the step. At either end the
step is disabled: in link mode a React Aria Link with `isDisabled` and
no `href`, which React Aria draws as a span with `role="link"`,
`aria-disabled` and `data-disabled` and no tab stop, and the app's
`getPageHref` is never asked for a page outside the range; in button
mode a disabled button. A disabled step is taupe with `cursor:
not-allowed` and no wash. The chevrons point the way they go:
`[dir='rtl'] .pagination-step svg { scale: -1 1; }`, the sidebar's rule,
so Previous, at the right in right to left, points right. Nothing else
is mirrored.

**Narrow.** The box inside the nav is a size container, `container:
pagination / inline-size` (the nav itself until patch 0.6.1), and under
30rem of it the numbers and gaps leave, the step
words become visually hidden and stay the steps' names, and the range
sits centered between the two steps: the list is laid over the range in
one grid cell and spreads the steps to the ends, and the range is kept
`2 * var(--size-control) + 1rem` clear of them. A container query styles
only what is inside the container, never the container, so the row
inside the nav is what the query re-lays (spec correction 24). A phone
keeps two 40px targets and the range; a narrow column on a wide page
narrows too.

**A width of its own** (patch 0.6.1). A size container takes no width
from its content: under inline-size containment its min-content and
max-content widths are zero. An app put Pagination in a flex row with
`justify-content: space-between` beside a "Show 100 a page" link, at a
desktop width of about 1870px, and the row sized the nav from its
content, zero: under 30rem of it the narrow row drew, the range in a
column one letter wide, since `anywhere` let it break between any two
letters, and the steps' list wrapped them one over the other. An `auto`
grid column did the same, and so did the app's own row with `flex-wrap:
wrap` at 1440px. The library's own Pagination baselines had drawn it so
from the start: the stories sat in Storybook's centered canvas, which sizes its
content from the content's width, and their 48rem box resolved its 100%
against that, so every picture held a range one letter wide; the stories
now sit in the padded canvas. So the nav is no longer the container:

- `div.pagination-box` inside it is, and the queries read its width,
  which is the nav's.
- The nav takes its intrinsic widths from the narrow row, drawn and never
  seen: `.pagination::before` writes the range again from `data-range`,
  at the range's step, with a control and half a rem each side, the room
  the range keeps clear of the steps under 30rem, in a block 0 tall,
  hidden, and so out of the accessibility tree. Its min-content width is
  the range's longest word and the two steps, about 172px for "1 to 50 of
  1,284 transactions", and its max-content width the range on one line
  and the two steps, 277px, capped at 18rem, the content of a 320px
  phone. A parent that sizes the nav from its content, an `auto` grid
  column or a `fit-content` box, draws the narrow row whole, and never a
  word broken.
- `flex: 1 1 0` takes the room its siblings leave in a flex row, from a
  zero basis, so a sibling such as the link keeps its own width and never
  shrinks for the nav, at a desktop width and on a phone alike; the
  automatic minimum, the narrow row's min-content width, keeps the nav
  from narrowing past its longest word, and in a wrapping row moves the
  link to a line of its own first.
- `max-block-size: max-content` keeps that flex from making it taller
  than its row in a flex column with room to spare, where `flex` works on
  the block axis. Chromium and WebKit honor it; Firefox treats an
  intrinsic keyword in the block axis as the initial value (Mozilla bugs
  567039 and 1597055), so there a nav that is the direct child of a flex
  column with room to spare takes a share of that room below its row.
  The play checks the cap where the engine honors it.

A stand-in width, `contain-intrinsic-inline-size` on the nav as the
container, was tried first: it sets the min-content and max-content
widths alike, so 18rem, wide enough for the narrow row, pushed the docs'
320px pages 22 to 50px sideways inside the centered stage, which sizes
its column from min-content. In a block, or a grid column sized with
`fr`, the nav fills the width as before. The `Checks/Pagination layout`
stories hold it in eight parents at 1280px and 375px, in link and button
mode and the short form, in three engines, a wrapping flex row among
them: the range one line at 1280px except in the `auto` column,
the controls on one line, the nav its row tall, the link at the row's
end, no control outside the nav, the range never narrower than its
widest word, and nothing scrolling sideways. The docs' "In a row" section
and its example say which parent gives which width. DataTable and
StatTile, the only other parts that set a container on their own root,
had the same trap (their records). FilterBar, SegmentedControl and Tabs
set none: FilterBar reads the viewport, and the
DataTable bulk bar is a plain wrapping flex row.

**Just above narrow.** Under 36rem of the nav the step words become
visually hidden names and the steps chevron circles, `padding-inline:
0`, while the numbers stay. The threshold is the worded row at the
default `siblingCount` on a coarse pointer, whose compact control is
44px: 7 slots of 44px are 308px, the 8 gaps of 0.25rem 32px, and the
two steps 0.75rem of padding each side, the 16px chevron, the 0.25rem
gap and the word, measured at 99px for Previous and 75px for Next, 174px
together: 514px, 32.1rem, wider than its container from 30rem to about
32rem before this band. 36rem leaves about 62px for longer words in
another language. Without the words the same row is 9 circles and 8
gaps, 428px, inside 30rem. Two siblings on a coarse pointer are 11
circles and 10 gaps without the words, 524px, still wider than a nav
just above 30rem, so as a last resort `.pagination-list` takes
`flex-wrap: wrap; justify-content: flex-end`, and wraps to the inline
end, the left in right to left, rather than push the page sideways.
The `JustAboveNarrow` story, in a 31rem column, and the docs'
`pagination-siblings` example, in a 30.5rem one, hold this with no
sideways scroll.

**The short form.** `hasPageNumbers={false}`, for an endless or
cursor-paged list, draws no pages and no gaps, and its row, marked
`data-page-numbers="false"`, is the narrow row at every width: Previous,
the range and Next. The steps keep their words as names. Drawn at every
width, the range sits between two steps of a known size, which a
centered range between two worded steps would not.

**The spoken range.** `span.pagination-status`, `role="status"` and
visually hidden, is empty at first render, so loading a page says
nothing, and takes the range `QUIET_MS` after it last changed: three
quick presses of Next say one range, the third. The effect compares the
range with the last one it saw, so the first render and Strict Mode's
second effect find nothing to say, and a later change back to the first
range is spoken again. The visible range is not live, so it is never
read twice. `QUIET_MS`, 600ms, moved from CommandPalette into
`utils/quiet.ts`, and both parts import it, so the two pauses stay one
number (spec correction 22).

**The focus handoff.** A step that disables while it holds focus, Next
on reaching the last page, hands focus on, so it never falls to the
page: to the current page's control, or, when that cannot take focus
(the numbers hidden, or not drawn under 30rem), to the other step. The
step remembers it had focus until focus moves to another element, since
a disabled link step is a new element (the anchor becomes a span) and a
disabled button drops focus; after the commit that disables it, a layout
effect moves focus unless it already went somewhere else on purpose. A
blur with no related target keeps the flag only while the step is gone
from the page or disabled, `:disabled, [aria-disabled="true"]`: focus
that goes to nothing from a step still there and enabled, a click on
the page around it, clears the flag, so a later disable does not pull
focus back into the row.

**Edges.** The shell cleans its inputs once and uses only the clean
values, for the page items, the clamp, the steps' disabling and whether
the list is drawn: `pageCount` is its whole pages, `Math.max(0,
Math.trunc(pageCount))`, and none when it is not a finite number, so
25.5 is 25 and `NaN` or `Infinity` draws the range alone; `siblingCount`
is likewise whole and at least 0, and 1, the default, when it is not a
finite number. A cursor-paged list needs no infinite count: the docs
pass `pageCount={hasMore ? page + 1 : page}`. A `page` that is not a
whole number from 1 to the count is clamped, and the status leaf warns
once per mount in the console: "Pagination: page 2.5 is not a page of 1
to 26; showing page 2.", and with no pages, "Pagination: page 3 is not
a page, since there are no pages; showing the range alone." The shell
has no effects, so it passes the sentence to the leaf (spec correction
21).

**URL state and R5.** Link mode is the consumer's: the server page reads
the page from its search parameters, builds each URL and passes the
range it formats. The docs' `pagination-links` example reads the page
in a client component under `Suspense`, since the docs pages are static,
and the end-to-end test proves the status region stays the same element
across the soft navigation and speaks the new range: verified for a
client parent; a server parent that re-renders on a `?page` change is
not yet verified (spec correction 23). If it does not speak there, the
docs advise rendering Pagination in the layout segment that persists.

**Measured pairs.** Gated: ink on canvas, a control, 16.25 in light and
19.31 in dark, and on lifted 17.84 and 17.42; canvas on ink, the current
page and its ring, 16.25 and 19.31; slate on canvas, the range and the
gap, 4.84 and 7.26, and on lifted 5.31 and 6.94. Measured and recorded,
not gated: ink on the 5% wash over canvas, 14.70 and 17.41, and over
lifted, 16.11 and 15.25. No pair is added to the gate.

**Forced colors.** The current page is `Highlight` with
`HighlightText`, and its inverted ring `HighlightText`; a disabled step
is `GrayText`.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule. The docs check what Chromium draws.

**The server.** The shell renders under React's server build with
`getPageHref`, and its HTML holds every link's `href`, the current
page's `aria-current`, the gaps, the chevrons and an empty status
region; with the leaves stood in for, no function reaches them. In
button mode, rendered as a client tree, the HTML holds the buttons, the
current page's `aria-current="true"` and no `href`.

**Screen readers.** Pagination's spoken range in VoiceOver on macOS and
NVDA: not yet verified (risk R3).

**The page size picker** (the owner's addition in batch 4, spec
corrections 109 and 112 of the documents plan). `pageSize`,
`pageSizeOptions` (10, 25, 50 and 100 by default) and
`onPageSizeChange(pageSize, page)`, typed together or not at all, draw a
rows-per-page picker at the row's start: a native `select` in a client
leaf, as Polaris draws its page size, labelled "Rows per page"
(`labels.pageSize`) by a `label` tied to it through `for` and an id from
`useId`, beside it at the range's small step in slate. The select wears
`.input`, so its edge, raised fill, hover, focus edge and ring and
radius (`--input-radius`, the pill unless a holder sets it) are the text
field's and the Select trigger's; it is as tall as the page controls
(`--size-control`), drops its own arrow (`appearance: none`) and draws
Lucide's chevron down in slate inside its inline end, a part step from
the value and 1rem from the edge, in `CanvasText` under forced colors,
and on the left in right to left. Its options are written with
`pageLabel`, so Persian digits reach them, and the current size is
always among them. It imports nothing from React Aria: a phone opens its
own wheel or sheet, the keys are the platform's (Up and Down choose at
once on Windows and Linux and open the list on a Mac), and its HTML on
the server is the working control with its size selected. A new size is handed on with the page that holds the first
row of the current page at that size, so the reader keeps their place;
the range stays the app's sentence, said politely once it settles. With
the picker the step words become hidden names under 54rem of the box,
the list wraps to its own line at the end below about 47rem, and under
30rem and in the short form the picker takes its own line above the
steps; nothing scrolls sideways at 320px, and right to left mirrors it.
It calls a function, so a client component renders it, in either mode;
a server page renders Pagination without it. Without it nothing is drawn
differently, so the 0.6.1 row and box are unchanged.

**The size.** The size limit is 2.5 kB for `Pagination`, above the
spec's 1.5 kB budget: the entry measured 1.55 kB, the shell with its
three client leaves, the page items and the focus handoff, and the rule
rounds up to 2 kB and adds 0.5 kB. With the cleaned inputs, the warning
for no pages and the blur rule it measures 1.63 kB, inside the limit.
With the page size picker on the library's Select it measured 4.05 kB
without React Aria and 55.56 kB with it, since every Pagination, a
server page's that cannot show the picker included, carried Select's
list, popover and option. As a native select (spec correction 112) it
measures 2 kB without React Aria, which the rule sets at 2.5 kB, the
limit it had before the picker, and 13.48 kB with it, the links' and
buttons' React Aria alone; a watch-only entry, "Pagination with React
Aria", holds that at 20 kB, so Select coming back would fail it.

## The server face

The rule every date and number part shares (filters spec, ruling 1).
Each renders React Aria's component on the server and in the browser,
so the label, the hint, the error line, the hidden form inputs and every
id are in the server's HTML. What React Aria derives from `Intl`, the
clock or the platform never is: on the server and through the hydration
pass each part draws its face, the same element tree with that text left
out or replaced by a string written without `Intl`, and from the first
render after hydration React Aria's own text. React Aria may build a
formatter inside a render, as the pickers' risk R1 accepted its
collator, as long as nothing it formats reaches the server's HTML or the
hydration pass. The face is never a second component, so nothing
remounts on hydration.

**When.** `useHydrated()` in `utils/useHydrated.ts`, moved from the
collapsible card, is `useSyncExternalStore` with a client snapshot of
true and a server snapshot of false: false on the server and through the
hydration pass, true from the render after, and true from the first
render of a part first rendered in the browser, such as one inside a
popover or a sheet, which therefore never shows a face.

**Per part.**

| Part | What React Aria writes from `Intl`, the clock or the platform | The face |
| --- | --- | --- |
| NumberField | The input's text; `inputMode` from an iPhone or Android check; a localized `aria-roledescription` | The value by integer arithmetic in ASCII digits with no grouping ("-1234.50") as the input's `value`; `inputMode` from props in both passes; the role description removed in both |
| DateRangePicker | Each segment's text, order and name | No segments: the frame, the calendar button and the app's `valueLabel` |
| Calendar, RangeCalendar | The heading, the weekdays, the days, every cell's name, which month shows and which day is today | Its parts at their final size, six weeks and a range's presets, with no date; the calendar mounts after hydration |
| FilterChip, multiple | `SelectValue`'s text, joined by `Intl.ListFormat` | Never drawn: the chip writes `labels.summary` |

**The tests.** `test/server-face.test.tsx` renders each part's rows
under `en-US`, `de-DE` and `fa-IR` and asserts one HTML, then snapshots
it. It runs in two Vitest projects of its own, `face-utc` and
`face-tehran`, which set `TZ` and name the zone through `provide`; each
project's first test asserts `Intl`'s resolved zone is the one named, so
the run proves it moved, and both write the same test names to one
snapshot file, so a zone that changes a byte fails against the other.
The `unit` project leaves the file out. The mocked iPhone belongs to
`test/hydration.test.tsx`, not the server test: on the server there is
no `window`, and every platform check in React Aria returns false before
it reads anything. The hydration test writes the HTML with jsdom's own
navigator, mocks `navigator.platform` as an iPhone, and hydrates. React
19 recovers from a text mismatch through `onRecoverableError`, but an
attribute that differs is only logged with `console.error` and never
patched, so the test fails on either. A control in the NumberField spike
proves the test can fail: without the fixed `inputMode`, an iPhone's
hydration pass logs the mismatch.

**The face stories.** Storybook renders in the browser with no
hydration, where a part never shows its face, so each part's `Face`
story renders `renderToString` of the part into a `div`: the page as a
browser paints it before the scripts run.

**R1 and R2.** React Aria runs `Intl`, the clock and a platform check
inside its render; none of it reaches the HTML under the face, and the
two tests, run on every change to React Aria's version, catch a release
that starts writing one into an attribute. The face changes on
hydration: a Persian page sees Latin digits in an amount until the first
render after, which changes the digits and the grouping in place, with
nothing moving.

## NumberField

A number, or with `money` an amount of money: `NumberField`, the text
input's pill holding a figure, the app's symbol beside it, a sign toggle
for negatives, and steppers for a plain number. The document draws no
number field of its own, so this one is derived from the input and the
field button.

**The figure.** The input is `direction: ltr`, `unicode-bidi: isolate`,
with tabular figures, the numeral rule, so a sign stays in front of its
digits on every page. In left to right it sits at the start; under
`[dir='rtl']` it takes `text-align: end`, the right of a left-to-right
box and the start of a right-to-left line. Because the input is left to
right everywhere, its logical paddings resolve left to right too, so
`number-field.css` writes them from two custom properties, the lead and
the trail, and swaps them under `[dir='rtl']` (plan, spec correction 9).
The lead is 1.5rem, the input's own, or `--size-field` with the sign
button; the trail is 1.5rem, or `2 * --size-field - 0.75rem` with the
steppers.

**The symbol.** `span.number-field-symbol`, `--text-body` in slate,
inside the pill and out of the input, at the lead from the start or at
the trail from the end, as the app names it in the field's direction
(ruling 6), taking no pointer events, so a press lands in the input. The
input pads clear of it by `--number-field-symbol`, which the wrapper
writes inline as the symbol's length in `ch` plus 0.5rem: a property of
the string, not a measurement. Its id joins the input's
`aria-describedby` after React Aria's, so "Amount, 1,234.50, $" is
heard. Taupe on a disabled field. A word in the Persian face of the font
is not exactly its length in zero widths; the right-to-left story shows
the room, and a per-script factor in CSS is the fix if review finds it
tight.

**The sign button.** The shared field button, `.input-button`, moved to
the start (`inset-inline: 0.375rem auto`), with a 16px slate `Minus`.
It is React Aria's `ToggleButton`, since a plain button inside a
NumberField must name one of its slots (spec correction 7), pressed
while the value is under zero: `aria-pressed` and `data-selected` are
the state and its twin the CSS keys on. Pressed, it is the ink fill with
a canvas glyph, after `input.css`'s hover and press rules and as heavy,
so the fill holds under the pointer, and its focus ring is the canvas
ring inside it, the rule for an ink fill. A press negates the value,
held within `minValue` and `maxValue` as React Aria's commit clamps, so
5000 with a `minValue` of -1000 turns to -1000, and then commits
validation as React Aria's steppers do. On an empty field, or at zero,
which has no sign to turn, it puts a minus in the input and focus
there, so a field never shows "-0.00"; left as a bare minus, the field
goes back to its value. `onChange` never receives -0: minor units add
0 after rounding, and a plain number does too. On a disabled or
read-only field the button is disabled with it, so a negative value
draws it pressed but recessed, a 15% ink fill with a taupe glyph, a
rule after the pressed fill and heavier, never the full ink fill of a
button that can be pressed.

**The steppers.** For a plain number only, with `hasStepper`: React
Aria's slotted buttons as two field buttons, 36px (24px compact), the
increment 6px in from the end and the decrement 2px before it. They are
named `labels.increment` and `labels.decrement` as `aria-label`, which
keeps React Aria's `aria-labelledby` of the button and the field's label
after it, so "Increase Guests" survives on a Persian page with its own
word; React Aria's `incrementAriaLabel` would drop the label (spec
correction 10). With an `aria-label` and no visible label the name is the
word and that label. Out of the tab order, disabled at a bound. Each is
hit at `--size-target` by the field button's `::before`, wider than the
2px between them, so the two hit areas would overlap and the
increment's, later in the order, would win: by 2px comfortable, all in
the gap, and by 14px compact, 6px of it on the decrement itself.
The facing sides split the gap: the decrement's `::before` ends 1px past
its inline end and the increment's starts 1px before its inline start.
The buttons follow the field's direction, only the input is left to
right, so the logical sides face each other on a right-to-left page too.
A play tagged `density` hit-tests the pixel either side of each facing
side, comfortable, compact, and compact right to left.

**The keyboard.** `inputMode` is `decimal` in money mode, and for a
plain number `decimal` when its options allow a fraction digit, read
from the props with ECMA-402's defaults (3 for a decimal or a unit, 0
for a percent) and never from `Intl`, else `numeric`. It is set through
the input context in both passes, so React Aria's platform choice, a
text keyboard on an iPhone when negatives are allowed, never reaches the
DOM (ruling 5). `formatOptions` refuses `notation` and `compactDisplay`
in its types: compact notation rounds by rules only `Intl` knows, so
neither the face before hydration nor the keyboard could follow it.

**Money.** The value is an integer count of minor units (ruling 4).
React Aria holds `minor / 10 ** d`, with `d` from `fractionDigits`, 2
unless given; its format options are one constant object per `d`,
`{ style: 'decimal', minimumFractionDigits: d, maximumFractionDigits: d }`,
so React Aria never sees new options; `step` is unset, so a typed 12.50
is never snapped; and `onChange` receives `Math.round(n * 10 ** d)`, or
null for React Aria's `NaN`. React Aria rounds the committed text to `d`
places before it calls `onChange`, so the product is an integer up to
float error and the rounding makes it exact. The bounds are minor units
too. A value that is not an integer is rounded, with a warning once per
mount. The trip through whole units and back is exact only up to
`2 ** 52 / 10 ** d` minor units, about 45 trillion cents, so a value
past that warns once per mount too, well before
`Number.MAX_SAFE_INTEGER`.

**Negatives.** Off unless `allowsNegative`: the lower bound is then 0,
or the app's `minValue` when it is above 0, and a `minValue` under 0
without it warns once and is held at 0. A negative amount is ink: never
error, since nothing failed, and never gain; the sign carries it.

**The hidden input.** React Aria's hidden input holds its number, which
in money mode is whole units, so the wrapper passes React Aria no `name`
and no `form` there and renders its own `input type="hidden"` with the
minor units, or an empty value, from React Aria's state, so it follows a
native form reset (spec correction 4). A plain number keeps React
Aria's.

**The role description.** React Aria writes a localized
`aria-roledescription` on the input, "Number field" or "Nummernfeld",
which would break the face, and a prop of `undefined` cannot remove it,
since React Aria merges the context first and the props after. The
wrapper re-provides the input context with a copy of React Aria's props
less that key, and sets `inputMode` and, before hydration, `value` the
same way (spec correction 5). The input is a `textbox`, named by its
label.

**Keys and the snap.** React Aria's: the arrows step by `step`, and a
money amount by one whole unit; Page Up and Page Down step as the arrows
do, since no page step is given. An arrow first snaps the value to the
step and then moves, so 12.50 then Arrow Up is 13.00, and from an empty
field it starts at the lower bound, 0 without negatives (spec correction
6). Enter commits and formats. The wheel is off in money mode.

**Home and End.** React Aria's spin button takes them for the minimum
and the maximum, so on a money field with a lower bound of 0 Home would
set the amount to zero. The group's `onKeyDownCapture` stops their
propagation when the input is the target, before React Aria's handler,
and the browser's default moves the caret (R3). The stop keeps the key
from the app's `onKeyDown` too, so the guard calls it first, with the
event in the shape React Aria's keyboard handlers receive. The spike's
play, on a bare React Aria NumberField and then on the wrapper, passes
in Chromium, and without the guard fails there; WebKit and Firefox run
it in CI as the `storybook-webkit` and `storybook-firefox` projects: not
yet verified on a machine with those engines.

**The paste.** React Aria commits a paste that replaces the whole text
as it is, and refuses one carrying the symbol. The group's
`onPasteCapture`, in money mode, when the clipboard text contains the
symbol and the selection covers the whole input, prevents the default,
stops the event and commits the text without the symbol, so a copied
"$1,234.50" lands as 123450 (spec correction 8). It calls the app's
`onPaste` first, which the stop would otherwise keep from it. A partial
paste is React Aria's.

**The unlabelled placeholder.** Taupe under a visible label; slate under
`data-unlabelled`, and taupe again while disabled, the rule the search
field set.

**Measured pairs.** Gated: slate on raised, the symbol, the resting sign
and stepper glyphs and the unlabelled placeholder, 5.49 in light and
6.44 in dark; canvas on ink, the pressed sign and its inverted ring,
16.25 and 19.31. Measured and recorded, not gated: ink on the 5% wash
over raised, a hovered button's glyph, 16.65 and 13.24. No pair is added
to the gate; taupe on the disabled sign's 15% fill is disabled text,
which the gate leaves out.

**Forced colors.** The input keeps `input.css`'s rules; the symbol is
`CanvasText`, and `GrayText` while disabled; the pressed sign button is
`Highlight` with `HighlightText`, and pressed and disabled a `GrayText`
glyph and 1px edge on the system `canvas`, as a disabled checked
checkbox is.

**Devices.** The decimal keyboard, the sign button on an empty field,
and VoiceOver and TalkBack reading the field as a text field named by
its label and described by its symbol, on a real iPhone and an Android
phone: not yet verified.

**The size.** The size limit is 3 kB, above the spec's 2.5 kB budget:
the entry measured 2.45 kB, the field parts the TextField entry also
pulls in, the money arithmetic and its face, the input context, the two
guards, the sign toggle, the hidden input and the two warnings, and the
rule rounds up to 2.5 kB and adds 0.5 kB. The guards calling the app's
handlers, the sign's clamp and validation and the precision warning
bring it to 2.66 kB, still under the limit, which is unchanged. The
deferred blur commit of the settings batch takes the entry from 2.76 kB
to 2.97 kB, still under the limit, and 25.09 kB with React Aria counted
(settings plan, spec correction 6).

**React Aria's blur commit, deferred** (patch 0.6.1, fixed in the settings
batch). React Aria's `useNumberField` commits the typed text on blur inside
`flushSync` (react-aria 3.53.1, `useNumberField.mjs:60-76`), so it can read
the formatted text back and announce it. A blur the browser sends while
React commits, as when an app moves focus from a layout effect or disables
the focused field, made React log "flushSync was called from inside a
lifecycle method", in every mode and at any value, with React Aria's own
NumberField too, in development only. The library now defers React Aria's
blur handler one microtask: `NumberFieldInput` replaces the input context's
`onBlur` with one that holds the event's `target` and `currentTarget` on an
object whose prototype is the event, and calls React Aria's handler with it
in `queueMicrotask`. After a browser's own blur the microtask runs at once,
before the next element's focus and before a following click, so the value
commits before a press or a submit reads it; after a blur inside React's
commit it runs once the commit is done, as React's message advises. The
commit and its announcement are kept. A disabled field is the second path:
React Aria commits from a `focusout` listener of its own on the input
(`useSyntheticBlurEvent`, `interactions/utils.mjs:41-105`), which the
deferred `onBlur` does not reach, so the field stops the browser's own
`focusout` on a disabled input at the input, in the capture phase. React
Aria's MutationObserver, its stand-in for Firefox, which sends no focusout
there, has seen the input disabled while focused and sends one once the
commit is done; the field sends the stopped event again a microtask later
only when nothing has replaced it, so listeners hear one focusout (settings
plan, spec corrections 2 and 6). An
app's `onBlur` and `onFocusChange(false)` run a microtask later too, and a
`requestSubmit()` from script in the same task as a blur reads the form
before the commit, which the page and the changeset say.

The consumer's reproduction (settings spec, ruling 6), a plain field with
`minValue={0}` in a Dialog titled "Add a plan", 0 typed, then Save or the
next field pressed, is a unit test and a play in Chromium, WebKit and
Firefox with Playwright's own pointer and keys. Neither press logged the
warning on the old code in jsdom or in Chromium; the same Dialog whose Save
disables its fields while it saves, reached by Enter, did, in Chromium, and
so did focus moved from a layout effect, in jsdom and Chromium (settings
plan, spec correction 1). The plays are `ZeroInADialogThenSave`,
`ZeroInADialogThenNextField`, `ZeroInADialogThenEnter`, `SubmitAfterBlur`
and `FocusMovedInALayoutEffect`; the test once expected to fail now passes.
The consumer then sent its own path (settings plan, spec correction 5):
controlled fields in a form saved by an async transition, "Add plan"
pending outside the form, and a Dialog rendered only while open, which a
save unmounts. `ConsumerEnterFastSave`, `ConsumerEnterSlowSave`,
`ConsumerPressFastSave` and `ConsumerPressSlowSave` hold it, by Enter and
by a press, with a save that settles at once or after 100ms; they read the
saved 0, no warning, and focus back on the trigger. They logged nothing in
Chromium before the fix either.
A focused field that is disabled goes back to the text it had when it was
focused, as React Aria's own field does: its listener for a disabled field
holds the commit of the render that focused it, so it drops text typed
since and reverts a value Enter committed since, calling `onChange` with
the old value (settings plan, spec correction 8). That is React Aria's,
the same before the deferral, kept as a test expected to fail and named in
the upstream issue. The same
deferral belongs in React Aria's `commitAndAnnounce`; the owner files the
issue (settings plan, owner action 4), and the deferral leaves when a React
Aria release has it.

## Calendar

One month of days that chooses a day or a range: `Calendar` and
`RangeCalendar`, on React Aria's calendars, with the app's presets and
the app's today. The document draws no calendar of its own, so this one
is derived from the controls' size, the pill and the ink fill.

**The width.** `width: min(100%, calc(7 * var(--size-control)))`: seven
controls wide where there is room, 280px, and 252px under compact
density, shrinking with the room under it. React Aria's grid is a
`table`, which a grid template cannot lay out, so it is
`table-layout: fixed` at the calendar's width, which gives seven equal
columns, and each day keeps `aspect-ratio: 1` (plan, spec correction
15). A day is 40px, and 36px compact, wherever there is room; at 320px
it is 36.29px in a popover (254px of room) and 38.86px in the sheet
(272px): 36px or more there, where the 40px target gives way (R4).
Inline, the days shrink with their container but never below WCAG's
24px minimum: `min-width: calc(7 * 1.5rem)`, 168px, holds seven of
them, and a narrower container is overflowed rather than a day shrunk.

**Six weeks.** React Aria draws only the weeks the month has, four,
five or six (`CalendarGridBody`), so the calendar reserves the missing
rows: `.calendar-grid:not(:has(> tbody > tr:nth-child(6)))` takes
`margin-block-end: calc(100% / 7)` and the five-row selector twice
that. A margin's percentage reads the containing block's width, the
calendar's, which is the grid's, so a seventh of it is one square day,
with no container query. The root is `display: flow-root`, so the
margin stays inside its box. The calendar's height never changes with
the month, and a story walks January to August 2026, four, five and
six weeks, at one height.

**The header.** The month in `--text-action` at weight 500, ink,
centred between two ghost `IconButton`s, React Aria's previous and next
slots, named by `labels` ("Previous month", "Next month"). Their 16px
chevrons mirror under `[dir='rtl']`, the sidebar's rule, so the
previous month's points outward on either side. The header is a `div`:
a `header` outside a section is a banner landmark, which axe refuses
inside the calendar. React Aria's heading is hidden from a reader, who
hears the month in the root's and the grid's names; React Aria also
writes its own visually hidden `h2` and next button.

**Weekdays.** `--text-small` at weight 450, slate, React Aria's narrow
names, not interactive.

**Days.** On the shape's pill, `--radius-pill`, wherever they sit: a
circle in Rounded, a soft square in Soft and a square in Square. The
number is `--text-small` with tabular figures, `unicode-bidi: isolate`,
ink; the number's `span` fills the cell and carries the fill and the
ring. Hover is the 5% ink wash inside `@media (hover: hover)`, and a
press shows it too. Days outside the month are `visibility: hidden`:
React Aria still lays the week out, and their places stay empty.

**Today.** A 1px `--color-boundary` ring on the number and weight 700:
a shape and a weight, never color alone (ruling 3). The mark is the
library's: the cell's render function writes `data-today` on the number
when the day is the app's `today`, compared with `isSameDay`, which
converts across calendars, or React Aria's own `isToday` when no `today`
is given. React Aria writes its own `data-today` on the cell from the
device's zone, which `calendar.css` never keys on, and a test reads the
file for it (spec correction 14). The opening month is the value's;
else `today`'s, passed as React Aria's `defaultFocusedValue` only while
there is no value, since React Aria prefers it to the value (spec
correction 13); else the device's. React Aria's spoken "Today" follows
the device, so near midnight across zones the mark and the voice can
name different days (R7): the docs say to pass `today` whenever the app
knows its user's zone.

**Chosen.** A single day and a range's two ends are the ink fill with
canvas text. A chosen today keeps its weight and turns its ring canvas,
a 1px outline 3px inside the fill, never a shadow. The keyboard's ring
sits inside the day, `outline-offset: calc(-1 * var(--focus-ring-width))`,
since the cells touch; on an ink day it is the canvas ring inside the
fill, the rule for an ink fill, and it replaces today's inner ring.

**The band.** The days between a range's ends sit on
`color-mix(in srgb, var(--color-ink) 10%, transparent)`, and their
numbers take weight 500. The band runs under each end's inner half
through a `::before` with logical insets (`50% 0` at the start, `0 50%`
at the end), so the range reads as one shape, and the end's number,
positioned, paints over it by tree order: no z-index. The band is a cue
(R8): 1.23 against float in light and 1.34 in dark, under 3:1, so the
filled ends, the weight and `aria-selected` carry the range; ink on the
band measures 14.97 and 13.04. A stronger band is the fallback if review
finds the range unreadable.

**Unavailable and out of bounds.** React Aria writes `data-unavailable`
for a day `isDateUnavailable` refuses and `data-disabled` for one
outside the bounds; both draw taupe, the color of disabled text, with
`cursor: not-allowed`, and an unavailable day is also struck through, so
the state is never color alone.

**Presets.** A wrapping row, `gap: var(--spacing-part)`, of pills
`--size-control` tall, `padding-inline: 1rem`, a 1px boundary edge,
`--text-small` at weight 500, ink: FilterChip's pill look. They are
React Aria's `ToggleButton`s in a `role="group"` named `labels.presets`,
since a plain button inside a calendar must name one of its slots (spec
correction 7); `aria-pressed` and `data-selected` are the state and its
twin the CSS keys on. Pressed, the ink fill with canvas text and the
canvas ring inside; disabled with the calendar, taupe on a 15% ink
edge. Each is hit at the target in height by the formula every control
shares. A press sets the range through React Aria's state, drops a
half-chosen one, and moves the view to its start; inside a picker the
same state reaches the picker's range and closes its popover (spec
correction 17). A preset whose range does not parse is left out, with
one warning. A preset whose range starts before `minValue`, ends after
`maxValue` or holds a day `isDateUnavailable` refuses is disabled: the
press would set a range React Aria's own choice never makes. The check
reads the props' bounds, not React Aria's state, which narrows them
around a half-chosen range's anchor that a preset replaces. A preset
shows pressed when the value's ends, written back with `toIso`, equal
its range's. The library computes no range.

**A range.** The first choice anchors, the second completes, and a
range of one day is allowed. From the keyboard, the first Enter or Space
anchors the day and, as React Aria does, moves focus to the next day.
`commitBehavior="reset"` drops a half-chosen range on a blur out of the
calendar and on a press released outside it or on anything in it that
is not a button, the month heading included (spec correction 16), so no
range the person did not finish is written. Escape drops it too and goes
on to whatever holds the calendar (spec correction 32).
`allowsNonContiguousRanges` is never passed.

**Values.** ISO strings in and out: `'2026-09-14'` and `{ start, end }`
(ruling 2). The wrapper reads each with `@internationalized/date`'s
`parseDate`, whose pattern and range checks throw, and keeps the date
only when it writes back as the very string given, since `parseDate`
also takes `'+002026-09-14'` and year zero; a string that does not
parse, or a range whose end is before its start, reads as no value
with one warning, so a hand-edited URL never throws. `onChange`
receives `toCalendarDate(date).toString()`, the Gregorian ISO date
whatever calendar the date is in, and `isDateUnavailable` receives the
ISO date. `@internationalized/date` is a dependency at React Aria's own
range, `^3.12.4`, so there is one copy and it adds no bytes.

**The Persian calendar.** The locale chooses the calendar and the
digits: `fa-IR` draws Shahrivar 1405 in Persian digits with the week
from Saturday, `fa-IR-u-ca-gregory` the Gregorian calendar in Persian
digits, and `fa-IR-u-nu-latn` Latin digits, all from `Intl` in the
browser; the values stay Gregorian. `createCalendar` is passed through:
one that returns `GregorianCalendar` or `PersianCalendar` narrows a
calendar's bundle, but React Aria's date fields build theirs with its
full `createCalendar` whatever is passed, so on a page with a date range
picker every system ships anyway (spec correction 18).

**The face.** On the server and through hydration the root is
`div.calendar[data-face]` (with `.range-calendar` for a range), built
from the calendar's own parts and classes: the header with two
`.icon-button` boxes and the heading, a range calendar's presets as
`button.calendar-preset`s with the app's words (no `Intl` in them), a
`table.calendar-grid` with a weekday row and six weeks of
`.calendar-day`s, and no date, weekday or month. A no-break space holds
a line where the calendar writes a name. It is `aria-hidden` and
`inert`, its buttons are `tabindex="-1"`, and `pointer-events: none`
keeps the pointer off it. Its box is the hydrated calendar's, since the
calendar always holds six weeks: stories compare the two for a month of
five weeks, of four (February 2026, from a Sunday) and of six, and a
range calendar with presets, at both densities, so nothing moves when
the grid arrives. React Aria's calendar mounts in the next render; the
root changes element, the one remount the server face allows, and an
inline calendar holds no focus then. A calendar in a popover or a sheet
is first rendered in the browser and never shows the face.

**Measured pairs.** Gated: slate on float, the weekdays in a popover,
5.49 in light and 6.94 in dark, and on canvas 4.84 and 7.26; the
boundary on float, today's ring, 3.48 and 5.21, and on canvas 3.38 and
5.34; canvas on ink, a chosen day and its inverted ring, 16.25 and
19.31. Measured and recorded, not gated: the 10% band against float,
1.23 and 1.34, a cue, and ink on it, 14.97 and 13.04; ink on the 5% wash
over float, a hovered day, 16.65 and 15.25. No pair is added to the
gate.

**Forced colors.** A chosen day, a range's ends and a pressed preset are
`Highlight` with `HighlightText`; the days between take a 1px
`Highlight` edge on their top and bottom, inside the day, which is
`box-sizing: border-box` so the edge never grows it; today's ring and
the weekdays are `CanvasText`; unavailable and disabled days and a
disabled preset are `GrayText`.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule: the ring inside the fill and a chosen today's inner ring are
`HighlightText`. The docs check what Chromium draws.

**Screen readers.** The month change and a chosen range announced, and
a preset read as a pressed toggle, with VoiceOver on macOS and NVDA: not
yet verified.

**The size.** The size limit is 2.5 kB, under the spec's 3 kB budget:
the entry `{ Calendar, RangeCalendar }` measured 1.85 kB without React
Aria, Lucide and `@internationalized/date`, and the rule rounds up to
2 kB and adds 0.5 kB.

## DateRangePicker

A range of two days in the text input's pill: `DateRangePicker`, on
React Aria's date range picker, with its two date fields typed in the
locale's order and its range calendar in a popover. The document draws
no date field of its own, so this one is derived from the text input,
the field button and the calendar.

**The frame.** React Aria's picker gives its group the role, the
labelling, Alt+Arrow Down and the focus within
(`useDateRangePicker.mjs:126-139`, `useDatePickerGroup.mjs:24-37`), so
the frame is a plain `div.input.date-range-control` that spreads that
whole group value less its non-DOM keys, and takes its ref, which React
Aria positions the popover against. It is not React Aria's `Group`,
whose focus-within `data-focus-visible` would turn `.input`'s focus rule
into a ring on the frame while the calendar button holds focus (spec
correction 20). Being `.input`, it takes the hover, disabled, changed
and invalid edges through the field's root, and the wrapper writes
`data-disabled` on it. Its own rule is one class after `input.css`:
`display: flex`, `align-items: center`, `gap: var(--spacing-part)`
(8px) and `padding-inline: 1.5rem 3rem`, clear of the button, and it
clips nothing: the button's hit area, 40px against a 36px compact frame
and a 24px button 6px in from its end, reaches past the frame's top,
bottom and end, and a story finds the button 19.5px each side of its
center at both densities. The two dates, the arrow and the face sit in
`div.date-range-dates`, a flex row that fills the frame, and that row is
clipped, `overflow-x: clip`, so a date too wide for a narrow frame never
spills; clipping the frame instead would cut the hit area to 38px across
in compact.
While a segment has keyboard focus the frame draws the focus edge and
ring, `.date-range-control.input:where(:has(.date-segment:is(:focus-visible, [data-focus-visible])))`:
two classes with the test in `:where()`, so it beats the hover edge by
order and the changed and invalid edges, three classes, still beat it.
While the button has focus the button rings itself and the frame draws
nothing; nothing keys on `:focus-within` or on the root's
`data-focus-visible`, which React Aria writes then too.

**Segments.** Each date is `DateInput.date-range-input`, an
`inline-flex` row that never shrinks, in tabular figures, and React Aria
isolates it (`unicode-bidi: isolate`), so a right-to-left page keeps
each date in its locale's order. A segment is ink, padded 2px at each
side, with a transparent caret and no outline. An empty segment,
`data-placeholder`, is slate, labelled or not, and taupe only while
disabled. The focused segment is the ink fill with canvas text on
`--radius-micro`, the text-sized chip's radius, empty or not: the
placeholder rule is one class and one attribute, the focus rule's weight,
and comes before it, and a test holds that no placeholder rule outranks
it. Disabled, the segments, the arrow and the face are taupe.

**The placeholder and axe.** As Select's placeholder (open question 3).
An input's placeholder is an attribute, which axe never measures, so a
text field's placeholder can be taupe, the whisper. A date field's empty
segments, "mm", "dd" and "yyyy", are elements, the field's visible text,
and must meet text contrast: taupe on raised is 1.58 in light and 3.68 in
dark, so they are slate, 5.49 and 6.44, under a label or without one,
and axe checks them with no exception in the stories or on the docs
page. A disabled field's segments are taupe, the disabled text, which
WCAG exempts.

**The arrow.** Lucide's `ArrowRight`, 16px, slate, in
`span.date-range-arrow[aria-hidden="true"]` between the dates. It points
from the start to the end, so it mirrors under `[dir='rtl']`, the
sidebar's rule, and is the only thing that does.

**The button.** The shared `.input-button` at the frame's end, Lucide
`CalendarDays`, named by `labels.open` ("Choose dates") and the label,
React Aria's `aria-labelledby` of itself and the label
(`useDateRangePicker.mjs:145-155`). React Aria's own name for it is
localized, so the library's replaces it in both passes.

**Names.** The group is named by the label. Each date field is a
presentation element (`useDateField.mjs:100-104`), and React Aria names
each segment by its type, the field's name and the label
(`useDateSegment.mjs:321-325`): "month, Start date, Statement period".
`DateInput` takes only its slot from the date field context
(`DateField.mjs:253-258`), so the wrapper re-provides that context with
`labels.start` and `labels.end` as the two slots' `aria-label` (spec
correction 19). On iOS React Aria makes each segment a text box
(`useDateSegment.mjs:303-309`).

**Values.** ISO strings in and out (ruling 2): `value` and
`defaultValue` are read with `parseIsoRange`, and one that does not
parse, is not written `YYYY-MM-DD`, or whose end is before its start
reads as no range with one warning; the bounds are read with
`parseIso`, and `isDateUnavailable` receives ISO dates. `onChange`
receives the two Gregorian ISO dates once both are whole and in order.
React Aria keeps a date while one of its segments is cleared, as it
keeps February 30 until blur, so `onChange(null)` comes once every
segment of a date is cleared (`useDateFieldState.mjs`, `setValue`). React
Aria also takes each digit of a year as it is typed and emits a range
whose end is before its start, flagged invalid; the app is told `null`
for it, since it is no range, and a controlled field keeps it in place
of the app's `null`, which would otherwise clear what is being typed.
The hold answers that `null` alone: it is keyed to the value it was
held against, so it goes once the app sets any other value, and it goes
once focus leaves the picker, so an outside "Clear all" that sets the
`null` the app already holds clears the field. React Aria's focus within
ignores focus moving into the calendar and is off while it is open
(`useDateRangePicker.mjs:103-114`), so opening it keeps the hold.
The hidden inputs hold Gregorian ISO dates in every calendar.

**Today and the opening month.** `today` is passed to React Aria as the
picker's `placeholderValue`, which React Aria gives the calendar as its
`defaultFocusedValue` only while there is no range
(`useDateRangePicker.mjs:211`), so the calendar opens on the value's
start month, else `today`'s, else the device's (spec correction 13),
and an arrow in an empty segment starts from the app's today. The
calendar marks `today` as Calendar does.

**The calendar in the picker.** The popover holds React Aria's `Dialog`
around a bare `RangeCalendar.calendar.range-calendar` with
`commitBehavior="reset"`, holding `RangeCalendarFrame`: the picker's
context gives it the value, `onChange`, the bounds and its focus, and it
passes none of its own (spec correction 17). The presets are checked
against the picker's own bounds and unavailable days. A preset press or
a completed range closes the popover (`shouldCloseOnSelect`, React
Aria's default), and focus goes back to what opened it: the button, or
the segment where Alt+Arrow Down was pressed.

**The popover.** `isPadded` steps down to `--spacing-inset`, 16px, with
two classes after `popover.css`'s one. The grid is a table at 100% of
its calendar, which would stretch a popover sized to its content across
the screen, so the popover's width is the month's:
`calc(7 * var(--size-control) + 2 * var(--spacing-inset) + 2px)`, 314px,
the 2px its frame. `popover.css` caps it at the viewport less 2rem, so
at 320px the month has 254px and a day is 36.29px (R4). It opens 8px
under the frame at its start, and React Aria flips and shifts it.

**The face.** On the server and through hydration each `DateInput`
renders no segments, but its hidden input and every id are written, the
arrow is left out, and `span.date-range-face`, first in the dates row, shows
the app's `valueLabel`, or nothing (R2). The segments' text, order and
names all come from `Intl`. The face is padded as a segment is, so its
text starts where the first segment's will; the frame is its full width
and the field's height either way, and a story compares the face's
field, frame and button with the hydrated ones at both densities, so
nothing moves. The face ellipsizes on one line. The server's HTML is one
string under `en-US`, `de-DE` and `fa-IR` and in UTC and Asia/Tehran.

**React Aria's descriptions.** The picker formats the chosen range for
its spoken description while it renders, and each date field formats its
value; both go into a node a layout effect creates, never the HTML (R1,
spec correction 22).

**Keys.** React Aria's (spec correction 21): Tab runs through the start's
segments, the end's and the button; Left and Right move between segments
in the drawn direction; Up and Down change a segment by one, wrapping at
its ends, a day from 1 to 31 in any month until blur; Page Up and Page
Down by a larger step, a week, two months, or to the next multiple of
five years; Home and End to the least and greatest value; Backspace and
Delete clear the last digit and, in an empty segment, move to the one
before; Alt+Arrow Down and Alt+Arrow Up open the calendar; Escape closes
it and gives focus back to what opened it.

**Measured pairs.** Gated: ink on raised, the segments, 18.43 in light
and 15.36 in dark; slate on raised, the arrow and every empty segment,
5.49 and 6.44; canvas on ink, the focused segment, empty or not, 16.25
and 19.31. No pair is added to the gate.

**Forced colors.** As the text input; the arrow `CanvasText`; the
focused segment `Highlight` with `HighlightText`; disabled segments, the
arrow and the face `GrayText`.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule (the focused segment). The docs check what Chromium draws.

**Devices.** The segments reached and typed with VoiceOver on iOS, as
text boxes: not yet verified.

**The size.** The entry `{ DateRangePicker }` measures what its import
pulls in, the range calendar's frame included (spec correction 30), and
the plan started it at 5.5 kB. It measured 3.37 kB without React Aria,
Lucide and `@internationalized/date`, and the rule rounds up to 3.5 kB
and adds 0.5 kB: 4 kB.

## FilterChip

A pill that names a filter and opens a list or a panel: `FilterChip`,
on React Aria's Select in single or multiple mode for a list, and on
its DialogTrigger for the app's own content. The document draws no
filter chip, so this one is derived from the control size, the shape's
pill, the boundary edge and the system's "on", the ink fill.

**The pill.** `div.filter-chip`, `display: inline-flex` at
`max-width: 100%`, `min-height: var(--size-control)`, 40px and 36px
compact, on `--radius-pill`, so it keeps the shape's pill: round in
Rounded, 12px in Soft, square in Square. Its edge is a 1px
`--color-boundary` on nothing: the chip is transparent, so the edge is
the boundary over the surface itself, 3.38 on canvas and 3.45 on a card
in light, 5.34 and 5.21 in dark (spec correction 27). The 3.06 and 3.36
the spec quoted are the gated boundary over a raised fill; the switch's
off track gates the boundary on each surface, which holds this edge, and
no pair is added.

**The trigger.** `Button.filter-chip-trigger` pads `1rem 0.75rem` with an
8px gap, the label in `--text-small` at 500 in ink and a 16px slate
chevron (4.84 on canvas in light, 7.26 in dark) that turns half a turn
in 140ms while open, Select's rule, and not under reduced motion. It is
hit at the target in height by the formula every control shares,
`inset-block: min(0px, (100% - var(--size-target)) / 2)`, so a compact
chip is hit at 40px, and `inset-inline: 0`, so its hit area is its own
width. React Aria's Select root has no role, so it is `display:
contents` and leaves the box tree.

**Hover and open.** An inactive chip washes 5% ink on hover, inside
`@media (hover: hover)`, on a press and while open: ink on that wash over
canvas measures 14.70 in light and 17.41 in dark.

**Active.** The ink fill with canvas text, the system's "on", as the
selected tab, the chosen option and the chosen segment are: canvas on
ink, 16.25 in light and 19.31 in dark, gated. The label steps to 450 and
the value follows at 700, one line, ellipsized past 16rem; its whole
text is in the trigger's name. A filter is neither consent nor unsaved,
so an active chip is never signal orange and never clay.

**The summary and the name** (ruling 7, spec correction 23). React
Aria's `SelectValue` would build an `Intl.ListFormat` while it renders,
and React Aria names the trigger by the value and then the label, the
reverse of what the chip shows, which axe's label-in-name check flags.
So the chip draws no `SelectValue`: it reads `state.selectedItems`,
built in the hidden collection pass on the server too, sorts them by the
collection's order, since React Aria keeps them in the value's order,
and writes `labels.summary` of their text values into
`span.filter-chip-value`: "Food", "Food, Rent", "Food, Rent and 2 more"
by default, with concatenation and `String()`. `valueLabel` overrides
it. A value none of whose keys is an option, a stale one from the URL,
would leave an active chip saying so by its fill alone, so the chip
shows the keys as written, through `labels.summary`, and warns once in
the console. The trigger is `aria-labelledby` its label span and then its value
span, "Category Food", the visible order. Axe joins the text of the
spans as it is written, so a space sits between them in the DOM, which
the flex row does not draw. A custom chip's trigger is named the same
way, and so is its dialog, since a name computed through the trigger
skips the trigger's own `aria-labelledby`.

**The clear button.** While active, clearable (a list chip, or a custom
chip with `onClear`) and not disabled, `Button.filter-chip-clear`
follows the trigger as the Select's sibling, never inside it: Select
hands its trigger's props to every Button in it, so a clear button there
would open the list (spec correction 25). It is the pill's last 2rem and
its full height, 38px and 34px compact inside the pill's edges, and is
hit at the target in height by the trigger's formula,
`inset-block: min(0px, (100% - var(--size-target)) / 2)` with
`inset-inline: 0`, so it is a 32 by 40 target in every density, as spec
11 asks. The trigger pads only 4px to it, so the two touch and never
overlap: each hit area grows in height alone, and neither reaches over
the other, the lesson of NumberField's steppers. It draws a
24px circle with a 12px canvas X; the circle washes 15% canvas on hover
and on a press, 1.50 against ink in light and 1.39 in dark, a mix and a
cue, with the glyph at 10.81 and 13.93 on it; keyboard focus draws the
canvas ring inside the circle, SegmentedControl's rule on an ink fill.
It is named `labels.clear(label)`, "Clear Category", and is a tab stop:
for a single chip it is the only keyboard way back to no value. A press
clears through `onClear`, else `onChange(null)` or `onChange([])`, and
puts focus on the trigger, since the button leaves with the value. A
secondary chip in a FilterBar's row then always tells FilterBar, even
when no More is drawn as it clears: with every secondary chip active
there is no More, and clearing one brings it back and takes the chip
out of the row, so FilterBar gives focus to More once the chip has gone.

**Focus.** Keyboard focus on the trigger rings the whole pill,
`.filter-chip:has(.filter-chip-trigger:is(:focus-visible,
[data-focus-visible]))`, in the focus ring color outside it.

**Disabled.** Taupe text and chevron on an edge of ink at 15%, 1.37
against canvas in light and 1.51 in dark, a disabled edge, recorded and
not gated; `cursor: not-allowed`. A disabled active chip keeps its value
on the disabled fill, and draws no clear button.

**The panel.** A custom chip opens `Popover.filter-chip-panel`, the
float, frame and corner, padded 16px, `--spacing-inset`, with two
classes after `popover.css`'s one, and capped at `min(22rem, 100vw -
2rem)`, inside a phone's margins. It holds React Aria's `Dialog`, which
takes focus as it opens and draws no ring of its own, as `dialog.css`'s
content does.

**A closed chip's keys** (R3, spec correction 24). React Aria's Select
chooses the next option on a letter, or on Left and Right, without
opening, which on a filter is a silent query and a URL write. The pill's
`onKeyDownCapture`, while closed and when the trigger is the target,
stops a printable key that is not Space and has no Control, Meta or Alt,
and Arrow Left and Arrow Right, before React Aria's handlers. Enter,
Space, Arrow Down and Arrow Up still open a list; a panel opens on Enter
and Space, as any dialog trigger. Multiple mode is already quiet while
closed, and the guard runs for it too, one code path. A play proves the
guard in Chromium, WebKit and Firefox.

**Modality** (ruling 10). React Aria's popover is modal, so the page is
inert while a list or a panel is open: a press on the next chip first
closes this one, Escape and an outside press close it, and focus goes
back to the trigger. Tab in an open list does not close it.

**The section face.** Where a FilterBar draws a chip in its More panel or
its Filters sheet, the chip is `section.filter-section`, named by its
`h3.filter-section-title`, the label. While active and clearable its
head holds a tertiary Button showing FilterBar's `labels.clear`,
"Clear", named `labels.clear(label)`, "Clear Category", which starts
with the visible word; it clears and puts focus on the section's
trigger, or a custom chip's first tab stop: an enabled control not at
`tabindex="-1"`, and of a group of radios its checked radio, or with
none checked its first enabled one. A list chip's section holds Select's look, `.field.select` with
`.input.select-trigger`, showing the summary, or `labels.any`, "Any", as
the slate placeholder; a custom chip's holds its content. The two words,
`labels.any` and FilterBar's `labels.clear`, are new (spec correction
26). A chip in a section draws no pill and no guard.

**The shared list.** Select's list, its filter and the popover that
keeps them out of React Aria's hidden collection pass moved from
`select/Select.tsx` to `picker/SelectList.tsx`, internal, with Select's
behavior unchanged (10.2 item 12): Select's tests, stories and baselines
are the proof. The chip opens the same list, from nine options with the
same filter, and a test counts the library popover's renders in the
hidden pass at zero.

**Forced colors.** The edge and the chevron `CanvasText`; active,
`Highlight` with `HighlightText`, the chevron and the clear glyph
`HighlightText`; disabled, `GrayText`, and a disabled active chip
`GrayText` on canvas, never on `Highlight`, which would say "on" for a
control that is off.
Drawn out of the forced repaint with `forced-color-adjust: none` (patch
0.6.1), as a selected DataTable row is: inside the repaint Chromium
draws a backplate in the system's background color behind each run of
text, which blanked the `HighlightText` words on `Highlight`. Out of it
nothing is forced, so each color on the part is a system color named in
the rule: no part of an active chip has a fill of its own, the clear
button's ring is `HighlightText` inside the pill, and the chip's ring
outside it is `Highlight`. The docs check what Chromium draws.

**Right to left.** The pill runs from the right: the label at the right
and the clear button at the left end. Neither the chevron nor the X has
a direction, so nothing mirrors.

**Screen readers.** "Category Food, Rent and 2 more, button" with
VoiceOver on macOS and NVDA: not yet verified.

**The size.** The entry `{ FilterChip }` measures what its import pulls
in: the shared list, the library Popover, SearchField and the tertiary
Button of the section face (spec correction 30). It measured 3.44 kB
without React Aria, Lucide and `@internationalized/date`, above the
spec's 2.5 kB, and the rule rounds up to 3.5 kB and adds 0.5 kB: 4 kB.

## FilterBar

The filters of a list page: `FilterBar`, which lays out the app's
search, a row of `FilterChip`s, More for the inactive secondary chips,
Clear all, and on a phone one Filters button that opens one sheet of
every filter. The document draws no filter bar, so this one is derived
from the chip's look, the Popover's float, the Sheet and the field
label's step.

**The row.** `div.filter-bar` is a wrapping flex row with the part gap,
8px: the search slot, `div.filter-bar-search`, grows from 16rem and stops
at 24rem; the chips sit in `div.filter-bar-row`, a `group` named
`labels.filters`, "Filters", which is a wrapping flex row of its own
with the same gap, so the group's box holds every chip; Clear all, a
tertiary Button, sits at the inline end with `margin-inline-start:
auto`. Nothing is measured (ruling 8): the browser wraps the row under
the search when it does not fit, and wraps the chips inside it. The
chips' hit areas grow 2px above and below a compact pill at most, inside
the 8px gap, so no hit area reaches a neighbor's.

**More.** An inactive chip's look, `div.filter-chip.filter-bar-more`
around a `filter-chip-trigger` with `labels.more` and the chevron, which
turns while its panel is open. It opens `Popover.filter-bar-more-panel`,
the float, frame and corner, padded 16px (`--spacing-inset`) with two
classes after `popover.css`'s one and capped at `min(22rem, 100vw -
2rem)`, holding React Aria's `Dialog`, named by the trigger, "More", with
no ring of its own. Its sections stack a peer step apart, 24px, with a
1px `--color-divider` rule between them and 24px under it: a separator,
1.23 against float in light and 1.34 in dark, measured and recorded, not
gated. More is a modal popover, as the chip's is (ruling 10).

**Sections.** In the panel and the sheet each chip draws as
`section.filter-section`, its head a flex row with the title,
`h3.filter-section-title`, at the field label's step, `--text-h4` at
700 in ink (18.43 on float in light, 17.42 in dark, gated as ink on
float), and the chip's tertiary clear at the inline end, showing
FilterBar's `labels.clear`, "Clear", and named by the chip's
`labels.clear(label)` (spec correction 26). The body sits a part step,
8px, under the head. In the sheet sections stack 24px apart with no
rule, since the sheet's body is one surface.

**The phone.** Under 768px of viewport, `@media (width < 768px)`, the
`--breakpoint-sm` token written out as `copy.css` writes it, with a test
that keeps them equal (spec correction 28), the row, More and Clear all
leave (`display: none`) and `Button.filter-bar-sheet-button` shows
beside the search, which takes the rest of the line. It is the
viewport, not the bar's own width, because a sheet is a phone surface.
The button is a secondary Button with Lucide's `ListFilter` at 16px,
`labels.filters` and, while any filter is active, a neutral Badge with
`formatCount(count)`: slate on float, gated. Its name is its text,
"Filters 2", a space in the DOM between the word and the Badge that the
flex row does not draw. It is never signal orange: a filter is not
consent. It opens one `Sheet` titled `labels.filters`, holding every
filter as a section in declared order, primary and secondary alike; its
footer, `div.filter-bar-sheet-actions`, holds Clear all
(`filter-bar-sheet-clear-all`, tertiary, at the start) while any filter
is active and Done, primary, at the end, `slot="close"`.

**The census** (spec 9.2). `censusOf` walks the children through
fragments, as BottomTabBar counts its items, and reads each `FilterChip`
element's props: a list chip with a value that is not null, undefined
or empty, read by the chip's own `hasChoice` so the two never disagree,
and a custom chip with a `valueLabel`, is active; an inactive chip with
`isSecondary` adds its label to the chips behind More. Anything else
counts as nothing, a false slot included. The count is in the server's
HTML. A chip wrapped in the app's own component cannot be read, so
`activeCount` replaces the count, and such a chip stays in the row: the
row's place carries the labels More holds, and only those leave it
(spec correction 29), so a wrapped secondary chip never vanishes.

**The row's order.** Spec 9.2 puts an active secondary chip after the
primary ones. The row flattens the children through fragments and moves
each secondary chip it can read after the rest, each keyed by its place
in the tree, so a chip that moves keeps its state. A wrapped chip stays
where it is declared.

**More's rules** (ruling 8, spec correction 29). More is drawn while a
readable secondary chip is inactive, and stays while its panel is open.
As the panel opens, it takes the labels behind More and shows those
until it closes, so a choice made in it, a multiple list's first toggle
included, never unmounts the field in use; the row shows the chip as
soon as it is active. FilterBar renders its children three times, in
the row, the panel and the sheet, each under the chip's place; the
panel and the sheet render nothing while closed, so their sections
mount only while open (R6). The copies share the app's value.

**Live** (ruling 9). A change in a chip, the panel or the sheet calls
the app's `onChange` at once, so the URL and the results behind the
scrim follow; there is no draft, and Done only closes. The app may name
Done with its result count, which it writes.

**Focus** (2.4.3). Focus never falls to the page. Clear all leaves with
the last active filter, so after the commit the first chip's trigger in
the row takes focus; in the sheet, Done takes it. A secondary chip
cleared in the row leaves it with its value, so after the commit More
takes focus, even when More was not drawn as the clear was pressed. A
choice in More that leaves nothing behind it takes More away as the
panel closes, so the chip the panel made active takes focus in the row,
once React Aria has lifted the inert page. Each waits for the commit
that removes the element holding focus, since a URL write may arrive
several renders after the press, and forgets the move once focus has
gone elsewhere by itself; focus on the body is focus in transit, so it
does not count as gone elsewhere.

**An open chip stays in the row.** A secondary chip in the row whose
last option is unchecked, or whose panel clears its own value, has no
value while its list or panel is open. It would go behind More at once,
taking the list in use with it and leaving focus on the body. Each such
chip reports its open state through the row's place,
`onRowOpenChange(label, isOpen)`, and FilterBar keeps the open labels in
its own state, `heldInRow`, and leaves them out of `behindMore`. The state
is the bar's, not the chip's, so the close re-renders the bar and its
focus effects run. As the list closes the label leaves `heldInRow`, the
chip goes behind More if it still has no value, and More takes focus.
The element expected to leave is the chip's trigger, since focus is
still in the closing list then. In Chromium the inert page a closing
popover made lifts only in React's passive phase, and an inert element
takes no focus, so any move whose target is inside `[inert]` waits for
that phase, not only the panel's.

**Turned wide with the sheet open.** Turning a phone past 768px with the
sheet open hides the Filters button, which the sheet gives focus back to
as it closes and which then takes none. The bar listens on the button
for React Aria's `react-aria-focus-scope-restore` event, which the
sheet's frame dispatches first, and while the button computes
`display: none` it takes the event and gives focus to the row's first
chip. A jsdom test hides the button inline, and the docs test turns the
viewport from 767px to 900px with the sheet open.

**R6, measured.** The `ManyOptions` story holds a 200-option chip, in
the row and in the sheet, and its play records the time from the press
to the list, in Chromium headless on the implementer's machine, five
runs: the row's list in 460 to 515ms, the sheet's sections in 140 to
156ms, and the sheet's list, from a sheet at rest, in 380 to 420ms.
The play waits for the sheet to come to rest before it opens the list:
the sheet's content is inert while it slides in (see "Sheet").
Each includes the test driver's press and the list's filter taking
focus; the sheet's open time is over 100ms.

**Forced colors and right to left.** As the parts it holds: the chips,
the Buttons, the Badge and the Sheet carry their own forced-colors
rules. The bar runs from the right: the search at the right edge, the
chips leftward from it, Clear all at the left end.

**Devices.** The Filters sheet on a real iPhone and an Android phone, a
chip's list opened over it and Done closing it: not yet verified.

**The size.** The entry `{ FilterBar, FilterChip }` measures what its
import pulls in: the chip with its list and the library Popover, and
the Sheet with its frame, the IconButton, the Button and the Badge,
which have entries or budgets of their own (spec correction 30). It
measured 5.87 kB without React Aria, Lucide and
`@internationalized/date`, above the spec's 4.5 kB, and the rule rounds
up to 6 kB and adds 0.5 kB: 6.5 kB.

## EmptyState

What a page or a table shows where it has nothing yet: `EmptyState`, an
icon, a title that says what is missing, a line that says what to do and
one action. The document has no empty state of its own beyond a text
color, so this one is derived from the card's steps and the text table.

**The column.** `div.empty-state` is a flex column, its items centered and
its text centered, padded a separate step by a peer step, 32px above and
below and 24px at the sides (`--spacing-separate`, `--spacing-peer`), so
it sits inside a card's body or a table's empty cell with room of its own
and never touches the holder's edge. It draws no surface: it takes the
fill of whatever holds it.

**The icon.** The app's Lucide element in `span.empty-state-icon`, drawn
24px in slate, a part step, 8px, over the title, and hidden from
assistive technology, since the title says what it shows. The library
imports no icon: lucide-react's `Icon` is a client module (see
"StatTile"), and the empty state stays a server part.

**The title.** A heading at `headingLevel`, 3 by default, the step under
a card's title, and 2 or 4 where the page asks; one look at every level.
It is the h4 step, `--text-h4` with its line height, at 700 in ink, the
field label's and the filter section's step: a short line that names a
state, not a page heading. It breaks anywhere, so a long word in the
app's sentence never pushes a phone's page sideways.

**The description.** `--text-small` with its line height and weight, in
slate, 4px under the title and at most 32rem wide, so a long line still
reads as one short paragraph in a wide table. The text table names an
empty state slate (`docs/design-system.md:886`, "A label, a hint, an
eyebrow, an empty state"), which overrides the older Dust Taupe line
that called empty state labels "placeholder-like" (`:42`). Never taupe:
the reader needs to read it, and taupe fails AA on every surface.

**The action.** One, in `div.empty-state-action`, a peer step, 24px,
under the text: a secondary Button that imports, a tertiary one that
clears the filters. The library draws no second slot.

**Measured.** The title is ink, 16.25 on canvas in light and 19.31 in
dark, 17.84 and 17.42 on lifted; the description and the icon are slate,
4.84 and 7.26 on canvas, 5.31 and 6.94 on lifted. Each is gated already
as text on canvas, lifted and float, and the contrast test cites the
gate and recomputes the values here.

**Forced colors.** The text takes the reader's palette on its own; the
icon is named `CanvasText` so it follows the text.

**Right to left.** Nothing mirrors: the column is centered, and the
description reads right to left from its own direction.

**Where it is used.** A page's empty card, DataTable's empty body and its
list face's (Tasks 2 and 4 of the data table plan). Static: no state, no
effect and no context, so a server component renders it.

**Import order.** `empty-state.css` is imported after `filter-bar.css`,
the first of the data files, and a test keeps `skeleton.css`, then
`data-table.css` and `side-panel.css` once they exist, after it in that
order. The tooltip's test, which allowed only the shell, home, picker and
filter files after the last overlay file, now allows the four data files
too.

**The size.** The entry `{ EmptyState, Skeleton }` measured 357 B without
React Aria, Lucide and `@internationalized/date`; the rule rounds up to
0.5 kB and adds 0.5 kB: 1 kB, the spec's budget.

## Skeleton

A placeholder shape where content will be: `Skeleton`, a line, a block or a
circle with no text, so a loading page keeps its layout. The document
has no loading state ("Loading state is unspecified; derive it"), so this
one is derived from the divider, the field and the target.

**The fill.** `--color-divider`, ink at 10% in light and white at 10% in
dark: the color the system already draws its quietest rule in, which
reads as a shape once it fills a bar and not a 1px line. It measures
1.23 against canvas in light and 1.28 in dark, 1.23 and 1.34 against
lifted. A skeleton is a decoration hidden from assistive technology, not
a boundary or text, so the values are recorded and not gated; the
contrast test recomputes them.

**The shapes.** A `line` is `1em` tall and 100% wide at `--radius-micro`,
an inline block on the text's line box, `vertical-align: middle`, so a
line of skeletons is the height of a line of the text it stands for (the
`TextLines` story measures it at the body and small steps). A `block` is
a field tall, `--size-field` (48px, 36px compact, 44px compact on a
coarse pointer), at `--radius-control`, so it takes the shape axis as a field
does: 20px corners in Rounded, 10px in Soft, square in Square. A
`circle` is the 40px target, `--size-target`, at `--radius-dot`, an
avatar's place. `width` and `height` write `inline-size` and
`block-size` inline, only when given, so a skeleton with neither writes
no `style` attribute and the server's HTML is the same everywhere.

**The pulse** (ruling 9). The opacity runs from 1 to 0.5 and back over
1.6s, ease in and out, forever: between the fill and half of it, which
measures 1.11 against canvas in both modes and 1.11 and 1.14 against
lifted. Only the opacity moves, never a sweep of color, so nothing
crosses the shape. Under `prefers-reduced-motion: reduce` it stands
still at the full fill. Playwright's screenshots run with animations
disabled, which holds it at its first frame.

**Forced colors.** A skeleton is only a fill, which the repaint would
drop, so it opts out (`forced-color-adjust: none`) and draws `GrayText`,
then `color-mix(in srgb, CanvasText 20%, canvas)` where the browser can
mix, so the shape stays in the reader's palette.

**The holder speaks.** `span.skeleton[aria-hidden="true"]` says nothing
and takes no focus. The part that shows skeletons says "Loading" once,
in a polite status of its own, and marks itself busy, as DataTable's
loading body does (spec 6.2).

**Where it is used.** DataTable's loading body and its list face's
(Tasks 2 and 4 of the data table plan), and any card that is loading.
Static, a server part.

**Right to left.** Nothing mirrors; a line's width runs from the inline
start, so a 60% line sits at the right on a Persian page.

**The size.** Measured with EmptyState, above.

## Dense data

The document has no rules for dense data. Its known gaps say so ("No
data-dense or tabular component patterns are defined", `:439`), Appendix
A quotes the line (`:448`), and the parent spec's risk R6 asks that dense
data, loading and empty states each get a recorded derivation before
they are built. This section is that derivation for the table and the
list that follow it; every value comes from a part that already has a
recorded rule.

**A row.** `max(var(--size-target), var(--size-field))`: 48px, 40px in
compact density and 44px compact on a coarse pointer, the field's height
and never under the 40px target, so a row holds a 40px checkbox in every
density and a finger always has a row to press. Cells are padded the
inset step, 16px, at their inline ends, so columns stand 32px apart, and
centered on the line. Above and below, a text cell is padded what a
one-line row leaves either side of its line and its rule, `(row - line -
1px) / 2`: 13.5px in a 48px row, 9.5px in compact. A cell of two lines
holds them as far off the rules as one line is, so a two-line row is
72px, 64px in compact (patch 0.6.1, "Row spacing" in DataTable).

**Rules, not stripes.** One 1px `--color-divider` rule under each row and
under the header, none above the first row, and a 1px `--color-frame`
rule above a totals row, the one rule that marks the end of a sum. No
zebra: the document's rhythm comes "from tone and whitespace, not lines",
and a rule per row is already the most a list draws.

**The header.** The overline step, `--text-overline` at its token weight
and tracking, uppercase, in slate: the token's own purpose ("Uppercase
column headers in tables and stat tiles"). It is the target's 40px tall,
so a sortable header, whose whole cell is its button, is hit at 40px.

**Text in a row.** `--text-small` at 450 in ink, the row header at 500,
the field label's weight; one line, ending in an ellipsis, with the full
text in the row's name. Figures follow the numeral rule of `copy.css`:
tabular digits, never broken, an isolated left-to-right run at the
line's end in either direction, so a column of amounts lines up at its
last digit on an English and a Persian page alike.

**The washes.** A row under the pointer takes the 5% ink wash over the
holder's fill, Menu's hover, only where hover exists; a selected row
takes 8%, one step over, with its checked box, never color alone. Slate
is the secondary text an app puts in a cell, so it meets 4.5 in every
row state: on the 5% wash it would measure 4.38 over canvas in light and
on the 8% wash 4.11, so a hovered or a selected row sets `--color-slate`
to granite for everything inside it, the app's own cell text included:
5.94 on the 5% wash and 5.59 on the 8% (patch 0.6.1, after an app's axe
check flagged a hovered row). A lighter 3% wash would have kept slate at
4.56, but the hover would then measure 1.06 against the canvas, where
the library's hover is 1.11. A sorted or hovered header is ink, and the
list face's slate meta line turns ink on a hovered or selected row.

**Focus.** The inset 2px ring in the focus ring token on the row, the
cell or the header, never under the pointer: a table can sit in a
scrolling region, where an outset ring is clipped (Menu's rule).

**The current row.** The row whose detail is open draws a 3px ink bar at
its inline start and its row header at 700, beside `aria-current` on its
link: a mark, a weight and a name, never color alone, and no ink fill, so
eight marked rows never draw a block of ink.

**Sticky and its layer.** A table's header row is the page's own sticky
element, so it sits at `calc(var(--z-header) - 1)`, under the page's
header and every piece of chrome ("The chrome's layers"), and sticks at
`--page-sticky-top`, the page header's height. AppShell's header slot
writes it from the header's measured height once hydrated (documents plan,
spec corrections 86 and 94); an app sets it itself, once on an ancestor,
only for a header outside the shell. The shell's header is the app's
content and has no fixed height, so no token is added.

**Never sideways.** A table never scrolls sideways in its own box: a
sticky header sticks to its nearest scroller, so inside one it would no
longer stick under the page's header, and a page that scrolls sideways
at 320px fails the parent spec. Columns leave instead, by a container
query on the table's own box at 48rem and 40rem (widths, not breakpoint
tokens), cells ellipsize, and under 40rem the list face takes over.

**Loading and empty.** A table that loads keeps its shape: skeleton rows
in its own columns, never a spinner in place of the rows, with one
spoken "Loading" in a status outside the busy part. A table with no rows
draws an EmptyState across every column: what is missing, in the app's
words.

## DataTable

Rows of data: `DataTable`'s table face, React Aria's Table with sorting,
a row header that links to the row's detail, a sticky header, figures,
columns that leave, totals, and an empty and a loading body; and its
list face, the same rows as React Aria's GridList grouped by day where
the table's box is narrow. The values come from "Dense data" above.

**The markup.** `div.data-table`, a size container named `data-table`,
holds `div.data-table-grid` with React Aria's `table.data-table-table`
(`thead`, `tbody` and, with totals, `tfoot`), then `div.data-table-list`
with the list face, then `div.data-table-error`, the error line, empty until a next page fails,
then, while a row is selected, the bulk-action bar, then
`span.data-table-status`, the polite status, and with selection on
`span.data-table-count`, the count's. The table is `table-layout: fixed`
at full width, so a column's `width`, written on its header cell as
`--data-table-column-width` and read as the cell's `inline-size`, is its
width (spec correction 1), and the rest share what is left. It draws no
surface of its own; the sticky header's fill is `--data-table-surface`,
the canvas by default, which an app sets to `--color-lifted` for a table
in a card.

**Measured.** A cell is ink, 16.25 on canvas in light and 19.31 in dark,
17.84 and 17.42 on lifted; a header is slate, 4.84 and 7.26 on canvas,
5.31 and 6.94 on lifted; all four are gated already. A hovered row is the
5% wash, a mix and not a token, so its pairs are measured and recorded:
ink 14.70 and 17.41 over canvas, 16.11 and 15.25 over lifted; slate 4.38
and 6.93 over canvas, 4.80 and 6.41 over lifted, which is why slate in
a hovered row is granite: 5.94 and 9.00 over canvas, 6.52 and 8.18 over
lifted. Slate on the bulk bar's float surface is 5.49 and 6.94. A
current, a disabled and the totals row take no fill, so their slate is
the rest pair. The rules are drawn, not read: the divider 1.23 and 1.28 over
canvas, the frame 1.28 and 1.36. The contrast test recomputes each.

**The stretched link** (ruling 2, risk R1). With `getRowHref`, the row
header's cell holds the library's `Link`, `a.data-table-link`, in the
row header's ink with no underline, around the cell's content. Its
`::after` is absolutely positioned at `inset: 0`, and the row is
`position: relative`, its containing block, so the link covers the whole
row and a press anywhere on it is a press on a real anchor: the router
opens it, and a middle click, a modifier click and the context menu are
the browser's. No cell is positioned, so none becomes the containing
block and clips the link to one cell; that is also why the current bar
is a border and not a `::before` (spec correction 13). React Aria never
sees the press as the row's: the link's own press stops there, and its
pointer down is a child's interaction the row ignores.

**Controls above the link** (spec correction 14). A button, an input, a
label, a select, a text area, a `summary`, a link other than the row's,
anything with the role `button`, `checkbox`, `combobox`, `menuitem`,
`radio`, `slider` or `switch`, anything in the tab order, a field, a
checkbox field and anything with the opt-in class `data-table-control`
in a cell are `position: relative` at `calc(var(--z-header) - 2)`: above
the stretched link, so they take their own press, and under the sticky
header cells at one less than the header's layer, so they scroll under
it. The row's own link is never raised, since a position would hold its
`::after` to its own box (the `CellControlsRaised` play, in three
engines). The stretched link also means text in a row is not selected by
a drag.

**The spike, in three engines.** Before the table was built, React
Aria's own Table wearing these classes, with the library's Checkbox,
Link and Menu, was run as six plays in Chromium, WebKit and Firefox
(`Checks/React Aria table`, commit 61e10a5, CI green in all three): the
browser's hit test finds the row's link under its amount cell and a
press there opens it and selects nothing; Enter on a focused row, taken
by a capture handler, clicks the link and selects nothing; the checkbox
and a cell's Menu trigger are what the hit test finds at their centers
and take their own press; a letter stopped by the capture handler never
reaches React Aria's typeahead (risk R2); an arrow that React Aria would
send to a hidden cell lands on the next shown one; and the header cells
stick at `--page-sticky-top` under a fixed 64px header. A table row is
the `::after`'s containing block in all three engines, so R1's fallback,
React Aria's `href` on the row, was not needed.

**The sticky cells** (spec correction 16). Each header cell is
`position: sticky` at `var(--page-sticky-top, 0px)`, not the `thead`,
which the spike proved in all three engines, at `calc(var(--z-header) -
1)` on the surface fill.

**Sorting** (ruling 12). A sortable header is React Aria's: a press,
Enter or Space calls `onSortChange` with that column ascending, or
descending when it is the column sorted ascending; there is no unsorted
state. The table shows what `sortDescriptor` says. The mark is a 16px
Lucide `ArrowUp` or `ArrowDown` on the sorted column, in ink with the
header, and `ArrowUpDown` in slate on a sortable column at rest, so a
sortable column shows itself before it is used; the marks never mirror,
up is ascending in both directions. React Aria writes `aria-sort` and
announces a change assertively in its own words (spec correction 9), with
no Persian (risk R5).

**Totals** (spec correction 3). A footer row counts in React Aria's
collection, so the empty body never renders while one exists: totals
render only while there are rows. The row is a `tfoot` row with a cell
per column, `isDisabled` with `disabledBehavior="selection"`, so the
arrows reach it and nothing selects it; its row header cell says
`labels.total` unless that column has its own total, at 700 under the
frame's rule, and it is not sticky.

**The empty and loading bodies** (spec correction 4). React Aria's empty
body is one row whose one cell spans every column. With no rows it holds
the app's `emptyState`. While loading with no rows it holds
`loadingRowCount` flex rows of skeleton lines, a row tall and ruled as
rows are, one line per column at the column's alignment and at 40% to
80% of its width in a fixed pattern, so the server and the browser draw
the same; the grid counts only the one empty row, so nothing can be
focused, selected or typed to. That cell is a `rowheader`, which axe
fails when it has no text, so it also holds `labels.loading`, visually
hidden (spec correction 22). While loading with rows, the rows stay.

**The error state** (amendment 2, spec correction 45). `error` is what
the app says when the rows did not load. With no rows it is the body,
React Aria's empty cell, in place of `emptyState`, as an EmptyState with
a Retry action. With rows shown, a next page that failed, it is
`div.data-table-error`, a polite status between the grid and the bar,
mounted empty so the error is heard as it arrives and taking no room
while empty, written at the small step in the error color a part step
under the rows, inset as the cells: 6.58 on canvas in light and 6.36 in
dark, 7.22 and 5.73 on lifted, all gated. It is the one use of the error
color in the table, and it means exactly that. It wins over `isLoading`
and `emptyState`: while it stands nothing is busy, no skeleton is drawn,
the loading status is silent and the reloading cue is off.

**Reloading** (amendment 5, spec correction 46). While rows already
shown load again, the next page, `QUIET_MS` after the load starts, as
the status speaks, `div.data-table-grid` takes `data-reloading` and each
header cell draws a 2px ink line at its foot, one line across the header
row, the cells being sticky and so positioned; it pulses as a skeleton
does, over 1.6s, stands still under reduced motion and is `CanvasText`
in forced colors. No text dims: the body at 60% opacity measured ink at
4.62 on canvas in light and would put an app's slate text under 3, so
the cue is a line. A load shorter than `QUIET_MS` draws nothing.

**Column options** (amendments 4 and 5, spec correction 47). `overflow:
'wrap'` lets a column's text run to two lines and clamps it there with
an ellipsis, `-webkit-line-clamp` on a `span.data-table-wrap` in the
cell, since a table cell cannot be the clamping box, its two lines as
far off the row's rules as one line is in its 48px row, a part step
until patch 0.6.1 and every text cell's block padding since (spec
correction 67, "Row spacing"); the row grows to hold it,
and its full text is still the row's name; an end-aligned column never
wraps, its figures stay unbroken. Every cell of that row stays centered
on it: the checkbox and a row menu have no text baseline to share with
the memo's first line, and centering keeps them, and every single-line
cell, on one line with each other as in a row that does not wrap. A
cell that holds only a control, a row menu's button, is never clipped
and draws no ellipsis: its focus ring and hit area reach past its box,
and an ellipsis there stood for no text (spec correction 66). `firstSortDirection: 'descending'` makes the first press on a
column, one that changes the sorted column, sort it descending, and each
later press flips it, React Aria's two states (ruling 12).
`isHeaderHidden` hides a header's label from sight only, as an actions
column of row menus needs: the column keeps `header` as its name.

**Busy and the status** (spec corrections 2 and 22). React Aria drops
`aria-busy` and `aria-current` from its Table and Row, so `aria-busy`
goes on `div.data-table-grid`, the face that loads. The status is that
element's sibling, outside the busy part and always mounted, empty in
the server's HTML: a screen reader may hold back what changes inside a
busy part, and a live region that appears with its text is often not
announced, as Skeleton's record says. It says `labels.loading`
`QUIET_MS` after loading starts and empties when it ends, so a load
shorter than that says nothing.

**The current row** (spec correction 2). The row takes `data-current`
and its link `aria-current="true"`; the first shown cell draws a 3px ink
`border-inline-start`, its padding 3px less so nothing moves, at the
right on a right-to-left page; the row header is 700. The rule is
written in `:where()`, under a leaving cell's, so a first column that has
left draws no bar, and each container width draws it on the first cell
that has not left (the `CurrentBarPastHidden` play, in three engines).

**Columns that leave** (ruling 6, spec corrections 15 and 70).
`hideBelow: 'md'` leaves under 48rem of the table's box, by container
query; under 40rem the list is drawn, so there is no second width. Their header and body cells stay in their rows, zero
wide with no inline padding or border, and `visibility: hidden`, which
takes them from sight, the pointer and assistive technology as
`display: none` would (spec correction 26). They are not `display: none`:
React Aria's empty cell spans every column of its collection, so with
the header's cells gone it made a column with no header at the table's
end, and the header and its rule stopped short of the box while the
skeleton rows ran to its edge; and an engine that counts a fixed table's
columns from more than its first row drew the same strip after a column
left. With every row holding every column, the table is the full width
of its box in all three engines (the `FullWidth` play), and a skeleton
row, a flex row inside that one cell whose cells take the columns' widths
and drop a column that left, lines up under the header. The row header
never leaves. React Aria's keyboard delegate walks its collection, not
the DOM, so an arrow could land on a hidden cell (spec correction 8):
DataTable's capture handler reads the computed visibility at key time
and, where React Aria would reach a hidden cell or column header with
Arrow Right or Arrow Left, Home or End, Ctrl+Home or Ctrl+End, or Arrow Up from the first
row into the first column's header, focuses the nearest shown one
instead, whose focus sets React Aria's focused key and its one tab stop.
It takes these keys with the modifiers React Aria's grid moves with:
none, Shift, and Ctrl off a Mac or Alt on one. Arrow Right is the next
cell in a left-to-right locale and the previous in a right-to-left one,
read from the locale as React Aria reads it, not from the CSS. In the
header row React Aria wraps Arrow Left and Right from one end to the
other; the handler stops them at the row's shown ends instead (spec
correction 43).

**Keeping clear of the header and the bar** (amendment 5, WCAG 2.4.11,
spec correction 42). A focused row must not end hidden behind the sticky
header row or the bulk-action bar. Rows and body cells carry
`scroll-margin-block` of `--data-table-scroll-start`,
`--page-sticky-top` plus the 40px header row (the root's scroll is never
padded, so the margin holds the whole offset; documents plan, spec
correction 121, which undoes correction 95's subtraction), and
`--data-table-scroll-end`, while the bar shows (`.data-table:has(>
.data-table-bar)`) the bar's inset and height,
`--app-shell-inset-block-end` plus 16px plus `--size-control`, two part
steps and its 1px edges; the list face's items read the same two
properties. A browser honors a scroll margin only when it scrolls a row
that is partly out of the view: Chromium's `scrollIntoView({ block:
'nearest' })`, which React Aria calls, leaves a row wholly in the view
and under the header or the bar where it is. So DataTable's root focus
capture also scrolls a focused body row or cell clear of the header row
and the bar by the least it needs, two frames after the focus, after
React Aria's own scroll (the `ScrollClear` play, J and K under a 64px
page header with the bar shown, in three engines). In the list the
covers are the page's sticky offset, which an ungrouped list has as its
only one, the item's day heading where it comes to rest, and the head
while it sticks in Select mode; each grid resolves `--page-sticky-top`
as its own `scroll-margin-block-start`, so the handler reads it in
pixels whatever unit the app wrote (spec correction 58; the
`ListScrollClear` plays).

**Hover and disabled** (spec corrections 40 and 47). The 5% wash is
drawn on a body row with a link (and, once selection is on, on every
selectable body row) under `:hover` or React Aria's `data-hovered`,
inside `@media (hover: hover)`; the totals row, which is never opened or
selected, takes none. A row with no selection is not React Aria's
hoverable item, since its press is the link's, so `:hover` is what draws
it. A row in `disabledKeys` is, by default (`disabledBehavior: 'all'`),
taupe with `cursor: not-allowed`, takes no focus and draws no link; with
`disabledBehavior: 'selection'` it keeps its link, its focus and its ink
and only its box is disabled, so a row that cannot be selected still
opens. Select-all and X skip it either way. React Aria writes
`aria-selected="false"` on every row while selection is on, the totals
row's too; a ref takes it off that row once it is drawn, so after
hydration the totals row claims no selection state, while the server's
HTML still carries it.

**Page Up and Page Down** (risk R4, spec correction 41). React Aria
measures a page against the whole table when the page itself scrolls, so
they moved to the first and last row. The capture handler takes them
from a body row or cell and moves by the rows that fit in the view: the
height of the nearest ancestor that scrolls, or the window, less the
sticky offset, the header row and, while it shows, the bar, over the
focused row's height, from a cell to the same column's cell, never past
the first or the last row; with Shift it extends the selection to the
row it reaches, as React Aria does (the `PageKeys` play, in three
engines). A header's keys stay React Aria's. In the list a page is the
view less the page's sticky offset, a day heading and the head while it
sticks (spec correction 58; the `ListPageKeys` plays).

**The sticky offset** (risk R8, spec correction 48). A wrong
`--page-sticky-top` puts the header under or below the page's header;
the `StickyHeader` story pins it under a 64px bar. The docs site writes
its own header's height to it, through a `ResizeObserver`, so the
examples' header rows stop under the docs header. A sticky part sticks
in its nearest scroll container, and an `overflow-x: auto` frame is one
in both axes, so a table in such a frame stuck its header the page
header's height down inside it, over its third row: an element that
scrolls around a table sets the offset to `0px` (spec correction 68).
DataTable cannot do it itself: an app's header may scroll inside the
same element, and nothing in the table can tell.

**Forced colors** (spec correction 39). Rules and the skeleton rows'
rules are `CanvasText`; the current bar `CanvasText`; the focus ring
`Highlight`; a disabled row `GrayText`; the bar's edge `CanvasText`. A
selected row is the reader's own selection pair, `Highlight` with
`HighlightText`, hovered too, and is drawn out of the forced repaint
with `forced-color-adjust: none`: inside the repaint, Chromium draws a
backplate in the system's background color behind each run of text, so
`HighlightText` sat on that backplate and could vanish, and the focus
ring, `Highlight` on the `Highlight` fill, did not show at all (WCAG
2.4.7). Out of the repaint
nothing is forced, so every part of the row takes the pair by name: its
text, its rules and its rings `HighlightText`, no fill of its own on
anything such as a badge, and a checked box drawn inverted, a
`HighlightText` box with a `Highlight` mark. A focused selected row or
cell is ringed `HighlightText`. The docs check what Chromium draws, not
only the computed values: the payee is `HighlightText` on `Highlight` at
the pair's own contrast, the ring along the row's top edge is
`HighlightText`, and the box shows both colors.

**Right to left.** Columns run from the right, an `align: 'end'` column
sits at the left with its figures a left-to-right run, the sort arrows
keep up for ascending, the current bar is at the right, the checkbox
column is the rightmost, and the bar's count sits at its right
(`DataTableMirrored`). In the list an item's box is at its right, its
amount at its left and its current border at its right
(`DataTableListMirrored`).

**Selection** (section 7, rulings 2 and 4, spec corrections 5, 30, 35,
36 and 44). With `selectedKeys` and `onSelectionChange`, the table is
React Aria's `selectionMode="multiple"` with
`selectionBehavior="toggle"`, and a first column, `__selection`, 3.5rem
wide with the part step, 8px, of padding at its ends, holds React Aria's
selection-slot checkboxes: the 40px hit area and 8px of room beside a
scroll edge, the checkbox rule's. The column never leaves. The header's
box is named `labels.selectAll`; a row's is named by React Aria's
`aria-labelledby`, its own label `labels.select` and then the row
header, so it reads "Select Corner Mart" and never the row's name twice.
The totals row's first cell is empty and a skeleton row's first cell a
3.5rem blank. Select-all and Mod+A give React Aria's `'all'`, which the
app never sees: `onSelectionChange` receives the keys of `items` not in
`disabledKeys`, the rows on this page, and a set becomes its keys in
order (ruling 4). React Aria is given only the selected keys still in
`items`, so a selection of keys that have left draws no indeterminate
header and lets Escape through; every change React Aria makes reaches
the app with those other keys after its own, kept until the app drops
them (risk R6), and Clear selection clears them all (spec correction
36). React Aria's selection, with its anchor, goes back to React Aria
while the app holds the same keys, so Shift with an arrow extends from
the row Space or X last toggled and shrinks on the way back, as React
Aria's own selection does; an array alone would lose the anchor on every
change. A press on a row is its link's and never selects, before and
after a row is selected. A row without a link selects nothing on a press
either: React Aria's cell would select its row on a press anywhere in
it, so DataTable's root stops, in its capture phase, a pointer down, a
mouse down and a screen reader's virtual click that land in a cell on
none of its controls, the list correction 14 raises, the checkbox's
field among them (spec correction 35, the `PressNeverSelects` play, in
three engines). React Aria's cell stops those events itself, so nothing
outside the table hears less than it did. Shift with a press on a row's
box selects the range from the anchor, as Shift with an arrow does:
React Aria's box toggles through its label's press, and clicks the label
itself 80ms later when the click of a press it started never reaches it,
so the root stops that press before React Aria starts one, cancels the
click and extends the selection through React Aria's manager (the
`ShiftPressRange` play, in three engines); without Shift the box toggles
its row.

**The selected wash** (ruling 7). A selected row takes the ink wash at
8% over the fill, one step over hover and held under the pointer, beside
its checked box, never color alone. It is a mix, so its pairs are
measured and recorded, not gated: ink 13.81 and 16.06 over canvas, 15.13
and 13.92 over lifted; slate 4.11 and 6.62 over canvas, 4.51 and 6.04
over lifted, under 4.5 over canvas in light, so the row sets
`--color-slate` to `--color-granite` for everything inside it: granite
5.59 and 8.50 over canvas, 6.12 and 7.63 over lifted. In forced colors a selected row is `Highlight` with
`HighlightText`.

**The bar** (ruling 5, spec corrections 9, 18, 29 and 38). While any
selected key is in `items`, `div.data-table-bar` follows the grid: React
Aria's Toolbar named `labels.toolbar`, holding
`labels.selected(formatCount(count))` at the small step at 500 with
tabular digits, the app's `bulkActions`, and a tertiary Clear selection.
It is the float surface Popover draws, with the frame's hairline,
`--radius-surface` and `--shadow-float`; its count is ink on float,
18.43 and 17.42, gated. It is `position: sticky` at
`--app-shell-inset-block-end` plus 16px from the viewport's bottom,
inside DataTable's box, so it rides with the table above a bottom tab
bar's reserve and comes to rest under the table once the table has
scrolled past (the `StickyBar` play); its layer is the header cells',
one under the header token. The count counts only keys still in `items`
(risk R6). A second polite status, `span.data-table-count`, says the
count `QUIET_MS` after it last changed, so a run of X presses is said
once; a run that ends on the count it already says, 2, 3 and 2 again,
changes nothing in it and is not said twice; it empties when the
selection does. React Aria also announces each change assertively in its
own English (spec correction 9), so a screen reader hears both, and only
the bar's is in the reader's language. Clear selection and Escape in the
bar clear the selection and put focus on the shown face's grid (spec
correction 18); Escape in a text field in the bar is the field's. React
Aria's Toolbar has no Escape and takes no key or focus handler, so
DataTable's root hears the bar's Escape and where focus is. When the
selection empties some other way while focus is in the bar, such as a
bulk action that clears it, a layout effect puts focus on the grid, only
when focus has fallen to the page. When the action opened a dialog or a
menu, a portal that holds focus as the bar leaves, such as a confirm
whose Delete clears the selection, the table watches that portal, the
body's child that holds it, and once it has left the page with focus
fallen to the body, puts focus on the grid; focus the reader moves out
of the portal ends the watch (the `ConfirmClears` play). Focus that
leaves the bar for the page, rather than for a portal, forgets the bar.
Left and Right move between the bar's buttons, React Aria's toolbar
keys.

**The keys** (ruling 3, spec corrections 6 to 8, 30, 31, 33, 34 and 37).
One capture handler on DataTable's root takes keys before React Aria's
grid, in this order. Nothing is taken from a key that reached the root
only through React's tree (a Menu opened in a cell is a portal), a
composing key, a key while the table sits under an open modal, a key in
a text input, a text area, a select or editable content, or a key in the
bar; a checkbox types nothing, so X on a row's box is the row's. The
modal test asks the overlay stack whether the table's root is outside
the top-most open modal: a table under a dialog stands down, and a table
inside one keeps its keys (spec correction 33, the `InDialog` play, in
three engines). Enter on a row, one of its own cells or the box in its
checkbox cell, with any modifiers, stops there and opens the row's link:
`click()` with none, so the router opens it, and a dispatched click
carrying the modifiers with one, as React Aria's `openLink` does, so
React Aria's link leaves it to the browser; a row without a link
swallows it, so React Aria never selects the row (spec correction 6),
and Enter on a row's box opens the row where React Aria would toggle it,
while Enter on the select-all box does nothing (spec correction 37).
Enter on a header, or on a control in a cell, is theirs. Then the
hidden-cell keys, above. Every other key with Ctrl, Alt or Meta is React
Aria's (Mod+A, Shift with the arrows). J and K, matched by `event.key`
and then by `event.code`, so a Persian layout's J is J, stop and
dispatch Arrow Down and Arrow Up on the focused element, the library's
own technique (spec correction 7). X, matched the same way, toggles the
focused row through React Aria's selection manager, as Space does, so it
sets the anchor Shift extends from; it does nothing on the totals row,
the empty row or a disabled row. A single printable key but Space that
React Aria's typeahead would act on, one that some row's name, a row
header cell's text, the totals row's or a header's name starts with
under React Aria's own search collator (`useFilter` at base
sensitivity), stops, so typeahead never moves focus; every other key
goes on to the page, so a page's shortcut such as "/" still works while
focus is in the table. React Aria stops a key itself once its typeahead
moved focus, so the handler stops nothing React Aria would have let
through (spec correction 34). Where the handler itself takes a Shift
arrow, or Ctrl+Shift+Home or End off a Mac, past a column that has left,
it extends the selection to the shown cell's row, the row React Aria
would have reached, so a hidden cell never stops Shift from extending
(the `ShiftPastHidden` play, in three engines). Escape in the table is
React Aria's: it clears a selection, and passes to the page when there
is none; from an editor in a cell it leaves the editor ("Editors in
cells").

**One tab stop** (spec 7.2, spec correction 28). React Aria's
`useFocusable` gives its Link and its checkboxes `tabindex="0"` for
Safari's sake, so every row link and checkbox was in the page's tab
order. With a real Tab key in Chromium React Aria's grid still made the
table one stop, moving focus to its last tabbable element on Tab and
back to its focused row when focus came in, but anything that follows
the DOM's tab order, as a keyboard simulation does, walked every row
link. The row links and the checkboxes now take `excludeFromTabOrder`:
the arrows still focus them, and a pointer, a middle click and the
context menu are the link's, so the table is one stop by the DOM itself.
Tab from before it lands on its focused row, the next Tab on the bar
when it shows and past the table when it does not, and Shift+Tab from
the bar returns to the row or cell last focused (the `TabStop` play, in
three engines, and a docs end-to-end test with the real Tab key).

**Editors in cells** (documents spec corrections 48, 64, 67 and 69,
risk R8). React Aria's cell takes every arrow from its children in its
key capture, re-dispatching Up and Down to the row and walking the
cell's focusable children on Left and Right, and the list's item does
the same. While an editable element in a cell has focus (a text input,
a text area, a select, editable content such as a date segment, never a
checkbox), DataTable turns the table's keyboard navigation off through
React Aria's table state, and draws the list with
`keyboardNavigationBehavior="tab"`, in which an item leaves its
children's arrows alone and stops their other keys short of the list:
the editor's arrows move its caret or step its segments. Escape the
editor leaves alone, not prevented and not stopped (a search field's
clearing, an open calendar's closing and a combo box's are theirs, and
a portal's Escape is not in the root's DOM), gives focus to the row or
the item, the WAI-ARIA grid pattern's way out of editing mode, and the
row's focus turns the navigation back on; the table hears it on the
root's bubble handler, the list on each item part's, before the item
stops it. Tab and Shift+Tab move from editor to editor in the DOM's
order, row by row like a form or a spreadsheet, and out of the table
after the last, in both faces (Chromium, `InTableCell` and
`InListItem`). The switch turns back on from focus: the root's focus
capture, its blur when focus leaves, a document `focusin` listener, and
a layout effect when `items` change, again after a frame since React
Aria draws a changed collection in a render of its own, so an engine
that fires no blur when a focused editor is removed or hidden never
leaves the arrows off.

**The modifier Enter, per engine** (open question 7, spec correction
32). The `ModifierEnter` play presses Ctrl+Enter on a row and records
the click that reaches the row's link. In Chromium, WebKit and Firefox
(CI at 6b36ad5) one click reached the link carrying Ctrl, the router
was not called, so React Aria's link left it to the browser, and the
row stayed unselected; Enter with no modifier then reached it with
none, and the router opened the row. What each browser opens for the
modifier click, a new tab or nothing, is not observable in a play, and
WebKit may ignore a modifier on a click a script dispatched; the
owner's device checks read it (owner action 4). Arrow Right onto the
row's link and the browser's own modifier Enter there is the fallback,
and the docs' Keys table names it (open question 7).

**Stale keys** (risk R6, spec correction 36). A selection keeps keys of
rows that have left `items` until the app drops them, so the bar counts
only keys still there, React Aria is given only those, and a warning,
once per mount, names the others: "DataTable: selectedKeys holds keys
that are not in items: t41, t42. Clear the selection when the rows
change." The docs clear the selection on every change of the rows.

**Row spacing** (patch 0.6.1). An app that draws every row as a name
over a slate second line found its rows too close: two 20px lines filled
a 48px row, 4px above and below. Measured before: a row 48px with
`padding-block: 0` and 16px inline, columns 32px apart, the header 40px,
a wrapping cell 56px with a part step above and below, and a list item
10px by 16px with its two lines 2px apart, 62px tall. Against other
systems, from their published sources:

| System | One-line row | Cell padding | Several lines |
| --- | --- | --- | --- |
| Material data table (`@material/data-table` 14) | 52px, dense down to 36px; header 56px | 16px inline, 0 block | its lists (`@material/list` 14): 48px for one line, 64px for two, 72px with a leading graphic, 88px for three |
| IBM Carbon (`@carbon/styles` 1.117) | xs 24, sm 32, md 40, lg 48 (the React default), xl 64; header matches | 16px inline | xl, 64px, is for two lines: 16px above and below, top aligned, the second line at label-01 |
| GitHub Primer DataTable (`@primer/react` 38) | condensed 28, normal 36, spacious 44 (12px text on a 20px line) | 4 by 8, 8 by 12, 12 by 16; 16px at the row's ends | none; a cell grows |
| Shopify Polaris IndexTable (13.9) | about 32px | 6px, 12px at the first cell | none; a cell grows |
| Atlassian dynamic table (19.3) | about 28px | 4px block, 8px inline | none; a cell grows |
| Apple (UIKit) | 44pt, the touch target | | a subtitle cell grows |

Linear and Stripe publish no numbers, so none are quoted here. The
systems agree on 16px at a cell's inline ends, on about 48px for a
comfortable one-line row and on 64 to 72px for two lines, with 12 to
16px above and below them. So a text cell's block padding is what a
one-line row leaves either side of its line and its 1px rule, `calc((var(--data-table-row) - var(--text-small) * var(--text-small--line-height) - 1px) / 2)`,
`--data-table-pad-block` on the root: 13.5px. A one-line row stays 48px
and a two-line row is 72px, its text as far off the rules as one line;
compact density gives 9.5px, 40px and 64px. The value comes from the row
and type tokens, so no spacing token is added. A cell that holds only a
control, and the checkbox column, take no block padding, since the
control is a target tall and the row's height centers it; a cell with
something taller than a line, a badge, grows its row by the difference.
Columns stay 32px apart and the header 40px, the target. A wrapping cell
is 68px. Skeleton rows stay a one-line row tall, and the totals row is a
row; the sticky header, the bar, the current bar and the focus rings
follow the row's box and need nothing.

**A second line in a cell.** `span.data-table-cell-meta`, written by the
app inside its cell: a block, a quarter rem, 4px, under the first line,
slate at the cell weight, 450 even under the row header's 500 or the
current row's 700, ending in an ellipsis. It reads the slate token, so
a hovered or a selected row or item, which sets `--color-slate` to
granite (patch 0.6.1), draws it granite on its wash, and a disabled
row's is taupe with the rest of its text. Its pairs: slate at rest, 4.84
and 7.26 on canvas and 5.31 and 6.94 on lifted, gated; granite on the 5%
hover wash, 5.94 and 9.00 over canvas and 6.52 and 8.18 over lifted;
granite on the 8% selected wash, 5.59 and 8.50 over canvas and 6.12 and
7.63 over lifted, all over 4.5, which the contrast test holds. The
`TwoLine` story measures a 72px row, the cell's 13.5px padding and the
one-line account centered on the row; `TwoLineStates` reads the line
granite in a hovered and a selected row, slate in the current one and
taupe in a disabled one, and the a11y check measures each. The list
item's two lines are 4px apart too, its block padding the same 13.5px,
so an item of two lines is the 72px a two-line row is, and a skeleton
item matches it.

**Density.** No `density` prop: the system already has one density axis,
`data-density="compact"`, which DataTable follows through
`--size-field`, as Primer's `cellPadding` would; a third, roomier step
would be a token change for every part, not a table option.

**A width from its holder** (0.8.0, spec correction 63; it was a stand-in
of its own from patch 0.6.1). The root is a size container, so it has no
content width. 0.6.1 named `contain-intrinsic-inline-size: 12rem`, the
list face with an item's title, second line and amount still readable,
since in an `auto` grid column it drew the list face at none (18rem
pushed the docs' 320px page 22px). A stand-in width is also the root's
min-content width, which a `flex: 1` item or a `1fr` track keeps as its
narrowest: two tables two up in their own wrappers scrolled a 320px page
72px sideways. So it follows the library's rule for every size container
(CardActions, "An intrinsic inline size of 0"): its intrinsic inline size
is 0. `flex: 1 1 0; min-inline-size: 0` still takes the room its siblings
leave in a flex row, from a zero basis, so a sibling never shrinks for
it, and `max-block-size: max-content` keeps it no taller than its content
in a flex column, in Chromium and WebKit (Firefox grows it there, as
Pagination's record says). A block, a `1fr` track or a flex row gives it
its width; a holder that sizes it from its content, an `auto` column, a
flex column with `align-items: flex-start`, an `inline-block` or
`width: max-content`, draws it 0 wide and gives it one, which the changeset
tells upgraders (spec correction 69). The `InAFlexRow` story holds the
table face beside a 12rem column; `OnANarrowPhone` (three engines) puts
tables in a `flex: 1` wrapper, a `1fr` grid and two up at 320px in every
shape and density and finds no sideways scroll, each table filling its
holder with its list face. Measured at CI's tolerance on a local build
before and after, no existing baseline moves.

**A meter in a row** (spec correction 64). Meter cuts its segments apart and
rings its pace marker in `--meter-surface`, Lifted unless an ancestor sets
it, so a meter on a canvas row, and on any hovered or selected row, drew
pale blocks there. The root sets `--meter-surface: var(--data-table-fill)`,
and each rule that washes a row or a list item, hovered at 5% and selected
at 8%, sets it to the same `color-mix` as its fill, so the cuts are always
the row's own color. In a Card the fill is the card's, which the card names as
`--data-table-surface` (spec correction 74). The root's value is set from
the table's fill rather than read from an ancestor's `--meter-surface`: a
property cannot fall back to its own inherited value, and the table's fill,
not an outer surface, is what a plain row shows, so an app sets
`--data-table-surface` for a table on a fill of its own. Meter's segments
are backgrounds in a clipping flex track, where a transparent cut would show the track's frame color rather
than the row, so the surface is set, not masked as Gauge's gaps are. The
`OnTableRows` play (Meter, three engines) reads the cut and the ring on a
plain, a hovered and a selected row as the fill behind the meter. In forced
colors the meter keeps its own `canvas` surface, as before.

**The list face** (ruling 8, spec 8). Both faces are in the server's
HTML, and a container query on DataTable's own box shows one: under
40rem the grid is `display: none` and `div.data-table-list` is drawn,
and the other way round. The box, not the viewport, so a table beside an
open panel on a small laptop is a list too, and nothing is measured, so
the server's page is right at every width. The list is a second `grid`
of the table's name; only one is ever drawn, so a reader and a screen
reader meet one. With selection on and rows to show, a head row comes
first (Select mode, below), then React Aria's `GridList` with
`disallowTypeAhead` (spec correction 10), then, with totals, the totals
line.

**Days.** `getGroup` gives each row a group id and the app's label;
`groupsOf` walks the rows in order and starts a section whenever the id
changes, so only adjacent rows group and a day that comes back after
another is a second section with a key of its own. The app sorts; the
docs say to pass `getGroup` only while sorted by date. Each section is a
`GridListSection`, a `rowgroup` named by its `GridListHeader`, the day's
heading: the overline step in slate on the surface's fill, a peer step
above it and a part step under it, sticky at `--page-sticky-top` one
layer under the header token, so the day stays in view while its items
scroll and the next day's heading pushes it out. Without `getGroup` the
items are the list's own, with no section and no heading: a section with
no header would name its `rowgroup` by an id that names nothing (spec
correction 51).

**An item.** Each row is a `GridListItem`, named by the row's text as
the table's row is and described by its meta and end parts, each part
by its own id so they are heard a word apart (spec correction 59), at least `max(--size-target, 3.5rem)` tall for two
lines, its lines 4px apart, padded `--data-table-pad-block` by 16px,
13.5px as a row's cells (patch 0.6.1; it was 10px with the lines 2px
apart), so two lines make 72px, its parts 12px apart, at the small step
at 450, and a divider rule under it but the last of its day. A column's
`listSlot` places its cell: `'title'`, the first line at 500, which the
row header takes by default and where its link is, stretched over the
item as in a row (the item is `position: relative`); `'meta'`, the
second line in slate; `'end'`, a column of cells at the item's end,
figures by the numeral rule; `'hidden'`, every other column's default.
Cells on one line are parts a part step apart; the library writes no
separator. Both lines end in an ellipsis on one line, and a line holding
a column with `overflow: 'wrap'` runs to two and clamps there (amendment
4). Hover, selected, current, focus and disabled are the rows': the 5%
wash on hover where hover exists and the 8% wash selected, slate turned
granite on both, a 3px ink inline-start border and a title at 700 for
the current item, the inset focus ring, and taupe for a disabled item.
The meta line turns ink on a hovered or selected item: 14.70 and 17.41
on the 5% wash over canvas, 13.81 and 16.06 on the 8%, light and dark;
any other slate in an item is granite, 5.94 and 9.00 on the 5% wash,
5.59 and 8.50 on the 8%. At rest the meta line is slate on canvas, 4.84 and 7.26,
or on lifted, 5.31 and 6.94, all gated.

**Select mode** (amendment 3, spec corrections 49 and 50). With
selection on, the list draws no checkboxes at first. Above it,
`div.data-table-list-head`, a target tall and ruled by the divider,
holds a tertiary button at its inline end named "Select"
(`labels.selectItems`). Pressed, every item draws its selection
checkbox, out of the tab order as the table's are; Select all
(`labels.selectAll`, the library's own Checkbox, since GridList has
none, spec 10.2 item 9) leads the head, checked or indeterminate from
the selection; and the button reads "Done" (`labels.doneSelecting`).
Done hides the boxes and keeps the selection. This is iOS Mail's order,
Select All leading and Done trailing. The button is a plain button whose
name says what it does next, not a toggle with `aria-pressed`, whose
name must not change, and focus stays on it after Select and after Done:
it is one element that keeps its place, so a second press undoes the
first. The GridList is multiselectable in both modes, so every item says
whether it is selected, and X and Space select the focused item whether
its box shows or not, as in the table. Out of Select mode a selected
item keeps a mark beside its wash, the checked box's look drawn, a 20px
ink box at the micro radius with a canvas check, 16.25 and 19.31,
`aria-hidden`: so after Done, after X, and when the list is drawn with a
selection made in the table face before the box narrowed, the selection
is never color alone, and the bar shows its count. While anything is
selected every item holds the mark's 20px slot, so selecting one never
moves its text, and the check is the checkbox's own mask, so the HTML
holds no icon (spec correction 61). Nothing measures when the list
starts to show. In Select mode the head sticks at the page's offset on
the fill, one layer under the header token, and the day headings stick
under it, so Select all and Done stay in reach, as a phone's selection
bar does; on a coarse pointer its controls are 44px (spec correction
64). In Select mode a press on an item, off its controls, toggles it, as
a phone's mail and photos do: its link takes no pointer there, the press
guard keeps React Aria's own press from starting, and the click toggles
through the list's manager; Enter, and the link reached by Arrow Right,
still open it. Out of Select mode a press opens and never selects,
ruling 2 (open question 8, spec correction 69).

**The list's keys** (spec correction 52). The table's capture handler
serves the list: J and K dispatch the arrows on the focused item, X
toggles it through React Aria's selection manager for the list, read
from an item's render values, so Shift extends from it, Enter opens its
link from the item or its box, and Page Up and Page Down move by the
items in view, read under the item's own sticky day heading. The list
takes no typeahead, so the handler stops no letter there and every one
reaches the page. Keys in the head are its controls' own. Out of Select
mode a press on an item's padding, which is in no cell, is stopped as a
press on a cell is, so it never selects. Focus on an item is scrolled clear of its day
heading and the bar, as a row's is of the header row.

**The list's totals, empty and loading bodies.** With totals and rows,
`div.data-table-list-total` follows the list: the frame's rule above it,
a target tall, `labels.total` at its start and the end slot's totals at
its end, at 700, figures by the numeral rule. React Aria's empty row
holds the empty state, the error, or while loading `loadingRowCount`
skeleton items, an item tall and ruled, each a 60% and a 40% line and an
end line at 24%, with `labels.loading` hidden from sight in the cell.
`div.data-table-list` is busy while loading as the grid is, and while
rows reload it draws one quiet line, at the foot of the first day's
heading or, ungrouped, along the list's top, sticky and out of the flow
so no item moves (spec correction 63). With more than one end column,
each total is named by its column's header in slate (spec correction
62). A grid with no rows is React Aria's tab stop itself, in either
face, so it draws the inset ring, `Highlight` in forced colors (spec
correction 60).

**The list in forced colors** (spec correction 57). The head's, the
items', the totals' and the skeleton items' rules are `CanvasText`, the
current border `CanvasText`, the focus ring `Highlight` and a disabled
item `GrayText`. A selected item is drawn as a selected row is, out of
the forced repaint with `forced-color-adjust: none`, `Highlight` with
`HighlightText`, every part in the pair, its checked box or its mark
inverted, a `HighlightText` box with a `Highlight` check, and a focused
selected item ringed `HighlightText`; the docs check the pixels Chromium
drew.

**Two faces, measured** (risk R3, spec corrections 54 and 65). Every
row is drawn twice in the server's HTML. With the story's five columns,
links and day groups, 50 rows write 128,207 bytes, the list face 50,311
of them, 6,606 gzipped, and 200 rows 482,951, the list 179,314, 19,863
gzipped; with selection on and two rows selected, 183,327 and 697,946.
The 200-row page is over the plan's 400 kB mark; the owner kept both
faces in the server's HTML and the docs advise pages of about 50 rows
with Pagination (open question 6).

**`hideBelow: 'sm'`** (spec corrections 53 and 70). Removed before
0.6.0: it named 40rem, the width at which the table gives way to its
list, so it changed nothing (open question 9).

**Beside a side panel** (ruling 24, spec correction 107 of the
documents plan). `listBelow: '40rem' | '32rem'`, a container width and not
a breakpoint, moves the switch to the list face. DataTable writes
`data-list-below="32rem"` for the second value and nothing for the
default; `data-table.css` keeps one 40rem block, scoped to
`:not([data-list-below='32rem'])`, and adds the same switch at 32rem for
the attribute, so the server's HTML is right at every width and the
select mode, the scroll clears and the sticky offsets follow the face
drawn, as DataTable reads the drawn face's `display`. At 1440px in an app
a table beside the 24rem panel is about 34rem: the table, its `hideBelow:
'md'` columns gone. Every phone held upright is under 32rem: the list.
The docs show an outline of the page beside the content from 1440px,
which left the recipe's box beside the panel about 19rem there; while an
example's panel is open they fold the outline under the content from
1440px, as they fold the rail, so the recipe's box is about 45.75rem at
1440 and draws its table, as an app's does. Its end-to-end test runs at
1440, and again at 1280, where the box is 36.75rem and `listBelow` is
what keeps the table.

**The bulk-action bar's data form** (ruling 25, spec corrections 14, 18
and 102 to 106 of the documents plan). Clear selection is a 40px ghost X
`IconButton` at the bar's start, named `labels.clearSelection`, with a tip
of the same words, in both forms; the count follows, then
`selectAllMatching` in `div.data-table-bar-select-all`, then the actions,
which take the line's end with `margin-inline-start: auto`. As data, up
to three `isPromoted` actions are secondary Buttons with a 16px icon and
`data-action-id`, a fourth warns once and goes to More, and More is an
ellipsis `IconButton` named `labels.moreActions` whose menu, opening above
the bar, is read as it opens: the unpromoted actions and every promoted
one whose button is not drawn (`isDrawn`, `getClientRects()`, since
`checkVisibility()` is above the Safari floor). The bar is its own size
container, and a container query reads its content box, inside the
padding that follows the shape: under 40rem of the bar's content the
promoted buttons are `display: none`, so More holds every action (spec
correction 116); a More holding only promoted actions
(`data-promoted-only`) is hidden at 40rem and wider; under 24rem the
select-all place takes a line of its own after the controls. The bar
keeps `flex-wrap: wrap` only as a last resort. The X and More are
controls in a single-row holder, held clear of its corners by the bar's
ends at `--holder-corner-inset` (Nested radii, derived), and the corner
audit passes. A node `bulkActions` draws as 0.6.0 did after the X.

Focus never falls to the page: a control that leaves the bar, by a
render, by being disabled or by the container query hiding it, hands
focus to the control in its place (More for a hidden promoted button).
Focus the reader moves out of the bar is theirs: a press outside it, or
focus that leaves a control still connected, drawn and enabled a frame
later, makes the bar forget the control, so a press on plain text, which
leaves focus on the body, is never followed by the bar taking it back as
it narrows or a control disables (spec correction 111). An action in
More that clears the selection takes the bar and the menu away together,
and the table takes focus in its layout effect, or, while React Aria's
open menu still holds the page inert, in its passive effect of the same
commit, after the menu's passive cleanup has taken `inert` away (spec
correction 113). The count is said once by the polite status, as before;
the menu's items keep the actions' names. With the X's tip open, as Tab
onto the X opens it, the first Escape is the tip's and the second clears
(spec correction 114); the tip repeats the X's name as its description,
which the Tooltip record accepts for every icon button until the owner's
screen reader check. A data array holding an entry that is not an
action warns once and draws nothing for that entry, rather than reach
React as a child it cannot draw (spec correction 118).

**The bar's offset.** The bar writes its border-box height as
`--save-bar-offset` through `useBottomBarOffset`, as SaveBar does, and
`data-table.css` declares the one-line height from tokens on
`:root:has(.data-table-bar)` and `.app-shell:has(.data-table-bar)`, so the
upload tray and the toasts sit above it; with a save bar on the page too,
each holder keeps both bars' heights and writes the taller (spec
correction 81). It sets no root scroll padding: the rows keep their own
scroll margin above it, and the bar registers itself as bottom chrome with
the shared focus clear (spec correction 121), so a control elsewhere in
the table's box that focus lands on under the stuck bar comes clear of
it. Its gap is 0, the bar's having no scroll margin of its own, so a row
the table's own clear has brought flush with the bar is not moved again.

**The size.** The entry `{ DataTable }` measured 2.62 kB without React
Aria, Lucide and `@internationalized/date`, Link and Skeleton included;
the rule rounds up to 3 kB and adds 0.5 kB: 3.5 kB, under the spec's 4
kB budget. With selection it measured 5.56 kB, which the rule sets at
6.5 kB, over the budget because the entry now carries Checkbox with its
field parts, Button, the bar, the key handler's shortcut matching and
the modal stack, each of which has an entry of its own. After Task 3's
fix round, with the press guard, the portal watch, the typeahead test,
the page keys, the error state and the reloading cue, it measured 6.99
kB, which the rule sets at 7.5 kB. With the list face and its Select
mode, Task 4 measured 8.02 kB, which the rule sets at 9 kB; its review
round, with the item descriptions, the tap in Select mode and the named
totals, and without the mark's icon, measured 8.32 kB, still 9 kB. With
`listBelow`, the X with its Tooltip and the More menu, batch 4 measured
11.11 kB, which the rule sets at 12 kB (spec correction 108 of the
documents plan); its review fix round, with the focus the bar forgets
and the malformed data guard, measures 11.39 kB, inside it. The shared
focus clear the bar registers with (spec correction 121) brings it to
12.07 kB, which the rule sets at 13 kB. With React Aria the entry
measured 80.5 kB at that review fix round and 81.19 kB with the focus
clear; the watch-only entry "DataTable with React Aria" holds it at 100
kB.

**Screen readers.** Not yet verified with VoiceOver and NVDA (owner
action 4): a row read by its row header and cells, the current row's
link read as current, the sort change, a row checkbox read as "Select
Corner Mart", the bar read as a toolbar named "Bulk actions", and how
often the selection count is announced; in the list, how a day's
rowgroup is announced, by its heading, with NVDA, VoiceOver and JAWS,
whether the Select button's new name, Done, is spoken when it is
pressed, in the same three, an item's description, its category and
amount, and an item's selected state read with its box hidden.

**Devices.** Not yet verified on a real iPhone and an Android phone
(owner action 4): outside Select mode a tap on an item opens it; Select
shows the checkboxes, a tap on an item then toggles it and Enter still
opens it; the Select all and Done head sticks under the page header
while the list scrolls, its controls 44px on a touch screen; and the
bulk-action bar sits above the tab bar.

## SidePanel

The detail of one row beside the rows: `SidePanelLayout` holds the page's
content and one `SidePanel`, which stands beside the content in a column
of its own on a wide screen and is a sheet on a phone. The document has
no panel of its own beside the content, so this one is derived from the
rail and from Sheet.

**The layout.** `div.side-panel-layout` is a grid of one column. From
1024px of viewport, while it holds an open aside
(`:has(> .side-panel)`), it is the content and a 24rem column,
`minmax(0, 1fr) 24rem`, a peer step, 24px, apart, its items at the top.
The panel pushes the content narrower and never covers it, so a
DataTable there may draw its list face by its own box (ruling 8).
`div.side-panel-layout-content` holds the page and takes focus as a last
resort (`tabIndex={-1}`, no outline), never as a tab stop.

**The surface.** The rail's, its third use after the rail and the drawer
as one object: the float fill, the hairline, the stadium corner, the
level 1 lift. It sits an inset, 16px, below the
layout's top, and it is sticky an inset under `--page-sticky-top`
(spec correction 73), so as the page scrolls it floats clear of the
page's header as the rail floats clear of the viewport's edge, as tall
as the viewport allows less that offset and two insets. The header, the
body and the footer are a column: the body scrolls inside the panel and
the footer stays pinned under it. Nothing moves: the panel is a column
of the layout and the content reflows once as it comes (R8, 10.2 item
11). In forced colors its edge is `CanvasText`. Its height is the room
under the header only when the layout starts right under it, so the
layout holds the page's title, filters and table in its content and
starts there; clamping the panel to the room under its own top would
measure it on every scroll (spec correction 89).

**The header.** The title, an `h2` at the h3 step, `--text-h3` with its
line height and letter spacing, at 700 in ink, breaking anywhere; the
description under it, 4px down, at the small step in slate; and the
close button at the inline end, a ghost `IconButton` with Lucide `X`,
hit at 40px, pulled a part step into the corner as Sheet's is. The
header is padded a peer step at its top and sides. With
`isTitleHidden` the title is visually hidden and still names the panel.

**The body and the footer** (spec correction 86). Each part holds its
own padding, as Sheet's do, so the body, which scrolls and clips what
it holds, has room for a field's focus ring: a peer step at its sides,
an inset at its end, a peer step with no footer, and an inset, 16px,
under the header that is a block scrolling with it, not padding, since
a scroller's block-start padding would hold a sticky part that far
below its top. While it scrolls and holds nothing to focus it is a tab
stop, ringed inside its edge, as Sheet's body is. It sets
`--page-sticky-top` to `0px` for what it holds, and so does the sheet's
body, so a table there sticks at their top (spec corrections 68 and
79). The footer is a wrapping row of actions at the inline end, a part
step apart, a peer step in from the sides, under a divider rule with an
inset above its actions and a peer step under them, `CanvasText` in
forced colors.

**Measured.** The title is ink on float, 18.43 in light and 17.42 in
dark; the description slate on float, 5.49 and 6.94. Both are gated as
text on float, and the contrast test cites the gate and recomputes the
values here. The footer's divider is 1.23 and 1.34 on float, a
separator as Sheet's is, measured and recorded, not gated.

**Which face, and when** (10.2 item 11, spec correction 17). The aside
is in the server's HTML while open, so a link to a row shows its detail
before any script. `useWide()` is true on the server and through
hydration and reads `(width >= 1024px)` in an effect after, as AppShell
does; under 1024px the aside is `display: none` from the first paint
and, after hydration, the panel is 3b's Sheet, modal, titled by the
title, with its footer, every dismissal asking to close. A phone that
opens a link to a row sees the list until scripts run (R7); the docs
advise the detail's own route for such a link.

**The landmark** (spec correction 19). The aside is a `complementary`
landmark named by its heading through `aria-labelledby`, which keeps it
a landmark inside `main`; on a phone it is a dialog titled by it.

**Focus and openings** (ruling 11, spec corrections 20, 75, 76, 77, 84
and 85).
An opening is `isOpen` turning true, or a panel mounted after hydration
with `isOpen`, as the app's `key` with the open row's id mounts one for
each row; a panel in the server's HTML, hydrated open, moves nothing.
On an opening the element that held focus is remembered by the layout,
so a Next button inside the panel keeps the first opener while panels
follow one another, and a panel opened from nowhere after the last one
closed has none, and on the
wide face focus moves to the heading, or to the aside, which can show a
ring, while the heading is hidden. When the panel closes, focus that
left with it, in the aside or the sheet's dialog, goes back to the
opener, or to the same row in the face a DataTable draws now if the
panel's going changed the face, or else to the content; focus in a
dialog or a menu the panel opened, as a confirm dialog's Discard, goes
back once that portal has left the page; focus the reader put
elsewhere stays. The wide face traps nothing: Tab leaves it,
nothing is inert and nothing is dimmed.

**Escape** (ruling 11, spec corrections 74, 80 and 88). The aside
listens in the bubble phase, so a list or menu open in the panel takes
its own Escape first, and takes only an Escape nothing handled, from
its own DOM, while no modal is open over it. Escape in the content is
the content's: the table's clears its selection. `onCloseRequest` is
asked before every close the panel starts, the close button and Escape
on either face and the sheet's swipe and press outside, and may refuse
it, so an app with unsaved edits asks whether to discard them, as Gmail
and Linear do. `isDismissable={false}` turns off only the sheet's swipe
and press outside, which move the sheet before they could ask; a swipe
the app refuses has already taken the sheet off the screen, so the
sheet rises again.

**Across 1024px** (spec correction 93). An open panel moves between its
faces as the window crosses 1024px: wide to narrow, the aside leaves
and the sheet rises and takes focus into its dialog; narrow to wide,
the sheet leaves and focus goes to the heading, after the sheet's own
hand-back. Focus moves with the panel only when it was in it: if the
reader was elsewhere on the page as the sheet came, the sheet holds
focus while it covers the page, and as the aside returns focus goes
back there, unscrolled, unless the reader moved into the sheet.

**The rail folds** (spec 10.3 amendment 1, spec correction 72). Under
1440px of viewport an open panel in a layout with `collapsesRail`, the
default, folds AppShell's rail to its 72px column and gives it back as
the panel closes. The fold is the shell's, not the reader's choice:
nothing is told through `onSidebarCollapsedChange`, a rail the reader
had folded stays folded, and a reader who expands the rail over a panel
keeps it expanded until the panel closes. While the fold alone
collapses the rail the shell's root carries `data-sidebar-folded`, and
the rail and the workspace move at once, in the frame the panel comes,
so the content's width changes once and a table beside the panel keeps
its table face at 1280px, about 45rem of box.

**The fold before scripts** (spec correction 94). A page loaded with
the panel open at 1024px to 1439px draws the rail folded from its first
paint: `SidePanelLayout` writes `data-collapses-rail` in the server's
HTML beside its open aside, and `app-shell.css` and `sidebar.css` fold
the rail from `:has()` on them, with no transition, before any script
runs. The stylesheet's copy of the collapsed rules sits in a media
block of its own, 1024px to under 1440px, since a selector cannot carry
a media condition; a CSS test keeps each copy's declarations the
collapsed rule's, and the collapsed width, 6.5rem, written out as the
sidebar token's collapsed value. A reader who expands the rail over the
panel writes `data-sidebar-unfolded` on the shell's root, which the
copy stands down for, until the last panel closes. Until hydration the
collapse button still reads as the expanded rail's, since only a script
can change its name; it does nothing before then either.

**Focus that follows the face** (spec correction 98). Focus given back
to a row as the panel closes stays on a drawn row while the content
settles: for a second after, while the layout's content resizes, focus
that has lost its row, to a face the box has since hidden or to the
body, moves to the same row in the face drawn now. A box whose width
moves through 40rem as the panel leaves, beside a rail unfolding over a
transition, would otherwise hide the row focus landed on. The fold asks
for nothing under 1024px, where the panel is a sheet and the rail a
drawer (spec correction 101).

**Right to left.** The panel's column is at the inline end, on the left
on a Persian page, and its close button at the header's left. Nothing
mirrors by attribute.

**The size** (spec corrections 83 and 91). The entry
`{ SidePanel, SidePanelLayout }` measured 3.07 kB without React Aria,
Lucide and `@internationalized/date`; the rule rounds up to 3.5 kB and
adds 0.5 kB: 4 kB. Its review round, with the portal watch, the open
stretch, the sheet's Escape and the move, measured 3.8 kB, which the
rule sets at 4.5 kB (spec correction 91), over the spec's 2 kB budget
because the entry carries Sheet with the overlay stack and its frame,
IconButton and the shell's fold, each of which has an entry of its own.

**Screen readers and devices.** Not yet verified with VoiceOver and
NVDA (owner action 4): the panel read as a complementary landmark named
by its title with focus on its heading, and the sheet read as a dialog;
on a real iPhone and an Android phone, the sheet opening from a row and
closing on a swipe, and a refused swipe rising again.

## ProgressBar

Work getting done: `ProgressBar`, how far an upload has come, or that a
reading is under way. The document has no progress bar of its own, so
this one is derived from Meter, the spinner and the skeleton (documents
spec, section 5).

**One object with Meter** (spec 13.2 item 5, the owner's answer in
13.3 item 9). The head is Meter's row, rule for rule: the label at
`--text-small` weight 500 in ink at the start, the value at
`--text-small` in slate with tabular figures at the end, 8px
(`--spacing-part`) above the track; the row wraps and a long word breaks
anywhere. The track is Meter's: 8px tall, the frame color, ink at 12%,
on `--radius-pill`. The fill is ink on the same radius, so both ends are
round in Rounded and Soft and square under Square, where
`--radius-pill` is 0, exactly as Meter's are. A meter and a progress bar
never differ by shape; the parent spec's "the ends of a progress stroke
take `--radius-dot`" is read as the spinner's stroke caps, whose ends are
dots. A meter measures against a limit and a progress bar measures work
getting done, and the role says which.

**The fill.** `span.progress-bar-fill`, absolute inside the track from
the inline start, `inline-size: var(--progress-bar-value, 0%)`. The
component writes `--progress-bar-value` on the track's inline `style`, the
share of the range as a percentage with at most three decimals (Meter's
rounding), so the stylesheet draws the width and a forced-colors block
can redraw it. It moves to each new value over 200ms
(`transition: inline-size 200ms ease`), so a run of small steps reads as
one movement.

**Indeterminate** (ruling 14). The fill becomes a segment 40% of the
track wide that slides from wholly before the track's start to wholly
past its end over 1.6s, ease in and out, forever: `inset-inline-start`
from `-40%` to `100%` of the track (spec correction 20). 1.6s is the
skeleton's pulse, so the library's two loading rhythms are one number.
The track writes no `style` while indeterminate. At rest, with no
animation running, the segment sits where the slide starts,
`inset-inline-start: -40%` in its own rule, wholly before the track's
start (spec correction 21).

**Reduced motion.** The determinate move stops (`transition: none`).
The slide slows by the spinner's own ratio, 900ms to 2400ms, from 1.6s
to `calc(1.6s * 8 / 3)`, about 4.3s, and never stops: the spinner's
rule, "a still spinner reads as finished", holds for a bar, where a
still segment at 40% reads as 40% done. Playwright's screenshots run
with animations disabled, which cancels an infinite animation, and a
reader's stylesheet may set `animation: none`; either way the segment's
own rule draws it, at the first frame's place before the track's start,
so the track reads empty, in a baseline and on the reader's screen.

**Right to left.** The fill is placed with logical properties, so it
grows from the right on a Persian page, and the slide animates the same
logical inset, so the segment slides from the inline start of the
direction the track itself resolves to, right to left on a Persian
page. Whatever set that direction, an rtl ancestor, a nested `dir` of
the other way or `dir="auto"` reading Persian or Latin, the slide
follows it; a sign read from an `[dir='rtl']` ancestor would not, and
`:dir()` is above the Chrome 111 and Safari 16.4 floor (spec correction
20). An animated inset is laid out on each frame rather than
composited; for one 8px segment that cost is small.

**The role on the track** (ruling 13). The WAI-ARIA `progressbar`
pattern by hand in a static module, not React Aria's `ProgressBar`, which
builds its value text with `Intl`. `progressbar` has presentational
children, so the role sits on `div.progress-bar-track`, as Meter's sits
on its bar, and the head beside it is not lost to it. While determinate
the track carries `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
clamped to the range, and `aria-valuetext`, which is `valueLabel` or the
default; while indeterminate it carries none of the four, which is how
the role says "unknown", and a `valueLabel` shown on purpose
(`showValueLabel`) describes the track through `aria-describedby`
instead. A range whose `maxValue` is not above `minValue` draws an empty
track and reports `minValue` for all three numbers, with no warning,
since a static part has no effect to warn from. The name is Meter's: a
non-blank `aria-labelledby`, else a non-blank `aria-label`, else a
non-blank label, else the value text; while indeterminate there is no
value text unless one is given, so a bar with nothing else to name it
takes `aria-label="Loading"`, Spinner's own default (spec correction
22). A blank `valueLabel` is no value text: the percentage stands while
determinate. The types ask for a name, and these fallbacks cover the
blank strings they admit; a label node that renders nothing or an
`aria-labelledby` that points at nothing is beyond what the bar can
see. The caller's `aria-describedby` moves to the track. The visible
value is `aria-hidden`, since the bar reads it. With an `aria-label`
and `showValueLabel={false}` there is no head at all: the upload row's
use.

**Never live** (spec 13.2 item 6). No `role="status"` and no
`aria-live`: a value that changes every 100ms would be read out every
100ms. The part that owns the work says what matters once, as the upload
tray's three announcements do, and a screen reader user who moves to the
bar hears its current value.

**The ASCII default.** The default value text is the percentage written
with integer arithmetic in ASCII digits,
`Math.round(((value - min) * 100) / (max - min))` and a `%`, never `Intl`,
so the server and the browser write the same under any locale. A Persian
page passes `valueLabel` in its own digits, as it passes every other
string. `useId` is the module's one hook, so a server component renders
the bar with no client JavaScript.

**Forced colors.** The fill is a background, which the repaint drops: it
becomes `canvastext`, and the track takes a 1px `canvastext` outline so
its end shows, as Meter's do. The indeterminate segment is the same fill.

**Contrast.** The label is ink and the value slate on canvas, lifted and
float, each gated already as text and cited by the contrast test, not
added. The track is a mix, so the fill against it is measured and
recorded, not gated: ink on the track is 12.69 in light and 14.19 in
dark over canvas, 13.88 and 12.19 over lifted (a Card holding the
upload list), and 14.34 and 12.19 over float (the tray's surface), each
past the 3:1 a graphic needs; the track against its surface is 1.28 and
1.36 on canvas, 1.28 and 1.43 on lifted and 1.29 and 1.43 on float, a
cue and not a boundary, since the value text carries the extent. So a
bar with no head needs its value shown in text beside it, as the upload
row's status line shows "45%" or "1.2 of 4 MB" (spec correction 23).
Signal orange, clay, error, success, warning and taupe appear nowhere.

**Where the build departs from the plan.** The props table on the docs
page picks the bar's own props from `ProgressBarProps`, as Meter's page
does, rather than listing `ProgressBarBaseProps` with every inherited
DOM attribute. The size limit is 1.5 kB, above the spec's 1 kB budget:
the entry measured 653 B, and the rule rounds up to 1 kB and adds
0.5 kB, as Meter's did. The review's fix round (spec corrections 20 to
23) slides the segment by its logical inset rather than a direction
property, rests it before the track's start, names an indeterminate bar
"Loading" when nothing else does, and adds the lifted surface and the
headless bar's value text; the entry then measures 661 B, inside the
same limit.

**Screen readers and devices.** Not yet verified with VoiceOver and
NVDA (owner action 4): the bar read by its name and value when reached,
and the bar speaking nothing as it moves. A screen reader's own
progress tones, such as NVDA's beeps for a progress bar that changes,
are the reader's setting and not a failure.

## FileDropZone

Files dropped on a field or on the whole page: `FileDropZone`, the inline
field; `PageDropZone`, the overlay that exists only while files are dragged
over the page; and `FileButton`, the button both rely on for the keyboard
and for touch. The document has no drop zone of its own, so this one is
derived from the field parts, the nested-radii table and the float surface
(documents spec, section 6).

**One check, three ways in** (rulings 1 and 2). A drop, a paste and a
choice run one function against `acceptedFileTypes`, `maxFileSize`,
`allowsMultiple` and `maxFiles`, and reach `onFiles(accepted, rejected)`
once, never with both lists empty. Each file is refused for the first
reason that holds, in this order: type, empty, size, count, where count
counts only the files accepted so far, so nine good files are never
refused for one bad one. A file whose type the browser does not know (an
empty MIME type, as some systems give a HEIC photo) matches no MIME entry
and is decided by the extension entries. A dropped folder is refused as
`'type'`, carried as `new File([], name)`, and never read (spec correction
16). The check is a courtesy: the docs say the server checks again, since
a renamed file passes any check by name.

**The box.** `--radius-surface`, 24px, a field frame's step. It is the
field's control, so in a holder's corner it keeps that corner and moves out
of the curve, as every control does (Nested radii, derived). A 2px dashed
`--color-boundary` edge, the control boundary, measured at 3.38 on canvas
and 3.45 on lifted in light, 5.34 and 5.21 in dark, each past the 3:1 a
control's edge needs (gated as the boundary on canvas and lifted; spec
correction 6 corrects the spec's 3.06 and 3.36). No fill of its own, so it
takes its holder's. `padding: var(--spacing-peer)`, `min-block-size: 8rem`,
the content centered: a 24px Lucide `Upload` in slate, `--spacing-part`
over a line holding the hint at `--text-body` weight 450 in ink and the
zone's secondary button. The box is a size container
(`container: file-drop-zone / inline-size`): under 20rem of its own width
the icon moves beside the line, for a zone in a narrow form column, and
the line wraps its hint over its button if it must.

**The drop look** (ruling 4). Any drag whose types include `'Files'` is a
copy and any other is cancelled, whatever the files' types, since Safari
shows no types during a drag: the zone never claims a refusal it cannot
see, and the check runs on the drop. While files are over the box its edge
turns solid ink and it takes the 5% ink wash, the float surface's hover
wash, inside the same radius, and "Drop to upload" at weight 500 in ink
replaces the hint. Ink on that wash measures 14.70 in light and 17.41 in
dark over canvas, 16.11 and 15.25 over lifted, recorded and not gated,
since the wash is a mix. Never signal orange, which is consent, and never
link blue.

**Invalid, disabled and touch.** Invalid turns the edge `--color-error`,
dashed, declared after the drop look so it wins its color, as invalid
outranks changed on a field; the error line is the field's. Disabled is
taupe, the edge, the text and the icon, with `cursor: not-allowed`; the
zone writes `aria-disabled` on its group, so its taupe text reads as an
inactive control's (spec correction 26). A click anywhere on the box
opens the picker, as Carbon's drop container and react-dropzone do: the
click is forwarded to the button's input, so the box adds no tab stop and
no role, and it takes the pointer cursor of a control, `not-allowed` while
disabled (spec correction 38). A phone cannot drag a file into a page, so under
`(hover: none) and (pointer: coarse)` the hint is not drawn and the button
stays; both strings are in the server's HTML and the media query picks.

**One tab stop** (ruling 3). The zone is a `group` named by its label,
which is the library's `Label` as a `span`, not `FieldHead`, since the zone
is no React Aria field and holds no value (spec correction 15). Its one
stop is the button, described by the description and, while invalid, by
the status. A paste on the focused button bubbles to the box, whose
listener runs the same check, so the keyboard adds files where a pointer
drops them. React Aria's `DropZone` would add a second, hidden stop named
"DropZone" in English, a tab stop in the server's HTML until hydration;
the box uses React Aria's `useDrop` with no drop button instead (spec
correction 5).

**Refusals.** A polite `role="status"` line, mounted empty with the zone
and clipped while empty, says `labels.rejected(n, formatCount(n),
rejected)` after a drop, paste or choice with refusals, and the zone is
invalid until the next. The default is singular for one file and names the
reason where every refusal shares one, as GOV.UK and Carbon state it: "1
file was not added: it is too large", "3 files were not added" where the
reasons differ (spec correction 33). Each round remounts the line, so a second refusal of the same count
is said again. `errorMessage` replaces the line; `isInvalid` is the app's
and a clean drop never clears it.

**A missed drop** (ruling 4). While any zone is mounted, one pair of
document listeners prevents the default of a files `dragover` and `drop`
that no part took, so a file dropped beside the zone never opens in the
tab and loses the page, and a held `dragover` sets `dropEffect` to
`'none'`, so the pointer says nothing drops there. A drop already taken,
a native file input, and a drag without files are left alone; a text
field, a text area or editable content is left alone only while the drag
also holds text or a link for it to insert, since a file alone dropped on
a form's text field would open in the tab and lose the form, and a
checkbox, a radio or a range is always held (spec correction 32). A
disabled zone still holds; the last zone to unmount releases.

**The page overlay.** Fixed, inset `--spacing-inset` from the viewport's
edges and from the rail's width
(`calc(var(--app-shell-sidebar, 0px) + var(--spacing-inset))`), so it
covers the workspace and leaves the rail in view, on the right on a
Persian page. A 2px dashed ink edge at `--radius-stadium`, the panel step,
since it is a page-sized object, over the canvas at 92% (`color-mix` on
the token), so the page shows faintly through. No text sits on that fill:
over solid ink, slate on it would be 4.11 in light. At its center a float
card (`--color-float`, the frame edge, `--radius-surface`,
`--shadow-float`, `padding: var(--spacing-peer) var(--spacing-separate)`)
holds a 40px `Upload` in ink, the title at `--text-h3` weight 500 and the
description in slate, 5.49 in light and 6.94 in dark on float (spec
correction 7). Its layer is `calc(var(--z-chrome) + 1)`: over the tab bar,
the tray and a save bar, under every modal and the toasts. It fades in
over 120ms through `@starting-style`, which is above the browser floor and
simply does not run there, and not at all under reduced motion. It is
drawn in the closest AppShell, or the body outside one, from a hidden mark
the zone renders in place while it shows: a fixed element inside an
ancestor with a `transform`, a `filter`, a `backdrop-filter` (a page
header's blur) or `contain` is confined to that ancestor's box. The shell
declares `--app-shell-sidebar`, so the overlay still clears the rail, and
the overlay copies the mark's theme, shape and density scope and its
direction (spec correction 34). The docs mount the zone at the page's
root.

**The overlay's lifetime.** It draws nothing on the server or while idle.
A set on the document of the elements the drag has entered, as React
Aria's `useDrop` keeps, shows it on the first `dragenter` holding files
and hides it when the last `dragleave` empties the set, which survives
Firefox's leave on every child boundary and Safari's null
`relatedTarget`. Each enter and leave first forgets the elements no longer
in the document, since an element removed under the pointer, a toast that
leaves, never gets its leave and would keep the overlay up after the drag
had gone (spec correction 31). The listeners are in the capture phase,
since a drop target on the page, the overlay among them, stops the drag
events it takes, and the set must see every one (spec correction 25).
`dragend` hides it at once. A drop hides it only once the drop has been
dispatched, in a `setTimeout` of 0: a browser runs the microtasks between
one listener and the next of a real drop, where React commits a state set
outside its handlers, so a hide in the capture listener took the overlay
away before its own drop handler ran and the files were lost, which no
dispatched event could show (spec correction 30). A `pointermove` or
`pointerdown` that is not a touch, which no engine sends during a native
drag, hides an overlay whose leave never came. It
stands down for a drag that holds no files (a row, a tag), while a modal
is open (`isAnotherModalOpen()` at each enter, spec correction 9), while
disabled, and for a second page zone, which warns once and stays idle
until the first unmounts. It is for the pointer and `aria-hidden`; its
keyboard twin is a `FileButton` beside the page's title. A page with a
page zone also takes a paste of files anywhere while focus is outside a
text field, as GitHub and Slack do, through the same check (spec
correction 39).

**FileButton.** React Aria's `FileTrigger` around the library's `Button`,
any variant. `capture` takes the HTML attribute's name and is handed to
`FileTrigger`'s `defaultCamera` (spec correction 1); FileDropZone passes
its own to its button. On iOS and Android it makes the input the camera's
only, so a zone given `capture` could no longer choose a PDF on a phone:
the docs prefer a second FileButton with `capture`, listing an image type,
beside the zone, and an extension beside each MIME type, since systems
disagree on types (spec correction 36). React Aria clears the input as the button is
pressed, so the same file chosen again fires again (spec correction 17).

**Forced colors.** The dashed edges are `canvastext`; a disabled zone's
edge, text and icon are `graytext`, as its button is; a drop target's
edge is `highlight` and solid, since the wash is gone, and it wins over
invalid here, whose error color is gone too (spec correction 35); the overlay's fill is `canvas`
with no transparency, and its card's edge `canvastext`.

**The spike** (spec correction 24). Before the parts,
`DropSpike.stories.tsx` proved in Chromium, WebKit and Firefox that a drop
holding files reaches `useDrop` with no drop button, and `DropZone` with
its hidden button out of the tab order; that a paste on a focused button
reaches the box around it with its file; that the document counter comes
back to zero across child boundaries; that a missed drop's default is
prevented and a drop into a text field or a file input is not; and that a
target drawn mid-drag takes the drop that follows, for events a script
dispatches. A script's `dispatchEvent` runs every listener before any
microtask, where a real drop runs them between listeners, so the spike
could not see the page zone hiding its overlay before the overlay's own
handler ran; a real drop through the DevTools protocol did, and the docs'
end-to-end run now drops real files on both zones (spec correction 30).
It found one difference in what
reaches `onDrop`: React Aria reads a dropped file only through
`webkitGetAsEntry()`, and Chromium gives a file a script made no entry, so
React Aria's items hold no file for a synthetic drop there. The library
reads the native transfer itself, during the drop, so a play's drop and a
real one take one path, and keeps `useDrop` for the drop look and the
event plumbing. The plays build their events as each engine takes them: a
script's transfer allows no operation, and Chromium and WebKit ignore the
setter, so the plays define `effectAllowed`; Firefox's `ClipboardEvent`
constructor drops `clipboardData`, so the paste plays define it.

**Where the build departs from the plan** (spec corrections 27 to 29).
The size limits are above the spec's budgets: `{ FileDropZone, FileButton }` measured 2.23 kB and is set
at 3 kB, and `{ PageDropZone }` 1.56 kB, set at 2.5 kB, by the repo's
rule; each carries the check, the transfer reader, the missed-drop hold
and React Aria's drop hook glue; after the review round they measure 2.61
kB and 2.17 kB, within those limits. The docs' "Take a photo" button shows
only on a coarse pointer without hover, through the site's own
`touch-only` class. The review round's changes, each cited above, are
spec corrections 30 to 39.

**Screen readers and devices.** Not yet verified (owner action 4): the zone
read as a group with one button described by its rules, a refusal spoken
once, the overlay never announced; on a phone, no drag hint, "Take a
photo" opening the camera, a HEIC photo with an empty type passing by
`.heic`, and whether iOS hands a HEIC photo over as HEIC or converts it to
a JPEG; in Safari on macOS, Cmd+V on the zone's button and on a page with
a page zone; on iPadOS, a file dragged from the Files app onto the zone and
the overlay.

## UploadTray

Each file from waiting to saved, needs review or failed: `UploadList`, the
rows, and `UploadTray`, which holds them in a panel that stays across pages.
The document has no upload part, so this one is derived from the list face's
item, the float surface and the toasts' column (documents spec, section 7).

**Who holds what** (ruling 5). The app holds the files as controlled `items`,
sends them, and says each one's status, progress and words; the tray draws
and announces. The library never reads, sends or sizes a file, and every
name, reason and progress label is the app's string. The counts reach the
title and the announcements through `formatCount`.

**Where it lives** (ruling 6). AppShell's `floating` slot, from the app's
root layout, which a client navigation keeps, so the tray, its scroll and its
folded state stay while the reader opens the documents it links to. With no
items it draws only its status host; with the first it draws both faces, and
a media query shows one.

**One column with the toasts** (ruling 7, spec correction 10). From 768px
the wide face is fixed in the bottom end corner, `inset-inline-end:
var(--overlay-inset)` and `width: min(28rem, calc(100vw - 2rem))`, the toast
region's own two expressions, so the corner is one column whether it holds
toasts, the tray or both, and stays one if either changes. Both faces carry
the `overlay` class, as the toast region does, since the overlay inset is
declared there alone (spec correction 40). The float surface:
`--color-float`, a 1px `--color-frame` edge, `--radius-surface` (a floating
surface takes 24px wherever it opens) and `--shadow-float`, at
`--z-chrome`, with the toasts and every modal above it. It rises 8px and
fades in over 200ms through `@starting-style`, the toast's rise, which is
above the browser floor and simply does not run there; it folds with no
animation, and nothing moves under reduced motion.

**The header.** `padding-block: var(--spacing-part)` and
`padding-inline: var(--spacing-inset) var(--spacing-part)`, so the title
lines up with the rows' icons and the two 40px ghost buttons sit a part step
from the edge. The title is an `h2` at `--text-body` weight 500 in ink with
tabular figures, "Uploading 2 of 5", counting the running batch's settled
files and the one in hand, so rows settled before the batch began do not
swell it, then naming what settled, failures and reviews included, "3
uploads complete, 1 failed, 1 needs review" (spec corrections 43 and 60).
While any row has failed, a 20px `CircleX` in error leads the title, hidden
from assistive technology, since the rows and the announcements say it. The
app's line under the title is `--text-small` in slate. The fold button's
name stays "Upload details" and `aria-expanded` says the state, the
disclosure pattern; its chevron turns 180 degrees while folded. A
`--color-divider` rule sits under the header while the body shows. The close
button shows by ruling 11: `onClear` once nothing is in flight, the Cancel
all question ("Cancel 1 upload?", "Cancel 3 uploads?") while files are
waiting or uploading, and none without `onCancelAll`, nor while only files
being read remain, which have reached the server and have no Cancel (spec
corrections 59 and 61).

**The body.** `max-block-size: min(24rem, 50dvh)`, about five rows, or half
a short window, scrolling with the library's thin scrollbar colors and
`overscroll-behavior: contain`, so the page under it does not scroll on.

**The row.** The list face's item: `min-block-size: max(var(--size-target),
3.5rem)`, `padding: 0.625rem var(--spacing-inset)`, a grid of the 24px
icon, the text and the buttons (`24px minmax(0, 1fr) auto`) with
`column-gap: 0.75rem`, and a `--color-divider` rule between rows. The 40px
ghost buttons pull in 8px at the end, so the row's end padding is the
icon's. The name is `--text-small` weight 500 in ink, or Link Blue and
underlined once it links; the status line is `--text-small` weight 450; the
bar sits `--spacing-part` under it across the text column, with no head, the
progress label at the status line's end in tabular figures.

| Status | Icon (Lucide) | Word and its color | Bar | Buttons |
| --- | --- | --- | --- | --- |
| waiting | `Clock` | "Waiting", slate | none | Remove |
| uploading | `ArrowUp` | "Uploading", slate, and the progress | determinate, or sliding without `progress` | Cancel |
| reading | `ScanText` | "Reading", slate | sliding | none |
| saved | `CircleCheck` | "Saved", success | none | Remove |
| review | `CircleAlert` | "Needs review", warning, and the reason | none | Remove |
| failed | `CircleX` | "Failed", error, and the reason | none | Retry, Remove |

The icon takes the word's color. On float, measured with `contrast.js`
(light, then dark), each gated as text on float: success 7.44 and 6.34,
warning 6.33 and 8.92, error 7.46 and 5.73, slate 5.49 and 6.94, ink 18.43
and 17.42, link 5.86 and 5.46. The reason is slate and not the tone: it is a
sentence the reader has to read. Signal orange and clay never appear in a
row. A button shows only when its handler is given.

**The name keeps its extension.** Two spans, split at the last dot unless it
is the first character: the stem ellipsizes (`min-width: 0`) and the
extension does not (`flex: none`), so a long receipt still says it is a JPG.
Both are isolated (`unicode-bidi: isolate`), and the name takes its own
direction (`dir="auto"`), so the extension is at the name's end in either
direction: at the left of a Persian name, and at the right of a Latin one on
a Persian page. The full name is the link's or the row's text.

**Focus.** The list and the tray remember the element that holds focus and
mend focus only once that element has left the page; focus the reader moves
anywhere else, the body by a press on empty space included, is theirs and is
never pulled back (spec correction 54). When Remove or Cancel takes a row
away with focus in it, focus moves before paint to the same button on the
next row, else the previous one, else the tray's heading or, in a page, the
list; never the body. When the row stays and only its button leaves, through
Retry or a status the reader did not change, the row itself takes focus
(`tabindex="-1"`, an inset ring when the keyboard brought it), never a
button the reader did not choose (spec correction 57). When the tray leaves
with focus in it, or after a yes to Cancel all, focus goes to the shell's
`<main>`, or outside a shell to the first `main` that takes focus (spec
correction 11); when only a close or clear button leaves with focus on it,
or after a yes to Cancel all that leaves settled rows, focus goes to what
stays in that face: the fold button, the sheet's own close or the bar's
button (spec correction 62).

**The phone's bar** (ruling 8). Under 768px a pill fixed across the bottom,
`inset-inline: var(--overlay-inset)`, on the float surface at
`--radius-pill`, `--size-field` tall, 48px, never under the 40px target in
compact density and never under 44px on a coarse pointer (spec correction
42), border-box, so its height is the one the page reserves. Its button says
the title at `--text-small` weight 500, after a 16px error `CircleX` while
any row has failed, with a 16px `ChevronUp` at the end, and opens a Sheet
titled by the title, holding the app's line and the list, whose rows run to
the sheet's sides on the sheet's own padding. A link pressed in the sheet
closes it as the router navigates. The bar is a region named "Uploads"
(`labels.region`), since a region named by its button's words would be read
twice (spec correction 41). A sheet left open while the window widens stays
open; when it closes there, focus goes to the wide face's fold button, the
one `matchMedia` read.

**The phone's Clear and Cancel uploads** (spec correction 56; Drive, Dropbox
and Gmail clear and cancel from their phone faces). The wide close button's
rule is the sheet's footer: a full-width secondary "Clear" (`labels.clear`)
calling `onClear` once nothing is in flight, or "Cancel uploads"
(`labels.cancelAll`) through the same Cancel all question while files are,
and no footer with neither handler. Once everything has settled and
`onClear` is given, the bar ends in an X named "Clear", as tall as the bar
inside its edge and `max(var(--size-field), var(--size-target))` wide, slate
turning ink, at the pill's end radius less its edge. The sheet's own close
button is named by `labels.closeSheet` ("Close"), apart from the panel's
`labels.close`, so an app that names the panel's button for clearing does
not rename the button that only closes the sheet.

**Room for the bar** (spec correction 55, WCAG 2.4.11). Under 768px, while
the bar shows, `.app-shell:has(> .upload-tray-bar) .app-shell-workspace`
pads its end by the shell's reserve, a sticky bar's offset, the bar's
`max(var(--size-field), var(--size-target))` and the inset, so the page's
last control scrolls clear of it. Tokens only, nothing measured. The root's
scroll is not padded for the bar (spec correction 121): a control that
focus lands on under it is scrolled clear by the focus clear below.

**Focus clear of the tray** (WCAG 2.4.11, spec corrections 121 and 122).
Both faces register themselves as bottom chrome with the shared focus
clear, `utils/focus-clear.ts`, while the tray has items; the face the
viewport hides measures nothing and counts for nothing. Each face's
`scroll-margin-block-end`, `var(--spacing-inset)`, is the gap a focused
control keeps above it. So from 768px a control wholly or partly under the
open or folded 28rem panel, and only one that overlaps it across, is
scrolled up two frames after the focus until its field ends 16px above the
panel's top, and under 768px the same above the phone's bar, which, fixed
at the bottom, covers the view down to its edge, the tab bar under it
included. `PhoneKeepsClear` reaches the last control of a long page at 375
by 812 by Tab and by `focus()` and finds it 16px above the bar, then
scrolls to the end and finds it above the bar still; `FocusClearOfPanel`
does the same for a full-width field under the panel at 1280 by 720; both
run in three engines. The docs' end-to-end run tabs through the recipe's
review at 768 and 1280 with the panel open and finds no focused control
under it.

**The three announcements** (ruling 10). A polite status host, mounted in
the server's HTML, clipped as the toasts' host is and kept out of a modal's
hiding, says: once, `QUIET_MS` after a batch starts, how many files the batch
holds; rows that turned failed or needs review, gathered by a timer that
waits `QUIET_MS` after the last such change and counting only those still so
when it speaks; and once nothing is in flight, `QUIET_MS` after the last row
settles, a summary of the batch, which drops a pending failure sentence,
since it says it. A retry before the summary cancels it and the batch runs
on, with no new start. Statuses on the first render are the baseline. Never a
percentage, never a row turning saved on its own. Each message is keyed, so
the same words twice are said twice.

**Leaving the page** (ruling 12). While any file is waiting or uploading
and `warnsOnUnload` holds, a `beforeunload` listener asks the browser to
warn, in its own words; a file being read is on the server already and holds
nothing open (spec correction 61). iOS Safari shows nothing, so the tray on the page is the
real warning; a client navigation keeps the shell and needs none.

**The bottom edge, the tray's part** (spec 12). Both faces sit at
`calc(var(--app-shell-inset-block-end, 0px) + var(--overlay-inset) +
var(--save-bar-offset, 0px))`: above the tab bar's reserve, which the shell
declares, and above a sticky save bar once one declares its offset. While a
face draws, a `ResizeObserver` writes the shown face's border-box height
plus `var(--spacing-inset)` as `--upload-tray-offset` on the root, and
removes it when the tray draws nothing; the hidden face measures 0. It is
never in the server's HTML, so no first paint waits on it. `toast.css` adds
it, with `--save-bar-offset`, to the toast region's bottom, so the toasts
sit 16px above the tray in the same column.

**Corners** (spec corrections 47, 58 and 92). The shared rule, Nested
radii, derived: the panel and the phone's bar are holders, and the panel's
buttons are controls that move out of its corners. The panel
(`--radius-surface`, 1px, no padding) and the bar (`--radius-pill`, 1px,
none) name `--holder-radius`, `--holder-border`, `--holder-pad` and
`--holder-corner-inset` and draw their edge and corner from them. The bar's
button and its clear X fill the bar inside its edge, so they take its radius
less the gap, 998px in Rounded. Every button in the panel keeps its own
round. The two in its end corners move down, so they stay on the end edge
of the rows' buttons, where a trailing action belongs: the header's trailing
button, Close or the fold when Close is not shown, sits under the header's
block-start padding, and the last row's trailing button over its row's
block-end padding, each the corner inset where that is more than the
padding: 23px in Rounded, 11px in Soft, and the part step and 10px as before
in Square. Folded, the panel is one row, too short to clear both end corners
downward, so the header's trailing button moves inward to the same inset
instead, as a toast's dismiss does. The sheet rounds only its top corners,
which its header holds, and no row reaches them. The list reads no holder: a
rounded box of an app's own that holds it keeps its buttons clear as it does
any control of its own. In a Card, as the stories and the docs example put
it, they are circles in Rounded, which the rule exempts, and clear of the
card's 16px curve in Soft.

**Forced colors.** The panel's and the bar's edges are `canvastext`; the
icons, the header's and the bar's error icon and the bar's clear X keep their
shapes in `canvastext`; the words carry the status, as the toasts' titles
carry their tones. The bar's buttons press as the native `:active` does too,
`:is(:active, [data-pressed])` (spec correction 63).

**Where the build departs from the plan** (spec corrections 40 to 63). The
size limits are above the spec's budgets: `{ UploadList }` measured 2.43 kB
and is set at 3 kB, and `{ UploadTray }` 7.48 kB, set at 8 kB, by the repo's
rule; after the review round the list measures 2.5 kB under its 3 kB, and the
tray, which now also carries Button for the sheet's footer, 8.01 kB, so the
rule sets 9 kB (spec correction 56). The tray carries Sheet, ConfirmDialog
through `useConfirm`, IconButton, Button and the list with its ProgressBar.
AppShell measured 934 B with its `floating` slot and keeps 1.5 kB.

**Screen readers and devices.** Not yet verified (owner action 4): the panel
read as a region named by its title, the fold button's state, each row's
link, word, reason and buttons, the three announcements and how often; on a
phone, the bar above the tab bar and above a save bar, its sheet, and the
sheet closing on a link and on a swipe; `beforeunload`, which iOS Safari does
not show.

## DatePicker

One day in the text input's pill: `DatePicker`, on React Aria's date
picker, its one date field typed in the locale's order and its calendar in
a popover, with the app's single-day presets (documents spec 8, rulings 15
and 16, section 13.2 item 19). It is DateRangePicker's field with one date,
so most of this record is that one's, cited rather than repeated.

**The shared frame.** `DateFrame` (`calendar/DateFrame.tsx`) is the frame
DateRangePicker drew for itself, moved out and given a class: the picker's
whole group value from React Aria's group context, less its ref and the
states a plain element does not take, on a plain
`div.input.<class>` that takes the ref, which React Aria positions the
popover against. DateRangePicker passes `date-range-control` and DatePicker
`date-picker-control`; `drawSegment` and `noSegment` moved with it, and
DateRangePicker's tests pass unchanged. Being `.input`, the frame takes the
hover, disabled, changed and invalid edges through the field's root; it
rings only while a segment has keyboard focus, never for the button.

**The frame's size.** `padding-inline: 1.5rem 3rem`, clear of the button,
and `min-inline-size: 12rem`, so a whole date and the button fit at the
compact size; the field caps it at `--container-field`. It clips nothing,
so the button's 40px hit area reaches past it at either density.

**Segments.** `DateInput.date-picker-input`, an `inline-flex` row in
tabular figures that React Aria isolates. The segment rules are
`date-range-picker.css`'s `.date-segment`, shared and not repeated: ink,
an empty one slate labelled or not (spec correction 4, since axe measures
it as text), taupe while disabled, the focused one the ink fill with
canvas text on `--radius-micro`.

**The face.** On the server and through hydration the `DateInput`
renders no segments and `span.date-picker-face`, padded as a segment is,
shows the app's `valueLabel`, ellipsized on one line, in a frame at its
final size; React Aria's segments replace it in the next render, and a
story compares the face's field, frame, button and changed dot with the
hydrated ones at both densities. The hidden input holds the ISO date in
both passes, React Aria's: the date field's own, which submits under
`name`, and an autofill `input[type="date"]` with `form=""`, which never
submits. The server's HTML is one string under `en-US`, `de-DE` and
`fa-IR` and in UTC and Asia/Tehran.

**Values.** ISO strings in and out: `value` and `defaultValue` read with
`parseIso`, one that is not `YYYY-MM-DD` read as none with one warning;
`onChange` gets the Gregorian ISO date once every segment is typed and
`null` once every segment is cleared; `validate` gets the ISO date. React
Aria takes each digit of a year as it is typed, so years 2, 20 and 202
reach the picker as whole dates first. The picker holds them back (spec
correction 68): it controls React Aria itself, with the app's value or
its own, and a day whose Gregorian year has fewer than four digits stays
in React Aria's field, shown and never sent, nor given to `validate`.
Every calendar's year passes through such days as it is typed or erased
(Persian 1, 14 and 140 are 622, 635 and 761), and a Japanese era's year
of one or two digits is whole at once; a day before the year 1000 cannot
be entered. Erasing the year to its placeholder, which React Aria tells
nobody (it keeps the day it held), commits `null`, seen by a watcher
drawn beside the year segment, so the face empties and the app and the
hidden input agree; leaving the field with a year cut short commits
`null` too, and a required field then shows itself invalid, React Aria's
own check on blur. A new value from the app drops a held day. `today` is the picker's
`placeholderValue`, which React Aria gives the calendar only while there
is no value, so the calendar opens on the value's month, else `today`'s.

**The popover** is the range picker's: `isPadded` stepping down to
`--spacing-inset`, the month's width,
`calc(7 * var(--size-control) + 2 * var(--spacing-inset) + 2px)`, capped
at the viewport less 2rem, so one month fits 320px and the calendar stays
a popover on a phone (ruling 15). It holds React Aria's `Dialog` around a
bare `Calendar.calendar` that the picker's context fills, with the shared
`CalendarHeader` and `CalendarDays`.

**Presets.** `CalendarDatePresets`, beside `CalendarPresets`, reads React
Aria's calendar state: `ToggleButton.calendar-preset`s in a `group` named
`labels.presets`, pressed for the chosen day, disabled for a day outside
the props' bounds or one `isDateUnavailable` refuses; a press sets the
value, which closes the popover through `shouldCloseOnSelect`, and moves
the view to the day. A preset whose date is not an ISO date warns once and
is left out. Closing on a day, a preset or Escape gives focus back to what
opened the calendar, React Aria's.

**Corners** (spec corrections 52, 65, 66 and 92). `date-picker.css` draws
no corner of its own. The calendar keeps Calendar's shapes, the days'
circles and the presets' pills, so DatePicker, Calendar and
DateRangePicker draw one calendar: the days and presets are controls in
a grid, not surfaces nested in the popover, and a square 7px day in
Rounded (correction 52's first reading) broke that. Under Nested radii,
derived, the days are circles, which keep their shape, and the presets
are controls, which keep theirs. The button is the shared field button,
`.input-button`, as in DateRangePicker and every other framed field; the
concentric rule reaches it in all of them at once in `input.css`, the
field's `--input-radius` less its 6px gap, never in one field alone.

**In a review grid.** A field per cell, named by `aria-label` or by
`aria-labelledby` of its column's header and its row's name; compact
density draws the 36px field; a changed field with no label draws the
changed dot ("Field parts"). Inside a DataTable cell React Aria's own cell
took every arrow from its children in its key capture, so DataTable now
turns the grid's keyboard navigation off while an editable element in a
cell has focus and back on when focus leaves it (spec correction 48, risk
R8): the segments' arrows step and move, digits type, J types nothing and
moves no row, in three engines. Escape gives focus back to the row, the
grid pattern's way out of editing, and the first Escape with the
calendar open closes only the calendar; Tab moves field to field, row by
row, and out of the table after the last. The list face, at a phone's
width, keeps the segments' keys too (spec corrections 64, 67 and 69;
"DataTable", "Editors in cells"). The `InTableCell` and `InListItem`
plays press them in three engines.

**Measured pairs.** Gated: ink on raised, the segments, 18.43 and 15.36;
slate on raised, the empty segments, 5.49 and 6.44; canvas on ink, the
focused segment, 16.25 and 19.31; clay on raised, the changed dot, 7.04
and 6.02. No pair is added to the gate.

**Forced colors.** As DateRangePicker: the focused segment `Highlight`
with `HighlightText` out of the repaint (shared); disabled segments and
the face `graytext`; the changed dot `canvastext`.

**Size.** `{ DatePicker }` measures 3.12 kB without React Aria, Lucide and
`@internationalized/date`, within spec 16's 4 kB budget, which the rule
keeps as the limit.

**Screen readers and devices.** Not yet verified (owner action 4): the
segments, the button "Choose date" and the calendar with VoiceOver and
NVDA, an unlabelled changed field in a grid reading "Changed" after its
name, and the segments typed with VoiceOver on iOS.

## SaveBar

A sticky footer for a form or a review: `SaveBar`, a sentence about what
will be saved, the clay Unsaved chip while dirty, a status line said
politely, a guarded Cancel, the app's secondary actions and a primary
action whose label the app writes (documents spec 9, rulings 12 and 17 to
19). The document has no save bar, so this one is derived from DataTable's
bulk-action bar, the field's Changed chip and the toasts' status host.

**One object with the bulk bar.** The float surface Popover draws:
`--color-float`, a 1px `--color-frame` edge, `--radius-surface` and
`--shadow-float`, `padding-block: var(--spacing-part)`, and
`margin-block-start: var(--spacing-peer)` from what it follows. The source
app's save bar sat at the lifted level; the library's bars sit at the float
level because they cross rows and fields as the page scrolls under them,
where the lift's 4% halo does not part them from what is under.

**The sticky rule** (ruling 17). `position: sticky; inset-block-end:
calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset));
z-index: calc(var(--z-header) - 1)`, the bulk bar's three values: the app
puts it last in the form's holder, so it rides at the viewport's bottom,
16px above a tab bar's reserve, while the holder is in view, and rests at
the holder's end, covering nothing that follows. It sticks inside the
nearest ancestor that scrolls, which in a SidePanel or a Dialog is the body,
where it belongs (risk R10). It is always drawn (ruling 18): dirty adds the
chip and the guard, so the page never moves under the reader as they type.

**Corners** (owner rule, 2026-10-17; spec corrections 70, 84 and 92).
The bar is a holder, as the bulk bar is, and a single row, so under Nested
radii, derived, its buttons keep their own uniform round and move inward,
out of its corners. It names `--holder-radius` (`--radius-surface`),
`--holder-border` (1px), `--holder-pad` (the part step, its block padding)
and `--holder-corner-inset`, and pads its inline sides as the bulk bar
does, `max(var(--spacing-inset), var(--holder-corner-inset))` at the start
and the corner inset at the end, so the action's gap to the end edge and
the first button's gap to the start edge of a line of actions, the edge
included, are at least the surface radius: 24px each side in Rounded, 17px
and 12px in Soft, 17px and 9px in Square. Both are logical, so a Persian
bar mirrors them. No margin of the actions makes up a shortfall.

**Layout** (spec corrections 71 and 80). The bar is a wrapping flex row and
its own size container, `save-bar`. The text column, `flex: 1 1 12rem`,
holds the chip over the sentence, so a dirty one-line bar is no taller
than a clean one: the chip's 14px and the sentence's 20px fit the 40px
control. The status follows, then the actions, pushed to the end on
whatever line they fall. Under 36rem of its own box the actions take a
line of their own, so a long label never squeezes the sentence, and each
button takes `flex: 1 1 auto`: they sit side by side in DOM order, the
action last, and grow to share the line, as Polaris's and Material's
narrow bars do, so a phone's dirty bar is the sentence over one row of
buttons, 100px tall at 375 in Rounded where the stacked column of the
first build was 148px. A button wraps to a line of its own only when its
label is too long to fit beside the others, and the visual order never
differs from the focus order. A label longer than the bar wraps inside its
button, which grows from 40px (spec correction 72). The width is the
bar's own, like the bulk bar's and StatTile's, not a token. It is the
content box's, which a container query reads, so the switch comes up to
22px of the bar's width later in Rounded, whose paddings are the widest,
than in Soft and Square; a query cannot read the radius, and moving the
corner insets into the children's margins for every wrap would cost more
than the band is worth.

**Text.** The sentence at `--text-small` weight 450 in ink, two lines at
most and then an ellipsis, its whole text the group's name. The chip is the
field's Changed chip unchanged, clay with its clay dot (spec correction 2),
the one place the bar uses clay, which means exactly unsaved. The status
at `--text-small`, slate when neutral, `--color-error` with a 16px Lucide
`CircleAlert` on its first line when `statusTone="error"`, the tone written
as `data-tone`. The action is primary ink, never signal orange, which is
consent only; Cancel is tertiary.

**The status** (section 13.2 item 14). A state, not an event: "3 fields
need attention", "Couldn't save. Try again."; a save that worked is the
app's success toast, as the Toast record splits events from states. The
host is a polite `status`, in the server's HTML and clipped while empty,
so it takes no room. It says each new status, and the same status again
after another press, since each press of the action draws the status's
text anew (spec correction 77, as the drop zone keys its line). While the
action holds focus as a pending begins, React Aria's Button says the
pending itself, assertively, through its live announcer: "Save Saving" as
it starts, by the ids of the action's label and its spinner, and "Save" as
it ends, by the action's own id (`dist/private/Button.mjs`); the status
then stays quiet, so the reader hears it once. When the action does not
hold focus as the pending begins, as after a pointer press in Safari,
which focuses no button, or when the app sets `isPending` with focus
elsewhere, the status says "Saving" in the status's place, neutral, once
the pending has held for `QUIET_MS`, so a fast save says nothing there,
and the app's status, an error's tone with it, returns when the pending
ends (spec correction 79).

**The action and Cancel** (ruling 19). A press calls `onAction`; a returned
promise holds the action's spinner, `pendingLabel` read with its name, and
disables Cancel until it settles, and a rejection keeps the bar and reaches
the page's handlers through `reportError`, as ConfirmDialog's confirm. The
action is never disabled (section 13.2 item 15): a press the app cannot act
on is answered with a status. Clean, Cancel calls `onCancel`; dirty, it
asks "Discard changes?" through the bar's own `useConfirm`, danger-toned,
"Discard changes" and "Keep editing", which starts on the safe answer and
gives focus back to Cancel. Focus on Cancel when it is disabled or leaves
goes to the action, never the body (spec correction 74), and after either
answer, when Cancel has left or a save begun while the question was open
has disabled it, focus that the question's exit drops goes to the action
too (spec correction 83). Mod+S is not
taken (section 13.3 item 6). While dirty, `beforeunload` asks the browser
to warn (ruling 12); a client navigation is not guarded.

**The offset** (spec corrections 13 and 81). While a bar is on the page, `:root:has(.save-bar)` and
`.app-shell:has(.save-bar)` declare `--save-bar-offset: calc(var(--size-control)
+ 2 * var(--spacing-part) + 2px + var(--spacing-inset))`, the one-line
bar's height and the inset, which lifts the upload tray and the toasts from
the server's HTML on; after hydration a `ResizeObserver` writes the bar's
measured height and the inset inline on the root and on the closest shell,
so a bar on two lines lifts them by its real height. Each holder keeps a
record of every mounted bar's height, so a save bar and DataTable's bulk
bar on one page never overwrite each other: the holder takes the taller,
and loses the property only with its last bar. A bar that measures
nothing, a hidden one, writes `0px` rather than nothing, so the
stylesheet's one-line value does not lift the tray and the toasts over a
bar that is not drawn. The root's scroll is never padded (spec correction
121, which removes correction 12's `scroll-padding-block-end`): a browser
applies root scroll padding to every focus scroll, and Tab onto the stuck
bar's own Cancel scrolled the page from 287 to 695px.

**Focus not obscured** (WCAG 2.4.11, risk R6, spec corrections 73, 78, 82
and 121). The clear is one shared internal utility, `utils/focus-clear.ts`,
which grew from the bar's own (`save-bar/uncover.ts`, now gone). Each piece
of chrome registers itself while it is mounted: the bar and DataTable's
bulk-action bar, the upload tray's two faces at the bottom, and AppShell's
header at the top. One `focusin` listener on the document, added with the
first and removed with the last, takes no part on the server, and two
frames after a focus, after the browser's own scroll and React Aria's,
scrolls the focused control's field (its label, control, description and
error line; the control alone outside a field) by the least whole pixels
that bring it out from under every registered piece that overlaps it
across: 16px above a bottom piece, the gap its `scroll-margin-block-end`
holds resolved (the bar's and the tray's faces are `var(--spacing-inset)`,
the bulk bar's 0), and level with a top piece's bottom. A stack is cleared
to its topmost: the tab bar, the bar and a phone's upload bar. A piece
stuck or fixed at its edge covers the view to that edge, so a control
under the tab bar under a stuck bar comes clear of the bar too, as the
root's padding gave before; a bar resting in the page's flow covers only
itself. It scrolls the control's own scroll port first and then each port
around it by what is still covered, counting there only a piece that holds
still as that port scrolls, and never past the control's top: a control
taller than the room keeps its top at the view's top, below the top
pieces and, where the window scrolls, the page's `--page-sticky-top` (read
from the bar's `scroll-margin-block-start`), as DataTable's clear does.
Nothing moves when the field is clear already or covered by half a pixel
or less, when focus is in a popover, a modal or a sheet, or when the
control is pinned where it is: fixed, or in a sticky piece stuck at its
offset, so focus on the stuck bar's own buttons, or the stuck header's,
never moves the page, while the bar's buttons, at rest in the page's flow
under the open upload panel, come clear of it. Whole pixels, because
WebKit and Firefox round a scroll position and the fields sit on
fractional lines, so a browser's own scroll can stop short by under a
pixel. The `FocusClear`, `FocusClearInScroller` and `TabOntoStuckBar`
plays, which require the gap within a pixel and an unmoved page, run in
Chromium, WebKit and Firefox; `FocusClearTall` and the docs' Tab test run
in Chromium.

**Measured pairs**, all on float, light then dark, each gated already as
text: ink, the sentence, 18.43 and 17.42; slate, the status, 5.49 and 6.94;
clay, the chip and its dot, 7.04 and 6.82; error, the error status and its
icon, 7.46 and 5.73. No pair is added to the gate.

**Forced colors.** The edge is `canvastext`; the chip and the status keep
their words, and the error icon its shape.

**Size.** `{ SaveBar }` measures 4.63 kB without React Aria and Lucide,
above spec 16's 3 kB budget, so the rule sets 5.5 kB (spec correction 75):
it carries ConfirmDialog through `useConfirm`, 2.99 kB alone, Button,
FieldChanged and the scroll helpers. After the review fix round, with the
whole field's clear, the clamp, the nested scroll, the per-bar record and
the focus checks, it measures 4.94 kB, still within the limit, and 5.36 kB
with the shared focus clear (spec correction 121). `pendingLabel` defaults
to `labels.pending`, "Saving", so one translated string names the spinner
and the status (spec correction 127).

**Screen readers and devices.** Not yet verified (owner action 4): the bar
read as a group named by its message, its status politely, the discard
question as an alert dialog, a focused field scrolled clear of the bar on a
real phone, and `beforeunload`, which iOS Safari does not show.

## PageHeader

A page's header: `PageHeader`, the trail, an eyebrow, the page's one `h1`,
a sentence and the actions; and `PageColumn`, the column the page under it
sits in (documents spec 10, rulings 20 and 23, the owner's page width). The
document's own header is the docs site's, so this one is that header on
tokens (parent spec risk R8).

**The docs header on tokens** (section 13.2 item 18). The row is the docs
header's: a wrapping flex row, `align-items: flex-end`, `justify-content:
space-between`, `gap: var(--spacing-peer)`. Its padding is
`var(--spacing-separate)` at the top, the docs' 32px, and
`var(--spacing-peer)` beneath, where the docs wrote 20px, which no token
holds; under 768px the inset, 16px, all round, with a 16px gap, the docs'
phone numbers. The titles are a grid with `gap: var(--spacing-part)`, 8px
where the docs wrote 6px: the trail, the Eyebrow and the title. The titles
start at 20rem and take the room the actions leave (`flex: 1 1 20rem`, the
actions `flex: none`), so the actions sit at the row's end, their bottom on
the title's, and fall under the title, at the inline start, only when it
would keep less than 20rem beside them (ruling 23); under 768px they always
take a line of their own. A trail adds nothing to the titles' width
(`contain: inline-size`), so a long one wraps rather than push the actions
down. The sentence takes its own line under the title's and the actions'
(`.page-header-detail`, `flex: 0 0 100%`), a part step under the title, so
the actions sit on the title, as Primer and Polaris place them, and never
on a sentence's last line (spec correction 100). Nothing is measured and
nothing moves into a menu. The titles' one column is `minmax(0, 1fr)`, so a
trail's long crumb ellipsizes rather than hold the column open past a
phone's width.

**The title** is `Heading level={1} size={2}`, the section step: 36px,
28px under 768px by the type tokens' own rule, weight 500 and -2%
tracking, wrapping at any character and never cut. A page has one;
`headingLevel` lowers it, at the same size, for a header that is not the
page's own, as the docs' examples are (spec correction 101). The sentence
is Text muted, slate at 450, held to `--container-field`, a reading
measure.

**No rule beneath it** (Appendix A). The header parts from the page by its
fill and its bottom padding, as the docs header does.

**The fill.** The canvas at 80%, `color-mix(in srgb, var(--color-canvas)
80%, transparent)`, under `backdrop-filter: blur(20px) saturate(140%)`
inside `@supports (backdrop-filter: blur(1px))`, else the canvas whole;
Lightning CSS writes the WebKit prefix into both, so Safari 16.4 blurs too.
What scrolls under a stuck header shows through it blurred, and the page
keeps its paper. Measured, light then dark, and recorded, not gated: slate,
the trail, the eyebrow and the sentence, on the fill over the canvas 4.84
and 7.26, over lifted 4.93 and 7.22, and over solid ink, the worst a page
can scroll under it, 3.16 and 5.03; ink, the title and the current crumb,
16.25 and 19.31 over the canvas and 10.61 and 10.67 over solid ink. Under
the 4.5 a text needs only over solid ink, which the 20px blur averages into
the canvas before the text is read. Slate and ink on the canvas and on
lifted, the header at rest, are gated already. A reader who asks for less
transparency or more contrast (`prefers-reduced-transparency: reduce`,
`prefers-contrast: more`) gets the canvas whole and no blur, the gated
pairs. The blur makes the header the containing block of a `position:
fixed` descendant, which the page says; the library's overlays portal out.

**The page column** (spec correction 85). `--container-page` is 82.5rem,
1320px, the docs content column's cap, its inline padding included. The
column is `box-sizing: border-box`, `inline-size: 100%`,
`max-inline-size: var(--container-page)`, `margin-inline: auto` and
`padding-inline: var(--spacing-separate)`, the inset under 768px: the docs
content column's 32px and 16px, so a page built on it lines up with this
site's. The header's fill spans its holder and its row is a page column, so
the titles start where a PageColumn's content starts and the actions end
where it ends, at any width; past 1320px both are centered in the
workspace, the room beside the rail shared on both sides. A column inside a
column takes no second cap and no second padding. In Tailwind,
`max-w-page` is the page column's width: the theme writes
`--max-width-page`, which Tailwind reads before `--spacing-page`, and
`max-w-(--container-page)` works as well (spec correction 101). On 0.6
`max-w-page` was the `page` spacing step, 48px; the changeset says so, and
`max-w-(--spacing-page)` keeps the old width (spec correction 127).

**Sticky** (ruling 20). PageHeader has no position of its own. In
AppShell's `header` slot, the first part of `<main>`, it sticks with the
shell's wrapper at `--z-header`; at the top of the content it scrolls away;
it never condenses. The shell measures its header wrapper after hydration
and writes the height as `--page-sticky-top` on `<main>`, so a DataTable's
header row and a SidePanel stick under the header and not behind it, and
the header registers with the shared focus clear, so a control that focus
lands on under it comes clear of it, while focus on its own buttons never
moves the page (spec corrections 86, 94 and 121). Until then a table's header row
sticks at the top; an estimate on the shell's style keeps the jump small.
The docs advise a sticky header without a sentence, since a phone's screen
is short.

**Landmarks.** A `header` element, inside `<main>` in the shell's slot as
at the top of any page's `<main>`, so a plain header and never a banner:
the skip link lands on the title, the first heading of the main landmark
(spec correction 93). It takes no focus and has no keys.

**Forced colors.** The system's background color whole, with no blur,
since forced colors keep an author color's alpha.

**Size.** `{ PageHeader, PageColumn }` measures 460 B, so the rule sets
1 kB, spec 16's budget.

**The docs site's own header** is a PageHeader from batch 5 (accounts plan,
spec correction 62): the trail "Docs › Components" as its eyebrow, the
page's title as its `h1` and the color mode and corner switches as its
actions, in the docs shell's own sticky row, a `div` with the banner role,
which writes `--page-sticky-top` from its height, as AppShell's slot would.
PageHeader takes `role="none"` there, so the page keeps one banner, and no
`header` element holds another (spec correction 71).
Its 1320px cap and 32px padding were the page column's already. PageHeader
has no leading slot, and none was added (plan open question 3): under
1024px the shell draws the drawer's 48px button over PageHeader's fill at
the column's start corner, 8px out from the column's edge as before, with
its middle on the title's first line, and the titles alone make room for
it, so the switches, on a line of their own under 768px, still start at
the column's edge. A cell beside PageHeader was tried first and indented
the switches under the titles, on two lines at 375px where the old header
had one. What the reader sees change is PageHeader's own and kept: 24px
under the row where the docs wrote 20px, 8px between the eyebrow and the
title (6px), 8px between the switches (12px), 32px over the row between
768px and 1024px (20px), and there the switches at the title's end while
it keeps 20rem, where they always took a line. None is a defect, so
PageHeader does not change (parent spec risk R8). From 1024px, beside the
open rail, the column is 640px at its narrowest, where 20rem titles drop the
switches under a short title up to 1068px; the docs' titles keep 16rem
there, so the switches stay on the title's line as they always did (spec
correction 76).

**Screen readers.** Not yet verified (owner action 4): the header and its
`h1` as the start of the main landmark, where the skip link lands.

## Breadcrumbs

Where a page sits: `Breadcrumbs` and `Breadcrumb`, a trail of links to the
pages above the current one, the current page last, and one back link on a
phone (documents spec 10, rulings 21 and 22). The document has no trail.

**Written by hand** (spec correction 8). React Aria's Breadcrumbs names
its own list as well as the landmark, draws the current page as a disabled
link and is a collection React Aria draws again after hydration, so the
library writes `nav.breadcrumbs[aria-label]` holding
`ol.breadcrumbs-list` of `li.breadcrumbs-item`, each the library's Link
to its `href` and the last a `span.breadcrumbs-current[aria-current=page]`,
the WAI-ARIA breadcrumb pattern. Each Breadcrumb draws its own item, so
Breadcrumbs reads nothing from its children: a crumb a server component
renders, or one a component of the app's wraps, draws as any other, and a
crumb is the current page by having no `href`. Breadcrumbs checks its list
in an effect and warns once for anything else in it, a current page above
the last and a last crumb with an `href` (spec correction 96). Each crumb
above the current page is one real `<a href>` in the server's HTML, which
both faces draw, so the trail works before hydration and with scripts off;
once hydrated, Link takes a press through the app's RouterProvider.

**Slate, not link blue** (section 13.2 item 17). Link blue is for a link
inside text; a trail is navigation, as the rail's items are ink and slate.
The trail is `--text-small` at 450, its links slate and underlined as Link
draws them, ink on hover where hover exists; the current page is ink at
500, not underlined, so it is told by weight and `aria-current` as well as
color, and the stylesheet draws it by `[aria-current='page']` as well as
its class. A link's text ellipsizes past 16rem with its whole text in a
`title` and the link's name, and shows whole while the link has keyboard
focus; the current page is never cut, wrapping at any character instead
(spec correction 99). A link is a flex box, which not every engine
carries its underline into, so the text draws the underline itself
(`text-decoration: inherit`), thickening with Link's on hover and press.

**Separators** are Lucide's `ChevronRight` at 16px in slate, a part step
either side, hidden from assistive technology, in every crumb and hidden
in the last (`:last-child`). They point along the trail, so `[dir='rtl']`
turns them with `scale: -1 1`, the back link's `ChevronLeft` with them, as
Pagination's
and Calendar's chevrons turn; a trail with its own `dir="ltr"` inside a
right-to-left page turns with the page, as theirs do.

**The 40px hit.** Each link is drawn at its text's 20px and hit at 40px by
an `::after` with `inset-block: min(0px, calc((100% - var(--size-target)) /
2))`, the formula every control shares ("Compact density"), so the line
does not move. A long trail wraps, its lines `calc(var(--size-target) -
1lh)` apart, a target from line to line, so two lines' hit areas meet and
never overlap.

**The back link** (ruling 22). Under 768px of viewport only the parent's
item, the second to last, is drawn, and its link is the back link: a
`ChevronLeft` before its text, its separator hidden, and the back label's
words said and not shown (visually hidden, `white-space: pre`), so it reads
"Documents" beside the chevron and is named "Back to Documents". Over
768px the chevron and the words are `display: none`, so each link is named
by its text. One set of links is in the server's HTML and the media query
picks what is drawn, so nothing is measured and a hidden crumb is out of
the accessibility tree. Its text runs to the line's end, as the one link
there. With no parent's link, one crumb or a parent without `href`, the
landmark is not drawn on a phone, so it is never an empty landmark.
`backLabel` is a template, `'Back to {parent}'`, which a server component
can pass, or a function from a client one; the parent's text stays in the
name, said whole after a label that does not hold it (spec correction 97).
Focus never falls to the page as the viewport narrows past 768px with focus
on a crumb the phone does not draw: the trail remembers the last element
focused in it and gives focus to the parent's link, whether focus is still
on the hidden crumb or, as in Chromium, already on the body (spec
correction 98). The trail is a one-column grid, `minmax(0, 1fr)`, so in a
centering grid or a flex row a long crumb ellipsizes rather than widen its
holder (spec correction 88).

**Forced colors.** The links `linktext`, the current page and the
separators `canvastext`.

**Size.** `{ Breadcrumbs, Breadcrumb }` measures 1.14 kB without React
Aria and Lucide, under its 1.5 kB limit, spec 16's budget; it carries
Link.

**Screen readers.** Not yet verified (owner action 4): the trail read as a
navigation landmark with the current page, and on a phone its one back
link.

## The bottom edge

Batch 4 (documents spec, section 12). Five parts can want the bottom of
the screen at once on a phone: the tab bar, a sticky save bar or DataTable's
bulk-action bar, the upload tray's bar and the toasts. They stack in one
order, from the bottom up, each lifting the next through a custom
property, and no first paint waits on a measurement.

| From the bottom | Part | Sits at | Its offset for the parts above |
| --- | --- | --- | --- |
| 1 | BottomTabBar, under 1024px | the viewport's bottom | `--app-shell-inset-block-end` on `.app-shell` (`calc(4rem + env(safe-area-inset-bottom, 0px))` under 1024px, `0px` above), and its copy for the root, `--toast-offset-block` on `:root:has(.tab-bar)` |
| 2 | SaveBar, or DataTable's bulk-action bar, sticky in its holder | `calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset))` | `--save-bar-offset` on `:root` and `.app-shell` while a bar is on the page |
| 3 | UploadTray, fixed: the panel from 768px, the bar under it | `calc(var(--app-shell-inset-block-end, 0px) + var(--overlay-inset) + var(--save-bar-offset, 0px))` | `--upload-tray-offset` on the root while it draws |
| 4 | Toasts, fixed at the root | `calc(var(--overlay-inset) + var(--toast-offset-block, 0px) + var(--save-bar-offset, 0px) + var(--upload-tray-offset, 0px))` | none |

**When each is written.** `--app-shell-inset-block-end` and
`--toast-offset-block` are declared by the stylesheets from the tab bar's
4rem, as before this batch. `--save-bar-offset` is declared from tokens
on `:root:has(.save-bar)`, `.app-shell:has(.save-bar)`,
`:root:has(.data-table-bar)` and `.app-shell:has(.data-table-bar)` as
`calc(var(--size-control) + 2 * var(--spacing-part) + 2px +
var(--spacing-inset))`, the one-line bar's height and the inset, so it is
in place from the server's HTML on; after hydration `useBottomBarOffset`
writes each bar's measured border-box height and the inset inline on the
root and on the closest shell through a `ResizeObserver`, the tallest of
several bars winning, `0px` for a bar that is hidden, and the property
removed with the holder's last bar (spec corrections 13 and 81). A bar on
two lines lifts the tray a little short until then. `--upload-tray-offset`
is written by the tray's own `ResizeObserver` only once a face draws,
which it never does on the server, and removed when it draws nothing.
None of these is in a measurement a first paint waits on.

**Focus, the same order.** Nothing pads the root's scroll (spec
correction 121, which replaces corrections 12, 55 and 95's padding): a
browser applies root scroll padding to every focus scroll, the one onto a
stuck bar's or a stuck header's own button included, and moved the page
there. Instead each part that covers an edge registers with the shared
focus clear, `utils/focus-clear.ts`: the save bar, the bulk-action bar and
the tray's faces at the bottom, AppShell's header at the top. A control
that focus lands on under them is scrolled out, two frames later, 16px
above the topmost bottom part it meets (the bulk bar's gap is 0) or level
with the header's bottom, and a part stuck or fixed at its edge covers the
view down to it, so the tab bar under a stuck bar is cleared with it. The
shell pads the workspace's end by the same parts while the tray's bar
shows, so the page's last control stays above it (spec correction 55).
DataTable's rows keep their own scroll margin, the whole page offset and
the header row, with no padding to subtract.

**The wide screen** has no tab bar: the tray sits 16px above the
viewport's bottom, or above a save bar while one shows, and the toasts
above the tray, in the bottom end corner's one 28rem column. The toasts
lift above a save bar at every width, not only on a phone (open question
6 of the plan, settled as recommended).

**One sticky bar a page.** A list with a selection and a form with
unsaved changes on one page is not a pattern the docs show. If both show,
the holders keep the taller bar's offset, so the tray and the toasts sit
above it; the two bars themselves sit only by their own sticky offsets.

**The stories.** `BottomEdge` (SaveBar, tagged `viewport-phone`) pins the
stack at 375 by 812: the tab bar, the save bar, the tray's bar and the
toasts, from the bottom up. `BottomEdgeWide` (`viewport-desktop`) pins the
wide face, the tray above the save bar and the toasts above the tray.
`OffsetMeasured` proves the measured height replaces the token value;
`PhoneKeepsClear` (UploadTray) that the page's last control is never under
the tray's bar; `FocusClearOfPanel` the same under the wide panel;
`WithToasts` the toasts above the panel; `FocusClear`,
`FocusClearInScroller` and `FocusClearTall` that a focused field stays
16px clear of the bars; `TabOntoStuckBar` that Tab onto the stuck bar's
Cancel leaves the page where it was; and `FocusClearOfHeader` and
`FocusInStuckHeader` (PageHeader) the same two under the stuck header.

**Revisit after use** (section 13.3 item 4, risk R7). On a phone the
tray's bar and the save bar stack, as the owner settled open question 3:
with the tab bar, a dirty save bar of one line of buttons (100px at 375 in
Rounded, spec correction 80), the tray's 48px bar and a toast, the stack
can take a third of a 640px-tall screen. The alternative, an uploads badge
inside the save bar, stays open until the first consumer has used its
review page on a phone.

**Screen readers and devices.** Not yet verified (owner action 4): on a
real phone, the tray's bar above the tab bar and above a save bar, and a
focused field scrolled clear of both.

## DescriptionList

Named values, such as an account's name, type, institution, last four
digits, bank feed, credit limit and APR: `DescriptionList` holding
`DescriptionListItem`s (accounts spec, section 5; owner rulings 7, 8 and
9). The document has no list of names and values, so this one is derived
from the Dense data row, the numeral rule and the corner rule.

**A `dl` of `div` rows, and no role.** The list is a `dl`; each row is a
`div` holding a `dt` (the term), a `dd` (the value) and, when the row has
actions, a second `dd` holding them, the grouping the HTML standard allows
inside a `dl` and GOV.UK's summary list row. The `div` keeps a row one box
for the layout and the rule, and axe's `definition-list` and `dlitem` rules
pass with it. No ARIA role is added: `role="list"` on the `dl` would drop
the term and definition semantics VoiceOver announces. A
`DescriptionListItem` outside a `DescriptionList` draws the same markup,
which axe's `dlitem` rule fails, and the docs say so. Both parts are static,
with no hook, context or id, so a server component renders them with no
client JavaScript.

**Layout by its own width.** The list is a size container
(`container: description-list / inline-size`). From 30rem of its content
box, `layout="auto"` draws a row as three columns: the term at
`--description-list-term-size`, 30% by default, the value, and the actions;
under it the term and the actions share the first line and the value spans
the second, 4px under the term (half the part step, StatTile's caption
gap). 30rem is chosen so the term column is at least 9rem (144px), which
holds "Routing number", about 105px at 14px and 500, on one line; under it
most terms would wrap. `horizontal` and `stacked` hold one layout at every
width. Every row has the same template, so the term column lines up down
the list with and without actions, with no subgrid. A row without actions
gives their column to the value side by side and to the term stacked. A
viewport breakpoint was rejected: a list in a 24rem side panel on a wide
screen would draw a 7rem name column.

**No width of its own** (risk R1; spec corrections 14 and 34). A size
container takes no width from its content, and the library's rule is that
its intrinsic inline size is 0: the list declares
`contain-intrinsic-inline-size: 0`. A stand-in width is also the
container's min-content width, which a `flex: 1` item or a `1fr` track
keeps as its narrowest. The first value, 20rem, pushed a 320px page 16px
sideways from a `flex: 1` wrapper in its 288px column, and 16rem still
scrolled the page with two lists side by side, 512px in 288px; the same
trap showed in the CardActions header and BarChart's figure. At 0 a block,
a `flex: 1` item or a `1fr` track gives the list its width, and a holder
that sizes it from its content (a content-sized flex item,
`width: max-content`, an `auto` grid track) must give it one, or it draws
nothing wide; the docs say so. A docs test puts a list in a `flex: 1`
wrapper, a `1fr` grid and a `1fr 1fr` grid two up at 320px with no
sideways scroll, and the `InAFlexRow` story gives the list a width in a
flex row and checks that it fills it.

**The row** (Dense data, against the value's line). `min-block-size:
max(var(--size-target), var(--size-field))`, 48px, 40px in compact and 44px
compact on a coarse pointer, and block padding
`max(0px, calc((row - 1lh - 1px) / 2))` against the body line, 22.4px: 12.3px
in comfortable, 8.3px in compact and 10.3px on a coarse pointer. Dense data
pads against the small step's line, 13.5px; a list's values are body text,
so it pads against theirs. The padding is `--description-list-pad`, which
the corner rule below reads. One 1px `--color-divider` rule on a row that
follows another, so none above the first row and none under the last, and
a list in a card ends at the card's padding. `hasDividers={false}` draws
none.

**Term and value.** A term is `--text-small` at 500 in slate: a name, read
before its value, so not ink, and set apart from a hint's 450. A value is
`--text-body` at its token weight, 450, in ink. The list draws no frame,
fill or radius of its own, so no part of it is a surface in a holder's
corner.

**Empty values** (ruling 9). A value that is absent, `null`, `false`, `true`
or `''` is empty, `present()`'s definition, and so is an array that holds
only those, as a list mapped from data with no entries gives (spec
correction 18); `0` is a value. The value's
`dd` carries `data-empty` and shows `emptyValue`, "Not set" by default, in
slate. It is words the reader has to read, so by the test in "Where each
text color may go" it is slate and never taupe; that table's "unset
indicator" in taupe is a mark, such as an empty swatch, not words (spec
correction 6). It is never a dash, which a screen reader reads as "dash" or
as nothing. `emptyValue` may be a link to add the value, GOV.UK's guidance
for a missing answer: the link stands where the value would, and the row has
no action of its own beside "Not set" (spec correction 19). The library
writes "Not set" in English, so a page in another language passes its own.

**Long values.** A value wraps, and a long unbroken word, an IBAN or an
email address, breaks anywhere (`overflow-wrap: anywhere`, the Card's rule,
set on the value so a list outside a card has it too). Nothing truncates: an
ellipsis on a value hides data. A long term wraps in its column.

**Numeric values.** `isNumeric` writes `data-numeric` and gives the value
`copy.css`'s numeral rules at the body size: tabular figures,
`direction: ltr`, `unicode-bidi: isolate` and
`text-align: match-parent` (with `-webkit-match-parent` before it for
Chromium), so "$5,000.00", "24.9%" or "4821" keeps its order and starts at
the line's start on a Persian page. A numeric value does not take the
numerals' `nowrap`; it is a value in a column, and breaks rather than push
a 320px page sideways. An empty numeric value drops `data-numeric`, since
"Not set" is words.

**Actions.** The app's nodes, in their own `dd` after the value, as
GOV.UK's summary list puts its "Change" link: the row's last column side by
side, and the end of the term's line stacked, as the gear stands beside each
heading in GitHub's pull request sidebar. `display: flex` with the part
step between, at the end. A 40px control sits level with the line beside it
through `margin-block: min(0px, calc((1lh - var(--size-control)) / 2))`, the
collapsible card toggle's technique, so the row does not grow for its
button. Each control names its row: "Edit" shown and "Edit Nickname" as its
name, through `aria-label` or visually hidden words, so WCAG 2.5.3 holds.

**The corner** ("Nested radii, derived"). A control in the last row of a
list that ends a card sits in the card's corner curve: in Rounded
comfortable a 40px button on a 22.4px line overhangs it by 8.8px, which
leaves the button 1 + 32 + 3.5 = 36.5px from the card's bottom edge (36.7px
as Chromium draws it, by baseline alignment) and 33px from its side, both
under the 40px radius. The rule for a control at a holder's foot applies: it
moves down, not in, so it stays on the column's end edge. The last row of a
list that is the last child of a card, of a card's body that is the card's
last child, or of a collapsible card's body (spec correction 16), adds
`calc(var(--holder-corner-inset) - var(--holder-pad))` to its block-end
padding while it holds actions and the list sits side by side: 7px in
Rounded, 19px in Rounded compact, nothing in Soft and Square, where the
padding already clears the 16px curve and Square has none. Stacked, the
last row's controls stand on the term's line at the row's top, a value's
line and more above the curve, so the row keeps its padding: the rule is
written for `[data-layout='horizontal']` and, inside the list's 30rem
container query, for `auto`, and a stacked list in a card ends at the
Dense data padding with no dead space under its last value (spec correction
15). The first row of a list that starts a card with no header takes the same
at its block start in every layout, since its controls stand on its first
line either way; a collapsible card always has its header above the body, so
it has no first-row form. Only the controls' row grows; a row without
actions keeps the Dense data padding. The button then ends 43.5px over the
card's bottom edge in comfortable and 41.5px in compact, past the 39px
corner inset. The selector is the LineChart toolbar's,
`:is(.card, .card > .card-body:last-child)`, with the collapsible card's
`.card > .card-disclosure > .card-fold > .card-body:last-child`, so a list in
a body followed by something else is not at the card's foot and does not
move (spec correction 4). The `CornerClear` story measures six places in
Chromium, WebKit and Firefox: a list ending a card's body, starting a card
with no header, directly in a card, ending a collapsible card's body,
stacked, and followed by a paragraph; the concentric audit runs every story
in the three shapes.

**Right to left** (ruling 7). Logical properties throughout: on a Persian
page the term column is on the right and the actions on the left. A numeric
value stays left to right and starts at the line's start, the right edge of
its column. `match-parent` is the standard name in Firefox and the prefixed
one in WebKit and Chromium, so the `DescriptionListMirrored` play runs in all
three engines (spec correction 17).

**Print.** Rules and text print; the actions are hidden under
`@media print`, since a printed page cannot press them.

**Forced colors.** The rules are borders, which the repaint keeps; the
block names their color, `canvastext`, so the CSS test's forced-colors
block holds something. Text takes the reader's colors.

**Contrast.** Gated already as text and cited by the contrast test, not
added: ink on canvas 16.25 in light and 19.31 in dark, on lifted 17.84 and
17.42, on float 18.43 and 17.42; slate on canvas 4.84 and 7.26, on lifted
5.31 and 6.94, on float 5.49 and 6.94. The divider is a cue, not a boundary.

**The size.** The entry `{ DescriptionList, DescriptionListItem }` measures
360 B without React Aria, Lucide and `@internationalized/date`, and 360 B
with them, since it imports none (328 B before the empty-array test of spec
correction 18); the rule rounds up to 0.5 kB and adds 0.5 kB: 1 kB, the
spec's budget.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): the terms and values read in order, and how each reader
announces the list; on a real iPhone and an Android phone at 320px to 430px,
the stacked list legible.

## Gauge

One figure on a range at a glance: `Gauge`, a ring or a semicircle with
an arc for the value, a centre numeral and a word under it, up to five
marks, and the label and the value text under or beside the dial
(accounts spec, section 7; owner rulings 2, 3, 5, 6 and 7). The first
consumer draws a credit score on 300 to 850 and a utilization per card.
The document has no gauge, so this one is derived from Meter.

**In react, not charts** (ruling 3). A gauge is a meter: one value on a
known range, the WAI-ARIA `meter` role. `@snapshot-ui/charts` holds data
series on scales, with axes, readouts and a table view, and is versioned
apart; a gauge has no series, no axis, no palette and no table. Meter and
ProgressBar live in react, so an app that draws a meter in a row and a
gauge in a tile imports both from one package. SwiftUI keeps its `Gauge` in
SwiftUI itself, Ant Design makes its dashboard a `type` of `Progress`, and
only Carbon puts a gauge with its charts. The arithmetic is two arcs and a
dash, in `gauge/geometry.ts`, small enough for a later donut to copy.

**One family with Meter.** The role is on the dial, `div.gauge-dial`, and
not the root, since a meter's children are presentational and the text
beside it would be lost. The naming chain is Meter's: a non-blank
`aria-labelledby`, else a non-blank `aria-label`, else the visible label,
else the value text, so the dial is never unnamed. `aria-valuemin` is
`minValue`, `aria-valuemax` `maxValue`, `aria-valuenow` the value clamped
to them, and `aria-valuetext` the app's `valueLabel`. A range whose end is
not above its start reports `minValue` for all three and draws an empty
track, ProgressBar's rule. The prop names are React Aria's, as
ProgressBar's are, with `minValue` first class: 742 on 300 to 850 is 80.4%
of the arc and reports `aria-valuemin="300"`. The track is Meter's frame
color, and the arc `--gauge-ink`, as Meter's fill is `--meter-ink`.
Static: `useId` is its one hook.

**Sizes and strokes.** `sm` 32px with a 4px stroke, `md` 96px with 8px,
Meter's track, and `lg` 160px with 12px, each stroke a twelfth of the box
or near it, so a ring reads as the same object at every size. The text sits
beside a 32px dial, which has no room for a figure, and under the 96 and
160px ones. No token is added: the sizes and strokes are literals in
`geometry.ts` and `gauge.css`, as Meter's 8px track is.

**The viewBox is the box in pixels.** `0 0 S S` for a ring and
`0 0 S (S / 2 + w / 2)` for a semicircle, where `S` is the box and `w` the
stroke, so at its own size one user unit is one pixel, and an app that sets
`--gauge-size` scales the svg uniformly by the default
`preserveAspectRatio`: a circle stays a circle. The charts'
`preserveAspectRatio="none"` stretch is not used. The track is a circle of
radius `r = (S - w) / 2` about the centre: a ring is two half arcs from the
top, clockwise, since one arc command cannot draw a whole circle, and a
semicircle one arc from the inline start over the top. Its length `L` is
`2 pi r` or `pi r`. Every number is written with at most three decimals,
Meter's rounding, so the server and the browser write the same string, and
the server face writes one HTML in three locales and two zones.

**The arc, caps included, is exactly the value.** Round caps add half a
stroke at each end of a dash, so a share `s` is a dash of
`max(0, s L - w)`, offset by `-w / 2` so it starts half a stroke in: the
arc from the outer edge of its first cap to the outer edge of its last
spans exactly `s L`. Half the value is half the track. The dash is written
in user units, as inline `stroke-dasharray` and `stroke-dashoffset`, so no
`pathLength` is needed (risk R3) and the stylesheet's transition runs on a
change. A semicircle's track is dashed the same way at a share of 1, so its
caps end exactly at the arc's ends and a full value covers it.

**Zero, the dot and the whole ring.** A share of 0 paints nothing, since a
zero-length dash with round caps would draw a dot, but it keeps its value
path, a zero-length dash marked `data-empty`, which the stylesheet gives
butt caps, so the path is there to move from and to (accounts plan, spec
correction 39). A share whose
arc is shorter than the stroke is a zero-length dash, which its caps draw
as a dot of the stroke's width at the start: the least a reader can see,
so 0.5% never reads as nothing. A whole ring has no ends: two caps meeting
at the top touch at one point and leave a notch in the stroke's outer and
inner edges as deep as half the stroke, which reads as a cut. So a ring at
its whole share is one dash of `L` and no gap, drawn solid (accounts plan,
spec correction 21); at 99% the caps leave the share's gap at the top, so
99% and 100% differ. The `ArcLength` play draws each value path again
through the engine's own svg renderer onto a canvas and reads the dot, the
empty start, the solid top and a semicircle's ends, in Chromium, WebKit
and Firefox.

**Marks.** Up to five, sorted by value, each clamped to the range: a radial
line across the track at the mark's share, `s * 360` degrees clockwise from
the top on a ring and `s * 180` degrees from the inline start on a
semicircle, reaching 2px past the track on both sides. Each is a 2px line in
ink standing in a 6px gap cut out of the track and the arc: Meter's pace
marker turned radial, so a mark reads over the arc and over the track
alike. The gap is not painted in a surface color. It is a luminance `mask`
in the svg, named by `useId`: a white box keeps, and a black 6px line per
mark cuts, so whatever is behind the gauge shows there, a card, the page,
or a hovered or selected table row. A gap painted in `--meter-surface` drew
a pale block wherever the surface was not the one named, which a DataTable
row's own fill, hovered or selected, always is (spec correction 35). The
mask's region is the box and a box around it, so the marks' overhang and the
caps are inside it. Marks are never toned: a band's edge is not over
anything. Their labels, in order of value, joined by full stops, form a
hidden span that describes the dial after the caller's own
`aria-describedby`; a mark with an empty label is drawn and not read, for
thresholds that repeat on every row of a table and are said once beside it
(spec correction 37). The `MarksOnRows` play draws a dial on a plain, a
hovered and a selected DataTable row through the engine's own renderer over
the fill behind it and reads the gap as that fill, in three engines. A
sixth mark is not drawn or described; a static part
cannot warn. On the consumer's score, 580, 670, 740 and 800 fall at 50.9%,
67.3%, 80.0% and 90.9% of the arc. Two marks closer than the stroke's
width overlap, so the docs say a 32px gauge holds two or three.

**The figure and its word.** `figure` is the app's numeral and
`figureCaption` a word under it, drawn at `md` and `lg` and never at `sm`.
Neither has a default: on a 300 to 850 score a percentage would be wrong, so
the library never invents a figure. Both are `aria-hidden`, since the value
text says the value and the word, and the same said twice is noise. The
figure is `--text-h3` at `md` (24px) and the `numeral-sm` step at `lg`
(32px), 500, tabular, in ink, left to right and isolated, and never wraps or
shrinks: the docs give the budget, 4 characters at `md` and 6 at `lg`
("100%", "$12.3K"), and `LongestFigure` holds each within the inner circle.
The caption is `--text-small` at 450 in slate, never toned, and ends in an
ellipsis past its lines, since the value text carries it whole. In a ring
the figure and its caption are one block centred in the inner circle,
which narrows above and below the centre, so the block is kept short and
the caption narrow (spec correction 36): the figure's line is its own size
(`line-height: 1`), and the caption is one line at most `S * 5 / 8` wide at
`md`, 60px of the 80px circle, a word or two, and two lines at most
`S * 13 / 20` at `lg`, 104px of 136. Then every line box's corners are
inside the circle: at `md` the widest figure, "100%", 66px, reaches 39.7px
from the centre of a 40px circle. In a semicircle the caption is two lines
under the chord, between the arc's ends. `LongestFigure` and
`FigureInsideRing` measure every line box's corners against the circle in
three engines.

**The concentric construction inside the dial.** The figure is HTML in the
dial's one grid cell, over the svg. In a ring it is centred as one block in
the inner circle, `S - 2w` across, through a padding of `--gauge-band`, the
stroke's share of the box (a twelfth at `md`, an eighth at `sm`, three
fortieths at `lg`), so it follows an app's own `--gauge-size`. In a
semicircle the figure's baseline is on the chord, in the bowl, and the
caption under the chord between the arc's ends. The baseline is set by a
strut, a `::before` half the box tall with no text: a flex item with no
baseline takes its foot as its baseline, so the row's baseline lines up
the figure's with the chord in any font. Since the figure is in flow, the
caption under the chord gives the dial its height, and nothing overlaps
the text under it. `SemicircleFigure` measures the baseline within 1px of
the chord in three engines.

**The corner rule leaves the dial alone.** The dial is a circle, whose
radius is half its side and not a choice, so it is not stepped, and the
corner audit skips it. In a Card, a StatTile or a table cell the gauge keeps
its size and shape.

**The text.** Under the dial at `md` and `lg`, centred, 8px
(`--spacing-part`) below it, as wide as the dial or 12rem, whichever is
more, and wrapping: the label at `--text-small` 500 in ink and the value
text at `--text-small` 450 in slate with tabular figures, Meter's head
turned to a column. At `sm` the text is beside the dial, 8px from it, its
lines centred on the dial. The value text is `aria-hidden`, since the dial
reads it. In a DataTable row the column header names the cell, so the
gauge takes `aria-label` with the row's name and shows only its value text;
the row is 48px, 40px compact, so a 32px dial fits every density. A 32px
gauge fits StatTile's 96 by 32 trend slot.

**Tones** (ruling 2). The app chooses; the gauge never decides that a value
is good or bad, since a high score is good and a high utilization is not.
`neutral` is ink. `warning` is "a state that needs the reader's eye soon
and is not a failure": a fair or a poor score, a utilization above 30%.
`error` is a failure only, such as a limit that stopped a payment. Both low
score bands are warning, and Fair and Poor are told apart by the word under
the figure and by where the arc stops between the 580 and 670 marks, never
by color. There is no success tone: a good score is not a save, and the
words say "Very good" over an ink arc; there is no gain, which is money
that arrived. Above `maxValue` the root takes `data-over`, the arc fills
the track, and a neutral gauge resolves to warning, Meter's rule; an error
gauge stays error, its rule last in the file at equal weight. Exactly
`maxValue` is not over, and `aria-valuenow` stays at `maxValue`. The value
text must say "over" in words. Signal orange, clay and taupe appear nowhere.
The tone always comes with words: `valueLabel` is required.

**The range's ends are the app's.** The gauge draws no numbers at its ends:
a range's ends are figures in the app's digits, and many gauges, a
utilization among them, need none. Where a reader has to place the arc on
an unfamiliar scale, the app draws them. The docs' credit score example
puts 300 and 850 under the semicircle's ends and a legend of the five
bands, each word with its range, under the scores, and the Accounts recipe
does the same in its credit tab (spec correction 41). They repeat for the
eye what the meter already reports, so the ends are `aria-hidden`.

**Round in every shape** (ruling 5). The caps are round and the dial is
round in Rounded, Soft and Square, the spinner's rule: the ends of a stroke
are dots, and dots stay round in every shape. `stroke-linecap` cannot read a
radius token, and a gauge drawn square would be a different chart. Meter
and ProgressBar square their ends under Square because their ends are a
box's corners; a gauge's are not.

**Motion** (ruling 6). When the value changes in the browser the arc moves
over 200ms, ProgressBar's timing: `stroke-dasharray`, `stroke-dashoffset`
and `stroke` transition together, so a tone change moves with it. A
transition never runs on the first style, so a gauge drawn on the server,
hydrated, or mounted with its value does not sweep in; a sweep would delay
the reading and need a client part. Under reduced motion nothing moves. A
change to or from 0 moves too, since a share of 0 keeps its path; its caps
turn from round to butt at once, which a transition cannot ease, so the
dot at the arc's start comes and goes at the start and the end of the move.
The `Motion` play reads no animation on first appearance, a 200ms
transition after a change down, to 0 and up from 0 on the same path, and
the reduced-motion rule in the page's own stylesheet.

**Direction** (ruling 7). The gauge follows the page, as Meter's fill and
LineChart's time do: `--gauge-flip` is `1` under `:where([dir='ltr' i])` and
`-1` under `:where([dir='rtl' i])`, the charts' pattern, since `:dir()` is
above the floor, and the svg takes `scale: var(--gauge-flip, 1) 1`. The
nearest `dir` attribute wins. On a Persian page a ring runs counter-clockwise
from the top and a semicircle fills from the right, and the marks move with
the svg. The figure, its caption and the text are HTML and are not
mirrored: "60%" reads left to right.

**Contrast**, measured with `contrast.js` and recorded, not gated, since
the track is a mix (accounts plan, spec correction 23). The arc against the
track, light then dark: over lifted, ink 13.88 and 12.19, warning 4.77 and
6.24, error 5.62 and 4.01; over the canvas, ink 12.69 and 14.19, warning
4.36 and 7.27, error 5.14 and 4.67; over float, ink 14.34 and 12.19,
warning 4.92 and 6.24, error 5.80 and 4.01. Each clears the 3:1 a graphic
needs, the lowest the error arc in dark over lifted and float. The track
against its surface is 1.28 and 1.43 on lifted, 1.28 and 1.36 on the
canvas and 1.29 and 1.43 on float: a cue, not a boundary, since the value
text, which is required, carries the extent, as Meter's record says. The
figure and the label are ink and the caption and the value text slate,
each gated already as text on those surfaces.

**Forced colors.** Strokes are not backgrounds, but an svg keeps the colors
its author set, so the block names them: the track `graytext`, the arc
`canvastext` in every tone, and the marks `highlight`, in their cut gaps,
where the reader's own background shows. The three stay apart, the mark
stays apart from the arc, and the words carry the tone, as Meter's over
state keeps its words. The mask is luminance, white keeps and black cuts,
so it takes `forced-color-adjust: none`: repainted in the reader's colors,
a dark theme's background would turn the keeping white black and hide the
track and the arc. A docs test reads the three strokes and the mask.

**Print.** `print-color-adjust: exact`, and its `-webkit-` form, as
`.meter` sets, so a printed track keeps its tint.

**The size.** The entry `{ Gauge }` measures 1520 B without React Aria,
Lucide and `@internationalized/date`, and 1516 B with React Aria not
ignored; it imports none, and the bytes are size-limit's own drift, as
CardActions' three were (spec corrections 13, 28 and 42). The mask and the
empty arc took it 20 B over the spec's 1.5 kB budget; the rule rounds up to
2 kB and adds 0.5 kB: a 2.5 kB limit.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): that a gauge reads as a meter, or what each reader calls
it, with its name, its value text and its marks' description, and never its
figure twice. Not yet verified in Windows' contrast themes (the track, the
arc and the marks each distinct) or on a real iPhone and an Android phone
at 320px to 430px (an `lg` semicircle and its caption legible).

## MonthGrid

Which months the reader has of something that comes monthly: `MonthGrid`,
a header of short month labels, one row per year with its label and one
cell per month, a sentence under it, a legend, and a table clipped from
sight (accounts spec, section 8; owner rulings 1, 7 and 10). The first
consumer draws an account's statement coverage on its credit tab. The
document has no such part, so this one is derived from Meter's looks.

**The name** (spec open question 17). It says what it draws, months in a
grid, and was the consumer's suggestion. A calendar's grid of days is
sometimes called a month grid, but the library's are `Calendar` and
`CalendarDays`, and React Aria's is `CalendarGrid`, so nothing collides,
and the docs page opens with a picture. `CoverageGrid` named one use and
`YearGrid` named the rows rather than the cells.

**States are the app's; looks are the library's.** The app names its
states in its own words, held, partial, missing, closed, pending, and maps
each to one of three looks. The looks are shapes, not meanings: `filled` is
a solid ink cell, `partial` Meter's held look, ink stripes 2px wide every
6px at 45 degrees inside a 1px ink edge, and `empty` a 1px
`--color-boundary` outline with no fill. None is error, warning or success:
a missing statement is the reader's fact, not the library's verdict, and an
app that wants the reader's eye on it says so in its summary or with a
Badge beside the grid. Signal orange, clay and taupe appear nowhere. The
empty look takes a control's edge, not a divider, because an empty month
carries information and its extent must show at 3:1. Two states may share
a look, but then only the table and the summary tell them apart, so the
docs ask for a look per state.

**Outside months are blank.** A `null` month, before the account opened or
not yet come, draws `data-look="none"`: no fill and no edge, the slot left
empty, so it never reads as missing. A month whose id no state has is drawn
the same way and reads "Not in range" in the table; it is in neither the
summary nor the legend.

**The grid.** `grid-template-columns: auto repeat(var(--month-grid-columns,
12), minmax(0, 1fr))` with 2px gaps, the Meter spacer's width, so a year
reads as a strip. `--month-grid-columns` is written on the grid's `style`
from the count of `monthLabels`, so a calendar of another count draws its
own columns. The year label is at the inline start, `--text-small` 500 in
ink with tabular figures and isolated, 8px from the first cell (a padding
of 6px and the 2px gap); each takes `grid-column: 1`, so every year starts
its own row and a row of the wrong length cannot move the years under it
(accounts plan, spec correction 46). Month labels are `--text-small` 450
in slate, centred over their column on one line and clipped. Cells stretch
with the box, `block-size: 1rem` and the column's share across: measured in
a card on a 320px phone, about 13px wide (15px compact) by 16px; in a 40rem
card about 42px. A strip that stretches, never a chart that scrolls.

**Its own width, and none of its own.** The figure is a size container,
`container: month-grid / inline-size`, so its own width decides the
header: every label from 28rem of the grid's box, and under it only every
third from the first, the first month of each quarter, so one-letter or
two-letter labels never collide. A quarter's label may run on over the
hidden labels after it rather than be clipped. The server's HTML holds all
twelve; nothing is measured. Its `contain-intrinsic-inline-size` is 0, the
library's ruling for every size container (accounts plan, spec corrections
34 and 45): a stand-in width is also the holder's min-content width, which
a `flex: 1` item or a `1fr` track keeps as its narrowest and which scrolled
a 320px page sideways. A block, a `flex: 1` item or a `1fr` track gives the
grid its width; a holder sized to its content must give it one, or it
collapses, which the docs say.

**Under 12rem it wraps, never shrinks** (spec correction 53). Twelve cells
across a narrow box, two cards side by side on a 320px phone, were 2px
wide. Under 12rem of the grid's own width the year label takes a line of
its own (`grid-column: 1 / -1`), its months follow in half-years,
`repeat(var(--month-grid-half, 6), minmax(0, 1fr))`, and the header is not
drawn, since a column is no longer one month. `--month-grid-half` is
`Math.ceil(monthLabels.length / 2)`, written on the grid's `style` by the
component, because a `calc()` inside `repeat()` is not a count every
engine takes. Measured two up in cards padded 32px at 320px: a 74px grid
with cells about 10.7px wide. At 320px a grid in a `flex: 1` wrapper, a
`1fr` grid and two up in a `1fr 1fr` grid, bare and in cards, each stay
inside the page with no cell under 6px (`OnANarrowPhone`, three engines,
and a docs test), and `QuarterLabels` reads the wrap at 11rem.

**The cell's corner is a text-sized part's.** A cell is a line tall, so it
keeps the micro step and is never rounder: `calc(var(--radius-micro) * 2 /
3)`, 4px in Rounded and Soft and 0 in Square, the spec's
`min(var(--radius-micro), 0.25rem)` written as a calc on the token so the
token rule reads it. 6px on a 16px cell reads as a pill and loses the grid.
A grid that ends a card puts its last year's last cell in the card's bottom
end corner: measured in Rounded, 33px from the end edge and 35px from the
bottom, inside the 40px curve (21px and 23px compact). The formula there
is 7px comfortable and 19px compact, so the cell's 4px is under it and it
keeps its corner; a cell is never a control, so nothing moves, and the
corner audit, which skips text-sized parts sharper than the formula,
passes. `CellsInTheCorner` reads it in Rounded comfortable and compact,
Soft and Square. The legend's 12px swatch takes the same corner, not
Meter's micro step, which is a circle on 12px: a key looks like what it
stands for (spec correction 46).

**The summary** (ruling 10; spec corrections 52, 54, 55 and 59). With no
`summary` the grid writes English from the app's words, a sentence per
state some month holds whose look is not `filled`: every `empty` state
first, then every `partial` one, each group in the order of `states`, so it
leads with what is missing. Each is the state's label, a colon, and its
months oldest first, whatever order the rows are drawn in: per year, three
or more consecutive months as a range ("March to May"), shorter runs month
by month, a whole year as "every month of 2025", and the year written once
after the last item of its year; the items are joined by commas with "and"
before the last. "Missing: November 2024, March and April 2025. Partial:
June 2025." Years are put oldest first by their ids when every id is a
number (2025, or 1404 on a Persian page); other ids keep the order drawn.
States are read once by id. With nothing missing or partial, the first
filled state that some month holds says "every month" when it is the only
filled state held; otherwise each other filled state held names its months
and the first says "all other months": "Closed: January to March 2025.
Held: all other months." A grid with no month in any state says nothing and
draws no paragraph. The sentence is string joining of the app's own words, so the server and the
browser write the same one; `Intl.ListFormat` is not used. Only English,
because list joining and word order are each language's own: any other
language passes `summary`, a string or a node, and `false` draws none. It
is `--text-small` at 450 in slate, 8px under the grid, visible: a sighted
reader scanning the page reads it as fast as the grid.

**The table is the alternative** (spec, decided item 21). A `table` with a
caption, the grid's name; a header row of `labels.year` ("Year") and the
full `monthNames` as `th scope="col"`; and per year a `th scope="row"` and
a `td` per month holding the state's label, or `labels.outside` ("Not in
range"). A screen reader user moves to March 2025 by row and column, which
a list of every month in turn cannot offer, and the summary gives the gist
first: in the markup the summary comes before the table, so in browse mode
the gist is heard before the detail, and the legend comes last (spec
correction 51). The visible grid is `aria-hidden`, since a grid of empty boxes reads
as nothing, and the legend too, since the table names every state. The
table is clipped inside its own box, `div.month-grid-alternative`, placed at
the figure's start corner, 1px square, `overflow: hidden` and `clip-path:
inset(50%)`, as the toast's status host is: a table's box takes its
content's width whatever its own width says, and on one line twelve month
names would otherwise scroll the page (spec correction 44). It is clipped,
not hidden, so browse mode and table navigation find it. LineChart's table
view is the precedent, visible there by a toggle.

**The name.** A `figure`, named by a non-blank `aria-labelledby`, else a
non-blank `aria-label`, else its visible label, Gauge's chain, and
described by its summary after any description of the caller's. The
visible label is `aria-hidden`: it still names the figure, since a name may
be read from hidden text, and is not read a second time (spec correction
56). The table's
caption is the label when one shows, else the `aria-label`; with only
`aria-labelledby` the table points at the same element and has no caption.

**No keys.** No cell is a stop and none has a tooltip: the grid is a
picture with its words beside it. An app that opens a month links to it
from its own list.

**Calendars** (spec 8.3). The grid knows rows and columns, not dates. A
Persian page passes Persian years ("۱۴۰۴"), the twelve Persian month names
and their short labels, and its data already placed in Persian months; the
docs show the app placing each statement with `@internationalized/date`'s
`toCalendar(date, new PersianCalendar())`, which the library does not
import. The Persian calendar, like the Gregorian, has twelve months every
year; a calendar whose years differ in their count, the Hebrew calendar's
thirteen-month leap years, cannot share one column count across rows and is
not supported.

**Direction** (ruling 7). The grid follows the page by its own logical
flow: on a right-to-left page the year column is at the right and the first
month, Farvardin, the rightmost column. The hatch keeps its 45 degrees: it
is a texture, not an arrow. `MonthGridMirrored` measures the order in three
engines.

**Contrast**, measured with `contrast.js` and gated already, so nothing is
added. The ink fill and hatch against lifted, light then dark, 17.84 and
17.42, and against the canvas 16.25 and 19.31. An empty cell has no fill,
so its edge is the boundary painted on the surface, the switch's off-track
pair: 3.45 and 5.21 on lifted and 3.38 and 5.34 on the canvas, each over
3:1 (spec correction 43; the spec's 3.36 and 3.06 are the boundary around a
Raised fill). The labels are slate and ink and the summary slate, gated as
text.

**Forced colors.** A fill is a background, which the repaint drops, so
`filled` is drawn in `canvastext`; `partial`'s stripes opt out of the
repaint, `forced-color-adjust: none`, and are drawn again in `canvastext`
on `canvas` with a `canvastext` edge, Meter's rule; `empty`'s edge is a
border and stays, in `canvastext`; `none` stays blank. The three looks stay
three shapes: solid, striped, outlined. A docs test reads all four.

**Print.** `print-color-adjust: exact`, and its `-webkit-` form, as
`.meter` sets, so fills and stripes print.

**The size.** The entry `{ MonthGrid }` measures 1491 B without React Aria,
Lucide and `@internationalized/date`, and 1478 B with React Aria not
ignored; it imports none of them, and the bytes are size-limit's own drift
(spec corrections 50 and 61). Under the spec's 2 kB budget; the rule rounds up to
1.5 kB and adds 0.5 kB: a 2 kB limit.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): that a month grid reads its name, its summary as its
description and then before its table, and its table by row and column
headers; and, with touch exploration on iOS and Android, that a finger over
the visible grid finds no cell or stray label and that swiping reaches the
summary and then the table (spec correction 57). Not yet verified in
Windows' contrast themes (the three looks still distinct) or on a real
iPhone and an Android phone at 320px to 430px (cells about 13px to 15px
wide in a card, about 10px two up, and the quarter labels, legible).

## BarChart

Amounts as bars: `BarChart`, the third chart of `@snapshot-ui/charts`,
from the insights spec (section 7) and the owner's rulings in its section
19. This section records the horizontal face, the consumer's ranked list
of categories, merchants and accounts, then the vertical face, the
consumer's month view, two series side by side in either orientation and
the previous period, and last the stacks, the category mix by month.

**Bars are HTML.** A bar keeps its shape: its data end is rounded by a
radius token, its thickness is capped in pixels, and the focus ring
follows its corners. An svg `rect` in a stretched `viewBox` would turn a
6px corner into an ellipse and could not take a token, so every bar is an
absolutely placed `span.bar-chart-bar`, its `inset-inline-start` and
`inline-size` written in render in percent with three decimals. The
gridlines and the zero line stay in a stretched svg with non-scaling
strokes, as a line chart's do. Nothing is measured, so the server's HTML
is the final picture.

**Anatomy.** `figure.bar-chart[data-orientation][data-layout][data-view][data-status]`,
named by its `aria-label` or `aria-labelledby`, holds `div.bar-chart-chart`
(the legend, for two series, then the rows), the shared table, toolbar
and `noscript`, and `span.bar-chart-status`, a polite status mounted from
the first render. `div.bar-chart-rows` is a `group` with
`aria-roledescription` from `labels.roleDescription`, named as the figure,
holding the gridlines' layer, a `div.bar-chart-row` per category, the
value labels and the readout.

**The row grid, three tracks.** `.bar-chart-rows` is a grid of
`fit-content(var(--bar-chart-label-size, 40%)) minmax(0, 1fr) max-content`
with an 8px column gap and no row gap. Each `div.bar-chart-row` is
`display: contents`, so its three parts are the grid's cells:
`span.bar-chart-category` at the start, as wide as the longest name up
to 40% of the chart (an app sets its own share by the property);
`div.bar-chart-track`, which takes the rest; and `span.bar-chart-amounts`
at the end, as wide as the widest amount, which the grid finds from the
amounts themselves with no script. The name and the amounts are hidden
from assistive technology, since each bar's name says them. The rows run
in `--chart-direction`, the attribute the svg's flip reads, so the marks
and the drawing always agree.

**The 2.5rem row and the 24px cap.** A track is at least `--size-target`,
40px, so a row is a 40px target for the pointer, or as tall as its
wrapped name. A bar is `min(1.5rem, calc((2rem - (k - 1) * 2px) / k))`
thick for `k` bars in the row (`--bar-chart-group`, written in render),
centred in the row and moved to its place in the group
(`--bar-chart-place`): 24px alone, the method's cap, and two 15px bars
2px apart in a pair.

**The data end and why micro.** A bar has two ends. The end at zero is
square in every shape, since the bar stands on its line, and a rounded
foot would lift it off the line it measures from. The data end takes
`--radius-micro` (6px in Rounded and Soft, 0 in Square) on its two
corners only, in logical properties: `border-start-end-radius` and
`border-end-end-radius` for a positive bar, the start corners for a
negative one, so right to left moves them with the bar. A bar is a mark,
not a surface or a control, and the nested-radii record keeps mark-sized
parts at the micro step; a pill (Meter's end) would hide the value at the
top of a curve and turn a short bar into a dot (owner ruling 5). A bar
thinner than 12px has its corners scaled by the browser to fit. Any bar
that is not zero is at least 1px long (`min-inline-size` under
`[data-nonzero]`), so a small amount never vanishes; a zero is a bar of no
length that the keys still reach.

**Zero, always.** A bar's length is its value, so the value axis always
includes zero: from the values, `niceDomain` over their extent with zero
included; a given `valueDomain` without zero is widened to it, with a
development warning once (`useWarnOnce`, the react package's pattern
copied). Negatives run from zero toward the inline start.

**The zero line's two colors.** Where the domain crosses zero, the zero
line is 1px of `--color-boundary` (`data-crosses`), the edge color a
reader must find, since it separates the signs: drawn on the surface, it
measures 3.45 and 5.21 against Lifted and 3.38 and 5.34 against canvas,
the switch's off-track pairs the gate holds at 3:1 (the plan's spec
correction 15). Where zero is the domain's edge, as in a list with no
refunds, it is the shared baseline in `--color-frame`, a cue, since the
bars' square ends draw the line. Gridlines are a line chart's, 1px
`--color-divider` at each `valueTicks` value inside the domain, with
their labels under the last row in slate, centred on the line and kept
inside the track at its ends. The layer, `div.bar-chart-gridlines`, is
one element absolutely placed over the track column across every row
(`grid-column: 2 / span 1; grid-row: 1 / span var(--bar-chart-rows)`), so
the lines run unbroken behind the rows and the layer takes no cell from
them. Both ends of each axis are given: an absolutely placed grid child
whose end line is `auto` reaches the grid's padding edge, which drew the
zero line and the gridlines across the amount column at first (the plan's
spec correction 20). The `LinesInPlace` play holds the zero line on the
bars' zero edge and each gridline on its label within 1px, left to right,
right to left and narrow, in all three engines.

**The amount column, on by default here.** A ranked list reads as a list,
name at the start and amount at the end, the consumer's layout and the
method's "value at the tip" made a column so the amounts align.
`valueLabels` is `'all'` by default for a horizontal chart; `'none'`
leaves the column empty (the track is `max-content` of nothing) and a
list of row indexes fills only those rows. Each amount is `--text-small`,
tabular, ink and `white-space: nowrap`, with the numeral rule's
`direction: ltr`, `unicode-bidi: isolate` and both `text-align`
spellings, so a figure reads left to right and stands at its column's
end in either direction. A refund that nets a row below zero keeps its
amount in the same column, so a sorted list's negatives line up. Value
labels are never inside a bar (owner ruling 8).

**Long names and the narrow chart.** A name wraps anywhere in its column
and is never cut short or rotated. The figure is the container
(`container: bar-chart / inline-size`); a query on a container styles its
children, never the container itself, so the figure and not the rows is
the container (the plan's spec correction 14). A size container's
intrinsic inline size is 0 and never a stand-in width
(`contain-intrinsic-inline-size: 0`, the library's ruling): a stand-in is
also the container's least width, so in any holder sized from its
content it would push a phone's page sideways. The holder gives the width:
a block its whole line, a flex item a basis such as `flex: 1 1 20rem`, a
grid a sized column (the plan's spec correction 19; the `InAFlexRow` play
holds one chart filling its row and two sharing a 320px frame with
nothing past its edge). Under 24rem of
its own width the grid is `minmax(0, 1fr) max-content`: each name takes a
line of its own above its bar (`grid-column: 1 / -1`), and the track and
the amounts share the line under it. The name then crosses the gridlines'
layer, so it is drawn over it in `--chart-surface`, as wide as its text;
the render writes `--bar-chart-rows-narrow` (twice the rows) for the
layer's span, since nothing measures which face is drawn.

**One stop, on a bar** (owner ruling 6). Each bar is `role="img"` with
`aria-roledescription` from `labels.bar` and `aria-labelledby` naming its
row header and its cell in the table, and its column header with two
series. The table is in the DOM while hidden, and the name computation
follows `aria-labelledby` into hidden content, so a screen reader hears
"Whole Foods Market $612.40, bar" from the app's own strings, with no
punctuation of the library's. The server writes no `tabindex`; after
mount the active bar is `0` and every other `-1`, the roving tab index.
Tab lands first on the first row with a value (the newest for
`bands="time"`) and after that on the bar last active. Down and Up move
bar by bar in drawn order, skipping a row with no value; Home and End go
to the first and last row with a value; Page Up and Page Down move seven
rows, `moveFrom`'s rule; focus moves with the key, so the reader hears
each bar's name with no live region. Left and Right are not moves in a
horizontal chart and are not prevented. Escape hides the readout once,
stopped as well as prevented; a second Escape goes on. A key with Alt,
Control or Meta is left alone. When `categories` change, by their joined
strings and not by the array's identity, the stop goes back to the first
bar, and a bar that held focus hands it to the new first bar, never to
the body, whether its row is gone or still there. A bar's ref is one
function for the chart's life, and its cleanup runs before React removes
the bar: a bar that leaves while it holds focus parks focus on the rows
group first, so no element ever loses focus to nothing. The group is
`tabIndex={-1}` after mount in every status, focusable by script, never
a tab stop, ringed with the token ring: when its attribute came and went
with the status, the commit that made the chart ready again took it away
before the layout effect could move focus on, and Chromium blurred the
group to the body (the plan's spec corrections 20 and 29). A status with
no bars keeps focus there; when the chart is ready again, a layout effect
gives it to the tab stop, the bar last active for the same categories and
the first bar for new ones, before the page paints. A press anywhere in
the group but a state's own content focuses nothing (`preventDefault` on
its `mousedown`), so a touch's hold and a pointer's row stay the
pointer's, a tap on another row's empty track takes the hold, and a
state's Retry button keeps its press. `StatusWhileFocused` takes both
orientations through ready, loading, ready, error and ready with a bar
focused and finds no focus lost to nothing, in three engines.

**The pointer's dimming.** A mouse or a pen over the rows activates the
row under it, read from each row's parts' boxes in the handler, and its
bar under the pointer or its first; the whole row is the target. While a
pointer holds a row the rows container is `[data-pointer]` and the other
rows' bars are at 40% opacity, with no new shape and no transition.
Against Lifted, ink so dimmed measures 2.57 in light and 3.81 in dark,
slate 1.75 and 2.19, and `gain` 1.93 and 2.36, all under 3:1 for as long
as the pointer rests: a transient emphasis, recorded and not gated, while
the active row is at full strength and the readout says its values. Under
the keyboard nothing dims. A mouse passing over moves no tab stop: only a
key, focus or a touch does. Leaving gives the active mark back to a
focused bar, or clears it; a touch holds until a press outside.

**The readout.** The shared float panel, hidden from assistive
technology: the category in slate, then a line per series with a value,
a 12px swatch in the series' color, the value in 500 and the series'
label in slate, and with `totals` a last line with the total and
`labels.total`. It sits over the active row's track, placed in that row's
grid area by the `--bar-chart-row` the render writes, above the row when
its lines fit there and below it otherwise (`placeReadout` along the
block axis from the row's index, the row count and 40px rows), so it
never covers the bar (the plan's spec correction 12). Along the row it is
at the far end of the row's longest bar, aligned start, centre or end by
quarter. Its grid area is the active row's track alone, both ends given
(`grid-row: var(--bar-chart-row) / span 1`), so a readout below the first
row sits under that row and not under the whole chart; the `ReadoutBelow`
play holds it within 24px of the bar. It is the rows' last child, so it
draws over every bar with no `z-index`, and `pointer-events: none`, so it
never takes the pointer from the rows under it.

**The states.** `status` draws in the rows' place and keeps the figure's
size: the height of `categories.length` rows when the app passes the
categories it expects, and four otherwise
(`calc(var(--bar-chart-rows) * var(--size-target))`). Loading draws a row
per category of still bars in Skeleton's fill and pulse (70%, 50%, 85%,
40%, repeating), square at zero, hidden from assistive technology, with
`aria-busy` on `div.bar-chart-chart`, the chart's view, and not on the
figure, so the polite status after it is outside the busy subtree and is
heard (correction 31); the status says `statusLabels.loading`
once after mount; no legend, toggle or table. Empty draws `statusContent`
or `p.bar-chart-message` with `statusLabels.empty` in slate; error the
same with `statusLabels.error` in `--color-error`, the one meaning that
color has, a load that failed, and the status says it once. Both keep the
gridlines and the zero line behind, and draw no toggle. Every state keeps
the row of value labels when `valueTicks` is given, with the labels and
gridlines inside its domain, so the figure does not move when the data
arrives. The three strings
are `ChartStatusLabels`, shared with LineChart later in the batch. The
chart composes and does not import: `statusContent` is the app's, such as
the react package's EmptyState.

**Color.** Section "Charts" assigns each series its color. One series is
ink; two take ink and slate by place unless a series pins its `color`.
`data-color` sets `--bar-chart-color`, which the bar, the legend key and
the readout swatch read; text never takes it. Ink measures 17.84, 16.25
and 18.43 against Lifted, canvas and Float in light and 17.42, 19.31 and
17.42 in dark; slate 5.31, 4.84, 5.49 and 6.94, 7.26, 6.94; `gain` 7.20,
6.55, 7.44 and 8.04, 8.92, 8.04. All are gated as text, so past the 3:1 a
graphic needs, and the bars add no pair to the gate.

**Forced colors.** The bars and the swatches opt out of the repaint
(`forced-color-adjust: none`) and draw in `CanvasText`, and the active
row's bars in `Highlight`, as does the focused bar's ring. The zero line
between the signs is `CanvasText`; the gridlines and a zero line at the
domain's edge are `GrayText`, a line chart's rules.

**Right to left.** The rows run from the inline start, so under
`dir="rtl"` the names are at the right and the bars grow from the right
toward the left, negatives toward the right of zero. A negative bar is
placed by `inset-inline-end`, from zero, so its least 1px also runs from
zero toward the start. The data end's
corners are logical, so they move with the bar. The amounts stay left to
right inside their isolates. Up and Down do not change with the
direction.

**Standing up, the default.** `orientation` is `'vertical'` unless the app
says otherwise, the consumer's month view. `div.bar-chart-plot` is the
group, named as the figure, and a grid of two columns and two rows: the
gridlines' labels in a column at the start, `max-content`, as wide as the
widest label, which the grid finds from the labels themselves;
`div.bar-chart-bars`, the bars' box, beside it at the plot's height
(`height`, 240 by default, written in render as its block size); and
`div.bar-chart-categories` under the bars' box. The gridlines' layer runs
under both columns (`grid-column: 1 / span 2; grid-row: 1 / span 1`, both
ends given), so each label sits above its line at the start, a line
chart's rule, and no bar ever crosses a label: drawn inside the bars' box,
as the plan had them, the labels were covered by the first band's bars
wherever it crossed a line (the plan's spec correction 23). Each label is
in flow in one cell of its column, so the column takes its width, and is
moved down by its line's place, a percentage of the cell, which is the
bars' height. The bars, the gridlines, the labels, the value labels and
the readout share one scale, the bars' box, and the room the labels
outside the bars' ends take is outside it: a line of the small step and
the 4px gap (`calc(0.25rem + var(--text-small) *
var(--text-small--line-height))`, 24px at the default size; correction 32) above when the
gridlines are labelled or a positive figure shows, and below when a
negative figure shows, written as `--bar-chart-room-start` and
`--bar-chart-room-end` under `[data-room-start]` and `[data-room-end]` and
read by the box's margins, the labels' padding and the gridlines' insets.

**Bands, thickness and groups, with nothing measured.** `n` categories
are `n` equal bands from the inline start; the render writes
`--bar-chart-bands` and `--bar-chart-group` on the plot and each bar's
band centre (`--bar-chart-centre`, a percent with three decimals) and its
place in its group (`--bar-chart-index`). The CSS computes the thickness,
`min(1.5rem, calc((100% / bands * 0.6 - (group - 1) * 2px) / group))`, and
the inline start, the band's centre less half the group plus the bar's
place, `calc(centre - (group * t + (group - 1) * 2px) / 2 + index * (t +
2px))`. A percentage inside a custom property resolves where it is used,
so `100%` is the bars' box's width on each bar. So a bar is at most 24px
and 60% of its band, a pair sits 2px apart centred on its band, and the
bars thin as the box narrows: twelve grouped months in a 248px plot are
5.2px each, which the `GroupThickness` play measures within 1px in three
engines, and thirty-one days about 5px. The horizontal row's offset in a
pair reads the same `--bar-chart-index`.

**Negatives split at zero.** `linearScale(domain, [100, 0])`, so a bar
runs from zero to its value: a positive one stands on the zero line from
below (`inset-block-end`), a negative one hangs from it
(`inset-block-start`), each with its size in percent, so a bar's least
1px (`min-block-size` under `[data-nonzero]`) also grows from zero. The
data end takes `--radius-micro` on its two corners only, the top ones
above zero and the bottom ones below, and the end at zero stays square.
The zero line is the horizontal line at zero, in the boundary color where
the domain crosses zero, the horizontal chart's rule; `LinesInPlaceStanding`
holds every bar on it within 1px, left to right, right to left and narrow.

**Figures standing up.** Off by default (`valueLabels` is `'none'`
standing up and `'all'` lying down): the table, the readout and each
bar's name carry every figure, and the method's rule is never a number on
every point. `'all'` or a list of bands draws `span.bar-chart-value`
outside the bar's data end with a 4px gap, above a positive bar and below
a negative one, centred on its bar by the same centre and place, in ink,
tabular, `--text-small`. Its box is placed in the chart's direction, so
its figure is an inner `span.bar-chart-value-text` with `direction: ltr`
and `unicode-bidi: isolate`, the numeral rule, since a logical inset
follows the element's own direction (correction 24). Under 30rem of the
chart's width `'all'` keeps only the first and the last band's figures
(`[data-keep]`); the bands an app names always show.

**Category labels standing up.** `div.bar-chart-categories` is a grid of
`repeat(bands, minmax(0, 1fr))`, so each `span.bar-chart-band-label` is
its band's width, centred, in slate, an axis's labels, and clamped at two
lines with an ellipsis (`-webkit-line-clamp`, in all three engines), never
rotated; under 30rem one line, and under 24rem, in a chart of more than
eight bands (`[data-dense]`), only every third (`[data-third]`); eight or
fewer bands keep every label at any width (correction 34). The whole name is always in the readout, the bar's name
and the table. `bands="time"` shows the first, the middle and the last
band (`categoryTicks` names others), on one line, each on its band's
centre and the first and the last kept inside the plot by `data-edge`, a
line chart's x labels' rule. Lying down, a category is the row's name,
ink, every one by default.

**Two series.** Grouped bars hold one or two series, in the types: a
third is a type error, and a stack takes more in its own layout. Without
`color`, filled series take ink and then slate by their place among the
filled series; `color` pins a series, so the consumer's month view draws
Income in `gain` beside Spending in ink, and each keeps its color when the
app shows it alone. Money out has no color of its own. A legend of swatch
keys names both, and each bar's name adds its column header: "Aug Income
$5,200.00".

**The previous period** (spec 5.5, the owner's ruling 25). `look:
'hatched'` draws a series as stripes of its color, 2px every 6px at 45
degrees, Meter's hatch on `--bar-chart-color`, inside a 1px border of the
color at full strength, with no fill. Without `color` it takes the first
filled series' color, so October beside September is ink beside striped
ink, and Income beside last period's Income is `gain` beside striped
`gain`. Its amount (lying down) and its figure (standing up) are slate,
its legend key and its readout swatch are the hatched swatch, and each
bar's name says its period, so the stripes are never the only cue. It is
drawn in the app's order, so the docs say to pass it second, where it
stands after the current bar standing up and under it lying down
(correction 25). A zero draws no border, a bar of no length. Measured as
the browser composites, against Lifted: the border is the color itself,
ink 17.84 and 17.42, `gain` 7.20 and 8.04, light then dark; the stripes,
a third of the box, average ink 2.14 and 3.05 and `gain` 1.71 and 2.02, a
texture and not an edge. A lighter fill would have to clear 3:1 against
Lifted and against the solid bar: ink at 40%, 50% and 60% measures 2.57,
3.45 and 4.76 against Lifted and 6.94, 5.17 and 3.74 against solid ink in
light, and 3.81, 5.21 and 6.94 and 4.57, 3.34 and 2.51 in dark, so ink has
a band; `gain` measures 1.93, 2.33 and 2.85 and 3.74, 3.09 and 2.52 in
light and 2.36, 2.97 and 3.71 and 3.41, 2.71 and 2.17 in dark, and has
none in either mode, which is why the previous period is striped
(`contrast.test.js` recomputes each, recorded not gated; correction 22).
In forced colors the current bars are solid `CanvasText` and the previous
period `CanvasText` stripes on `canvas` in a `CanvasText` border, Meter's
block, `Highlight` stripes and border for the active band's: solid
against striped in every palette. A hatched bar under 4px across, such as
a month of days compared in a phone's card, is its outline alone, since
stripes that thin are noise: the stripes' tile is the box scaled from what
it has past 4px (`background-size: max(0px, (100% - 4px) * 100)` on each
axis), nothing at 4px or less, with nothing measured; the docs say a
comparison of more than about fifteen bands reads better lying down
(correction 33, the `HatchedThin` story).

**Keys standing up and in groups.** Left and Right move to the bar drawn
beside, through a pair bar by bar and on to the next band's first,
skipping bands with no value, mirrored in right to left by the nearest
`dir` attribute at the key press; Up and Down are no move and are not
prevented. Lying down, Up and Down step through a row's pair the same way
and Left and Right are left alone. Home, End and the pages move by band,
keeping the series where the band has one. Time bands start Tab at the
newest band. The `Keys`, `KeysCompare` and `Mirrored` plays run in three
engines.

**Pointer and readout standing up.** The band under the pointer is read
across the bars' box from the inline start in the handler, the nearest
band with a bar when the one under it has none, and within it the bar
under the pointer or the band's first; the other bands' bars step back to
40%, as rows do. The readout is placed from known values in the bars'
box: above the band's highest bar end when its lines fit
(`placeReadout` with both ends of every bar of the band and the plot's
height), else below the lowest, so it covers no bar of its band, a
negative one's included; along the plot it is at the band's centre,
aligned by quarter. Its place counts its lines, so no line may break
where the count does not: a figure is one line (`white-space: nowrap` on
the value) and a series' name breaks only between words
(`overflow-wrap: normal`), and under 30rem a centred panel takes three
quarters of the plot (`max-width: min(16rem, 75% - var(--spacing-part))`)
where it took half, so on a phone it never rises over the legend
(correction 30). `ReadoutStanding` holds it clear of the bar and within
24px of it, and in a 280px chart finds every figure one line high and
the panel's top at or below the figure's top.

**States standing up.** Loading draws a still band per category (four
when none is given) of 60%, 85%, 45% and 70% repeating, from the bottom,
in a bar's place and thickness, square at zero; empty and error draw
their content over the bars' box at the plot's height, with the
gridlines, their labels and the category labels kept.

**Turning on its side.** The consumer's control swaps `orientation` with
the categories; the group is the same element in both faces, so a focused
bar that leaves parks focus on it and a layout effect, which now watches
the orientation too, gives it to the new tab stop, the bar last active for
the same categories. `TurnWhileFocused` holds that no element loses focus
to nothing, in three engines.

**Stacks** (spec 7.3, owner rulings 4 and 11). `layout: 'stacked'` puts
up to five series end to end in one bar's place, the consumer's month of
its top four categories and the "Other" it sums. `stackBySign`, pure,
runs each band's positives from zero up and its negatives from zero
down, each sign in series order, the diverging stack of Recharts'
`stackOffset="sign"` and Observable Plot's default; each segment is
placed from the running sum of its sign before it (`barExtent` with a
base), so a stack's two ends are its sums and the value domain is taken
from them, not from the values. A stack is one bar across: the render
writes `--bar-chart-group: 1` and every segment's index 0, so its
thickness is a lone bar's, 24px at most and 60% of its band. One series
ignores the layout and draws as one series (correction 64).

**A segment's corners and its gap.** Only the outermost segment of each
sign keeps the data end's `--radius-micro` (`data-outer`, the last
nonzero segment of its sign); every inner join is square
(`.bar-chart[data-layout='stacked'] .bar-chart-bar:not([data-outer])`,
after both faces' radius rules), and the end at zero stays square as a
bar's does. A segment that stands on another (`data-joined`) starts with
2px of the surface, Meter's spacer, as a border on its edge toward zero:
the block end above zero and the block start below it standing up, the
inline start and end lying down, so right to left moves it with the bar.
The bar is a border box, so the gap is inside the segment's own length
and the stack's total stays exact. A segment on another is at least 3px,
its gap and 1px of its color (`min-block-size`, or `min-inline-size`
lying down, under `[data-joined][data-nonzero]`), so a small amount
never draws as a gap alone; it is placed from its far end, so the extra
grows toward zero over the segment under it, which drew before it, and
the stack's end stays at its total: what a small segment overshoots is
its neighbour, by up to 3px less its own size, never the stack
(correction 72). The first segment of each sign is placed from zero. A
zero is a segment of no length where its sign has reached, never the
outermost and never gapped, and the keys still reach it (correction 65).
`StackInPlace` holds the first segment of each sign on the zero line and
every other's far end on its sum within 1px, at 3px at least, its gap
toward zero, inner joins and zero ends square, and each stack's ends
where the gridlines put its sums, left to right, right to left, narrow
and with $10 between $600 and $300; `StackGaps` holds the same along a
row in both directions, in three engines.

**A stack's colors.** Without `color` the series take the palette's slots
in order, `chart-1` to `chart-4` (teal, violet, olive, magenta), and the
fifth slate, the remainder; a pinned `color` is kept to the fifth, so a
category keeps its color when a filter takes another away, and the docs
pin them, "Other" to slate: a series' texture slot is its color's
(`chart-k` the slot k, slate the fifth, ink or gain its place), so a
slate "Other" is the fifth look in a month of fewer series too
(correction 71). The legend, the readout and the table list the series
first to last, while a standing stack draws them from the foot up, which
the docs say. A sixth and later series draw slate whatever they pin, with a
development warning once: the legend and the table still tell them apart.
A hatched series in a stack warns and draws as a fill in its slot, since
stripes there are a texture, never a previous period. Text stays ink and
slate; the legend's swatches carry the slots.

**Totals.** The chart never sums: `totals` is one string per band, the
app's. Standing up, `valueLabels` labels each stack once with its total,
at the far end of the side its band nets to (above the positives' top
when the band's two sums net to zero or more, below the negatives' foot
otherwise); lying down the total fills the amount column, one line to a
row. The readout lists every segment of the band in legend order, then
the total with `labels.total`, and the table gains a Total column. A
stack asked for figures without `totals` warns once and labels nothing,
and since a horizontal chart's amounts are on by default, a horizontal
stack wants `totals` or `valueLabels="none"` (correction 63). The
readout is placed from the stack's ends, both of them, as a band's bars
are, and lying down it stands at the stack's far end from zero;
`ReadoutStacked` holds it clear of the stack and within 24px of it.

**Keys along a stack** (spec 7.6). Standing up, Up and Down move along the
stack segment by segment by what is drawn, from the foot below zero to
the top above it whatever the series order, by each segment's level (the
sum of its two ends); Left and Right go to the same category in the band
beside, or the nearest category it has by series order, mirrored in
right to left. Lying down the pairs swap: Left and Right along the bar,
mirrored in right to left, and Up and Down across the rows. At either end
of its stack a key is prevented and stays, as Right at the last band
does. Home, End and the pages keep the category, else the nearest
(correction 67). `KeysStacked` runs both orientations and right to left
in three engines. The pointer takes the band's segment nearest it along
the band, so past a stack's end the outermost on that side of zero
(correction 77). When the bar that holds the stop loses its value, the
stop, and any focus parked by it, go to the nearest series its band
still has, and to the first stop only when the band has none
(correction 75).

**Textures** (spec 7.11, owner ruling 11). `hasTexture`, off by default,
draws each slot's texture as well as its color, for a reader who cannot
tell the colors apart and for a printout without color: the first solid,
the second Meter's stripes at 45 degrees, the third at 135, the fourth
both, the fifth solid slate, the method's two directions only, stripes
2px every 6px in the series' color over the surface. Each textured bar
and each legend and readout key has a 1px border of its color, so it
keeps its outline where stripes do not print. A slot is `data-series` on
the segment and on its legend and readout items; the texture is two
custom properties set on the slot (`--bar-chart-texture` and
`--bar-chart-fill`) and drawn by one rule for bars and keys. Grouped
charts write no slot, so a pair's second series is never a texture. A
segment on another has its gap where its border's zero-ward side would
be, so the rule's first background layer draws that side: 1px of the
color along the padding box's zero-ward edge, which the gap rules place
by `--bar-chart-edge-at` and `--bar-chart-edge-size`, the inline start
or end following the chart's direction by `--chart-flip`; on every
other bar and key the layer has no size (correction 73). `TexturedEdges`
reads it on every segment, standing and lying, both directions, in three
engines.

**A stack in forced colors.** Always textured, asked or not, since a
system palette has one text color and a stack needs five looks: the four
slots in `CanvasText`, the fifth solid `GrayText`, and the active band's
in `Highlight`, by setting `--bar-chart-color` on the slot. The gaps are
the page's own color: bars are out of the repaint, so a gap drawn in
`--chart-surface` would show the surface's token on a forced canvas, and
the library never sets the app's surface variable, so the gap reads
`--bar-chart-gap`, which only the forced-colors block sets, to `canvas`
(correction 66). The active band's fifth is a `Highlight` outline over
`canvas`, so it stays apart from the first's solid `Highlight`
(correction 74). The docs' forced-colors run holds the four looks, the
fifth's `GrayText` and the gaps.

**Focus through data and status.** A segment that leaves while it holds
focus, its value gone or its band loading, parks focus on the group as a
bar does; the layout effect that hands it on runs after every commit and
gives it to the tab stop whenever the chart is ready and focus is on its
group, for new data as well as new categories, an orientation or a
status (correction 68). `StackFocus` takes a stack through a segment's
value gone, loading and ready again with a segment focused and finds no
focus lost to nothing, and then takes it through the same steps while a
second chart holds focus, which stays where it is (correction 78).

**In a DataTable cell.** DataTable raises what takes focus in a cell
above the row's link with `position: relative`, and a bar is a tab stop
placed absolutely in its track, so the rule would collapse the bar the
moment it took focus. `data-table.css` leaves `.bar-chart-bar` out of
that rule beside the row's own link, and an app that wants a pointer on
the bars wraps the chart in `data-table-control`, which raises the whole
chart. `Compositions/BarChart in a DataTable` (three engines) focuses a
bar in a linked row and finds its box unchanged (correction 90).

**Bars that link** (the consumer's drill-down, which the spec left as a
later candidate in its open question 13; corrections 96 to 101). On the
consumer's Insights and Reports pages every category or merchant bar
opens the transactions it stands for, for the period shown. A
`BarValue` takes an `href`, one per bar of every series, a stack's
segments included, so a comparison's September bar opens September.
It is data rather than a function of the band and the series, because
a function cannot cross from a server component, and the consumer's
page passes its figures from one.

*The bar is the anchor.* A bar with an `href` is drawn as
`a.bar-chart-bar` in place of the `span`, with the same class, states,
place and name from its table cells, and no role or role description of
its own, so a screen reader says "Groceries $640.00, link": a role
description of "bar" over a link would hide that Enter follows it, which
ARIA asks an author never to do to a widget's role. The other way, a
link inside a roving item, puts the name on one element and the stop on
another, and the stop would still have to be a link for Enter. With
`onBarPress` and no `href` the bar is `role="button"`, which Enter and
Space press. The roving tab index is unchanged: one stop among the
links, moved by the arrows. Enter is the link's own: the browser clicks
it, and the chart's click handler routes the press. Space on a link is
prevented, since a link answers Enter alone (APG's link pattern) and a
page that scrolled from under the chart would lose the reader's place.
A key with Alt, Control or Meta is left alone, so Control with Enter
opens the link in a new tab as it does anywhere.

*A real anchor over the band.* A press anywhere in the band follows its
bar's link, as the pointer already took the whole band. Each linked bar
draws `a.bar-chart-hit` after the band's bars, an anchor to the same
href, `aria-hidden` and `tabIndex={-1}` from the server on, so a reader
meets each link once, on the bar, and it is never a stop. Because the
target is a link, everything a browser does with a link works on the
whole band in every engine with no script: a click with Command,
Control or Shift opens a new tab or window, a middle click a new tab,
the context menu offers both, and the status bar shows the address.
Highcharts, Polaris Viz and Carbon take a bar's click in script on an
svg mark, which gives none of that; forwarding a click from the band to
the bar in script would give it back only for a plain click. A
`::before` stretched from the bar cannot reach its band, since its
percentages resolve against the bar and the band's place is the plot's.
The targets are placed as the bars are, in percent and grid areas,
with nothing measured: standing up, the band's first bar takes the
band's column through the bars' box and the room above and below it,
and a second the half of the band nearer it, from the band's middle;
lying down, the row's first bar takes its whole grid area, the name,
the track and the amount, and a second the half under the row's middle,
where it lies; on a narrow chart the first takes the name's line and
the bars' line and the second the half of the bars' line under the
middle; in a stack, the band's first segment takes the band and every
other its own run along it, the outermost of each sign on to the plot's
edge, room included, so a press past a stack's end takes its outermost
segment. The pointer reads the target under it, so the readout names
the bar a press opens, wherever the two would otherwise differ by a
segment's least 3px; off every target, the band's rule stands. In a
pair without links the pointer between or beside the bars now takes
the nearer, the targets' rule, where spec 7.7 took the band's first
(correction 97). The targets draw nothing in any mode; the link cursor
shows over them. A bar with no `href` in a band with a link takes a
target of its own, a `span.bar-chart-hit` with no href, placed by the
same rule: otherwise the band's first link's target lay over it, and a
press on a stack's "Other" with no link, or on a previous period with
none, opened the band's first bar's link while the readout named
another. A press there is that bar's own, `onBarPress` or nothing, and
it shows the plot's cursor, the press cursor where bars press (the
review of e137645, correction 103).

*Touch.* A tap follows the link. A touch held half a second or more,
the platforms' long press, is a reading: the readout shows, as a hold
always did, its click follows nothing, the context menu Android opens
on a held link is prevented while a touch is down, and
`-webkit-touch-callout: none` keeps Safari's link preview away, so the
readout can be read. A mouse's context menu stays (correction 98). The
hold covers only the click that ends it, which follows the lifting at
once: a long press usually sends no click, and the mark it left made the
next click in the chart, a mouse's, Enter's on a focused link or a
screen reader's, follow nothing (the review of e137645, correction 105).

*Before hydration.* The server writes the links with no `tabindex`, so
before the chart hydrates, and with scripts off, every bar is a link of
its own, a stop in drawn order, and the targets already follow a press:
the drill-down works from the HTML a server page sends. Once mounted
the links take the roving tab index. A reader who tabbed to a link
before then keeps focus on it: a layout effect on mount finds focus on
one of the chart's bars and makes it active, so that bar is the stop,
its readout shows, and Shift Tab does not jump back to the first bar.
No bar moves when the chart hydrates. A press on a row before then
focuses its target, as Chromium focuses a pressed link, and a link to the
same page leaves the page and focus there, on an element hidden from
assistive technology: the same effect gives that focus to the target's
bar (the review of e137645, correction 106).

*The table and the router.* With one series each category cell links
to its bar's href, once a row, as DataTable links its row header; with
two or more each figure's cell links, named by its row header, its
column header and itself as its bar is, and the category cells stay
text, since no one bar stands for a band of several series. The
noscript copy links too. The charts import no React Aria, so they cannot
read the app's `RouterProvider`: `navigate`, the same function the app
gives the provider, routes a plain click or Enter on a bar, a target or
a table link, with React Aria's rule for which clicks a router takes, a
primary click with no modifier key; any other click stays the browser's.
It routes the chart's own links only: a link the app passes in
`statusContent`, such as a help page in a new tab, was routed too,
which dropped its target, and now opens its own way (the review of
e137645, correction 104).
`onBarPress(category, series)` hears every press, a link's before it is
followed (corrections 99 and 100).

*Focus in the table* (the review of e137645, correction 102). The
table's links are the first stops in the table view besides the toggle,
and a status takes them from under focus: loading takes the table and
its toggle away, and empty and error hide the table, which Chromium
blurs at its next rendering step, so focus fell to the body and stayed.
New data takes a link too, a cell that lost its href or a row that went.
The figure keeps the table's link or the toggle that last took focus,
and the layout effect that hands a leaving bar's focus on does the same
for it: one that went or was hidden, with focus on it or on the body,
hands focus to the group while there are no bars, to the toggle while
the table shows, else to the tab stop. Focus the reader moved out of the
chart or to the page's empty space, with the link still shown, is
theirs, and stays (SaveBar's rule). `LinksTableFocus` (three engines)
holds it: through loading and through an error the group holds focus
and no hidden link is blurred to nothing, and ready again the toggle
does.

*Dimming, the readout, focus and forced colors* are unchanged: the
targets take no opacity and draw nothing, a press focuses nothing as
before, and the link bars keep the bar's focus ring and its forced
colors. `data-table.css` leaves the target out of the cell controls it
raises, as it leaves the bar. `Links`, `LinksServerFace` and
`LinkTargets` (no-visual, three engines) hold the keys, Enter, Space,
the modified clicks left to the browser, the targets in every face, the
readout over each, the server's links, hydration with a link focused
and the bars drawn as without links; the docs' end-to-end run opens a
new tab by Control and by the middle button on a row's name, follows a
row with scripts off, and follows the recipe's Category bars through
its router.

**Where the build departs from the plan.** The plan's spec corrections
13 to 20 record them: the horizontal face drawn for any `orientation`
until the vertical one lands, with a warning; the figure as the container
and the gridlines' layer as its own class; the zero line's and the dimmed
bar's measured contrast; the plays' engines; the combined size limit set
by the rule; the intrinsic size of 0; and the review's fixes. Corrections
21 to 28 record the vertical face's, the previous period's and LineChart's
states': the labels' column, the figures' isolate, the series' order and
colors, the measured mixes, and the sizes, 5.84 kB for `{ BarChart }`,
over the spec's 5.5 kB budget, with a 6.5 kB limit by the rule, which the
lead accepted; Task 6 reports against both. Corrections 29 to 34 record
the review's fixes: the group focusable by script in every status, the
readout's lines, busy on the chart's view, the figures' room, the thin
hatched bar's outline and every third label only past eight bands.
Corrections 63 to 70 record the stacks': one total per band at the end of
the side it nets to, one series ignoring the layout, the zero never
outermost and the attributes the CSS reads, the gap's own variable and
the fifth slot's `GrayText` in forced colors, the keys and the nearest
series, focus handed on after new data, the plays, and the sizes.
Corrections 71 to 80 record the review's fixes: the slot from the color,
the 3px least segment placed from its far end, the textured outline on
the gap's side, the active fifth in forced colors, the nearest series
for a lost stop, slate as the palette's fifth neighbour, the pointer
past a stack, the second chart in `StackFocus`, the docs' order and
slate "Other", and which stacked baselines change. After them
`{ BarChart }` is 6.46 kB, over the spec's 5.5 kB budget and accepted by
the rule with a 7 kB limit, and `{ LineChart, BarChart }` 8.06 kB, with
the rule's 9 kB limit (correction 70, amended). Corrections 96 to 101
record the links: the anchor bar and its API, the targets over the
band and the nearer bar of a pair, tap and hold, the table and the
router, and the sizes: `{ BarChart }` 7.15 kB, so 8 kB by the rule, and
`{ LineChart, BarChart }` 8.78 kB, inside its 9 kB. Corrections 102 to
107 record the review's fixes, after which they are 7.37 kB and 8.98 kB,
inside the same limits.

**Screen readers and devices.** Not yet verified (owner action 3): Tab
onto one bar and the arrows bar by bar in VoiceOver and NVDA, each bar's
name from its hidden cells in WebKit, the bars and the zero line in a
Windows contrast theme, and the list with its names above its bars on a
phone at 320px to 430px; standing up, the bars in both orientations and
in a comparison read with their period, the hatched previous period
against the current bars in a contrast theme, and twelve monthly bars and
grouped pairs on a phone; stacked, each segment read with its month, its
category and its value and the keys along and across a stack, the four
textures and the `GrayText` fifth told apart in a Windows contrast
theme, and a month's stack of five on a phone; linked, each bar read as a
link with its name, Enter following it and the links list naming each
once, Safari's Option Tab through the server's links before hydration,
and on a phone a tap that follows a row and a hold that shows its
readout with no link menu.

## Prose

Long-form text an app renders: the `prose` class in `prose.css`, which
styles the plain HTML inside it, and the static `Prose` (a `div`, an
`article` or a `section` through `as`) and `ProseScroll` in
`@snapshot-ui/react` (insights spec 8, rulings 15 to 23, 27 and 28). The
first consumer's monthly report, weekly coaching note and Ask answers are
model output in Markdown; its goals guide is its own, in English and in
Persian. All of it is rendered on the server by react-markdown in a
server component, so Prose ships no JavaScript and imports nothing
client-only.

**The selector.** Every rule is `.prose :where(<element>)` and the guard
`:not(:where(.not-prose, .not-prose *))`, Tailwind Typography's shape: one
class's specificity, a component's own, and nothing under `not-prose`. A
pseudo-element stands after the guard (`::marker`), since `:where()` takes
none, and a language rule is written on the element, `:where(ol:lang(fa))`,
so it keeps the same specificity. The root sets ink and the sans face, so
a page without `base.css` reads the same.

**Components inside prose** (spec 8.5, the review's fix, spec correction
52). One class's specificity and the import order kept a component's own
declarations, but not what it leaves unset: Breadcrumbs, PageHeader's
trail, Pagination, Calendar, DataTable, UploadList, BottomTabBar and the
charts took prose's list, table, figure and link rules, and an unclassed
link inside a component took the link look. So the element rules sit in
a layer of their own, `components.prose`, under every component's rules
whatever their specificity, and that layer's last rule,
`.prose :is(<roots>), .prose :is(<roots>) * { all: revert-layer; }`,
with the same for markers, hands a component's root and everything in it
back to the layer below, so each property takes what it would outside
prose. The roots are every component's root class, written into that one
rule by the build (`scripts/component-roots.js`, from the component
stylesheets: a class that extends no other class of its file, and the few
parts a component renders as its own outermost element, such as a
standalone `field-label` or ToastRegion's `toast-status-host`). The react
and charts packages' server tests render every component and fail one
whose outermost element carries no class of the built list (spec
correction 93). Lightning CSS has no custom selectors, and the
list in each of some sixty rules' guards would have added about 150 kB to
`styles.css`; in one rule it costs `prose.css` 5 kB before compression.
The root must sit inside the prose box, so a Prose in a Card or a
PageColumn is styled; the gaps between the box's own children stay
outside the layer, two classes deep through a last `:not(.not-prose)`, so
they win over a component root's own `margin: 0`, one class in a file that
loads later: a chart in an article stands 24px under the paragraph before
it and a Heading of level 2 32px, whatever order the files load in (spec
correction 89). Tailwind Typography's `prose` sits in Tailwind's
`utilities` layer, after the components layer, and matches the library's
boxes too; an app that uses both renames Typography's class with the
plugin's `className` option (spec correction 91).
`ComponentsUnchanged` (Compositions/Components in Prose, three engines)
renders seventeen parts bare, each a direct child of a prose box, the
compound ones included, and compares every element's type, color,
spacing, edges, corners, list style and measure with its twin outside.
Prose does not nest inside what it leaves alone: a Prose inside a
`not-prose` subtree, or inside a component inside another prose box, is
unstyled, which the page says.

**Type.** Body text is `--text-body`, 16px at 450, with a line height of
1.6, which leaves WCAG 1.4.12's spacing met by default and room for
Persian's taller marks. `h1` takes the section step (36px, 28px under
768px, 500, -2%), since a page's display `h1` is a hero and not an
article's title; `h2` the card title's step (24px, 500, -2%); `h3` to `h6`
the subhead (14px, 700, no tracking), `h5` and `h6` in slate; no new step
(ruling 16). `strong` is 700 (ruling 17): 500 against 450 is a step a
reader barely sees at 16px. `em` is the italic face, which the app loads,
since `base.css` turns synthesis off (risk R9): the docs site loads Sofia
Sans's italic as a call of its own, not preloaded, set first for `em`
and `i` outside Persian and Arabic (spec correction 62), and Storybook
imports the fontsource package's `wght-italic.css`. Persian emphasis
inside `strong`, `b` or a 700 heading keeps 700 (spec correction 56). Headings take
`scroll-margin-block-start: var(--prose-scroll-margin, 0px)`, a sticky
header's height for an app to set. A long word or address breaks anywhere
in every text block and table cell, so a phone is never pushed sideways.

**Rhythm and measure** ("Vertical rhythm, derived"). Top margins only, so
collapsing never decides a gap, and the first and last children carry no
outer margin, so the holder's padding is the article's inset: 24px between
blocks (peers), 32px before an `h1` or `h2` and on both sides of an `hr`
(separate), 8px after a heading and a heading after a heading (parts of
one thing), 8px between list items, under an item's text for a nested
list, between paragraphs in an item and under a figure for its caption,
24px between blocks in a quote and between a definition and the next
term. Text blocks (`p`, `li`, headings, `blockquote`, `dl`, `figcaption`,
each footnote) stop at one line length (ruling 18): `--prose-line`, a
registered `<length> | none` that inherits, set once on the box from
`--prose-measure`, 70ch, so the ch is the body's and a heading or a caption
shares the paragraph's measure (spec correction 55); tables, code, figures
and rules take the box's width. `--prose-measure: none` on the box or
above lifts it.

**Lists, quotes and definitions.** `padding-inline-start: 1.25rem`; `ul`
disc, circle, square and `ol` decimal, lower-alpha, lower-roman by depth;
markers slate, `ol` markers tabular. A quote is a 2px `--color-frame` rule
at the start with the list's 1.25rem indent, so a quote's text and a
list's share an edge, ink, upright and with no quote marks. `dt` is 500
and `dd` indented 1.25rem.

**Inline.** Links restate the Link record on its tokens, paint only: link
blue, a 1px underline at 0.25em that thickens to 2px on hover (where hover
exists) and press, the focus ring, `--radius-micro`, and anywhere breaks;
the CSS test reads `link.css` and pins each value. Inline code is the
docs': `--font-mono` at 0.875em on bone with `--radius-micro` and
`padding: 1px 6px`, plus a 1px transparent edge for forced colors, left to
right and isolated, so a path in a Persian sentence keeps its order and
leaves the words around it alone. `kbd` restates the Kbd record. `mark` is
light signal orange at 20% under ink, the attention cue as a wash, never a
text color. `sup` and `sub` take `line-height: 0`.

**The code block, moved from the docs** (ruling 21). The docs site's
`.code` look is `pre`'s now: bone, a 1px `--color-frame` edge, `padding:
1.25rem 1.5rem`, `--font-mono` at 0.875rem and 1.7, charcoal,
`overflow-x: auto`, `tab-size: 2`, `white-space: pre` and
`overflow-wrap: normal` (so code scrolls rather than break mid-token,
whatever a card above it inherits), left to right with `text-align:
left`, and the focus ring. Shiki's css-variables theme maps onto the
palette as the docs did, keywords and links link blue, strings granite,
constants and functions ink, parameters charcoal, comments and
punctuation slate, never clay, error or success; its background is bone,
since Shiki writes it on the `pre` itself. The docs' Code component now
renders Shiki's `pre` inside a `prose` box and keeps only the copy
button's place and its 200ms ease between shapes (spec correction 40).
`pre code` takes `font: inherit`, so no monospace size quirk shrinks it.
Its intrinsic inline size is 0 (`contain: inline-size`), as a
`ProseScroll`'s is, so a long line never widens a card's body or any flex
or grid item the prose sits in: the block takes the width it is given and
scrolls (spec correction 41). In print, `pre` wraps.

**Framed blocks.** `pre`, `img` and `video` take the holder's radius
less its edge and padding, or the micro step where that runs out,
reading the surface step and no edge or padding where nothing holds them:
`max(var(--radius-micro), calc(var(--holder-radius, var(--radius-surface)) - var(--holder-border, 0px) - var(--holder-pad, 0px)))`.
They are concentric with a Card, a Dialog or any holder they sit in (7px in a Rounded card, 19px
compact, the micro step in Soft, 0 in Square), the surface step on a page,
wherever in the holder the block falls. `img` and `video` stay inline at
`max-inline-size: 100%` and `block-size: auto`.

**Tables.** A chart table's look: the box's width, collapsed, at the
small step with tabular figures; `th` 500 in slate, `td` ink; cells
`padding: 0.5rem 0.75rem` over a 1px `--color-divider` rule; a cell's own
`align` attribute or GFM's style left alone, else `text-align: start`;
the caption slate at the start. Outside a `ProseScroll` a table's cells
break anywhere, so it never pushes the page sideways; inside one they
break only between words, so the table keeps its figures whole and
scrolls (spec correction 42).

**`ProseScroll`** (ruling 28, spec 8.11).
`div.prose-scroll[role="region"][tabindex="0"]` with a required name (`AriaName` in the types; it cannot
warn, being static): `overflow-x: auto`, `max-inline-size: 100%`,
`overscroll-behavior-inline: contain`, `--radius-micro` for its ring, the
focus ring on `:focus-visible`, and no frame of its own. Its intrinsic
inline size is 0 (`contain: inline-size`), the library's rule for a box
that must not size its holder (spec correction 19), so a six-column table
in a flex or grid item never widens it (spec correction 41). The table
keeps `display: table`, so its rows and columns are read. At 375px the
monthly report's table scrolls inside its region and the page does not;
the region takes focus and the arrow keys scroll it (`WideTableScrolls`,
three engines, and the docs end to end). It is a tab stop whether its
table overflows or not, since it cannot know without measuring, so the
docs wrap only tables wider than three columns; the docs' map names each
region from its column headers, and makes a code block a region named
"Code", its language and its first line (spec correction 61).

**Neutralized links and images** (ruling 27, spec 8.10). Nothing in
`prose.css` lays anything out by `a` or `img`: every rule on them is
paint, and the CSS test fails a margin, padding, display, width, position,
inset, float, flex or grid declaration on either. A model's link reaches
the page as `span.prose-unlinked`, the text's own look (`color: inherit`,
no decoration, anywhere breaks), since a thing that looks like a link and
goes nowhere breaks the reader's trust; its image as `span.prose-image`,
its alt text at the small step in slate, inline in the inline code's bone
box with a 1px transparent edge that forced colors draw, and not drawn
when empty. The docs' map starts the span with a visually hidden
"Image:" and renders nothing for an image with no alt text (spec
correction 58). A link within the page, a footnote's mark and its way
back, stays a link. The docs' recipe writes both through
react-markdown's `components` map with `skipHtml`; react-markdown and
remark-gfm are a devDependency of `@snapshot-ui/react`, for one server
render test, and dependencies of the docs site, never of a published
runtime (spec correction 38).

**Footnotes and task lists** (spec corrections 53, 59 and 60). GFM's
footnotes are small and slate under a divider rule, each note at the
measure; the "Footnotes" heading GFM writes for screen readers alone
(`h2.sr-only`, which react-markdown leaves unstyled) is hidden as
visually hidden text, read through `[class~='sr-only']` since the class
pattern refuses an `sr-` class, and the list under it takes no gap for
it. A Persian page passes its label through react-markdown's
`remarkRehypeOptions` (`footnoteLabel`, `footnoteBackLabel`). GFM's task
lists draw their own boxes: no markers and no indent.

**Right to left and Persian.** Logical properties throughout, so markers,
indents, quote rules and `dd` move to the right; `pre` and inline code do
not. Under `:lang(fa)` and `:lang(ar)` headings take `letter-spacing:
normal`, since tracking pulls a cursive script apart (the same fix is
owed to `Heading`, risk R11), and `em` is 500 and upright, the emphasis a
Persian text uses, since Vazirmatn has no italic. Under `:lang(fa)` every
ordered list counts in Persian digits (`list-style-type: persian`, ruling
22). Prose sets no direction; a renderer writes `dir="auto"` on mixed
paragraphs (ruling 23). An amount in a Persian sentence is wrapped in a
left-to-right isolate, U+2066 to U+2069: after Persian letters the
bidirectional algorithm reads a leading currency sign with them and draws
"1,250.00$" (spec correction 54; `ProseMirrored` holds the sign left of the
figures). Vazirmatn, the face an app puts first in
`--font-sans` under `lang="fa"`, is served to Storybook from
`apps/storybook/public/fonts/vazirmatn/` (33.003, its OFL and its sha256
in the folder's README, spec correction 37), so the baselines draw it
with no network; a story opts in with `data-font="vazirmatn"`, so the
right-to-left stories baselined before keep their face (spec correction
36). The docs site loads it through `next/font/google` as
`--font-persian`, not preloaded, and sets it first under
`[lang]:lang(fa)`. `VazirmatnLoaded` holds the face loaded and the
headings untracked in three engines; `ProseMirrored` is its baseline.

**Dark mode, forced colors and print.** Every color is a token, so dark
mode is the tokens' dark values, and images are neither inverted nor
dimmed. In forced colors inline code's edge is `CanvasText`, `mark` takes
the reader's `Mark` and `MarkText` where the engine names them and
`Highlight` and `HighlightText` where not (under `@supports`, since
Lightning CSS folds a repeated declaration), the quote's rule, the `hr`
and the footnotes' rule take `CanvasText`, so does the alt text box's
edge, and the rings of a scrolling
`pre` and a `ProseScroll` are `Highlight`.

**Contrast.** Gated already: ink, slate and link blue as text on the
canvas and lifted. Measured and recorded, light then dark, not gated:
charcoal on bone, the code's text, 13.75 and 11.44; slate on bone, the
image's alt text, 4.99 and 6.44; link blue on bone 5.33 and 4.81; granite
on bone, a string in code, 6.78 and 8.22; ink on the mark's wash 14.62
and 12.86 over lifted, 13.50 and 14.65 over the canvas (spec correction
47, where the spec's 11.41, 6.45 and 14.63 were composited a little
differently).

**Card and PageColumn.** In a Card, Prose is one part of the body and
the card's padding its inset; an article in a card starts at a paragraph
or an `h2`, and the card's title stays the Card's. On a page, `Prose
as="article"` in a PageColumn under a PageHeader keeps its text on the
column's start edge, under the title (`InPageColumn`), never centred.

**Size.** `{ Prose, ProseScroll }` measures 169 B, and 167 B with React
Aria not ignored, a difference of compression alone, since neither part
imports it; the rule sets 1 kB, over the spec's 0.5 kB budget (spec
correction 45). `prose.css` builds to 16.9 kB before compression, 5 kB of
it the component roots in the one rule that hands them back.

**Screen readers and devices.** Not yet verified (owner action 3): a
report's headings, lists and table read in VoiceOver and NVDA, a
`ProseScroll` read as a named region that scrolls by keys, a neutralized
link read as plain text, inline code's edge and the mark in a Windows
contrast theme, and a report with a wide table and the Persian guide in
Vazirmatn on a phone at 320px to 430px.

## Chart palette

The parent spec asks for "a categorical chart palette, which the design
system lacks, derived and measured for contrast in both themes before any
chart is built". Batch 6 adds it, from the insights spec (section 5) and
the owner's ruling 4 there: four tokens, `chart-1` to `chart-4`, teal,
violet, olive and magenta, for a chart of several peers, such as a stack
of a month's top categories, with slate for "Other". A stack of
categories is the first chart with more than two series; the line chart,
the grouped bars and the previous period need none of it.

**The tokens.** Each has a value chosen for its mode, not an inverted one,
and the description "A chart series that is one of several peers. Never a
state, never text." Teal keeps its value in dark, written there all the
same, so each mode's value is the one the test measured (spec correction
50).

| Token | Hue | Light | Dark | OKLCH light (L, C, H) | OKLCH dark |
| --- | --- | --- | --- | --- | --- |
| `--color-chart-1` | teal | `#029393` | `#029393` | 0.601, 0.102, 195 | 0.601, 0.102, 195 |
| `--color-chart-2` | violet | `#7024ab` | `#af6af2` | 0.450, 0.199, 305 | 0.659, 0.200, 305 |
| `--color-chart-3` | olive | `#697805` | `#7a8a06` | 0.541, 0.124, 118 | 0.600, 0.137, 118 |
| `--color-chart-4` | magenta | `#910080` | `#c344ae` | 0.450, 0.200, 335 | 0.599, 0.200, 335 |

The build writes `--color-chart-1` and the rest, light on `:root` and
dark in the dark scopes, `tokens.js` entries with their modes, and the
Tailwind names `bg-chart-1` to `bg-chart-4`.

**How they were found.** The colors that carry a meaning sit on OKLCH
hues 29 to 79 (error, clay, both signal oranges, warning), about 160
(success and gain) and about 265 (link blue). A series must not be read
as one of them, so the hues sit at least 30 degrees from each, in the arcs
left free: olive about 110 to 128, teal to sky 192 to 233, violet to
raspberry 297 to 359. Every order of the candidate hues was scored by its
worst neighbouring pair in both modes, each mode's lightness chosen per
slot from a grid, and the best order kept; the order was enumerated, not
chosen by eye.

**The checks**, the data-visualization method's, ported into
`packages/core/scripts/palette.js` as pure functions and run by
`test/palette.test.js` on the values in `tokens.json`:

- OKLCH lightness in the mode's band, 0.43 to 0.77 in light and 0.48 to
  0.67 in dark, and chroma at least 0.10, under which a hue reads as gray.
- Neighbours at least 8 apart under simulated protanopia and
  deuteranopia, by OKLab distance times 100, simulated with Machado,
  Oliveira and Fernandes (2009) at full severity in linear RGB, the model
  the method's thresholds are set for; and at least 15 apart for full
  color vision.
- At least 10 from every reserved color for full color vision, and 30
  degrees of hue from each one that has a hue: error, success, gain,
  warning, clay, signal orange, light signal orange, link blue and taupe.
- At least 3:1 against lifted, the canvas and float in both modes, so no
  slot needs the method's relief rule of visible labels; the table is
  there anyway.

`paletteFailures(palette, mode)` returns each check a slot fails as a
sentence, as `contrastFailures` does, so the test asks for an empty list
and its own fixtures show that a slot turned toward amber, a slot given
its neighbour's value, a dark slot too dim and a reserved color moved
onto a slot each fail. The test also recomputes the figures below at
their precision, so a changed token or a changed method fails it.

**Contrast as a graphic** (3:1 needed), gated: the twenty-four pairs, four
slots on three surfaces in two modes, are in `CONTRAST_PAIRS`.

| Token | Light: lifted, canvas, float | Dark: lifted, canvas, float |
| --- | --- | --- |
| `chart-1` | 3.63, 3.31, 3.75 | 4.64, 5.15, 4.64 |
| `chart-2` | 8.03, 7.32, 8.30 | 5.11, 5.67, 5.11 |
| `chart-3` | 4.74, 4.32, 4.90 | 4.53, 5.03, 4.53 |
| `chart-4` | 8.08, 7.36, 8.35 | 3.95, 4.38, 3.95 |

**Separation**, neighbours in slot order, OKLab distance times 100; the
color-blind figure is the lesser of protanopia and deuteranopia:

| Pair | Light, normal | Light, color-blind | Dark, normal | Dark, color-blind |
| --- | --- | --- | --- | --- |
| 1 and 2 | 29.5 | 20.0 | 26.1 | 13.8 |
| 2 and 3 | 33.6 | 28.1 | 34.2 | 27.8 |
| 3 and 4 | 32.2 | 20.0 | 32.0 | 18.7 |

The neighbours are the pairs bars use: only neighbours in a stack or a
group touch.

**Kept from the meanings.** The nearest reserved color to each slot, for
full color vision: in light, teal to success 17.0, violet to link 14.4,
olive to warning 11.2, magenta to error 17.0; in dark, teal to success
10.2, violet to link 12.9, olive to success 12.1, magenta to error 18.7.
The least hue apart is teal from success in light, 34 degrees. Two
reserved colors are close under color-vision deficiency, olive to warning
4.4 in light and violet to link blue 2.9 in dark, both under
deuteranopia; that would matter only if a chart drew a status or a link
beside a series, which the meaning rules forbid and the `ChartColor` type
cannot say (risk R7).

**Taupe has no hue.** It is a warm gray in light (chroma 0.009) and white
at 40% in dark, measured painted over the canvas (0.001), so its hue
angle is noise: 106 degrees in dark, 11 from olive. The hue check reads
only reserved colors of chroma 0.03 or more, the least of the others
being success in light at 0.071, and taupe is held by distance: its
nearest slot is teal in dark, 11.9 apart (spec correction 49).

**Not for scatter or small multiples.** On every pair rather than
neighbours, the four do not all pass: the worst pair for full color
vision is violet and magenta, 10.3 in light and 12.0 in dark, and for a
color-blind reader teal and magenta in dark, 3.7. A chart form where any
two series can sit side by side takes three slots at most. No such form
exists yet; this is for the next.

**The fifth series is slate.** A stack of more than four peers folds the
rest into an "Other" that the app sums and labels, since the library
never sums a figure it must say. It is drawn in slate, achromatic, so it
reads as the remainder and never as a fifth hue; slate is gated already
as text, 5.31 and 6.94 on lifted. A sixth series draws nothing new.
Drawn on the fourth slot, slate is magenta's neighbour, and the checks
hold the pair like any other: 21.2 for full color vision and 10.0 for
the lesser simulation in light, 22.5 and 12.4 in dark. An app pins
"Other" to slate, so in a month of fewer series it stands on an earlier
slot; recorded, not gated: teal and slate 13.0 and 8.2 in light, 14.3
and 6.5 in dark, under the neighbour thresholds, and olive and slate
12.6 for full color vision in light. The gap, the legend, each
segment's name and, in forced colors, GrayText against CanvasText tell
them apart (the plan's spec correction 76).

**Never text, and only in charts.** Values, labels, legend names and
readouts stay ink and slate; the colored mark beside them carries the
series, the method's rule. `css.test.js` fails any `color` declaration
in core that reads a chart token or the bar's color variable, and finds
the four tokens read only by `charts.css`'s `[data-color]` rules, which
set `--bar-chart-color`. Avatar's record declined a color per name, and
it stays declined: a person's color would be a color carrying a meaning
the name already carries. A series keeps its slot when a filter removes
another only if the app pins it with `color`; without `color` slots go
in series order.

**Considered and rejected**, as the spec measured them. Six slots with a
sky blue (225) and a raspberry (355) pass the neighbour checks, worst
9.5, but put teal and sky 5.7 apart for full color vision, under any
reader's threshold for two things, and raspberry 10.4 from error in
light. An ink ramp (ink at 100%, 70%, 45%, 25%) is an ordinal ramp, and a
stack of categories is nominal: lightness steps would say "more" where
there is no order. Link blue as a slot would make a series look like a
link and like the info tone.

**No visual change yet.** Nothing draws a slot until the stacks: no story
passes one, so no baseline moved. `ChartColor` named the four since the
foundations (spec correction 4), and `charts.css` now draws them. The
stacks draw them since ("BarChart", "A stack's colors" and "Textures").

**Where the build departs from the plan.** Corrections 49 to 51: taupe
joins the reserved colors, with the hue check reading only colors that
have a hue; teal's dark value is written, the checks are one
`paletteFailures` list, and every figure of spec 5.2 recomputes as the
spec states it; the docs' swatches and the bar chart page's Color
section.

## CopyButton

A button that copies a string the page holds and says it did, without
moving the reader: `CopyButton` (settings spec, section 11; decided item
23; rulings 5 and 7, questions 21 and 22). It is the design the accounts
spec worked out and deferred (its section 5.6), taken as written, with the
API the settings spec gives it and the changes below. It composes what
exists: IconButton's ghost look with a Tooltip by default, or Button's
secondary look with the glyph and the word (`look="button"`).

**The root and its parts.** `span.copy-button[data-look]` holds the button
and `span.copy-button-status`, a polite `role="status"` host, in the
server's HTML and empty, so a screen reader is listening before the words
arrive. The root is a part of its own so the status sits beside the button,
never inside it, where it would join the button's name. `className` and
`style` go on the root, so what places the part moves the button and its
status together; `ref` and the rest of the Button props go on the button,
the element a ref is taken to focus (settings plan, spec correction 18). The root
is `inline-flex`, not a grid, so its absolutely placed status needs no grid
lines (lesson 9). Prose's generated guard of component roots (batch 6) lists
`copy-button` as a root, since it extends no other class in its file
(settings plan, spec corrections 9 and 32); the docs' answer and the
`UnderAnAnswer` story draw the answer with Prose.

**The copy, inside the press.** The press handler calls
`navigator.clipboard.writeText(value)` synchronously, so the call is made
inside the user activation Safari requires; a call after an `await` or a
timer would be refused there. Nothing reads `navigator` or the clipboard
until a press, so the server and the first render read nothing.

**A fallback, the document's copy command** (settings plan, spec correction
10, a choice). The accounts and settings specs ruled out `execCommand`. It
is back as a fallback only, because the Clipboard API is missing on a page
served over plain http and refused in a frame whose permissions policy does
not allow `clipboard-write`, the case of an app embedded in another site,
and in both the command still copies on a press, as the clipboard-copy and
copy-to-clipboard libraries do. Where `writeText` is missing, the command
runs in the press; where it rejects, it runs in the rejection, still inside
Chromium's transient activation. The value goes into a clipped
`span.copy-button-source` inside the root, which is selected and copied,
and a capturing `copy` listener puts the value on the event as
`text/plain`, so no markup or style is copied with it. The span leaves in
the same task, the reader's own selection is put back, and focus, which a
selection does not move, is put back if an engine moved it. Only when the
command also fails, or does not exist, is the outcome a failure. A refused
copy that a later copy has superseded, or that settles after the part has
left, runs no command and reports `onCopy(false)`: its command would write
its value over the later copy's, or select in a page the part has left
(settings plan, spec correction 19). A docs
test removes the Clipboard API and copies with a real click in Chromium,
reading the value from the copy event.

**The two-second hold.** The outcome, `copied` or `failed`, is written to
`data-outcome` and held 2000ms, the docs site's `useCopy` and Carbon's
copy button feedback timeout; a second press restarts the hold. The timer
is cleared on unmount, and a copy that settles after the part has left, or
after a later copy, starts no timer and changes nothing on screen;
`onCopy(copied)` still runs once for every copy.

**Said once, by the status.** The status writes the outcome's words,
"Copied" or "Copy failed", as a new node for each copy (keyed by the
copy's number), so a second copy during the hold is said again, and each
copy is said once. The tip shows the same words for the eye but is not
the button's description: the outcome's tip has a state of its own that no
trigger shares, so React Aria never points `aria-describedby` at it, and a
screen reader does not hear the outcome twice. The resting tip, the icon
look's name on hover and focus, stays shut while the outcome's tip holds
its place. Escape anywhere, focus leaving the button, a scroll or a resize
closes the outcome's tip, as any tip closes (WCAG 1.4.13). The tip takes
the Escape that closes it, as React Aria's own tips do, so in a Dialog the
first Escape closes the tip and the next the Dialog (settings plan, spec
correction 17).

**The name never changes.** The button is named `labels.copy`, which says
what it copies ("Copy webhook address"), through every outcome: a name
that changes under focus is read again by some screen readers and not by
others. Only the tip and the status change.

**Not only the glyph.** On a copy the `Copy` glyph turns to `Check`; both
are drawn, `aria-hidden`, and the stylesheet shows one by `data-outcome`,
so the server's HTML is the rest state and the swap needs no render of its
own. The glyph is never the only signal: the tip shows the words, for a
touch reader too, and the status says them. A failure keeps the copy glyph
and shows "Copy failed".

**The check in ink.** The check is `--color-ink`, never success's color:
a copy is not a save. A failure says its words and is not drawn in the
error color, which marks invalid values. The word look's glyph is 16px
before the word, as the filter bar's sheet button draws its icon.

**Focus** stays on the button: the button is never disabled, hidden or
replaced by a copy, and the fallback's selection is put back without
moving focus. `CopyStatus`, `CopyFailed` and `CopyByCommand` read focus on
the button in Chromium, WebKit and Firefox, and the docs test reads it
after the hold.

**`aria-busy`.** A status inside an `aria-busy="true"` part may go
unheard, so the status is never put under one: an answer that streams
with `aria-busy` on its body puts its CopyButton in the footer. When the
status speaks inside `aria-busy="true"`, the part warns once in
development (lesson 11).

**Forced colors, motion, direction.** The buttons draw their own forced
colors; the check is `buttontext`, the button's text color in the reader's
palette, so it shows where the copy glyph did. Nothing moves: the file has
no transition or animation, and the glyph swaps at once. The glyphs are not
mirrored on a right-to-left page, since a copy has no direction;
`RightToLeft` checks the button at the row's inline end and no transform on
the glyphs.

**Contrast**, measured with `contrast.js` and gated already, so nothing is
added. The check and the word look's glyph and word are ink: against the
canvas 16.25 in light and 19.31 in dark, against lifted 17.84 and 17.42.
The tip is canvas text on ink, 16.25 and 19.31.

**The size.** The entry `{ CopyButton }` measures 2.52 kB without React
Aria, Lucide and `@internationalized/date`, over the spec's 2 kB budget:
it draws IconButton or Button, both tips, the status, the timer and the
copy command's fallback. The rule rounds up to 3 kB and adds 0.5 kB: a
3.5 kB limit. With React Aria not ignored it measures 20.62 kB. After the
review it measures 2.76 kB, Button's kept announcement included (spec
correction 22): the parts it composes come to about 2 kB on their own
(`{ Button }` 771 B, `{ IconButton }` 259 B, `{ Tooltip, TooltipTrigger }`
986 B), so no trim of its own code reaches the budget short of dropping a
tip, the status or the fallback.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): "Copied" said once after a copy, and again after a
second copy during the hold; the name unchanged; the tip not read as a
description. Not yet verified on a real iPhone and an Android phone at
320px to 430px (the outcome's tip after a tap, and the status), or in
Windows' contrast themes (the check in the button's text color).

## ConditionalFields

Fields a gate shows and hides, such as a logo provider and its key under
"Show bank logos": `ConditionalFields` (settings spec, section 7; decided
items 14 and 15; open questions 11 and 12; ruling 3). The gate is the
app's own control, placed right before the group, whose `aria-controls`
names the group's `id`. The part never reads or writes a value.

**A fieldset, for its `disabled`.** The group is
`fieldset.conditional-fields`, the one element whose `disabled` reaches
every field inside it, hidden inputs and React Aria's hidden select
included. Its border, padding, margin and min-content width are reset
(`min-inline-size: 0`, so a long field never holds a 320px page wider), and
it is a grid whose gap is `var(--conditional-fields-gap,
var(--spacing-peer))`, a form's gap between fields, which an app sets to its
own. Without a name it has `role="none"`: a group with no legend says
nothing a screen reader can use, and the gate before it names what follows.
An app that passes `aria-label` or `aria-labelledby` keeps the fieldset's
group role. `className`, `ref` and the rest of a fieldset's attributes go
on the fieldset; the `id` comes from the prop or `useId`, and the ref reads
it.

**The three attributes.** Hidden, the group carries `hidden`, `inert` and,
unless `submitsWhenHidden`, `disabled`, with `data-hidden`, all written in
the same render and in the server's HTML (React 19 writes `inert` as a
boolean attribute), so a page loaded with the gate off has no hidden field
in its tab order, its reading order or its submission before any script.
`hidden` takes the group out of the layout and the accessibility tree;
`inert` keeps focus and find-in-page out in the frame a stylesheet might
still show it; `disabled` takes its fields out of the submission and the
browser's checks. Shown, none of them is there. `.conditional-fields` sets
`display: grid`, which beats the user agent's `[hidden]` rule, so the file
hides `[hidden]` and `[data-hidden]` by its own rule.

**Kept, not sent, not checked** (ruling 3). The children stay mounted while
hidden, so React keeps their state and the DOM keeps their values: turning
the gate on again shows them as they were. A disabled fieldset's fields
are not submitted, so a hidden key never overwrites the saved one and a
secret typed and then hidden is never sent; the server reads the gate to
know what an absent field means. They are also barred from constraint
validation, which `hidden` and `inert` alone do not do: a hidden required
field would block a native submit with a bubble pointing at nothing. A
form reset still resets a hidden field, as a browser resets every control,
and puts the gate back to its first value. `submitsWhenHidden` keeps
`hidden` and `inert` and drops `disabled`, for the model where hidden
answers are posted and the server ignores them by the gate; the app then
makes hidden fields not required itself.

**"Never cleared or disabled", reconciled.** The parent spec carries the
rule that hidden conditional fields are made `inert`, never cleared or
disabled. Its point is the reader's: a field that comes back keeps its
value and never comes back dimmed. The hidden fieldset's `disabled` is
never seen, leaves as the group shows, and React Aria's fields inside keep
their own `isDisabled` false, so no field is ever drawn disabled; nothing
is cleared. A test turns the gate through every state and finds no shown
group disabled and no field with `data-disabled`.

**Focus to the gate.** The reader who turns the gate off is on the gate,
so nothing moves; showing moves nothing either, and the fields follow the
gate in the tab order, as the disclosure pattern does. When the group
hides while it holds focus, because another control or the app turned the
gate off, focus goes, in the frame after the commit, to the gate (the first
element outside the group whose `aria-controls` names its id), else to the
last element before the group that takes focus by Tab, else to `<main>`,
never the body. A `main` with no tabindex is lent `tabindex="-1"` while it holds
focus, so a script can focus it and Tab never stops on it. Nothing moves on the
server's render or on hydration: only a change after the first commit
does. A group no gate points at warns once in development.

**The focus watch** (lesson 10). Chromium blurs a field whose group turns
`hidden` or `inert` before effects run, so when the group's frame comes
`document.activeElement` is already the body, and "was focus inside?"
cannot be asked then. The group asks the shared module,
`utils/focus-after-commit.ts`, which the later parts of the batch reuse: a
document `focusin` listener, capturing, sets the watch on a focus inside
and clears it only on a focus outside, never on a blur to nothing. The
move then runs only if focus is lost: on the body, on nothing, detached,
or inside something hidden, inert or disabled, as Firefox leaves it on the
hidden field. `FocusToGateWhenHidden` turns the gate off from the key by
the app's own Escape and reads focus on the gate, and on the body for one
frame at most, in Chromium, WebKit and Firefox; with the watch cleared by a
blur it fails in Chromium. The docs test does the same on the page.

**The weekly email** (ruling 3). The group may hold no field at all: a
status line and a "Send a test" Button. Its `disabled` then disables the
Button while hidden, unseen.

**No indent, no motion, no dimming.** The fields line up with the gate,
with no indent and no line beside them, since an indent at 320px costs a
field's width. The group appears and leaves at once: the file has no
transition or animation, so there is nothing for reduced motion to stop.
Hidden is hidden, never dimmed in place. Forced colors, right to left and
density are the fields' own: the group draws nothing and uses logical
properties only, and its forced-colors block keeps its border at none.

**Contrast.** The group draws no color of its own, so it adds no pair.

**The size.** `{ ConditionalFields }` measures 1.16 kB without React
Aria, Lucide and `@internationalized/date`, and the same with React Aria
not ignored, since it imports none: over the spec's 1 kB budget, as the
shared focus module (the frame, the watch, the tab order and the named
place) is most of it and is counted here first. The rule sets a 2 kB
limit (settings plan, spec correction 31).

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): a hidden group absent from the reading order; the gate
read as a switch, checked or not; focus on the gate read after a group
hid while holding focus. Not yet verified on a real iPhone and an Android
phone at 320px to 430px, or in Windows' contrast themes.

## FieldExtras

A line under a field, or under a group, that offers the field's default
("Default: 3 days", Reset to default) or a value worked out for this
reader ("Suggested: $2,340, a month of your fixed bills", Use):
`FieldExtras` (settings spec, section 8; decided items 16 and 17; open
questions 13 to 15; ruling 2.6). It wraps any field and composes what
exists: a tertiary Button at the end of a slate line.

**An offer is an edit.** Taking one calls the offer's `onTake`, the app's
setter, the one the field's `onChange` calls, and nothing else: the
wrapper reads no value, writes none, prefills nothing and draws no
Changed chip. So the field's Changed chip, its checks and a SaveBar follow
the app's own comparisons, as they do for typing: a field saved at its
default shows no offer and no chip; edited away, the chip and the offer
show; reset, both leave; saved away from its default, the offer shows and
no chip, and after a reset the chip shows and no offer. The SaveBar counts
a take as one change, by the app's message, and its Cancel brings the
saved values back and the offers with them. A suggestion is never put in
the field and never shown as its placeholder: taupe is for placeholders,
and a suggestion is words to read.

**Drawn only when useful.** An offer whose `isCurrent` is true is not
drawn, so a page of fields at their defaults shows no offers. When both
are given, neither is current and their values are equal, only the default
is drawn, the plainer reason. When both show, the suggestion comes first:
it is about this reader, the default about everyone. Two offers are two
lines.

**The markup.** `div.field-extras[data-scope]` holds the field, then a
`p.field-offer[data-kind]` per offer drawn, `span.field-offer-text` with
the words and, for a suggestion, ", " and its reason, and a tertiary
`Button.field-offer-button` with its word, then the polite status host,
`span.field-extras-status`. `className`, `ref` and the rest go on the root.
The button is `type="button"`, so a press never submits the form or runs
the browser's checks; it has no name or value of its own, so it adds
nothing to the form's data; and nothing joins the field's description, so
the field keeps its own words and its own error, which the app's
validation clears. Helpers never fight the field's checks.

**Names.** Each button is named by its word and the field's label, "Reset
to default, Wait", through `aria-label`, and described by the offer's
words, "Default: 3 days" (settings plan, spec correction 23). The name
starts with the word the button shows, so voice control finds it by what
is seen (WCAG 2.5.3). A list of offers then reads as a list of fields, not
a list of Resets.

**Focus after a take.** A taken offer leaves, since the field now holds
it, so the button that held focus goes. In the frame after React's commit
(`afterCommit`, never a layout effect, spec 12.4), focus goes to
`controlRef`'s element when it takes focus, else the first control of the
field or the group, not of the offers, else an offer still drawn, else
`<main>`, never the body. It moves after a pointer press too, since Safari
leaves a pressed button unfocused, so focus is not read first. It moves
only when focus is the pressed button's, inside the wrapper or lost: an
app whose setter moved focus itself, into a dialog that asks first, keeps
it (spec correction 26). A NumberField with `allowsNegative` draws its
sign button before its text box, so its text box takes focus in the
sign's place: it reads the value taken, where the sign reads only
"Negative" (spec correction 34). An app passes `controlRef` when another
control is the one to focus.

**Said politely** (settings plan, spec correction 25, a choice). The spec
said the field read with its new value was the confirmation and needed no
live region. The owner's instruction for this task asks for a polite
announcement of an applied suggestion: a screen reader does not always
read a field focused by script (VoiceOver on iOS often does not), and
voice control and switch users hear nothing of a focus move. So a polite
status in the server's HTML, empty until then, says what a take did, "Set
to the suggestion" or "Set to the default", as a new node per take, so the
same offer taken again is said again, and empties after five seconds, so a
reader browsing later meets no stale news. It speaks in the frame after
the move, once the field holds focus (spec correction 32): a screen reader
reads a focus move at once, so a status said before it was cut short or
read first and then repeated by the field, and the field's own words
already give its label and value, so the status says neither again. It
speaks only of a take the field holds (spec correction 33): when the
app's setter took focus elsewhere, into a dialog that asks first, nothing
is set yet and nothing is said, and the words leave as soon as the taken
offer is drawn again, refused by the setter, typed away from or undone by
a Cancel, since they would no longer be true. Its words are
`labels.usedStatus` and `labels.resetStatus`. A status that
speaks inside `aria-busy="true"` warns once in development (lesson 11).

**The group scope** (ruling 2.6). `scope="group"` lifts the measure, so
the line sits under the whole group, and the first control of the group
takes focus after a take: a pair of fields' first, a reset Repeater's new
first row's first field, or its Add with no rows (Task 5). One offer line
serves a field and a set alike, and the Repeater stays ignorant of values
(open question 3).

**The colors, and why.** The words are slate at the small step, 450; the
button is a tertiary Button in ink. Never clay, since an offer is not
unsaved work; never signal orange, since it is not consent; never success
or gain, since a suggestion is not a good outcome; never info, since
nothing is being reported; never taupe, since it is not a placeholder.

**The line.** It sits a part step under the field's last part, its hint or
error, and wraps between its words, breaking a word only when it alone is
wider than the line (`overflow-wrap: break-word`, spec correction 35). It
was `anywhere`, which made a letter the line's narrowest, so a holder that
sizes the field from its content, a table's cell, squeezed
"$2,340,000.00" onto two lines, which reads as two numbers: the Badge
lesson. The wrapper's one column is `100%`, its own width where that is
known, so a long address still breaks inside a 320px page rather than
widening the column, and the longest word where a holder sizes it from
its content. The button's 40px box is level with the line by
`margin-block: min(0px, calc((1lh - var(--size-control)) / 2))`, so the line
does not grow for its target, the DescriptionList actions' technique. A
field's extras stop at `--container-field`, as a field does, so an offer
ends under the control's end; a group's span the group.

**The corner** (settings plan, spec correction 24). The last offer of a
field that ends a card is a control at the card's foot. Its button's box
hangs under the line by half the control's height less half the line's,
10px comfortable and 8px compact, so the plan's padding of the corner
inset less the card's padding left the box 30px from the card's edge in
Rounded, measured, inside the 39px inset. The line's block-end padding is
the corner inset less the card's padding plus that overhang: 17px in
Rounded and 27px compact. In Soft and Square the inset is the card's
padding, which already clears their curve, so the line keeps no padding:
the rule takes the smaller of the move and the inset less the padding
scaled up, which is 0 there. `OfferClearOfCorner` measures it in three
engines.

**Forced colors, motion, direction.** The words are text and the button
draws its own forced colors, so the file adds nothing of its own; a docs
test reads the words in CanvasText, the button in ButtonText and its focus
ring. Nothing moves: an offer leaves at once. Every property is logical:
on a Persian page the words start at the right and the button ends the
line on the left (`RightToLeft`). A figure in another script keeps its
order inside the app's isolates: `value` is a string, where a `bdi` would
be drawn as its letters, so the app writes U+2068 and U+2069 around the
figure, which do what `bdi` does (spec correction 36); a `reason` is a
node and can hold a `bdi`.

**Server rendering.** A client part for its focus move and its status; the
offers are in the server's HTML from the props, and the status host is
there empty. Nothing reads the locale, so en-US, de-DE and fa-IR write one
HTML. Prose's generated guard of component roots (batch 6) lists
`field-extras` and `field-offer` as roots: they extend no other class in
their file, which names no `.field` selector (settings plan, spec
corrections 9 and 32).

**Contrast**, measured with `contrast.js` and gated already, so nothing is
added. The words are slate: against the canvas 4.84 in light and 7.26 in
dark, against lifted 5.31 and 6.94. The button is ink: against the canvas
16.25 and 19.31, against lifted 17.84 and 17.42.

**The size** (spec corrections 27 and 37). The entry `{ FieldExtras }`
measures 1.90 kB without React Aria, Lucide and `@internationalized/date`,
over the spec's 1.5 kB budget: Button is 771 B of it, with its kept
announcement (spec correction 21), the shared focus module most of the
rest, and the status the spec did not have adds its timer and its node.
The review took it from 2.09 kB: the app's ref through
`useImperativeHandle` instead of a merged callback ref, as ConditionalFields
gives its own, and checks that another check already made. The rule rounds
up to 2 kB and adds 0.5 kB: a 2.5 kB limit. With React Aria not ignored it
measures 14.29 kB.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): an offer's button read with its name and description;
the field read with its new value after a take, and the status after it;
nothing said twice in a way that confuses. Not yet verified on a real
iPhone and an Android phone at 320px to 430px (an offer's line wrapping,
the button at its end), or in Windows' contrast themes.

## Repeater

A short ordered list of rows the reader adds and removes, each row the
app's own fields, such as the consumer's wait tiers: `Repeater` (settings
spec, section 6; decided items 8 to 13; open questions 6 to 10; rulings
2.2 to 2.6). It composes what exists: a fieldset per row, the app's
fields, a tertiary Button for Remove and a secondary Button for Add.

**Fieldsets, not GridList.** A grid's arrow keys move between cells and
fight a text field's caret, and the APG grid answers that with an edit
mode, Enter to edit and Escape to leave, which makes a few rows of a form
harder to fill than rows read with Tab. GOV.UK's "add another" pattern and
the MOJ Design System's component are fieldsets with a legend per item and
plain buttons, which every screen reader reads as a form. Reordering, the
reason a list widget would earn its keys, is not offered (open question
7): the app sorts at save.

**The markup.** `fieldset.repeater` (`data-full` at the maximum,
`data-empty` with no rows) holds `legend.repeater-legend` with the label
and, while `isChanged` and no set error, the Changed chip;
`p.repeater-description`; `p.repeater-error`; then `ol.repeater-rows` of
`li.repeater-row[data-row-id]`, each a `fieldset.repeater-row-set` with
`legend.repeater-row-legend`, `div.repeater-row-fields` (the size
container) holding `div.repeater-row-grid` with `div.repeater-row-main`
(the app's fields) and `div.repeater-row-end` (Remove), and
`p.repeater-row-error`; or, with no rows, `p.repeater-empty` in the list's
place; then `div.repeater-foot` with Add and `span.repeater-count` or
`span.repeater-full`; then the polite status, `div.repeater-status`. The
set's `aria-describedby` names its hint and its error. A floated legend is
not the fieldset's drawn legend, so both legends join their grid as items
and take its gap; in a grid nothing floats, so the float is no side.

**Controlled or uncontrolled** (ruling 2.5). `value` and `onChange` hand
the app typed rows on every add, remove and the render function's
`update`, which writes a row back by its id. Without `value` the Repeater
holds the rows from `defaultValue`, the fields hold what is typed, and the
app names them: by the render function's `index`, `tiers.0.amount`, so
after a remove every row is named by its new place and what the form sends
reads back into the same rows (settings plan, spec correction 35), or the
same name in every row, read with `getAll` in drawn order. The Repeater
never reads a field. A row's id is React's key, so a removed row's fields
unmount and the rows after it keep theirs and what was typed in them. Two
rows of one id are both drawn, the second under a key of its own, and warn
once in development.

**Focus and the status.** Each move runs in the frame after React's
commit (`afterCommit`), never in a layout effect, and lands on a place the
reader can name through `focusNamedPlace`, never the body:

- After an add, the new row's first field, or its field marked
  `data-autofocus`; the status says "Tier 3 added", and at the maximum
  adds the reason: "Tier 3 added. 3 of 3. Remove one to add another."
- After a remove, Remove in the row now in its place, else in the row
  before it, else Add; at `minRows`, where no Remove is left, that row's
  first field. The status says "Tier 2 removed", by the old legend, since
  the rows after it are renumbered (settings plan, spec correction 34, the
  owner's instruction). A reader removing several rows keeps their place,
  one press after another. A held Enter removes one row: React Aria
  starts no press from a repeated keydown (`usePress.mjs`, `!e.repeat`),
  and the first press fires on the key's release.

The move happens only when focus is on the pressed button, inside the
set, or lost, so focus the app moved elsewhere stays. The status is in the
server's HTML, empty, writes each event's words as a new node so a
repeated sentence is said again, and empties after five seconds, as
FieldExtras' does. A status that speaks inside `aria-busy="true"` warns
once (lesson 11); a form that marks itself busy while saving marks its
fields' container, not the Repeater's root.

**Names.** Remove shows its word and is named "Remove, Tier 2" through
`aria-label` (spec correction 33): a clipped span would be a block, and
the name would read "Remove , Tier 2". The name starts with the word
shown (WCAG 2.5.3). Add is named by its text and described by its count,
"2 of 3", or at the maximum by the full line.

**From none to the most** (rulings 2.2 and 2.3). With no rows the list is
not drawn and `labels.empty` stands in its place, in slate. At `maxRows`
Add stays drawn and natively disabled, in taupe as Button draws it, and
`labels.full` takes the count's place beside it in slate: visible, its
description in browse mode, and said by the add that reached it. Button
has no focusable disabled mode (settings plan, open question 1): React
Aria's `allowFocusWhenDisabled` is undocumented and gives `tabIndex={-1}`,
so a focusable Add would be a change to Button's API for every disabled
button. Rows passed above `maxRows` are all drawn. At `minRows` no row
draws Remove, and a hidden stand-in the width of Remove keeps the end
column from 30rem, so the fields do not widen when a row is added (spec
correction 37). With `isDisabled` Add and Remove are disabled and the count
stays.

**Errors.** A field's own error is the field's. A row's error,
`rowErrors[id]`, is a line in the error color under the row's fields,
names the row's fieldset in its `aria-describedby`, marks it
`data-invalid`, and is given to the render function so the app marks the
fields invalid. The set's error sits under the legend and describes the
set; while it shows the Changed chip steps aside. Never a colored row.

**The row's width.** `div.repeater-row-fields` is a size container with
an intrinsic inline size of 0 (lesson 8), and the query styles its frame,
`div.repeater-row-grid` (accounts correction 8). Under 30rem each field
takes a line and Remove follows them; from 30rem the fields share a
wrapping line, each `flex: 1 1 10rem` (spec correction 36), and Remove
stands at the line's end, its block start offset by a field label's line
and a part step plus half the field's height less the control's, so its
centre is the first control's. Every fieldset's border, padding, margin
and min-content width are reset, so a 320px page never scrolls sideways.

**The colors.** The legend is the h4 step in ink; a row's legend the
small step at 500 in slate; the hint, the count, the full line and the
empty line slate; the errors the error color. Rows are ruled apart by
`--color-divider`, a peer step of padding above and under each, none
above the first or under the last. Never clay but the Changed chip, never
signal, success or gain.

**The corner.** A Repeater that ends a card puts Add at the card's bottom
start corner, a control at its foot: the foot's block-end padding grows by
the corner inset less the card's padding, 7px in Rounded, 19px compact, 0
in Soft and Square. Under a group's offers in FieldExtras the foot moves
only while no offer follows the Repeater, when the wrapper's status comes
straight after it (spec correction 38). The first Remove of a Repeater
with no legend that starts a card with no header needs no rule: its row's
legend and its fields' label row stand above it, so it sits lower than the
corner inset in every shape and density (`RemoveClearOfCorner`).

**Forced colors, motion, direction.** The rules between rows are
`canvastext`; words and buttons draw their own. Nothing moves: a row
appears and leaves at once. Every property is logical: on a Persian page
the legends start at the right, Remove stands at the row's left from
30rem, and a money figure stays left to right by NumberField's rule
(`RepeaterMirrored`).

**Server rendering.** A client part for its presses, focus moves and
status. Every row, its legend, fields, errors and Remove, Add with its
count or the full line, and the empty status are in the server's HTML;
nothing reads the locale, so en-US, de-DE and fa-IR write one HTML, and
nothing moves on hydration. Prose's generated guard lists `repeater` as a
root, since every other class of its file extends it (spec correction 42).

**Contrast**, measured with `contrast.js` and gated already, so nothing is
added. Ink against the canvas 16.25 in light and 19.31 in dark, against
lifted 17.84 and 17.42; slate 4.84 and 7.26, and 5.31 and 6.94; the error
color 6.58 and 6.36, and 7.22 and 5.73. A disabled Add's taupe is disabled
text, exempt.

**The size** (spec correction 41). The entry `{ Repeater }` measures 2.91
kB without React Aria, Lucide and `@internationalized/date`, under the
spec's 3 kB budget; the rule gives a 3.5 kB limit. With React Aria not
ignored it measures 15.2 kB.

**Screen readers and devices.** Not yet verified with VoiceOver and NVDA
(owner action 3): a row's legend on focus moved by script, the added and
removed statuses, a disabled Add read with its reason, the empty line.
Not yet verified on a real iPhone and an Android phone at 320px to 430px,
or in Windows' contrast themes (a disabled Add in `graytext`).
