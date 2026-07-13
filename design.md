# JustEnough Design System

Status: normative for the web product  
Last updated: 2026-07-13  
Working promise: **The right model. The right effort. Evidence included.**  
Brand line: **No smarter than necessary.**

This document fixes the visual and interaction language for JustEnough. It is an implementation contract, not a mood board. New pages and components should use these primitives before inventing local styles.

## 1. Product character

JustEnough is an evidence instrument for choosing a model, reasoning effort, harness, and budget for a software task. It should feel like a published technical report that can answer questions, not a leaderboard dressed as a marketing page.

The product personality is:

- **Serious about evidence.** Claims carry samples, uncertainty, and provenance.
- **Dryly funny about waste.** The joke is overkill, never the user's task or a model's failure.
- **Quiet until the data speaks.** The shell is nearly monochrome; color communicates meaning.
- **Dense but not cramped.** Important comparisons stay visible together, with progressive disclosure for raw detail.
- **Decisive without pretending certainty.** Recommend a configuration when evidence supports it; abstain plainly when it does not.

### Design principles

1. **Evidence before recommendation.** A recommendation always exposes why it was selected and what could invalidate it.
2. **Economy is a first-class outcome.** Cost, latency, effort, and reliability sit beside capability—not in a footnote.
3. **One obvious “just enough” answer.** The primary state is a recommended execution configuration, surrounded by weaker and stronger alternatives for context.
4. **Playful copy, sober numbers.** Humor may label the decision; it must never blur a metric or caveat.
5. **Color belongs to data and state.** Navigation and decoration do not compete with charts, verdicts, or the selected route.
6. **Show the missing evidence.** Low coverage, benchmark mismatch, and old snapshots are visible states, not implementation details.
7. **Progressive disclosure, not progressive disappearance.** Summaries may collapse detail; users can always reach the underlying cases and trials.

## 2. Relationship to DeepSWE

The live DeepSWE site is the main design reference for this first version. The patterns we intentionally learn from are its computational-editorial hierarchy, restrained chrome, compact segmented controls, wide evidence tables, tabular metrics, thin borders, generous section rhythm, light/dark semantic tokens, and the use of color for data rather than decoration.

JustEnough must not copy DeepSWE's wordmark, illustrations, provider palette, page composition, or benchmark-specific voice. Our distinct language is a warm paper/ink foundation, a porridge-yellow decision accent, the three-way **too weak / just enough / overkill** comparison, and dry economy-focused copy.

## 3. Semantic color system

Components must consume semantic tokens. Do not place literal colors in component classes. Use OKLCH so lightness and chroma can be adjusted predictably between themes.

### Light theme

```css
:root {
  color-scheme: light;

  --background: oklch(98.2% 0.012 88);
  --foreground: oklch(18% 0.014 72);
  --surface: oklch(100% 0.006 88);
  --surface-foreground: var(--foreground);
  --surface-raised: oklch(99.3% 0.009 88);

  --muted: oklch(95.2% 0.014 88);
  --muted-foreground: oklch(48% 0.018 75);
  --subtle: oklch(92.7% 0.018 88);
  --border: oklch(87.5% 0.018 84);
  --input: oklch(84.5% 0.022 82);

  --accent: oklch(82% 0.155 89);
  --accent-hover: oklch(78% 0.165 87);
  --accent-foreground: oklch(22% 0.046 68);
  --ring: oklch(60% 0.14 86);

  --positive: oklch(55% 0.145 148);
  --positive-soft: oklch(94% 0.045 148);
  --negative: oklch(56% 0.19 29);
  --negative-soft: oklch(95% 0.045 29);
  --warning: oklch(66% 0.145 72);
  --warning-soft: oklch(95% 0.05 78);
  --info: oklch(57% 0.13 244);
  --info-soft: oklch(95% 0.035 244);
  --unknown: oklch(58% 0.024 75);
}
```

