# Adding content

The application has no lesson content inside it. Everything a teacher sees
comes from JSON and media files under `public/content/`. Adding a unit is a
filesystem operation, never a code change.

## Folder shape

Media lives at the **unit** level so one `audio/` folder serves every lesson in
the unit — which is what makes adding recordings a single drag-and-drop.

```
public/content/
├── catalog.json                        list of course ids
└── courses/life-vision-b1/
    ├── course.json                     title, publisher, levelIds
    └── intermediate/
        ├── level.json                  title, badge ("B1"), unitIds
        └── unit-1/
            ├── unit.json               title, subtitle, pageRange, lessonIds
            ├── pages/page-8.jpg …      the page images, named by printed page
            ├── audio/1.01.mp3 …        named by printed track number
            ├── video/*.mp4
            └── lesson-1-2/
                ├── lesson.json         title, subtitle, strand, pages[]
                ├── pages/page-10.json  hotspots + answer key for that page
                └── activities/*.json   one file per interactive exercise
```

`lesson.json` points at both:

```json
{
  "contentBase": "courses/life-vision-b1/intermediate/unit-1/lesson-1-2",
  "mediaBase":   "courses/life-vision-b1/intermediate/unit-1"
}
```

`contentBase` resolves page JSON and activities; `mediaBase` resolves page
images, audio and video.

## A. Adding audio to an existing unit

Name each file after the track as printed in the book and drop it in the unit's
`audio/` folder:

```
audio/1.01.mp3   audio/1.02.mp3   audio/1.03.mp3 …
```

Nothing else. A hotspot with `"track": "1.02"` resolves to
`<mediaBase>/audio/1.02.mp3` automatically. Open the unit and look: badges with
a file show a solid blue ring, badges without show a dashed grey one and name
the missing path on hover.

Videos are referenced by filename instead, because the book does not number
them — see the `video/README.md` in the unit.

## B. Importing a new unit from the PDF

### 1. Page images

```bash
python scripts/extract-pdf-pages.py "life_vision_intermediate.pdf" 23 36 \
    public/content/courses/life-vision-b1/intermediate/unit-2/pages \
    --number-from 22
```

`23 36` are **PDF** page numbers; `--number-from 22` is the **printed** page
number of the first one, so the output is named `page-22.jpg` … `page-35.jpg`.
(In this book the printed number runs one behind the PDF page.)

The script pulls the embedded scan out rather than rendering the page, so the
`frenglish.ru` watermark — which is a separate text layer — does not come with
it.

### 2. Audio badge positions

Placing hotspots on the book's own printed 🔊 badges by eye is slow and never
quite lands. This finds them:

```bash
python scripts/detect-audio-badges.py "life_vision_intermediate.pdf" 23 36 \
    --number-from 22 --out badges.json --overlay /tmp/check
```

`badges.json` holds hotspot-ready percentage coordinates keyed by printed page.
**Always look at the `--overlay` images before trusting a new unit** — every
badge should be boxed and nothing else should be. On Unit 1 it found all 22
with no false positives.

### 3. Page JSON

One file per page, in the owning lesson's `pages/` folder:

```json
{
  "id": "page-10",
  "index": 1,
  "bookPage": 10,
  "label": "1.2 Grammar",
  "image": "page-10.jpg",
  "width": 1447,
  "height": 2048,
  "hotspots": [],
  "answers": []
}
```

`width`/`height` must match the real image — they set the aspect ratio, and
hotspot percentages are relative to them.

`scripts/seed-life-vision-unit-1.mjs` is the worked example: it generated every
file for Unit 1 and is a reasonable template for the next unit. Once it has
run, the JSON is yours to hand-edit — re-running it would overwrite your edits.

## C. Hotspots

`x`, `y`, `width`, `height` are **percentages of the page image**, so they stay
aligned at any zoom level or screen resolution.

**Audio** — sits exactly on the book's printed badge, so tapping the printed
`1.02` plays track 1.02:

