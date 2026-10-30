# VYBE — UI Concepts

Three original directions. None of them use card stacks, swipes or face grids.

## Concept 1 — "Night Sky Orbit" (selected)

The app is a calm night-sky system. **You** are a softly glowing avatar at the centre, and other people are small avatar planets on three or four concentric rings.

- **Ring = proximity tier** (same area → nearby → wider → Greater Sydney). **Angle and size = compatibility.** Rings are labels, not distances.
- **Thin luminous threads** connect you to a planet and are coloured by the strongest shared category (violet for cinema, blue for music, pink for travel…). Threads draw in when you focus a planet.
- **Tapping a planet** opens a translucent bottom sheet (a "glass panel"). It shows the avatar, nickname, shared-interest chips, the compatibility explanation, languages, intent and a Conversation Spark.
- **The Worlds tab** reuses the same visual language. Interest categories become floating planets you can "enter".
- **Motion:** slow orbital drift (60–120 s per revolution), which pauses under `prefers-reduced-motion`. There is no constant particle noise.

**Why it wins:** it encodes the product's two ranking axes (proximity tier and compatibility) directly in the layout, so the visual novelty *is* the information. It works in 2D SVG/CSS on low-end phones, and the 3D avatar only renders at the centre. It also maps cleanly to an accessible list: rings become sections and planets become rows.

## Concept 2 — "Taste Archipelago"

Discovery is a top-down map of floating islands. Each island is an interest cluster ("Night Drive Isle", "K-Thriller Cove"), and people's avatars stand on the islands where they overlap with you. You pan across the sea and dock at islands.

- Strong for **Taste Galaxy** and communities.
- Weaker for proximity: two spatial metaphors (a map plus geography) confuse people about "where" others are, and a map invites location inference. It also needs panning, which is heavier on small screens.
- **Used for:** the visual vocabulary of Worlds and community portals.

## Concept 3 — "Signal Waves"

People are waveforms. Your VYBE DNA renders as a layered sine signature. Discovery is a horizontal tuner: you "tune" a dial across frequencies (interest categories), and people whose waves resonate with yours phase-align and glow.

- Very on-brand ("wavelength"). The DNA comparison view (two waves overlapping) is excellent.
- The tuner is hard to make accessible and hard to explain on first use, and one-dimensional tuning hides proximity.
- **Used for:** the **VYBE DNA** visualisation and the two-person overlap view.

## Selected direction

**Night Sky Orbit** is the primary navigation and discovery language. We borrow **Signal Waves** for the DNA and overlap visualisations and **Archipelago** for the Worlds and community portals.

## Design system

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0D0B17` | App background (deep space) |
| `--surface` | `#1B1830` | Panels and sheets |
| `--surface-2` | `#25213F` | Raised/hover surfaces |
| `--primary` | `#9D78F5` | Primary actions and focus rings |
| `--secondary` | `#6F8CFF` | Links and secondary emphasis |
| `--accent` | `#F2A6D8` | Highlights and "spark" moments (used sparingly) |
| `--text` | `#F8F7FF` | Body text |
| `--muted` | `#A9A3C7` | Secondary text (≥ 4.5:1 on `--bg`) |

- **Type:** "Space Grotesk" for display, "Inter" for body.
- **Glass panels:** `surface/70%` + `backdrop-blur` + a 1 px `white/8%` border. Opaque fallback when `prefers-reduced-transparency` is set or blur is unsupported.
- **Orbit motif:** concentric ring outlines at `white/6%`, and a single subtle radial glow per screen.
- **Motion:** 150–300 ms ease-out for UI. Ambient motion is CSS/Motion, disabled by reduced-motion or low-power heuristics (`hardwareConcurrency ≤ 4`, `deviceMemory ≤ 4` or `saveData`).
- **Accessibility:** visible focus rings, minimum 44 px touch targets, landmarks, skip link, every spatial view mirrored by a list, and no information carried by colour alone.
- **Primary navigation** (bottom bar on mobile, side rail on desktop): Universe · Radar · Worlds · Connections · My VYBE.