### Dark theme

```css
.dark {
  color-scheme: dark;

  --background: oklch(16.5% 0.012 72);
  --foreground: oklch(96% 0.009 88);
  --surface: oklch(20.5% 0.014 72);
  --surface-foreground: var(--foreground);
  --surface-raised: oklch(23% 0.016 72);

  --muted: oklch(26.5% 0.016 72);
  --muted-foreground: oklch(72% 0.016 84);
  --subtle: oklch(30% 0.018 72);
  --border: oklch(33% 0.018 72);
  --input: oklch(38% 0.022 72);

  --accent: oklch(86% 0.15 89);
  --accent-hover: oklch(90% 0.14 91);
  --accent-foreground: oklch(20% 0.04 68);
  --ring: oklch(82% 0.13 88);

  --positive: oklch(74% 0.15 148);
  --positive-soft: oklch(28% 0.055 148);
  --negative: oklch(72% 0.18 29);
  --negative-soft: oklch(29% 0.06 29);
  --warning: oklch(79% 0.14 78);
  --warning-soft: oklch(30% 0.055 78);
  --info: oklch(75% 0.125 244);
  --info-soft: oklch(28% 0.05 244);
  --unknown: oklch(74% 0.025 82);
}
```

### State mapping

| Meaning | Primary treatment | Secondary cue |
|---|---|---|
| Just enough / selected route | `accent` | Filled center mark and `Recommended` text |
| Empirical pass / sufficiently capable | `positive` | Check icon and explicit pass count |
| Empirical fail / too weak | `negative` | Cross icon and explicit fail count |
| Overkill | `info` | Up-right arrow and excess cost/latency text |
| Mixed or caution | `warning` | Triangle icon and uncertainty text |
| Missing evidence | `unknown` | Dash icon and `No evidence` text |

The accent is not a generic success color. Green means observed success; yellow means JustEnough's recommendation. Never collapse those meanings.

### Chart palette

Provider identity must remain readable without granting any provider a “winning” brand color. Assign chart colors deterministically from the following series, in order of first appearance within a chart:

```css
--chart-1: oklch(57% 0.14 244); /* blue */
--chart-2: oklch(57% 0.13 155); /* green */
--chart-3: oklch(62% 0.16 35);  /* orange */
--chart-4: oklch(57% 0.15 305); /* violet */
--chart-5: oklch(61% 0.12 195); /* teal */
--chart-6: oklch(63% 0.16 330); /* magenta */
--chart-7: oklch(65% 0.14 76);  /* ochre */
--chart-8: oklch(54% 0.06 260); /* slate */
```

Raise chart-series lightness by about 16 percentage points in dark mode while keeping hue stable. Use shape, line style, or direct labels in addition to hue when more than one series appears.

## 4. Typography

### Font families

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
--font-mono: "Google Sans Code", ui-monospace, SFMono-Regular, Menlo,
  Monaco, Consolas, monospace;
```

The system face makes the interface quiet and native. The mono face is for model names, effort levels, task IDs, costs, percentages, durations, token counts, versions, and code—not for body paragraphs. Self-host the mono font and subset it; if it is unavailable, fall back without blocking rendering.

### Type scale

| Token | Size / line-height | Weight | Use |
|---|---:|---:|---|
| `display` | `clamp(2.75rem, 7vw, 5.5rem) / .98` | 600 | Homepage thesis only |
| `h1` | `clamp(2.25rem, 5vw, 4rem) / 1.02` | 600 | One page title |
| `h2` | `2rem / 1.1` | 600 | Major evidence sections |
| `h3` | `1.25rem / 1.25` | 600 | Card and panel titles |
| `body-lg` | `1.125rem / 1.55` | 400 | Introductory copy |
| `body` | `1rem / 1.55` | 400 | Reading text |
| `ui` | `.875rem / 1.3` | 500 | Controls and table cells |
| `caption` | `.75rem / 1.35` | 500 | Metadata and chart labels |
| `metric-lg` | `2rem / 1` | 500 mono | Primary recommendation metric |

Headings use `letter-spacing: -0.025em`; captions may use `0.025em`. Do not uppercase paragraphs or navigation. Uppercase may be used for short effort levels such as `LOW`, `MEDIUM`, and `HIGH`, with `0.05em` tracking.

All numeric comparisons use `font-variant-numeric: tabular-nums`. Align decimals where practical. Keep prose measures between `48ch` and `68ch`; evidence tables and charts may use the full shell width.

## 5. Spacing and layout

Use a 4px base unit. Allowed spacing values are `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120`. Avoid arbitrary values unless required for pixel-aligned chart geometry.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
--space-30: 7.5rem;

--shell-max: 72rem;
--reading-max: 68ch;
--compact-max: 48rem;
```

