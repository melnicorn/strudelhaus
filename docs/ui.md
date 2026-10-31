# UI conventions (Tailwind v4 + HeroUI v3)

The app is styled with Tailwind utility classes and HeroUI v3 components (`@heroui/react` 3.2.6, pinned). There is no component CSS: `app/globals.css` only holds the theme, a few base element styles, the CodeMirror flash keyframes and the ⌘-dictionary underline.

## Theme

`app/globals.css` sets HeroUI's semantic variables to the workshop palette (warm greys, orange accent) for light and dark. Dark mode is the `.dark` class on `<html>`, set from the system setting by a small script in `app/layout.tsx`. Use the semantic Tailwind names, never raw colours:

| Use | Classes |
| --- | --- |
| Page / panel / soft fill | `bg-background`, `bg-surface`, `bg-default` (also `bg-surface-secondary`, `bg-surface-tertiary`) |
| Text | `text-foreground`, `text-muted` |
| Lines | `border-border`, `bg-separator` / `divide-separator` |
| Accent (orange) | `bg-accent text-accent-foreground`, `text-accent`, `bg-accent-soft text-accent-soft-foreground` |
| Play / GUI / passed (green) | `bg-success text-success-foreground`, `text-success`, `bg-success/15` |
| Partial / warning (amber) | `bg-warning/15 text-warning` … |
| Custom code (purple) | `bg-custom/15 text-custom border-custom` |
| Errors | `text-danger`, `bg-danger/10 border-danger` |
| Code areas (always dark) | `bg-code text-code-foreground font-mono` |
| Flash on change | `animate-flash` (re-trigger with a changing `key`) |

`font-mono` is Geist Mono, `font-sans` Geist. Base text is `text-sm` (14px).

## Components

Import from `@heroui/react`. Docs: <https://heroui.com/docs/react/components/…>, or the downloaded copies in the scratchpad (`heroui-docs/components/*.mdx`, `heroui-docs/demos/<component>/*.tsx`).

- **Buttons**: `<Button size="sm" variant="secondary">`. Variants: `primary` (accent orange, the main action), `secondary`, `tertiary` (quiet), `ghost` (no fill), `outline`, `danger`, `danger-soft`. Play is green: `className="bg-success text-success-foreground"`. React Aria buttons use **`onPress`**, not `onClick`. `isDisabled`, not `disabled`. Icon buttons: `isIconOnly` plus `aria-label`.
- **Hover help on buttons**: `TipButton` from `components/ui/TipButton` (a `Button` plus `tip`). React Aria buttons drop `title`, and `TipButton` still shows the tip while disabled, so use it to say why a button is off. In block panels use `SmallButton`/`RemoveButton` (compact TipButtons). Plain non-button elements can keep a native `title`.
- **Toggle sets** (Steps / Mini-notation, filters): `ToggleButtonGroup` + `ToggleButton` (`selectionMode="single"`, `selectedKeys`, `onSelectionChange`). Single on/off: `ToggleButton isSelected onChange`.
- **Selects**: `SimpleSelect` from `components/ui/SimpleSelect` for string values (`value`, `onChange`, `options` or groups, `aria-label`, optional `renderValue` to show a short code in the trigger). Use HeroUI `Select` directly only when you need more.
- **Text / number / search inputs**: HeroUI `Input`, `TextField`, `NumberField`, `SearchField`. Mini-notation inputs stay monospace (`font-mono`).
- **Sliders**: HeroUI `Slider` with `Slider.Track`/`Slider.Fill`/`Slider.Thumb` (+ `Slider.Output`). Give it `className="w-full"` (or a width) or it collapses. Use `onChangeEnd` to write code on release.
- **Checkboxes**: HeroUI `Checkbox`.
- **Chips / status**: HeroUI `Chip size="sm"` (`color="success" | "warning" | "danger" | "accent" | "default"`). Custom-code status: `className="bg-custom/15 text-custom"`.
- **Boxes**: `Panel` from `components/ui/Panel` (flat Card, `title`, `actions`).
- **Helper text**: `Hint` from `components/ui/Hint` (`tone="danger"` for errors).
- **Overlays**: `Drawer` for side panels, `AlertDialog`/`Modal` for confirms, `Tooltip` for hover help, `Kbd` for keys.
- **Layout**: plain elements with utilities. Rows: `flex flex-wrap items-center gap-2`. Stacks: `flex flex-col gap-3`.

Custom widgets (step grid, 303 sequencer cells, degree tracker, piano keys, arrangement matrix, mixer faders) stay as plain elements styled with utilities; HeroUI is for the standard controls around them.

## Rules

- No new CSS classes or CSS files. Put repeated patterns in a small component, not a class.
- Keep every `aria-label`, `id` and `data-*` attribute that code or tests rely on (`data-term`, `data-code`, `aria-label="… step 3"`…).
- Mobile: no horizontal page scroll at 375px wide. Use the standard breakpoints (`md:` 768px, `lg:` 1024px), or `max-[760px]:` where an exact old breakpoint matters.
