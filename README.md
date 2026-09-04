# IMKON Digital Textbook

One Windows application that replaces "PDF viewer + media player + PowerPoint"
in the classroom: the coursebook page on screen, the book's own audio badges
tappable in place, exercises the class can do together, an answer key for the
teacher, and a pen to draw over any of it. Touch and stylus first, fullscreen,
fully offline.

**Loaded course:** *Life Vision* Intermediate (B1), Oxford University Press —
**Unit 1, "That's entertainment"** (printed pages 8–21), split into its 12
lessons, with all 22 printed audio badges wired up, 26 interactive exercises
and a full answer key.

## Prerequisites

- Node.js 18+ and npm
- Windows 11 for the final `.exe` packaging step; day-to-day development works
  on any OS.
- Python 3.9+ with `pymupdf` (`python -m pip install pymupdf`) — only needed to
  import new units from a PDF.

## Run it

```bash
npm install
npm run dev
```

That starts Vite and an Electron window pointed at it, with devtools open.

Working on the UI is faster in a plain browser — `npm run dev:vite` and open
http://localhost:5173. The app behaves identically outside Electron.

## Build and package

```bash
npm run build      # compiles the Electron main process + builds the web app
npm run package    # produces a Windows installer under release/
```

Copy the installer to a classroom PC and run it. No Node, no internet, no
dependencies on the target machine.

`npm run package:dir` gives an unpacked build for quick testing.

## Using it in class

| Action | How |
| --- | --- |
| Turn pages | Edge arrows, ← / →, or type a printed page number in the toolbar |
| Play a recording | Tap the book's own printed **🔊 1.02** badge |
| Open an exercise | Tap the ringed exercise number |
| Show the answer key | **Answers** in the toolbar (or `A`) |
| Hide the interactive layer | The eye icon (or `H`) — shows the plain page |
| Draw on the page | Pen / highlighter / eraser, five ink colours |
| Jump anywhere in the unit | The menu button (or `M`) opens page thumbnails and the lesson list |

Other shortcuts: `+` / `-` / `0` zoom, `P` pen, `V` pointer, `Ctrl`+wheel zoom.

Pen marks are kept per page and survive closing the app.

## Adding the audio

The recordings are not in the repository. Drop the unit's MP3s into one folder,
named exactly as the tracks are printed in the book:

```
public/content/courses/life-vision-b1/intermediate/unit-1/audio/1.01.mp3
```

That is the whole contract — no configuration. A badge with a file shows a
solid blue ring; a badge without one shows a dashed grey ring and names the
path it expected, so the page itself is your checklist. See the README in that
folder for the full list of the 16 tracks Unit 1 needs.

## Project layout

```
digital-textbook-mvp/
├── electron/              Electron main process + preload
├── public/content/        ALL course content — see CONTENT_GUIDE.md
├── scripts/
│   ├── extract-pdf-pages.py      PDF -> page images (watermark-free)
│   ├── detect-audio-badges.py    finds the printed 🔊 badges for you
│   └── seed-life-vision-unit-1.mjs   generated Unit 1's JSON
├── src/
│   ├── types/content.ts   the data model (Course -> ... -> Activity)
│   ├── engine/            contentLoader.ts — resolves content paths
│   ├── state/             appStore.ts — navigation and reader state
│   └── components/
│       ├── Navigation/    course / level / unit / lesson pickers
│       ├── Textbook/      reader shell, page stage, hotspots, rail, answers
│       ├── Media/         audio player bar, video modal
│       ├── Activities/    the six exercise types
│       ├── Annotation/    pen / highlighter / eraser canvas
│       └── Toolbar/       the reader toolbar
└── build/                 Windows installer icon
```

## What is real and what is missing

- **All application code is real and working**: navigation, page viewer, zoom
  and fit modes, hotspots, the audio player, six exercise types, the answer
  panel, annotation with undo/redo and persistence, thumbnails, fullscreen.
- **Unit 1's content is real**: pages extracted from the Student Book, hotspot
  positions measured off the actual page images, answers worked out from the
  book.
- **Audio and video files are not included** — see above. Everything degrades
  gracefully until they are added.
- `public/content/courses/english-a1` is the original placeholder sample from
  the first prototype. It is no longer listed in `catalog.json`, so it does not
  appear in the app; delete the folder when you no longer want it in the build.
- Units 2–8 are not built. `CONTENT_GUIDE.md` describes the process, which is
  the same two scripts plus authoring the page JSON.