- The app shell is centered at `72rem` maximum width.
- Horizontal gutters are `16px` below 640px, `24px` from 640px, and `32px` from 1024px.
- The global header is `56px` tall.
- Major page sections have `80px` vertical separation on desktop and `56px` on mobile.
- Related panels are separated by `24px`; dense control groups by `8px`.
- Keep the recommendation and its confidence/provenance summary within the first desktop viewport after a query.

Whitespace creates hierarchy; boxes do not. A section does not need a card merely because it has a heading.

## 6. Surfaces, borders, radii, and shadows

- Default border: `1px solid var(--border)`.
- Strong divider: `1px solid var(--input)`.
- Focus ring: `3px solid var(--ring)` with a `2px` background-colored offset.
- Small radius: `6px` for buttons, inputs, chips, and tooltips.
- Panel radius: `10px` for dialogs, drawers, and the task composer.
- Pill radius: `999px` only for compact status labels or segmented-control rails.
- Shadows are exceptional. Inline cards and tables use none. Floating popovers may use `0 8px 24px rgb(0 0 0 / 0.12)` in light mode and `0 12px 32px rgb(0 0 0 / 0.35)` in dark mode.

Avoid glassmorphism, blurred decorative blobs, gradients, oversized radii, and stacked drop shadows. The selected recommendation may use a `2px` accent border or an accent top rule; do not make it glow.

## 7. Core controls

### Buttons

- Default height: `36px`; compact chart controls: `28px`; large submit action: `44px`.
- Horizontal padding: `12px` default, `16px` large.
- Primary button: foreground text on a solid accent background.
- Secondary button: transparent or surface background with a border.
- Tertiary button: no border until hover; reserve for reversible navigation actions.
- Destructive button: negative text/border; solid negative only inside a confirmed destructive flow.
- Icons are `16px` default and never stand alone unless the accessible name is explicit.

Button copy begins with a verb: `Find a route`, `Compare evidence`, `Show trials`. Avoid `Submit`, `Learn more`, and unexplained icon buttons.

### Task composer

The task composer is the product's primary input, not a search-bar ornament.

- It is a bordered panel with a plain-language prompt, multiline input, and visible example.
- Minimum textarea height is `132px`; it grows to `280px` before scrolling.
- Model constraints, confidence target, budget, latency, and environment live in a collapsible `Constraints` row below the task text.
- The action `Find just enough` is visible without opening constraints.
- On submit, preserve the user's exact task text and show parsing/retrieval progress nearby.
- Do not use placeholder text as the only label.

### Segmented controls

Use segmented controls for mutually exclusive views such as `Cost / Latency / Tokens / Steps`, not for independent filters. The rail is muted, `28–32px` high, and the active segment uses a surface fill plus border. The current value must be conveyed by `aria-pressed` or a radio group, not color alone.

### Filters and chips

Filters remain compact and reversible. A filter button displays its active count. Selected chips include an explicit remove control. More than five filters should use a popover or drawer rather than wrapping multiple rows above the evidence.

