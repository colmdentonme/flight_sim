# FBW A380X SOP Checklist (PWA)

An installable, offline-capable checklist for the FlyByWire A380X, transcribed directly from
the community "FBW A380X Full SOP Checklist" PDF. Content and ordering match the source exactly,
aside from a handful of obvious spelling corrections (e.g. "Simbreif" → "Simbrief") — see
`data/checklist.json` for the full transcription. Built for use on an iPad (Mini and up) in the
cockpit, in place of the flat PDF.

- Plain HTML/CSS/JS, no build step, no framework, no external runtime dependencies.
- Works fully offline once installed (service worker caches the app shell).
- Linear phase-by-phase flow (Cockpit Prep → ... → Securing the Aircraft) with a menu to jump
  to any phase directly.
- Checked-item progress is saved to the device (`localStorage`) so a reload mid-flight doesn't
  lose your place. Use the reset button (top right) to clear everything before a new flight.
- The checklist content lives entirely in [`data/checklist.json`](data/checklist.json) — to
  correct a transcription error or adapt this for a different aircraft's SOP, edit that file;
  the app renders whatever is in there.

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
