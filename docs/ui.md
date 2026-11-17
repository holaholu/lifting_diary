# UI Coding Standards

These rules apply to all UI code in this project. No exceptions.

## Components: shadcn/ui only

- **Only shadcn/ui components may be used to build the UI.** Every button, input, card, dialog, popover, calendar, table, badge, etc. must come from shadcn/ui.
- **ABSOLUTELY NO custom components.** Do not create new components, wrappers, or abstractions around shadcn components, and do not hand-roll UI elements (e.g. a custom `<button>` or styled `<div>` that stands in for a shadcn component).
- If a UI need arises, find the matching shadcn component and use it directly. If none exists, ask before building anything.
- Pages (`app/**/page.tsx`) compose shadcn components directly, with their layout written as plain Tailwind utility classes on elements like `<main>` and `<div>`.

### Adding shadcn components

Install components with the CLI; never copy or write them by hand:

```bash
npx shadcn@latest add <component>
```

Components are generated into `components/ui/` (see `components.json`: style `base-nova`, Base UI primitives, lucide icons). Do not edit the generated files in `components/ui/` except through the shadcn CLI.

### Styling

- Style with Tailwind CSS utility classes and the theme's CSS variables (`bg-background`, `text-muted-foreground`, etc.) so light and dark mode work.
- Use the variants and sizes a shadcn component already provides (e.g. `Button` `variant="outline"`) before adding any class overrides.
- Icons come from `lucide-react`.

## Date formatting: date-fns

All dates shown in the UI are formatted with [date-fns](https://date-fns.org/). Do not use `toLocaleDateString`, `Intl.DateTimeFormat`, or manual string building for display.

Standard display format is ordinal day, abbreviated month, full year (`do MMM yyyy`):

| Date | Output |
| --- | --- |
| 2025-09-01 | 1st Sep 2025 |
| 2025-09-02 | 2nd Sep 2025 |
| 2025-09-03 | 3rd Sep 2025 |
| 2025-09-04 | 4th Sep 2025 |

```ts
import { format } from "date-fns";

format(date, "do MMM yyyy"); // 1st Sep 2025
```

Note: date-fns abbreviates September as `Sep`, not `Sept`. Use `Sep` as that is what `MMM` produces.