### Confidence badge

Confidence is never a color-only badge. Render a concise label plus coverage, for example:

`Moderate confidence · 17 similar cases · evidence v2026.07`

The badge opens the methodology/provenance panel. Do not map confidence to fake precision such as `87%` unless the value is statistically defined and calibrated.

## 8. Recommendation grammar

Every result uses the same three-part comparison:

1. **Too weak** — the nearest cheaper/faster configuration that fails the user's reliability target.
2. **Just enough** — the least costly eligible configuration supported by the current evidence.
3. **Overkill** — the nearest more expensive configuration with little or no expected task benefit.

The “just enough” column is visually primary and appears first on narrow screens. Each configuration shows, in this order:

1. Model and effort level
2. Recommendation state
3. Estimated success range and evidence confidence
4. Expected cost and latency range
5. Agent/harness/tool assumptions
6. One-sentence rationale
7. Link to similar cases and raw trials

Never describe the middle route as “best” without a named objective. It is “just enough for the selected confidence, cost, latency, and environment constraints.”

## 9. Tables

- Headers are `12px`, medium weight, and remain sticky in long result sets.
- Text columns align left; numeric columns align right and use mono tabular numerals.
- Rows are at least `44px` tall; task-title rows may grow naturally.
- Prefer hairline row dividers to zebra stripes. A hover background may use `var(--muted)`.
- Sort direction is visible, keyboard operable, and announced to assistive technology.
- Units appear in headers (`Cost / run`, `Latency p50`) or values, never implied.
- Missing values render as `—` with an accessible explanation, not `0`.
- Trial counts and uncertainty stay adjacent to aggregate rates.
- Selecting a row opens a stable detail page or drawer; do not hide the only detail behind hover.

On narrow screens, preserve comparison integrity. Either use deliberate horizontal scrolling with the first column sticky, or transform each row into a labeled definition list. Never silently remove cost, uncertainty, or provenance columns.

## 10. Charts

The primary visualization is the **Just Enough frontier**: empirical success or confidence on the vertical axis, with the currently selected economy dimension (cost, latency, output tokens, or steps) on the horizontal axis.

- Directly label important points when space allows; do not force legend-to-mark lookup for the recommendation.
- Render the selected configuration with the accent plus an outlined halo; observed pass/fail uses positive/negative.
- Draw the eligibility threshold and Pareto frontier explicitly.
- Label both axes and their units. Start axes at meaningful baselines, and mark truncated domains.
- Tooltips appear on hover and keyboard focus, remain within the viewport, and include model, effort, sample size, estimate, interval, benchmark, and snapshot.
- Provide a text summary and accessible data table directly after every chart.
- Avoid 3D charts, pie charts for comparisons, decorative area fills, and smoothed curves that imply unmeasured values.
- Do not compare model points from incompatible benchmark versions without an explicit warning and visual break.

Small multiples are preferred when benchmark suites or environments differ. Aggregation must never visually erase source disagreement.

## 11. Page anatomy

### Global frame

1. `Skip to content`
2. Header: JustEnough wordmark, `Explore`, `Evidence`, `Method`, snapshot/status, theme control
3. Main content
4. Footer: evidence snapshot, API/schema version, source credits, repository link

The wordmark is plain text. A small spoon, bowl, or three-tick gauge may become a later brand asset, but the interface must not depend on a mascot to feel complete.

### Home / query page

1. Brand line: `No smarter than necessary.`
2. One-sentence product explanation
3. Task composer
4. Constraint summary
5. Example tasks, presented as real actions rather than testimonials
6. Compact evidence coverage strip: suites, cases, models, snapshots
7. Method/provenance note

Avoid a conventional SaaS hero with mockup art, logo clouds, testimonials, pricing cards, or multiple competing calls to action.

### Result page

