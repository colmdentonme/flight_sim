# Flight SOP Checklists (PWA)

An installable, offline-capable library of interactive aircraft SOP checklists, for use on an
iPad (Mini and up) in the cockpit, in place of a flat PDF. Opening the app shows a landing page
listing each installed aircraft; tapping one opens its checklist.

- Plain HTML/CSS/JS, no build step, no framework, no external runtime dependencies.
- Works fully offline once installed (service worker caches the app shell).
- Landing page lists every aircraft checklist available; tap one to open it, or use the "All
  Aircraft" link in the phase menu to come back.
- Linear phase-by-phase flow per aircraft (Cockpit Prep → ... → Securing the Aircraft) with a
  menu to jump to any phase directly.
- Checked-item progress is saved per aircraft to the device (`localStorage`) so a reload
  mid-flight doesn't lose your place. Use the reset button (top right) to clear the current
  aircraft's progress before a new flight.

## Content

Currently included:

- **FBW A380X** — transcribed directly from the community "FBW A380X Full SOP Checklist" PDF.
  Content and ordering match the source exactly, aside from a handful of obvious spelling
  corrections (e.g. "Simbreif" → "Simbrief").

### Adding another aircraft

1. Add a new file at `data/aircraft/<id>.json` with this shape:
   ```json
   {
     "aircraft": "Aircraft Name",
     "source": "where this SOP came from",
     "groups": { "groupId": { "label": "...", "color": "#RRGGBB" }, ... },
     "phases": [
       {
         "id": "phase-id",
         "title": "Phase Title",
         "group": "groupId",
         "items": [
           { "type": "item", "challenge": "SOME SWITCH", "response": "ON" },
           { "type": "action", "text": "A checkable step with no response value" },
           { "type": "note", "text": "Non-checkable informational text (italic)" },
           { "type": "marker", "text": "Small non-checkable caption, e.g. an altitude callout" }
         ]
       }
     ]
   }
   ```
   `group` colors are used for the phase-menu dots and the phase banner — pick whatever fits
   that aircraft's own SOP color scheme.
2. Register it in `data/aircraft/index.json`:
   ```json
   { "id": "<id>", "name": "...", "subtitle": "...", "file": "data/aircraft/<id>.json", "accent": "#RRGGBB", "phaseCount": N, "itemCount": N }
   ```
   `phaseCount`/`itemCount` are just for the landing page card — they don't need to be exact.
3. Optionally add its file path to `APP_SHELL` in `sw.js` so it's precached on install (fully
   offline-ready before it's ever opened); otherwise it's cached automatically the first time
   it's opened with connectivity.

## Run locally

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser. For iPad-sized testing, use your browser's
device emulation (Chrome DevTools / Safari Responsive Design Mode) set to an iPad Mini
viewport, in both portrait and landscape.

## Hosting on GitHub Pages

This repo includes `.github/workflows/deploy.yml`, which deploys the site to GitHub Pages
automatically on every push to `main` (no build step — it publishes the repo as-is).

One-time setup after pushing this repo to GitHub:

1. On GitHub: **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. Push to `main` (or re-run the workflow from the **Actions** tab). The deploy job will publish
   the site and print the live URL.

GitHub Pages serves over HTTPS by default, which is required for the service worker and for
"Add to Home Screen" to install the app as a standalone PWA — no certificate setup needed.

### Installing on iPad

1. Open the deployed GitHub Pages URL in **Safari** on the iPad (Safari is required for iOS PWA
   install support — Chrome/Firefox on iOS can't install PWAs to the home screen).
2. Tap the **Share** icon → **Add to Home Screen**.
3. Launch it from the home screen icon — it opens full-screen, no browser chrome, and works
   with the iPad in Airplane Mode after the first load.

### Alternative hosts

If you'd rather not use GitHub Pages, this is a static site with no build step, so it also
deploys as-is to **Cloudflare Pages** or **Netlify** (both free, both HTTPS by default) — just
point either at this repo with an empty build command and `.` as the output directory.
