# Interactive story page

A branching story that runs in the browser with no build step. Push the folder
to GitHub and it works as-is.

```
index.html                    page shell
assets/story.js             <- your story lives here (the only file you edit)
assets/app.js                 the engine: branching, back/forward, save & resume
assets/styles.css             both themes
assets/vendor/marked.umd.js   markdown parser (vendored, v18)
assets/vendor/purify.min.js   HTML sanitizer (vendored, v3.4)
```

## Writing the story

Everything you write goes in `assets/story.js`. Each scene has an id, some
Markdown, and a list of choices that point at other scene ids:

```js
"cellar": {
  chapter: "Chapter One",          // small label above the text (optional)
  text: `First paragraph.

Second paragraph.`,
  choices: [
    { text: "Open the door", to: "hallway" },
    { text: "Stay in the dark", to: "ending_stay" }
  ]
},
"ending_stay": {
  chapter: "Ending",
  text: `The dark keeps you.`,
  ending: true                      // terminal scene
}
```

- **Use backticks** around `text` so you can write paragraphs on real lines —
  no `\n\n` escapes, no `" + "` concatenation.
- A blank line is a paragraph break. One newline is not.
- Set `start:` to the id of the first scene. Add as many branches and endings
  as you like.

### Markdown that works

`**bold**`, `*italic*`, `~~struck~~`, `` `code` ``, `[a link](https://example.com)`,
`![an image](assets/img/photo.jpg)`, `> a quotation`, `- bullets`,
`1. numbered`, `---`, `### a small heading`, and GFM tables.

Raw HTML also works (`<em>text</em>`), and entities like `&amp;` are fine.

### Coloured quotes

A plain `>` quote uses the default sky-blue tint. Wrap it in a `:::` fence to
choose a colour — `pink`, `blue`, `mint`, `lilac`, `peach`, or `plain`:

```
::: lilac
> Do not draw it twice.
:::
```

The `>` markers are optional inside a fence, since the fence already says
"this is a quote" — so multi-paragraph quotes work too. An unrecognised colour
name falls back to pink, and `:::` at the start of a line is reserved.

Only `http(s)`, `mailto` and relative links survive sanitizing. Bare
`#fragment` links are stripped, because the engine uses the URL fragment to
remember which scene you are on. Choice *labels* are plain text, not Markdown.

### Ending markers

The line and buttons on an ending can be rewritten. Set them once for the
whole story under `endings`:

```js
endings: {
  note: "You have reached an ending.",
  restart: "Read it again",
  alternate: "Try another path"
}
```

...or override any individual ending scene with `endingUI`:

```js
"ending_arrive": {
  text: `...`,
  ending: true,
  endingUI: {
    note: "She signs her own name, and does not look up.",
    alternate: ""          // empty string hides that button
  }
}
```

Scene-level wins over story-level, and anything you leave out falls through to
the defaults. An empty string hides that piece; set all three empty and the
ending shows no marker at all.

### Finding problems

Open the browser console while writing. On load the engine checks every link
and lists anything broken, plus any scene that has no choices and isn't
flagged as an ending. Branches pointing at scenes you haven't written yet
appear greyed out as `[unwritten scene]` rather than breaking the page, so you
can write linearly and branch later.

## Background animation

The picker in the header offers three ambient backgrounds behind the text:

- **Still** — nothing moving (the default)
- **Drift** — three large slow colour blobs
- **Aurora** — soft diagonal ribbons sweeping across
- **Motes** — pastel dust drifting upward

Your choice is remembered in the browser. Nothing moves under
`prefers-reduced-motion: reduce` — the shapes are still drawn, but frozen.

## Previewing

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

The reader's place is saved in the browser, so a reload offers to continue.
Clicking anywhere skips the typewriter effect. It reveals the Markdown itself,
so emphasis and quotations are styled from the first character rather than
popping in at the end, and it is skipped entirely under
`prefers-reduced-motion`.

If the two vendored libraries ever fail to load, the page still runs — it falls
back to plain paragraphs (no typewriter) and logs a warning to the console.

## Publishing to github.io

1. Create a repo named `<your-username>.github.io` (or a project site repo,
   which then lives at `<your-username>.github.io/<repo>`).
2. Commit everything in this folder to the root of the repo.
3. **Settings → Pages → Source: Deploy from a branch**, pick the branch
   (usually `main`) and `/ (root)`.

Nothing else is needed — there's no build, the libraries are vendored rather
than loaded from a CDN, and `.nojekyll` is included so GitHub Pages serves the
files untouched.