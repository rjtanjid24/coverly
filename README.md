# Academic Cover Page Designer

Design professional academic cover pages in seconds. Built for students of Bhawal Badre Alam Government College (BBAGC), Gazipur.

Credit: [Tanjid Shuvro](https://rjtanjid24.github.io/me)

Plain HTML, CSS and JavaScript. No build step, no backend, no accounts, no paid services.

## What is inside

- **Home page** with hero, template gallery, features, how it works, privacy, FAQ and developer credit.
- **Studio** (dashboard): left navigation (bottom bar on phones), settings panel, live A4 preview, export buttons.
- **9 templates:** Classic Academic, Official Seal, Formal University, Modern Minimal, Bold Banner, Practical Notebook, Science & Research, Group Project, Creative Editorial.
- **11 document types** including Excursion Report and Group Project. Fields change with the type.
- **Export:** PDF, JPG and Print.
- **Fonts:** 13 choices with separate body and heading fonts (serif, sans and Bangla fonts).
- **Extras:** watermark text, signature lines, blank lines for empty name/roll/reg., 11 color themes, 5 border styles, Letter/A4/custom size, landscape.
- **Group members table**, saved profiles, duplicate designs, design file download and load.
- **Share with friends:** copies the site link and shows a modal that fades out by itself.
- **Thank you modal** after every download or print.
- **Visitor counter** with Today and Total.
- **Auto-save** of your last draft in the browser, with a Clear saved data button.

Defaults are set for Hasan Shuvro (2021-22, Botany, Biostatistics & Research Methodology 243013), submitted to Dr. Md. Anwarul Islam. Change them in `js/config.js` (`DEFAULT_STATE`).

## Project structure

```
index.html          Home page and Studio
styles.css          App interface styles
templates.css       Cover page styles
js/config.js        College details, fields, colors, fonts, defaults, counter settings
js/templates.js     The nine cover page templates
js/counter.js       Visitor counter (Today and Total)
js/app.js           Routing, studio, preview, export, share, storage
vendor/             html2canvas and jsPDF (bundled, works offline)
assets/             Put the two official logo files here (see below)
```

## Add the official logos (important)

Save these two files in `assets/`:

- `nu-logo.png`  (National University crest)
- `bbagc-logo.png`  (college logo)

Download them from the links in `js/config.js`. If the files are missing the app tries the web links, then falls back to a neutral emblem. Local files are the reliable option because other websites can block images for PDF and JPG export.

## Visitor counter

Counts use the free counterapi.dev service, once per browser per day. The namespace is set in `js/config.js` (`COUNTER.namespace`); change it to your own unique name so your totals are separate. If the service cannot be reached, the counter shows counts for this device only (the dot turns amber). Set `COUNTER.enabled` to `false` to hide it.

## Run locally

```
cd cover-page-designer
python3 -m http.server 8000
```

Open http://localhost:8000 . Serve over http so exports can read the logos; double-clicking `index.html` works for previewing only.

## Deploy

- **GitHub Pages:** push the folder, then Settings > Pages > Deploy from branch > `main` / root.
- **Netlify:** drag the folder onto app.netlify.com/drop.
- **Vercel:** import the repository, framework "Other", no build command, output directory is the root.

## Notes

- PDFs and JPGs are high-resolution images of the page, so text in the PDF is not selectable.
- Fonts load from Google Fonts. Offline, the app falls back to Georgia or Times.
- Bengali text works in every field.
- This is a student tool, not an official college website.
