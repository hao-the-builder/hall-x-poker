# Design

Matte black and rose gold. A private card room after hours: flat near-black surfaces, warm bone-white ink, and one rose-gold accent that does the work of both the "red" suits and the primary action. Serif numerals like the index of a playing card.

## Visual Theme & Atmosphere

Scene: a phone at the table at 1am with the lights low, or a laptop in the common room after everyone else has gone to bed. Dark-only by design. "Matte" is the discipline: no gloss, no glow, no gradients, no glass. Depth comes from hairlines and one step of surface lift, never from shadows.

Color strategy: **Restrained.** Neutral black ground, warm-tinted bone text, one accent (rose gold) used for primary actions, S-tier marks, red-suit pips, the signed-in player's row, meters, and focus rings. The gold is a touch, not a wash.

## Color Palette

All colors in OKLCH.

| Token | Value | Role |
|---|---|---|
| `--bg` | `oklch(0.13 0 0)` | Page ground. Neutral matte black. |
| `--surface` | `oklch(0.17 0.003 30)` | Table header band, hover fills, lifted panels. |
| `--surface-2` | `oklch(0.22 0.004 30)` | Pressed / selected neutral state, meter track. |
| `--ink` | `oklch(0.93 0.01 45)` | Body text, black suits. Warm bone, not pure white. |
| `--ink-2` | `oklch(0.72 0.012 45)` | Secondary text. About 7:1 on bg. |
| `--ink-3` | `oklch(0.58 0.012 45)` | Placeholder / disabled. About 4.6:1 on bg. |
| `--rule` | `oklch(0.25 0.006 30)` | Hairlines, table rules. |
| `--rule-strong` | `oklch(0.4 0.01 30)` | Input borders, emphasised rules. |
| `--pip` | `oklch(0.76 0.085 22)` | Rose gold. Primary buttons, S tier, red suits, meters, focus. Dark text on it. |
| `--pip-hover` | `oklch(0.82 0.08 22)` | Primary hover (lighter, since the ground is dark). |
| `--pip-tint` | `oklch(0.2 0.02 22)` | Row highlight for the signed-in player. |
| `--pip-ink` | `oklch(0.13 0 0)` | Text on rose-gold fills. |
| `--ok` / `--ok-tint` | `oklch(0.8 0.12 150)` / `oklch(0.2 0.03 150)` | Success text / background. |
| `--warn` / `--warn-tint` | `oklch(0.84 0.12 85)` / `oklch(0.22 0.04 85)` | Warning text / background. |
| `--danger` / `--danger-tint` | `oklch(0.74 0.16 25)` / `oklch(0.22 0.05 25)` | Error text / background. |
| `--focus` | `oklch(0.76 0.085 22)` | Focus ring, 2px, 2px offset. |

Text on rose gold is always `--pip-ink` (dark): at L 0.76 the fill is pale enough that dark text wins on both WCAG and perceived contrast.

## Typography

Two families on a contrast axis (serif display + humanist sans).

- **Display: Instrument Serif** (400, italic 400). Page titles, the wordmark, rank numerals in the card-index motif, tier letters, averages. Never in labels, buttons, or table body.
- **UI: IBM Plex Sans** (400, 500, 600). Everything else. `font-variant-numeric: tabular-nums` on all data.

Light-on-dark compensation: body line-height 1.55 and letter-spacing 0.005em; primary buttons step up to 600 weight.

Fixed rem scale, ratio about 1.2: `--t-xs` 0.75rem, `--t-sm` 0.875rem, `--t-md` 1rem, `--t-lg` 1.25rem, `--t-xl` 1.75rem, `--t-2xl` 2.5rem, `--t-3xl` 3.5rem. Line-height 1.15 on display sizes. Headings use `text-wrap: balance`.

## Spacing & Layout

4pt scale: `--s-1` 4px through `--s-16` 64px. Page container `max-width: 72rem`, side padding 16px (mobile) / 32px (768px and up). Top nav is a hairline-ruled bar. Sections are separated by space and hairlines, not cards. The only card-shaped objects are the three card-index tiles for the top three players.

## Components

- **Button**: 40px tall, radius 4px. Primary = rose-gold fill, dark text, 600 weight. Secondary = bone text, `--rule-strong` border, transparent fill. Quiet = no border. Danger = `--danger` text. Hover lifts to `--surface` (or lighter gold for primary); focus-visible ring; disabled uses `--ink-3` on `--surface`.
- **Input / Select**: 40px tall, `--rule-strong` border, `--bg` fill, bone text, `--ink-3` placeholder. `color-scheme: dark` so native pickers match.
- **Table**: hairline rules, `--surface` header band, tabular numerals. Signed-in row tinted `--pip-tint`. Meters fill in rose gold on a `--surface-2` track.
- **Tier mark**: serif letter in a 1px box. S = rose-gold fill, dark letter. A = rose-gold outline. B, C = bone outline. D, E = muted outline. Provisional = dashed border.
- **Card index tile** (top 3): `--bg` fill, `--rule` border, radius 10px; hover lifts to `--surface` and strengthens the border. No shadow.
- **Status pill**: tinted fill, matching text, radius 999px.
- **Notice**: tint fill, 1px border in the semantic color. No side stripe.

## Motion

150 to 200ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Only state changes. Leaderboard rows fade-in on first paint with a 20ms stagger capped at 12 rows. Everything collapses to instant under `prefers-reduced-motion: reduce`.

## Z-index scale

`--z-sticky` 10, `--z-dropdown` 20, `--z-toast` 30.
