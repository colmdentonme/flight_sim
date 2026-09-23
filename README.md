# Flight SOP Checklists (PWA)

An installable, offline-capable library of interactive aircraft checklists, for use on an
iPad (Mini and up) in the cockpit, in place of a flat PDF. Opening the app shows a landing page
listing each aircraft and, under it, the checklist documents available for that aircraft; tapping
one opens it.

- Plain HTML/CSS/JS, no build step, no framework, no external runtime dependencies.
- Works fully offline once installed (service worker caches the app shell).
- Landing page groups checklists by aircraft, each with its available documents (e.g. an
  expanded SOP flow and/or a short Quick Reference / Normal Checklist). Tap one to open it, or
  use the "Home" link in the phase menu to come back.
- Linear phase-by-phase flow per document (Cockpit Prep → ... → Securing the Aircraft) with a
  menu to jump to any phase directly.
- Checked-item progress is saved per document to the device (`localStorage`) so a reload
  mid-flight doesn't lose your place. Use the reset button (top right) to clear the current
  document's progress before a new flight.
- Light theme by default (navy-on-white, in the style of Airbus/Boeing's own corporate sites)
  for daytime/ground-ops legibility, with a dark "night mode" a tap away (sun/moon icon, top
  right) for cockpit use after dark — the same day/night split real EFB apps like ForeFlight
  ship. Your choice is remembered on the device.
- Search (magnifying-glass icon, top right) finds any item across the whole open document by
  challenge, response, or note text, and jumps straight to it with a momentary highlight.
- Text size control (bottom of the phase menu) — Small/Default/Large — another thing real EFB
  apps all offer, since cockpit viewing distance and lighting vary a lot.
- The home page shows a "Continue" card for whichever document you last made progress in, so
  reopening the app after a break doesn't mean re-navigating from the aircraft list every time.

## Content

**FBW A380X:**

- **Expanded SOP** — transcribed directly from the community "FBW A380X Full SOP Checklist" PDF.
  Content and ordering match the source exactly, aside from a handful of obvious spelling
  corrections (e.g. "Simbreif" → "Simbrief").
- **Quick Reference** — the short, read-aloud Normal Checklist, converted from FlyByWire
  Simulations' own aircraft repo
  ([`flybywiresim/aircraft`](https://github.com/flybywiresim/aircraft), GPL-3.0 — the actual
  data their in-sim EFB checklist page uses). Credit: FlyByWire Simulations.

**PMDG 737-800:**

- **Quick Reference** — transcribed from a community "Boeing 737-800 Normal Checklist" PDF
  ([bluemarble.ch](https://bluemarble.ch/files/b737/B737NG_NORMAL_CHECKLIST.pdf)). Real Boeing
  737-800/NG QRH content and format; not PMDG-branded, but directly applicable since PMDG's
  737-800 closely simulates the real aircraft. One header typo ("CHECLIST") corrected; the
  closing "Airport Bar Checklist" is a well-known community in-joke, kept verbatim.
- **Expanded Checklist** — transcribed from Carsten Rau's "Boeing 737 NG Checklist +
  Flow-Procedure" PDF ([hweistra.nl](https://www.hweistra.nl/Checklist-737-PMDG-737NGX.pdf)),
  written for the FSX-era PMDG 737NGX. The real aircraft flow/switch content was transcribed
  faithfully; simulator/multiplayer-session-specific instructions from that legacy setup
  (starting an FSX flight, an old VATSIM voice-client's connection/transponder steps, ATC
  hand-off reminders, keyboard shortcuts, a third-party flight-planning tool) were left out, as
  agreed with the user, since they don't apply outside that specific setup and would otherwise
  read as current instructions. The source PDF's fuel-planning reference tables (not checklist
  content) weren't included either. Marked "DO NOT USE FOR FLIGHT" by its original author —
  simulation use only, same as everything else in this app.
- Like the A380X, most Expanded Checklist phases link to the matching Quick Reference phase
  (`linkedReference` in `pmdg738.json`) — mapped by phase correspondence between the two
  documents rather than an explicit "run the checklist" phrase in the source, since this source
  doesn't call one out the way the A380X SOP does.

**PMDG 777F:**

- **Quick Reference** — transcribed from a real Boeing 777 Normal Checklist PDF
  ([flyuk.aero](https://flyuk.aero/assets/downloads/resources/checklists/UKV-PRD-B777-CHECKLIST-V2.pdf),
  `UKV-PRD-B777-CHECKLIST-V2`). Not PMDG-branded, but directly applicable. As the 777F is a
  freighter with no passenger cabin, passenger-specific items in the source (passenger signs,
  cabin lights, IFE/pass seats, cabin/utility power) were left out rather than invented for a
  configuration the source doesn't cover; everything else kept exactly as sourced. A short
  virtual-airline flight-prep intro (weather/NOTAM download, VATSIM/IVAO flight-plan filing, a
  tracking tool) at the top of the source, not itself checklist content, wasn't included.
- **Expanded Checklist** — transcribed from "PMDG Boeing 777 Flows" by FilbertFlies
  (filbertflies.com), a 2024 PMDG-777-specific flow document credited to a real-world pilot. Its
  electronic-checklist trigger points (the 777's own EICAS `CHKL` synoptic page) are a real
  aircraft feature and are kept faithfully, each linking to the matching Quick Reference phase.
  Passing references to Simbrief/GSX (third-party tools) were left out. Written for the
  passenger 777-300ER — PMDG's 777F shares the same flight deck and systems, so this transfers
  directly, except the same passenger-cabin items excluded from the Quick Reference above were
  also removed here for consistency (no freighter-specific source was found, so nothing
  cargo-specific was invented beyond what's here).

**Fenix A320 CEO** (classic engine option, not NEO):

- **Quick Reference** — converted from FlyByWire Simulations' own aircraft repo
  ([`flybywiresim/aircraft`](https://github.com/flybywiresim/aircraft), GPL-3.0), the same
  in-sim EFB checklist data already used for the A380X's Quick Reference. Published under their
  A32NX (NEO) product, but the content itself is engine-agnostic (no PW1100G/LEAP-specific
  items) and matches the real Airbus A320-family QRH Normal Checklist, so it applies equally to
  the CEO — genuinely concise (42 items) rather than the longer summarised-checklist style used
  elsewhere in this app. Credit: FlyByWire Simulations.
- **Expanded Checklist** — transcribed from "Airbus 320/321 Cockpit Flows" by Eisa Godoussey,
  derived from Aerosoft's "Step by Step" document and explicitly written to be
  aircraft/livery-generic — no NEO-specific content (no PW1100G/LEAP references), so it applies
  cleanly to the CEO. The source itself marks phase-boundary checkpoints (`[--COMPLETE--]`)
  matching real QRH phases, so — like the A380X — most phases link to their Quick Reference
  match on that explicit signal rather than inferred correspondence.

**Clearance calls, in every Expanded Checklist.** The A380X's Expanded SOP explicitly calls out
moments like "OBTAIN AN IFR CLEARANCE" and "OBTAIN PUSH & START CLEARANCE" inline in the flow,
not just in its Quick Reference — the other three aircraft's Expanded Checklists didn't
consistently do the same, since their own source documents weren't as explicit about it. Rather
than inventing new text, the missing clearance-request (and, for Fenix, boarding/loading) items
were pulled verbatim from that same aircraft's own Quick Reference and inserted at the matching
point in its Expanded Checklist.

### Two kinds of checklist, and where to source them

- **Expanded SOP / flow** — long, detailed, performed silently phase by phase. Usually only
  exists as a PDF (official airline SOP, or a community one like the FBW A380X source above), so
  adding one means rendering its pages to images and transcribing it by hand — same process used
  for the A380X SOP (see the git history for that transcription work if you're doing another).
- **Quick Reference / Normal Checklist** — short, read aloud, organized by phase. Airbus/Boeing
  publish these officially but they're copyrighted OEM documents; several open-source cockpit
  projects (like FlyByWire) publish their own equivalent as structured data (JSON/JSON5) in their
  GitHub repos, which can be script-converted directly — no PDF/manual transcription needed. Check
  the project's GitHub repo for a `checklists.json`/`.json5` file before assuming you need a PDF.

### Adding another aircraft or document

1. Add a new file at `data/aircraft/<id>.json` (pick any filename — `<aircraftId>.json` for the
   main SOP, `<aircraftId>-reference.json` for a second document, etc.) with this shape:
   ```json
   {
     "aircraft": "Aircraft Name",
     "source": "where this content came from, and its license if not your own",
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
   that aircraft's own color scheme.
2. Register it in `data/aircraft/index.json`. A new document on an existing aircraft just adds
   another entry to that aircraft's `documents` array; a new aircraft adds a whole new object:
   ```json
   {
     "id": "<aircraftId>",
     "name": "...",
     "subtitle": "...",
     "accent": "#RRGGBB",
     "documents": [
       { "id": "<docId>", "label": "...", "file": "data/aircraft/<file>.json", "phaseCount": N, "itemCount": N }
     ]
   }
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
