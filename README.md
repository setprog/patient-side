# CarePath — patient app

React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui (new-york). Mobile-first, light and dark mode.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
npm run preview    # serves the production build
```

Log in with the pre-filled demo account. The app stores its demo data in the browser's localStorage. **Profile → Reset demo data** starts it over.

## Project layout

```
src/
  main.tsx                  ThemeProvider (light / dark / system) + App
  App.tsx                   screen router, bottom tab bar, toasts
  index.css                 Tailwind v4 + shadcn theme tokens (:root and .dark)
  data.ts                   sample care plan, readings, meals, messages, helpers
  store.tsx                 app state (React context + localStorage), derived values
  components/
    ui/                     shadcn/ui components (added with the shadcn CLI)
    theme-provider.tsx      from the official shadcn Vite template
    pickers.tsx             DatePicker (Popover + Calendar), TimeSelect (Select)
    app-parts.tsx           top bar, task row, list row, field, readings chart
  screens/
    home.tsx                login, home, today's plan, task sheet
    plan.tsx                care plan (tabs), goals
    track.tsx               track hub, meal diary, health readings, exercise
    forms.tsx               add meal, add reading, log exercise, check-in
    social.tsx              messages, doctor chat, group, notifications, profile
```

## shadcn/ui

`components.json` is set up, so you can add more components with the CLI:

```bash
npx shadcn@latest add dialog dropdown-menu
```

The app uses these components: button, card, input, textarea, label, badge, progress, separator, avatar, alert, select, popover, calendar, switch, checkbox, tabs, toggle, toggle-group, sheet, alert-dialog and sonner.

The components are unchanged from the shadcn registry, except for a few patient-friendly adjustments:

- **Larger touch targets.** Buttons, inputs, select triggers, toggles and tab lists are 44px tall (`h-11`) instead of 36px.
- **Base-size text in form fields.**
- **Tighter card padding** (`px-4 py-4`) for phone screens.
- **New `Badge` variants:** `success`, `warning`, `danger` and `muted`.
- **New `Alert` variants:** `info` and `warning`.
- **Sonner theme.** Sonner reads the theme from `theme-provider` instead of `next-themes`.

The status colors (`--success`, `--warning`, `--danger-soft`) and the chart target band (`--band`) are extra tokens in `src/index.css`.
