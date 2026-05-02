# ALD Buddy — Social Stories Feature Spec

## Context
Adding a Social Stories feature to the existing ALD Buddy app. Read the
existing codebase thoroughly before writing any new code — this feature
must reuse existing components, patterns, and libraries wherever possible.

Social Stories are short illustrated narratives used by primary school
teachers to help students (often with autism or other learning needs)
understand social situations, routines, and expectations. They are created
by teachers and used with individual students.

This feature sits alongside the existing ALD Boards feature — same app,
same nav, separate section. Follow all patterns already established in the
codebase.

## What a Social Story is (implementation context only)
- A sequence of pages, each containing one image and one sentence of text
- Read like a picture book — one concept at a time
- Written in first or third person, positive tone
- The teacher writes the sentences freely — the app imposes no guidance,
  labels, prompts, or constraints on how sentences are written
- Images are typically photos of the actual child or environment (uploaded),
  or ARASAAC pictograms as a fallback

## Core user flow
1. Teacher opens the app, sees "Social Stories" in nav alongside "Boards"
2. She sees her saved stories (if any) and a "New Story" button
3. She gives the story a title and the student's name (both editable later)
4. She adds pages one at a time. Each page has:
   - One image (photo upload shown first, ARASAAC search as secondary tab)
   - One sentence of text
5. She can reorder pages by drag-and-drop
6. Story auto-saves (same pattern as boards)
7. She opens the print composer to download a PDF

---

## Stack — reuse existing code

Before writing anything, read the existing codebase and identify:
- The Dexie schema and how boards are stored and queried
- The ArasaacPicker component and how it's used
- The image upload and compression logic
- The PDF export code (jsPDF + html2canvas dynamic imports)
- The routing and nav pattern
- Any existing drag-and-drop dependencies

Show me what you find and which existing components you plan to reuse
before writing any new code. Do not duplicate existing logic.

---

## Storage model

Add a new table to the existing Dexie instance. Do not create a new
database — add to the existing one and handle the version increment
correctly.

```typescript
interface SocialStory {
  id: string;           // uuid
  title: string;
  studentName: string;
  createdAt: number;
  updatedAt: number;
  pages: StoryPage[];
}

interface StoryPage {
  id: string;           // uuid
  sentence: string;
  imageData: string;    // base64 data URL, same pattern as Cell in boards
  imageSource: 'upload' | 'arasaac';
  arasaacId?: number;
}
```

Stories list view should show: title, student name, page count, last
edited date. Support duplicate, rename, and delete — same as boards.

---

## Story editor

When she opens a story:
- Title and student name shown at top, editable inline
- Vertical list of pages in order, each showing image thumbnail and
  sentence text
- Drag handle on each page for reordering
- Use @dnd-kit/sortable if it's already a dependency. If not, check
  if the boards feature uses any drag-and-drop. If nothing is installed,
  add @dnd-kit/sortable — it's the lightest option.
- "Add page" button at the bottom of the list
- "Download PDF" button that opens the print composer

When she clicks a page to edit it, open a modal or panel (match the
pattern used in the board cell editor) with:
- Two tabs: "Upload photo" (default, shown first) and "Search ARASAAC"
  Upload is the primary tab because personalised photos are more
  effective than pictograms for Social Stories
- A single text field for the sentence — large, comfortable to type in,
  no character limit, no guidance, no labels of any kind
- Auto-saves on close

---

## Print composer

The PDF export is not a simple linear dump of one story. It is a print
composer that lets the teacher select pages from any of her stories,
in any order, and compose them into a single print-ready PDF.

### Opening the composer
She clicks "Download PDF" from anywhere in the Social Stories section
(either from the story list or from within a story editor). The composer
opens as a full-screen modal or a dedicated view.

### Composer UI
The composer has two columns or sections:

**Left: available pages**
- Shows all her stories, each expandable to show their pages
- Each page shows its image thumbnail and sentence text
- She can click a page to add it to the print run, or drag it across
- Stories and pages are labelled clearly (story title + page number)

**Right: print run (selected pages in order)**
- Shows the pages she has selected, in the order they will print
- Each entry shows thumbnail, sentence, and which story it came from
- She can reorder by drag-and-drop
- She can remove individual pages
- An optional "Add cover page" button that adds a cover page entry
  she can fill in with a title and student name — useful when printing
  a single complete story. Not added by default since she may be mixing
  stories.

**Settings panel (above or beside the print run)**
Three settings, chosen each time she downloads:

1. **Pages per sheet:** 1, 2, 3, or 4
   Each "slot" is one image + one sentence pair.
   - 1 per sheet: one pair fills a full A4 portrait page
   - 2 per sheet: two pairs stacked vertically on one A4 portrait page
   - 3 per sheet: three pairs stacked vertically on one A4 portrait page
   - 4 per sheet: four pairs stacked vertically on one A4 portrait page
   At higher densities, images will be smaller — acceptable tradeoff.

