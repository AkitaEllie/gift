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

   ENDING MARKERS
   -------------
   The line and buttons shown on an ending can be rewritten. Set them once for
   the whole story under `endings`:

     endings: {
       note: "You have reached an ending.",
       restart: "Read it again",
       alternate: "Try another path"
     }

   ...or override any individual ending scene with `endingUI`:

     "ending_arrive": {
       chapter: "Ending",
       text: `...`,
       ending: true,
       endingUI: {
         note: "She signs her own name, and does not look up.",
         alternate: ""            // empty string hides that button
       }
     }

   An empty string hides that piece. With every piece hidden the ending shows
   no marker at all.

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
  title: " ",

  start: "start",

  scenes: {
    /* ---------------------------------------------------------------- *
     *  Placeholder text so the engine is visible while you write.
     *  Delete these scenes freely — just point `start` at the first
     *  scene you write.
     * ---------------------------------------------------------------- */

    start: {
      chapter: "Uuu... so awkward..",
      text: `You woke up, it's your special day today! 

You've woken up real nice and early. You just can't wait can you? or did you notice something missing from your bed?

Someone's waiting for you already, she seems rather excited even if you can't see her yet.`,
      choices: [
        { text: "Get up, and get out of your room", to: "wokeup" },
        { text: "Sleep in.. zzz..", to: "slept" },
      ],
    },

    wokeup: {
      chapter: "Happy birthday!",
      text: `You get up, freshen barely enough to look acceptable and get to the door.

The moment you open it, that girl. Your wife was waiting for god knows how long. No wonder you woke up alone..

Without missing a beat, she pounces on you and wraps her arms around you, pushing you back onto the bed. She's still kissing your face without end on the bed.

::: pink
> HAAAAPYY BIRTHDAY DEAR!! My pretty little boy is finally up~!!
:::
<sub>I love you smsmsmsmsmmsms <33 omg i can't write this it sounds so pretentious</sub>

You can see something in the now open door, a little cake and a letter.`,
      choices: [
        { text: "Enjoy the moment", to: "stayhug" },
        { text: "Try and get up out of bed.", to: "nohug" },
      ],
    },

    nohug: {
      chapter: "Uu :<< don't leav",
      text: `You try and push her away to get up, she let you go the moment you tried anyways.

She soon gets up with you, and holds your hand, leading you out of the room. 
She lets go of your hand to take a tray with a small cake and a letter on it. She presents it to you.

The cake itself is kind of plain, not as perfect as those you'd buy in stores. She made it for you. It sits there, neatly plated.

The letter sits there, folded up neatly. held together by a heart sticker.

She looks at you smiling innocently, the look of someone who woke up early and spent her entire morning preparing.`,
      choices: [
        { text: "Take a bite of the cake", to: "eatcake" },
        { text: "Give her the first bite of the cake <3", to: "givecake" },
        { text: "Read the letter", to: "letter" },
      ],
    },

    eatcake: {
      chapter: "She tried, did she do well?",
      text: `You took the spoon and grabbed a piece of the cake. It's good, very sweet despite looking bare. You can't help but smile, so does she. :3
      
She's still standing there, holding the tray, smiling as she sees you enjoy the cake she made. Her face is red.`,
      choices: [
        { text: "Share with her", to: "givecake" },
        { text: "Read the letter", to: "letter" },
      ],
    },

    givecake: {
      chapter: "How sweet you are <3",
      text: `You take a piece of the cake, but instead of going to your mouth. You try and feed her some as well.
      
She's flustered and surprised at the gesture. She still opens her mouth and enjoys the cake. <3

Soon you both finish the cake, both your faces look like a mess, she's smiling like an idiot and looking at you expectantly.`,
      choices: [{ text: "Finally, read the letter", to: "letter" }],
    },

    letter: {
      chapter: "Happy birthday, Lucas. <3",
      text: `You take the letter, she eyes you, nervous? Embarassed?

You open the letter, it reads.
:::blue
Hey, lucas, OOC letter. look at me.

I love you, I love you as much or more than the day i met you. 
I'm so glad I got to meet you, get close to you and stay with you as your partner for six years.
I'm happy i got to stand here, and see you grow up and hit your 18th birthday.
Congratulations, Lucas.

I never forgot, i remember how much you used to want to end it all.
I remember how many times we were so close to splitting apart.
But we didn't, and i'm so happy for it.

I can't make anything much, nothing eye candy. Even this site feels generic.
But i want you to know i wrote every last bit of text on this place myself.
That everything here is for you.

I love you more than anything, and i want to stay around for much longer, even forever.

Do you want to too?
:::
`,
      ending: true,
      endingUI: {
        note: "You look back at her, she has tears in her eyes. Looking at you so longingly",
        alternate: "",
        restart: "Look around more?",
      },
    },

    stayhug: {
      chapter: "You're such a cute boy, you know?",
      text: `It feels kind of nice, you stay in her arms for a moment. It's warm. Despite the morning chill, you can really stay here forever..
      
That though quickly gets interrupted by her letting go and getting back up. Grabbing your hands in the process and leaving you sitting in front of her.

:::pink
> Alright, alright. enough being in bed today, come with me! i have a surprise for you~
:::
A little upset by the sudden release, you pout, looking at her.
`,
      choices: [
        { text: "Get up anyways", to: "gotup" },
        { text: "Continue pouting at her :<", to: "pouts" },
      ],
    },

    slept: {
      chapter: "Uuu don't be lazy! :<",
      text: `You stay in bed, trying to sleep again, feeling lazy on your special day. 

Not that it lasts long, a girl, your wife burst through the door. Jumping in bed with you and holding you in her arms really tight. 

::: pink
> Were you really gonna go back to bed? You silly boy, come on, get up! We're gonna celebrate real nice today eheh~
:::
She sounds very excited, she jumps out of bed, waiting for you to get up yourself too.

The bed's real soft though.. So was her.. Do i really need to get up?`,
      choices: [
        { text: "Get up", to: "gotup" },
        { text: "Stay in bed, invite her back too", to: "bed" },
      ],
    },
    bed: {
      chapter: "Getting lucky~",
      text: `You gesture for her to get back in bed with you. She doesn't hesitate, if that's what her birthday boy wants for his special day.
      
:::pink
> Alright, I relent, I'll get in bed with you silly.
:::
She gets on the bed and wraps her arms around your waist, holding you tight and close. One of her hands move and carresses your head and plays with your hair.

It's hard to not notice how soft and warm she is when she's right up against you~
`,
      choices: [
        { text: "", to: "" },
        { text: "", to: "" },
      ],
    },
    gotup: {
      chapter: "Good boy~",
      text: `You finally get off the bed, holding onto her like it's the only thing keeping you standing.
      
She looks at you clinging so hard, smiling wider every second.
:::pink
> Alright, alright, what do you wanna do today hm? your call, 
:::

You cling tighter to her, hugging her at this point. You've got not a clue what you want to do.
`,
      choices: [
        { text: "Stay clingy", to: "clingy" },
        { text: "Let her lead again. Finally let go.", to: "letgo" },
      ],
    },
  },
};
