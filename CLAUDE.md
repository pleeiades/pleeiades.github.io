# ALD Board Maker — Build Spec

## Context
I'm building this for my mum, a primary school teacher. She wants to create her
own Assisted Language Device (ALD) boards using weekly vocab, print them, and
use them with students. She's not technical. Simplicity beats features.

## The core flow
1. She opens the app. She sees her saved boards (if any) and a "New Board" button.
2. She picks a board size — either a preset grid or a custom rows × columns.
3. She adds vocab words to cells. For each word she can either:
   - Search ARASAAC and pick a pictogram, OR
   - Upload her own image
4. She names the board and saves it. It persists in the browser.
5. She downloads a clean print-ready PDF.

That's the whole app. Don't add extra features unless I ask.

## Stack
- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Dexie.js** (IndexedDB wrapper) for persistence — NOT localStorage, because
  images blow past the quota
- **jsPDF + html2canvas** OR **pdf-lib** for PDF export — pick whichever gives
  cleaner, more predictable output for a grid of images + text. Justify the choice.
- **No backend.** Everything runs client-side so it can deploy as a static site.
- **No auth, no accounts, no cloud sync.**

## ARASAAC integration
- Search endpoint: `https://api.arasaac.org/api/pictograms/en/search/{searchText}`
- Image URL pattern: `https://static.arasaac.org/pictograms/{id}/{id}_500.png`
- Verify these endpoints work before building the UI around them. If the API
  shape has changed, check https://api.arasaac.org/api/docs/ and adapt.
- Language should be English (`en`).
- Debounce search input (~300ms). Show up to ~20 results as a grid of thumbnails.
- When the user picks a pictogram, fetch the image, convert it to a base64 data
  URL, and store that in IndexedDB with the board. This way boards work offline
  after first load and don't break if ARASAAC is ever down.
- Attribution: ARASAAC pictograms are CC BY-NC-SA, created by Sergio Palao for
  the Government of Aragón. Include a small attribution line in the app footer
  and on the printed PDF.

## Board sizing
Presets: 2×2, 2×3, 3×3, 3×4, 4×4, 4×6, 5×5
Custom: user inputs rows and columns (cap at something sensible like 8×8 so
cells don't become unreadable).

Each cell shows:
- Image (pictogram or user-uploaded)
- Word label underneath

When printing, the whole board fits on a single A4 page (landscape if the grid
is wider than tall, portrait otherwise). Maximise cell size within the page.

## Image upload
- Accept PNG, JPEG, WebP
- Client-side resize/compress before storing (max ~500px on longest side, ~80%
  JPEG quality) to keep IndexedDB usage reasonable
- Store as base64 data URL alongside pictograms

## Storage model
Use Dexie with something like:

```typescript
interface Board {
  id: string; // uuid
  name: string;
  rows: number;
  cols: number;
  cells: Cell[];
  createdAt: number;
  updatedAt: number;
}

interface Cell {
  position: number; // 0-indexed, left-to-right top-to-bottom
  word: string;
  imageData: string; // base64 data URL
  imageSource: 'arasaac' | 'upload';
  arasaacId?: number; // for attribution/reference
}
```

Boards list view should show board name, grid size, last edited, and a thumbnail
preview. Let her duplicate, rename, and delete boards.

## UX priorities
- My mum is the user. Big tap targets, clear labels, no jargon.
- When she clicks a cell, it opens an editor with: a word input, a tabbed picker
  (Search ARASAAC | Upload image), and a preview of the cell.
- Saves should feel instant and automatic — no "Save" button for cell edits.
  Only the initial board creation needs a name prompt.
- Show a loading state when searching ARASAAC so she knows something's happening.
- Handle ARASAAC API failures gracefully — if search fails, tell her and offer
  the upload option.

## PDF export
- Button on the board editor: "Download PDF"
- PDF should be print-ready: white background, black borders between cells, word
  label in a clear readable sans-serif (think 18-24pt depending on cell size),
  image centred in each cell with padding so it doesn't touch the borders.
- Board name as a header on the page.
- Small ARASAAC attribution in the footer.

## Code quality expectations
- Keep components small and focused. No 500-line files.
- TypeScript strict mode on.
- Use React Query or SWR for the ARASAAC fetches — gives us caching and loading
  states for free.
- Accessible: proper labels on inputs, keyboard navigation for the board grid,
  alt text on pictogram images using the word.
- Don't over-abstract. This is a small app.

## Deployment
Configure the project so it can deploy to Cloudflare Pages as a static site:
- `npm run build` produces a `dist/` folder ready to serve
- Include a `README.md` with:
  - Local dev instructions (`npm install`, `npm run dev`)
  - Deployment steps for Cloudflare Pages (connect GitHub repo, framework preset
    "Vite", build command `npm run build`, output directory `dist`)

## Out of scope (do NOT build)
- User accounts / login
- Cloud sync across devices
- Board sharing / collaboration
- Backend of any kind
- Custom fonts or theme switching
- Analytics

## Build approach
1. Scaffold Vite + React + TS + Tailwind
2. Verify the ARASAAC API shape with a quick test call — adjust the client if
   the response shape differs from what's assumed above
3. Build the storage layer (Dexie schema + CRUD functions) and test it
4. Build the boards list view
5. Build the board editor (grid + cell editor modal)
6. Build the PDF export
7. Polish, add attribution, write the README

Work incrementally. After each step, tell me what's done and what's next before
moving on. If you hit an ambiguous decision, pause and ask rather than guessing.