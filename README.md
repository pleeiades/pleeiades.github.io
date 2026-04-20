# ALD Board Maker

A browser-based tool for creating Assisted Language Device (ALD) boards. Search pictograms from ARASAAC, upload your own images, and download print-ready PDFs — all without an account or internet connection after first load.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for production

```bash
npm run build
```

The `dist/` folder is ready to deploy as a static site.

## Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In the [Cloudflare Pages dashboard](https://pages.cloudflare.com/), click **Create a project** → **Connect to Git**.
3. Select your repository.
4. Set the following build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

Cloudflare Pages will rebuild automatically on every push to the main branch.

## Pictogram attribution

Pictograms provided by [ARASAAC](https://arasaac.org) — © Sergio Palao, Government of Aragón, Spain. Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## Licensing and attribution

This app is intended for **non-commercial educational use**.

### App code

The application code is MIT licensed (see `LICENSE`).

### Pictograms (ARASAAC)

Pictograms displayed and exported by this app come from [ARASAAC](https://arasaac.org), created by Sergio Palao for the Government of Aragón (Gobierno de Aragón), and are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

The app handles attribution automatically:
- A credit line appears in the app footer on every screen.
- Every exported PDF includes the attribution in its footer.

**If you fork or redistribute this app**, you must not add commercial features (ads, paywalls, paid subscription tiers) that would place ARASAAC pictograms in a commercial context. The CC BY-NC-SA licence prohibits commercial use.

**If you build a derivative work that includes the pictograms**, that work must also be licensed under CC BY-NC-SA 4.0 and must retain full attribution to Sergio Palao and the Government of Aragón.

### User-uploaded images

Images that users upload themselves are entirely their own work. The CC BY-NC-SA restrictions above apply only to pictograms sourced from ARASAAC, not to user-supplied content.