2. **Font:**
   - "Standard" — the app's existing font (Inter or system-ui)
   - "Queensland School" — Edu QLD Beginner from Google Fonts
     (https://fonts.google.com/specimen/Edu+QLD+Beginner)
     This is the standardised font used in Queensland primary schools.

3. **Font size:** Small / Medium / Large / Extra Large
   Map these to concrete pt values that scale sensibly with the chosen
   pages-per-sheet setting. Document the mapping in a comment.
   Example: at 1 per sheet, Large = 24pt. At 4 per sheet, Large = 14pt.
   Use your judgement and adjust if the output looks wrong.

**Download button**
Generates and downloads the PDF. Show a loading/generating state while
it runs — PDF generation with multiple images can take a few seconds.

### PDF structure
- Cover page (only if she added one): title centred, student name below,
  clean and printable, no garish decoration
- Content pages: pairs laid out according to pages-per-sheet setting
- Each pair: image centred in upper portion of its slot with padding,
  sentence text below in chosen font and size, centred
- Subtle border or dividing line between slots when multiple per sheet
- No sentence numbers, no labels, no watermarks
- ARASAAC attribution footer on the last page, only if any selected
  pages contain ARASAAC images (same footer text as existing board PDFs).
  User-uploaded images are exempt but footer still appears if even one
  ARASAAC image is present.

---

## Font loading and embedding

### Loading Edu QLD Beginner
Load via @fontsource/edu-qld-beginner if available on npm, otherwise
via a Google Fonts CSS import. Check npm first.

### Embedding in PDF — this is the highest-risk part
jsPDF requires fonts to be embedded as base64. Two approaches, in order
of preference:

**Option 1 — jsPDF font embedding:**
1. Convert the Edu QLD Beginner woff2/ttf file to base64 at build time
   or load and convert at runtime before PDF generation
2. Register with jsPDF using addFileToVFS and addFont
3. Set the font before rendering text in the PDF
4. Test that the rendered PDF actually shows the Queensland font, not a
   fallback — do not assume it works

**Option 2 — html2canvas fallback:**
If Option 1 proves unreliable (silent fallback to a generic font, or
garbled characters), render the story pages as styled HTML, capture them
with html2canvas, and embed the canvas output as images in the PDF. This
guarantees the font renders correctly because the browser handles it.
Tradeoff: larger file size, slower generation, text is not selectable
in the PDF.

Recommend an approach before implementing, explain the tradeoff, and
explicitly test the output. If you go with Option 1 and the font does
not render correctly in the output PDF, fall back to Option 2 without
me having to ask.

---

## Navigation and routing

Add "Social Stories" to the existing navigation alongside "ALD Boards".
Follow whatever routing pattern is already in place exactly — do not
introduce a new routing library if one is not already present.

The nav entry should be labelled "Social Stories" not "Stories" to be
unambiguous.

---

## Build approach — follow this order

**Step 1 — Read and report**
Read the existing codebase. Before writing a single line of new code,
tell me:
- What Dexie version and schema are currently in use
- Which existing components can be reused (ArasaacPicker, image upload,
  PDF export, etc.) and where they live
- What drag-and-drop library if any is already installed
- What routing pattern is in use
- Any naming conventions or patterns I should be aware of
Stop here and wait for my confirmation before proceeding.

**Step 2 — Storage layer**
Add the SocialStory Dexie table, handle the version increment, add
TypeScript types. Test that the schema migration doesn't break existing
boards data.

**Step 3 — Stories list view**
Mirror the boards list view pattern. CRUD operations: create, rename,
duplicate, delete.

**Step 4 — Story editor and page editor**
Vertical page list, drag-to-reorder, page editor modal.

**Step 5 — Print composer UI**
The two-panel layout for selecting and ordering pages. Settings panel.
No PDF generation yet — just the UI and state management.

**Step 6 — PDF generation**
Wire up the actual PDF output. Handle font loading and embedding.
Test the output explicitly.

**Step 7 — Navigation**
Add to nav, wire up routing.

**Step 8 — Verify**
Run `npm run build`. Confirm no TypeScript errors. Confirm existing
boards feature still works. Summarise all new files and changed files.

Stop and check in after Step 1 and after Step 5 before continuing.

---

## Hard constraints
- No sentence type labels, guidance, prompts, or ratio enforcement of
  any kind — teachers are professionals
- No sharing or cloud sync
- No audio or video
- No AI-generated content
- No new routing library if one is not already present
- Do not touch the existing boards feature code except to reuse
  components from it
- Do not duplicate any existing component — import and reuse