1. Parsed task summary with an `Edit` action
2. Recommendation grammar: too weak / just enough / overkill
3. Confidence, coverage, and assumptions
4. Just Enough frontier
5. Similar evidence cases
6. Model-by-case trial table
7. Missing obligations / mismatch warnings
8. Methodology and source provenance

### Evidence-case page

1. Case title, suite, version, repository/language/environment
2. Normalized task facets and required capabilities
3. Original prompt and verifier summary
4. Per-model, per-effort trials
5. Cost/latency/tokens/steps where available
6. Source links and ingestion timestamp
7. Data-quality warnings

Raw material stays reachable, but long prompts, logs, and code render collapsed by default.

## 12. Responsive behavior

Breakpoints are content-driven; use the following defaults:

- `< 640px`: one column, 16px gutters, mobile ordering.
- `640–1023px`: flexible two-column panels where each remains at least 280px wide.
- `>= 1024px`: full three-route comparison and side-by-side chart/summary layouts.

On mobile:

- Show `Just enough` first, then `Too weak`, then `Overkill`.
- Collapse global navigation behind one labeled `Menu` control; keep evidence snapshot visible.
- Allow chart panning only when a usable single-column representation is impossible.
- Use a bottom sheet for filters and provenance; dialogs must not exceed the viewport.
- Retain 44px touch targets even when visual controls are compact.

At 200% browser zoom, content must reflow without lost controls or two-dimensional page scrolling, except intentional data-table regions.

## 13. Accessibility

Meet WCAG 2.2 AA as a minimum.

- Body text and icons require at least 4.5:1 contrast; large text and non-text UI require at least 3:1.
- Validate these proposed OKLCH tokens in the implemented browser themes; adjust token lightness rather than component-local colors if a pair fails.
- All interactions are keyboard accessible with a visible focus state.
- Use native landmarks, headings, labels, buttons, tables, and radio groups before ARIA.
- Every state encoded by color also uses text, iconography, shape, or line style.
- Announce retrieval progress and completed recommendations with a polite live region; do not repeatedly announce chart hover state.
- Tooltips and popovers open on focus as well as hover and are dismissible with Escape.
- Charts include a concise prose insight and a data-table equivalent.
- Respect `prefers-contrast`, `prefers-reduced-motion`, operating-system color scheme, and user-selected theme.
- Do not autofocus the task composer on mobile. Preserve focus after async updates.
- Errors identify the field, explain the problem, and suggest a recovery action.

## 14. Motion and feedback

Motion explains state change; it does not add personality by itself.

