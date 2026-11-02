# UI conventions (Tailwind v4 + HeroUI v3)

The app is styled with Tailwind utility classes and HeroUI v3 components (`@heroui/react` 3.2.6, pinned). `app/globals.css` holds the theme, a few base element styles, the hardware-control looks (`.hw-btn`, `.hw-pad`, `.hw-led`, `.hw-seg`, `.hw-lcd`: gradients, 3D borders and glows that utilities can't express), the CodeMirror flash keyframes and the ⌘-dictionary underline. Nothing else is component CSS.

## Two kinds of surface

- **Page chrome** (header, Learn, Library, Reference, Dictionary, dialogs, menus, the sandbox's project bar and block list): HeroUI components on the light/dark theme below.
- **Instrument panels** (transport, block modules, mixer strips, arrangement): always dark, like a drum machine's face, built from `components/hw`. Wrap one in `HW_SURFACE` (from `components/hw/Displays`): it adds the `dark` class, so any HeroUI component inside (selects, inputs, tooltips) renders in dark colours whatever the page theme.

## Hardware controls (`components/hw`)

All of them write code the same way the old sliders did (on release, on a keyboard step, or when a value is typed), and every one shows its number.

- **`Knob`**: a rotary for a number (`min`/`max`/`step`, `log` for frequencies, `bipolar` draws the arc from the centre, `defaultValue` for double-click reset). Drag up/down, ⇧ for fine, arrow keys step, Enter opens the readout. Built on React Aria's `useSliderState` + `useMove`, so it is a slider to assistive tech. `unit` picks the readout format (`hz` → "2.5k", `pan` → "L20", `seconds` → "200ms"); the same text can be typed back.
- **`Fader`**: a vertical level control (mixer strips), `useSlider` with a track.
- **`Readout`**: the amber number under a knob or fader; click or Enter turns it into a text field, Enter commits, Esc cancels. Dimmed when the value is the default.
- **`SlideSwitch`** for up to five fixed choices (filter type, Steps/Mini), **`ToggleSwitch`** for on/off. Longer lists stay `SimpleSelect` with `triggerClassName={LCD_TRIGGER}` (from `components/blocks/StepGrid`) so the trigger is a small LCD.
- **`HwButton`**: a raised push button, optional `led` and `keys` (shortcut hint). `SmallButton` in `components/blocks/SoundControls` is the compact one for modules.
- **`SegDisplay`** (seven-segment digits), **`Lcd`** (green text line; `tone="purple"` for custom code, `"amber"` for warnings), **`Led`** / **`StatusLeds`**, **`BeatLeds`**, **`Caption`** (the small uppercase label under a control).
- **Step pads** live in `components/blocks/StepGrid`: `.hw-pad` with `--pad` set to one of `PAD_COLORS` (the 909's four beat colours), `data-on` lights the LED, the playing step gets a white outline.

Colours for all of this are the `hw-*`, `led`, `go`, `hot`, `lcd` and `pad-1…4` tokens in `globals.css` (`bg-hw`, `text-hw-muted`, `border-hw-line`, `text-led`…).

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
- **Sliders**: on instrument panels use `Knob`/`Fader` (above). Elsewhere HeroUI `Slider` with `Slider.Track`/`Slider.Fill`/`Slider.Thumb` (+ `Slider.Output`); give it `className="w-full"` (or a width) or it collapses, and use `onChangeEnd` to write code on release.
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
