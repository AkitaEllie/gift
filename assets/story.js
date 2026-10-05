/* =========================================================================
   STORY CONTENT — this is the only file you need to edit.

   Scene prose is Markdown, compiled by marked and sanitized with DOMPurify.
   `assets/app.js` is the engine and does not need to change.

   WRITING PROSE
   -------------
   Use a backtick template literal for `text` so you can write paragraphs on
   real lines, with no \n\n escapes and no " + " string concatenation:

     "attic": {
       chapter: "Prologue",
       text: `The map was already finished when you found it.

       Twelve cities, eleven coastlines, one blank space where a
       thirteenth should be.`,
       choices: [ ... ]
     }

   Markdown that works here:
     **bold**  *italic*  ~~struck~~  `code`
     [a link](https://example.com)   ![an image](photo.jpg)
     > a quotation
     - a bullet list        1. a numbered list
     ---
     ### a small heading

   Raw HTML still works too (<em>text</em>), and entities like &amp; are
   fine. Only http(s) and mailto links are kept — `javascript:` links and
   bare `#fragment` links are stripped, because the engine uses the URL
   fragment to remember which scene you are on.

   SCENE SHAPE
   -----------
   window.STORY = {
     title:  "The Story",          // shown in the header
     start:  "cellar",             // id of the scene to open on
     scenes: {
       "cellar": {
         chapter: "Chapter One",   // small label above the text (optional)
         text: `First paragraph.

         Second paragraph.`,
         choices: [
           { text: "Open the door", to: "hallway" },  // 'to' = another scene id
           { text: "Stay in the dark", to: "ending_stay" }
         ]
       },
       "ending_stay": {
         chapter: "Ending",
         text: `The dark keeps you.`,
         ending: true              // true = terminal scene, shows the ending UI
       }
     }
   };

   COLOURED QUOTES
   ----------------
   A plain `>` quote keeps the default sky-blue tint. To pick a colour, wrap
   the quote in a ::: fence named after the colour:

     ::: pink
     > Do not draw it twice.
     :::

   Available: pink, blue, mint, lilac, peach, plain. The `>` markers are
   optional inside a fence — the fence already says "this is a quote":

     ::: lilac
     Two paragraphs are fine too.

     And a second one.
     :::

   An unknown colour name falls back to pink. Note that `:::` at the start of
   a line is reserved for this.

   RULES
   -----
   - Every scene needs a unique id (the quoted key) and some text.
   - Every `to:` must match a scene id. Broken links show up as
     "[unwritten scene]" and are listed in the browser console.
   - Endings only need `ending: true` — you never link away from them.
   - Choice labels are plain text, not Markdown.
   - Add as many scenes and branches as you like; there is no limit.
   ========================================================================= */

window.STORY = {
  title: "The Cartographer's Debt",

  start: "attic",

  scenes: {
    /* ---------------------------------------------------------------- *
     *  Placeholder text so the engine is visible while you write.
     *  Delete these scenes freely — just point `start` at the first
     *  scene you write.
     * ---------------------------------------------------------------- */

    attic: {
      chapter: "Prologue",
      text: `The map was already finished when you found it. Twelve cities,
eleven coastlines, one blank space where a thirteenth should be.

- *It* had been signed three days before your grandmother died.`,
      choices: [
        { text: "Study the blank space", to: "blank" },
        { text: "Look for her notes", to: "notes" },
        { text: "Burn it", to: "burned" },
      ],
    },

    blank: {
      chapter: "One",
      text: `Under a brass magnifying glass the blank space is not empty. It
is faintly stippled, the way a coastline looks from very far away.

Someone has drawn a city here and then taken it back out.

The stippling carries a date: **the 14th of March**. The city does not
appear in any atlas you own, and the two you have borrowed do not agree
about it.

::: peach
> Do not draw it twice.
:::

Someone has written that in pencil, at the edge of the sheet. The pencil
is yours.`,
      choices: [
        { text: "Copy it into your own hand", to: "copied" },
        { text: "Take the map to the university", to: "university" },
      ],
    },

    notes: {
      chapter: "One",
      text: `Her notebooks fill four shelves, and every one of them is wrong in
some small way. Distances off by a mile. Rivers running uphill.

- Bridges where no river runs.
- A church in a town with no church.
- One page, numbered 402, that she dated twice.

The last entry is dated the day after her death.`,
      choices: [
        { text: "Read it anyway", to: "copied" },
        { text: "Put the notebooks down", to: "blank" },
      ],
    },

    copied: {
      chapter: "Two",
      text: `You trace the stippling until your hand cramps. By morning there
are two thirteenth cities, and they do not agree with each other.

One of them is where you are standing.

---

You could check. That is the whole of the problem: you could walk there
after lunch and be wrong, or be right, and both are worse than not
knowing.`,
      choices: [
        { text: "Go to the thirteenth city", to: "ending_arrive" },
        { text: "Erase both of them", to: "burned" },
      ],
    },

    university: {
      chapter: "Two",
      text: `The cartographer who inherited her position has never heard of her.
There is no obituary. There is no grave.

There is, however, a salary record that runs unbroken for sixty years,
with no gaps for illness and no gaps for anything else.`,
      choices: [
        { text: "Ask about the salary", to: "copied" },
        { text: "Leave before you're noticed", to: "ending_leave" },
      ],
    },

    burned: {
      chapter: "Ending",
      text: `The map catches on the third match.

What is left of the thirteenth city does not burn, which is the part you
will think about later.`,
      ending: true,
    },

    ending_arrive: {
      chapter: "Ending",
      text: `You find it behind a warehouse on the east side, exactly where the
second copy said. There is a door. There is no building around the door.

Your handwriting is on it.`,
      ending: true,
    },

    ending_leave: {
      chapter: "Ending",
      text: `You leave the map on the desk and walk out into the ordinary street.
It is a relief for roughly eleven seconds.

Then a stranger asks you for directions, and you know the way.`,
      ending: true,
    },
  },
};