```css
--duration-fast: 100ms;
--duration-base: 160ms;
--duration-slow: 220ms;
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

- Use `100–160ms` for hover, focus, segment, and tooltip transitions.
- Use up to `220ms` for drawers, disclosure, and result reordering.
- Animate opacity and transform; avoid layout-heavy height animation for large evidence sections.
- A result point may move between chart positions when the metric changes, but the axes and labels must update synchronously.
- Loading uses stable skeleton geometry or textual progress such as `Comparing 113 cases…`; avoid indefinite full-page spinners.
- With reduced motion, remove transforms and animate only instant/brief opacity changes.
- Do not use bounce, confetti, pulsing recommendation cards, typewriter text, or auto-advancing content.

## 15. Voice and copy

Voice is concise, candid, and faintly cheeky. The system sounds like a careful engineer who dislikes waste.

### Preferred copy

- `This should do.`
- `Just enough for a 90% confidence target.`
- `Likely too weak: 4 of 11 close cases passed.`
- `Overkill by about $7.20 per run.`
- `We found 17 close cases across 3 suites.`
- `Not enough evidence yet.`
- `Cheaper, but the evidence gets thin.`
- `Same outcome. More tokens.`
- `Show your work` for opening evidence/provenance.

### Avoid

- `The ultimate AI model router`
- `Revolutionary`, `magical`, `supercharge`, or `unlock`
- `Best model` without a stated objective
- `Guaranteed` unless it is literally guaranteed by a deterministic constraint
- Competitive ridicule, anthropomorphized model intelligence, or jokes about failed user tasks
- Fake exactness such as `92.37% confidence` when the evidence supports only a qualitative tier

Use sentence case everywhere. Prefer concrete nouns and verbs: `cases`, `trials`, `passed`, `cost`, `latency`, `matched`, `excluded`.

## 16. Component inventory

Build these primitives before page-specific variations:

- `AppShell`
- `SiteHeader`
- `Section` and `SectionHeading`
- `TaskComposer`
- `ConstraintBar`
- `SegmentedControl`
- `FilterMenu` and `FilterChip`
- `Metric` and `MetricDelta`
- `RecommendationComparison`
- `RouteCard`
- `ConfidenceBadge`
- `CoverageNotice`
- `FrontierPlot`
- `EvidenceTable`
- `TrialMatrix`
- `ProvenanceDrawer`
- `EmptyState`, `LoadingState`, and `ErrorState`

Each component must support light/dark themes, keyboard operation, loading, empty, error, and missing-data states where applicable. Story or example pages should demonstrate long model names, large costs, zero results, mixed benchmark versions, and narrow viewports.

## 17. Explicit do / don't

| Do | Don't |
|---|---|
| Lead with the selected route and the evidence threshold | Lead with a generic global leaderboard |
| Show model and effort as one execution configuration | Treat effort as hidden model metadata |
| Display sample size, interval, suite, and snapshot near a claim | Present one benchmark score as universal capability |
| Use warm neutral surfaces and reserve yellow for the selection | Wash the entire page in the brand accent |
| Use thin rules, direct labels, and whitespace | Put every section in a floating rounded card |
| Keep metrics mono, aligned, and unit-labeled | Mix proportional numerals or hide units in tooltips |
| Explain why evidence is weak or incompatible | Force a recommendation when retrieval should abstain |
| Let users reach source cases and raw trials | Summarize evidence into an uninspectable score |
| Reflow tables deliberately on mobile | Silently drop cost, confidence, or provenance columns |
| Be dryly funny in headings and summaries | Put jokes in errors, warnings, methodology, or raw data |

## 18. Implementation and review rules

1. Map these tokens into the Tailwind theme and expose them as CSS variables. Components use semantic utility names such as `bg-surface`, `text-muted-foreground`, and `border-border`.
2. Keep structural styles colocated with components; keep semantic tokens and global typography in one theme file.
3. Prefer Radix/shadcn-style accessible primitives for behavior, but restyle them to this document rather than accepting default rounded-card aesthetics.
4. Use custom SVG for small and medium charts; move to Canvas only after measured SVG performance problems. Preserve an HTML table equivalent either way.
5. Test every screen in light and dark mode at 320px, 768px, 1024px, and 1440px widths, plus 200% zoom.
6. Run automated accessibility checks, then manually verify keyboard order, focus restoration, tooltip access, chart summaries, and contrast.
7. Any new literal color, arbitrary spacing value, shadow, gradient, or radius requires a design-system update rather than a one-off exception.

## 19. Reference provenance

Observed from the live DeepSWE production site on 2026-07-13:

- [DeepSWE home and leaderboard](https://deepswe.datacurve.ai/)
- Production stylesheet inspected: `https://deepswe.datacurve.ai/assets/app-BYAebmrR.css` (asset hashes may change)
- Direct observations include a 4px spacing base, system sans and Google Sans Code stacks, semantic light/dark themes, low-chroma shell colors, thin borders, small radii, tabular numerals, compact controls, wide centered layouts, and separate tokens for pass/fail, model families, languages, and verdict categories.
- The descriptions “computational editorial,” “quiet research instrument,” and the inferred design intent are our interpretation, not language claimed by DeepSWE.

DeepSWE is a reference, not a dependency. If its visual language changes, this document remains the JustEnough source of truth until intentionally revised.