```json
{ "id": "hs-10-a1", "type": "audio", "style": "badge",
  "x": 22.06, "y": 9.37, "width": 6.05, "height": 1.92,
  "track": "1.06", "exercise": "1", "label": "Ex 1 · Erika, Lara and Sam explain" }
```

**Exercise** — a ring around the printed exercise number, leaving it readable:

```json
{ "id": "hs-10-e2", "type": "activity", "style": "marker",
  "x": 5.26, "y": 37.85, "width": 1.9, "height": 1.32,
  "refId": "p10-ex2.json", "exercise": "2", "label": "Ex 2 · Narrative tenses rules" }
```

A marker is centred on the digit: take the glyph's top-left corner and subtract
0.55 from `x` and 0.25 from `y`.

**Video** — outlines an area of the page; the play badge appears on hover so it
never covers the words underneath:

```json
{ "id": "hs-10-anim", "type": "video", "style": "region",
  "x": 8.4, "y": 43.75, "width": 17.9, "height": 1.95,
  "refId": "video/1-2-narrative-tenses.mp4", "label": "Grammar animation" }
```

## D. Exercises

One JSON file per exercise in the lesson's `activities/`. All six types share
Check / Show answers / Reset and a score.

**multiple-choice** — several questions, `_` marks the gap:

```json
{ "id": "p18-ex4", "type": "multiple-choice", "title": "Ex 4 · Choose the correct answer",
  "questions": [
    { "id": "q1", "text": "I felt really _ when I asked Tom's mum …",
      "options": [{ "id": "a", "text": "painful" }, { "id": "b", "text": "embarrassed" }],
      "correctOptionId": "b" }
  ] }
```

**fill-blank** — `_` marks each gap, one answer per gap in order. With a
`wordBank` the class taps words instead of typing; `distractors` are bank
entries that are deliberately not needed. Separate acceptable alternatives with
`|`:

```json
{ "id": "p13-ex5", "type": "fill-blank", "title": "Ex 5 · Replace the highlighted words",
  "wordBank": ["fascinated", "cheerful", "annoyed"],
  "distractors": ["lonely"],
  "items": [
    { "id": "a", "text": "How do most of us feel … annoyed or _?", "answers": ["cheerful|delighted"] }
  ] }
```

**matching** — tap a card on the left, then its partner on the right. The right
column is shuffled for the class:

```json
{ "id": "p12-ex4", "type": "matching", "title": "Ex 4 · Match the sentence halves",
  "leftHeading": "Advice", "rightHeading": "Ending",
  "pairs": [{ "id": "p1", "left": "Be careful with what you share",
              "right": "E because once it's online it's out of your control." }] }
```

**true-false**, **ordering** (list the items in their *correct* order — the app
shuffles them), and **categorise** (columns with their correct members) follow
the same shape; see `src/types/content.ts` for the exact fields.

Add `"track": "1.12"` to any exercise to offer its recording inside the modal.

## E. The answer key

Per page, in the page JSON. It opens in a panel beside the page rather than
over it, so the class still sees the exercise:

```json
"answers": [
  { "exercise": "3", "title": "Crime report",
    "lines": ["was reading", "took", "had noticed"] },
  { "exercise": "5", "title": "Podcast", "lines": [],
    "note": "Answers come from track 1.11." }
]
```

Use `note` for anything that depends on the recording or on students' own
ideas — better than inventing an answer.

## F. Adding a lesson, unit, level or course

Each level of the hierarchy lists its children, so one hand-edit makes new
content appear:

- New lesson → create the folder and `lesson.json`, add its id to the parent
  `unit.json`'s `lessonIds`.
- New unit → create `unit.json`, add its id to `level.json`'s `unitIds`.
- New level → create `level.json`, add its id to `course.json`'s `levelIds`.
- New course → create `course.json`, add its id to `catalog.json`.

No React component ever needs to change for any of this.

`strand` on a lesson (`vocabulary`, `grammar`, `reading`, `listening`,
`speaking`, `writing`, `skills`, `review`, `project`) sets the colour used on
the lesson card and in the page rail; the values mirror the book's own section
colours.
