/* =========================================================================
   Story engine. Reads window.STORY (assets/story.js) and plays it.

   `text` in each scene is Markdown. It is compiled with marked and then
   sanitized with DOMPurify (marked does not sanitize its own output).

   The typewriter reveals marked's *token tree*, not plain text, so emphasis,
   quotations and lists are styled from the very first character. If either
   library is missing the engine falls back to plain paragraphs.

   No dependencies beyond those two vendored files. No build step.
   Works from file:// and from GitHub Pages.
   ========================================================================= */

(function () {
  'use strict';

  var STORE_KEY = 'story:visited:v1';
  var THEME_KEY = 'story:theme';
  var AMBIENT_KEY = 'story:ambient';
  var AMBIENT_MODES = ['off', 'drift', 'aurora', 'motes'];
  var SPEED = 20;          // ms per character, for a short scene
  var SPEED_CAP = 40;      // long scenes slow down rather than crawl forever
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var story = window.STORY;
  var scenes = (story && story.scenes) || {};

  var el = {
    root:     document.documentElement,
    title:    document.getElementById('story-title'),
    path:     document.getElementById('path-label'),
    resume:   document.getElementById('resume'),
    resumeGo: document.getElementById('resume-go'),
    resumeTxt:document.getElementById('resume-text'),
    resumeDrop:document.getElementById('resume-drop'),
    chapter:  document.getElementById('scene-chapter'),
    body:     document.getElementById('scene-body'),
    choices:  document.getElementById('choices'),
    backWrap: document.getElementById('back-wrap'),
    backBtn:  document.getElementById('back-btn'),
    restartWrap: document.getElementById('restart-wrap'),
    restartBtn: document.getElementById('restart-btn'),
    alternateBtn: document.getElementById('alternate-btn'),
    themeBtn: document.getElementById('theme-toggle'),
    themeIcon:document.getElementById('theme-icon'),
    ambient: document.getElementById('ambient'),
    ambientSelect: document.getElementById('ambient-select'),
    resetAll: document.getElementById('reset-all')
  };

  var visited = [];      // chain of scene ids, last one is current
  var revealRun = 0;     // token so a fast reader cannot interleave reveals
  var reveal = null;     // compiled scene mid-typewriter, else null
  var stage = null;      // the <article> that carries aria-live

  /* ---------------------------------------------------------------- utils */

  function fail(message) {
    el.body.innerHTML = '';
    el.choices.innerHTML = '';
    el.backWrap.hidden = true;
    el.restartWrap.hidden = true;
    var p = document.createElement('p');
    p.textContent = message;
    el.body.appendChild(p);
  }

  /* One dot per choice taken, alternating pink and sky. */
  function renderTrail() {
    el.path.innerHTML = '';
    for (var i = 0; i < visited.length - 1; i++) {
      var dot = document.createElement('span');
      dot.className = 'trail__dot';
      el.path.appendChild(dot);
    }
  }

  /* ------------------------------------------------------ ambient background */

  /* Built in JS rather than markup so a mode costs nothing until it is picked.
     Only transform/opacity are animated (see styles.css), so this is
     compositor work and does not touch layout. */
  var AMBIENT_COLOURS = ['--accent', '--accent-2', '--qc-tint-mint', '--qc-tint-lilac'];

  function renderAmbient(mode) {
    if (AMBIENT_MODES.indexOf(mode) < 0) mode = 'off';
    el.ambient.innerHTML = '';
    el.root.setAttribute('data-ambient', mode);

    if (mode === 'drift') {
      ['--accent', '--accent-2', '--qc-tint-lilac'].forEach(function (v, i) {
        var blob = document.createElement('span');
        blob.className = 'blob blob--' + i;
        blob.style.background =
          'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(' + v +
          ') 55%, transparent), transparent 70%)';
        el.ambient.appendChild(blob);
      });
      return;
    }

    if (mode === 'aurora') {
      for (var i = 0; i < 3; i++) {
        var band = document.createElement('span');
        band.className = 'band band--' + i;
        el.ambient.appendChild(band);
      }
      return;
    }

    if (mode === 'motes') {
      for (var m = 0; m < 18; m++) {
        var mote = document.createElement('span');
        mote.className = 'mote';
        var size = 4 + Math.round(Math.random() * 9);
        mote.style.width = size + 'px';
        mote.style.height = size + 'px';
        mote.style.left = (Math.random() * 100).toFixed(2) + '%';
        mote.style.background = 'var(' + AMBIENT_COLOURS[m % AMBIENT_COLOURS.length] + ')';
        var dur = 14 + Math.random() * 16;
        mote.style.animationDuration = dur.toFixed(1) + 's';
        // Stagger with a negative delay so they are already mid-flight, but
        // keep it inside the duration — a delay longer than the cycle parks
        // the mote at the start and it never appears.
        mote.style.animationDelay = (-(Math.random() * dur)).toFixed(1) + 's';
        el.ambient.appendChild(mote);
      }
    }
  }

  function initAmbient() {
    var saved = null;
    try { saved = localStorage.getItem(AMBIENT_KEY); } catch (e) {}
    if (AMBIENT_MODES.indexOf(saved) < 0) saved = 'off';   // opt-in, never assumed
    el.ambientSelect.value = saved;
    renderAmbient(saved);
    el.ambientSelect.addEventListener('change', function () {
      renderAmbient(el.ambientSelect.value);
      try { localStorage.setItem(AMBIENT_KEY, el.ambientSelect.value); } catch (e) {}
    });
  }

  function current() {
    return scenes[visited[visited.length - 1]];
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(visited)); } catch (e) {}
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var chain = JSON.parse(raw);
      if (!Array.isArray(chain) || !chain.length) return null;
      // every link must still exist, otherwise the save is stale
      var ok = chain.every(function (id) { return !!scenes[id]; });
      return ok ? chain : null;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------- markdown -> DOM */

  /* DOMPurify's global is callable but not an object, so probe the methods
   rather than the type. */
  var hasMarkdown = typeof window.marked === 'object' &&
                    typeof window.marked.parse === 'function' &&
                    typeof window.DOMPurify !== 'undefined' &&
                    typeof window.DOMPurify.sanitize === 'function';

  /* Absolute http(s)/mailto/tel, plus anything with no scheme at all — which is
   how an author references a local image like `img/harbour.jpg`. The negative
   lookahead is what rejects javascript:, data:, vbscript: and friends. */
  var URI_OK = /^(?:https?:|mailto:|tel:|(?![a-z][a-z0-9+.-]*:)[^:])/i;

  var PURIFY_CONFIG = {
    ALLOWED_URI_REGEXP: URI_OK,
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'em', 'strong', 'del', 'ins', 'mark', 'small', 'sub',
      'sup', 'code', 'pre', 'blockquote', 'q', 'cite', 'abbr', 'time', 'var',
      'kbd', 'samp', 'a', 'img', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1',
      'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th',
      'td', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'width', 'height',
                   'datetime', 'start', 'colspan', 'rowspan', 'align', 'class'],
    ALLOW_DATA_ATTR: false
  };

  /* The engine owns location.hash to remember the current scene, so a bare
     #fragment link would fight it. Drop the href, keep the words. Class is
     allowed only on blockquote, which is what carries a quote's colour. */
  function installPurifyHooks() {
    if (!hasMarkdown || window.__storyHooksInstalled) return;
    window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A') {
        var href = node.getAttribute('href');
        if (href && href.charAt(0) === '#') node.removeAttribute('href');
      }
      if (node.tagName !== 'BLOCKQUOTE' && node.hasAttribute('class')) {
        node.removeAttribute('class');
      }
    });
    window.__storyHooksInstalled = true;
  }

  /* Markdown is compiled once per scene, to a token tree plus the plain text
     length used to pace the reveal.

     Options and extensions both go through marked.use() rather than being
     passed per call: passing an options object to marked.lexer replaces the
     defaults outright, which would silently drop the quote extension. */
  var QUOTE_COLOURS = ['pink', 'blue', 'mint', 'lilac', 'peach', 'plain'];

  function installMarked() {
    if (!hasMarkdown || window.__storyMarkedReady) return;
    installPurifyHooks();
    window.marked.use({
      gfm: true,
      breaks: false,      // a blank line is a paragraph; one newline is not
      pedantic: false,
      extensions: [{
        name: 'tintedQuote',
        level: 'block',
        start: function (src) { return src.indexOf(':::'); },
        tokenizer: function (src) {
          var m = /^::: ?([a-z]+)[ \t]*\n([\s\S]*?)\n::: *(?:\n|$)/.exec(src);
          if (!m) return undefined;
          var colour = QUOTE_COLOURS.indexOf(m[1]) > -1 ? m[1] : 'pink';
          // Accept the quote written either way — with `>` markers or as bare
          // prose. The fence already says "this is a quote", so strip any
          // leading `>` or the body would lex as a quote inside a quote.
          var body = m[2].replace(/^[ \t]*>[ \t]?/gm, '');
          return {
            type: 'tintedQuote',
            raw: m[0],
            colour: colour,
            text: body,
            // nested block tokens, so the typewriter can still reveal the
            // quote word by word rather than all at once
            tokens: this.lexer.blockTokens(body)
          };
        },
        renderer: function (token) {
          return '<blockquote class="q-' + token.colour + '">' +
                 this.parser.parse(token.tokens) + '</blockquote>\n';
        }
      }]
    });
    window.__storyMarkedReady = true;
  }

  function toFragment(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = window.DOMPurify.sanitize(html, PURIFY_CONFIG);
    return tpl.content;
  }

  /* Returns { blocks, plain }, or null when the libs are unavailable. */
  function compile(markdown) {
    if (!hasMarkdown) return null;
    installMarked();
    var blocks = window.marked.lexer(String(markdown == null ? '' : markdown));
    return { blocks: blocks, plain: plainOf(toFragment(window.marked.parser(blocks))) };
  }

  /* Used only if marked/DOMPurify are missing: paragraphs, no typewriter. */
  function plainFallback(text) {
    var frag = document.createDocumentFragment();
    String(text == null ? '' : text).split(/\n{2,}/).forEach(function (chunk) {
      var trimmed = chunk.trim();
      if (!trimmed) return;
      var p = document.createElement('p');
      p.textContent = trimmed.replace(/\n/g, ' ');
      frag.appendChild(p);
    });
    return frag;
  }

  /* ------------------------------------------------------------ plain text */

  /* The rendered text of a scene, with block breaks preserved. Used for pacing
     and for the caret position — never for what the reader actually sees. */
  var BLOCKISH = {
    P: 1, DIV: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, LI: 1, UL: 1,
    OL: 1, DL: 1, DT: 1, DD: 1, BLOCKQUOTE: 1, PRE: 1, TABLE: 1, THEAD: 1,
    TBODY: 1, TR: 1, HR: 1, SECTION: 1, ARTICLE: 1, FIGURE: 1, FIGCAPTION: 1
  };

  function plainOf(fragment) {
    var out = [];
    var walk = function (node) {
      if (node.nodeType === 3) { out.push(node.nodeValue); return; }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toUpperCase();
      if (tag === 'BR') { out.push('\n'); return; }
      if (tag === 'HR') { out.push('\n\n'); return; }
      for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
      if (BLOCKISH[tag]) out.push('\n\n');
    };
    for (var i = 0; i < fragment.childNodes.length; i++) walk(fragment.childNodes[i]);
    return out.join('').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ---------------------------------------------------- token truncation */

  /* How many characters a token shows. Only used to decide whether the
     token fits inside the budget, so an approximation is fine. */
  function nodeCost(tok) {
    switch (tok.type) {
      case 'text':    return tok.text.length;
      case 'escape':  return 1;
      case 'br':
      case 'hr':
      case 'image':
      case 'code':    return 1;
      case 'space':
      case 'def':     return 0;
      case 'list':
        return tok.items.reduce(function (n, item) { return n + nodeCost(item); }, 0);
      default:
        return tok.tokens ? tok.tokens.reduce(function (n, t) { return n + nodeCost(t); }, 0)
                          : 1;
    }
  }

  /* Keeps whole tokens while they fit in `budget`, then splits the first one
     that doesn't. Returns tokens marked can render as they are. */
  function truncateTokens(tokens, budget) {
    var out = [];
    for (var i = 0; i < tokens.length && budget > 0; i++) {
      var tok = tokens[i];
      var total = nodeCost(tok);
      if (total <= budget) {
        out.push(tok);
        budget -= total;
        continue;
      }
      var partial = splitToken(tok, budget);
      if (partial) out.push(partial);
      break;
    }
    return out;
  }

  /* A token shown part-way through. Emphasis wraps whatever its children
     managed to produce, so `**bo` becomes <strong>bo</strong> mid-type. */
  function splitToken(tok, budget) {
    if (tok.type === 'text') {
      var slice = Object.assign({}, tok);
      slice.raw = tok.raw.slice(0, budget);
      slice.text = tok.text.slice(0, budget);
      // A block-level text token — a tight list item, for instance — carries
      // its inline tokens, and the renderer reads those rather than .text.
      if (tok.tokens && tok.tokens.length) {
        slice.tokens = truncateTokens(tok.tokens, budget);
      }
      return slice;
    }
    if (tok.type === 'list' && tok.items) {
      var list = Object.assign({}, tok);
      list.items = splitItems(tok.items, budget);
      return list.items.length ? list : null;
    }
    if (tok.tokens) {
      var copy = Object.assign({}, tok);
      copy.tokens = truncateTokens(tok.tokens, budget);
      return copy;
    }
    return null;   // indivisible (fenced code, tables, raw html): wait for it
  }

  function splitItems(items, budget) {
    var out = [];
    for (var i = 0; i < items.length && budget > 0; i++) {
      var item = items[i];
      var total = nodeCost(item);
      if (total <= budget) {
        out.push(item);
        budget -= total;
        continue;
      }
      var copy = Object.assign({}, item);
      copy.tokens = truncateTokens(item.tokens || [], budget);
      out.push(copy);
      break;
    }
    return out;
  }

  /* Hand the reader the whole scene, sanitized, with no caret. */
  function settle() {
    if (!reveal) return;
    el.body.replaceChildren(toFragment(window.marked.parser(reveal.blocks)));
    reveal = null;
    if (stage) stage.setAttribute('aria-live', 'polite');
  }

  /* --------------------------------------------------------- validate text */

  function audit() {
    var problems = [];
    Object.keys(scenes).forEach(function (id) {
      var scene = scenes[id] || {};
      if (!scene.text) problems.push('scene "' + id + '" has no text');
      if (scene.ending) return;
      if (!scene.choices || !scene.choices.length) {
        problems.push('scene "' + id + '" is not an ending and has no choices');
      }
      (scene.choices || []).forEach(function (c, i) {
        if (!c.to) problems.push('scene "' + id + '" choice ' + (i + 1) + ' has no "to"');
        else if (!scenes[c.to]) {
          problems.push('scene "' + id + '" choice ' + (i + 1) +
                        ' points at missing scene "' + c.to + '"');
        }
      });
    });
    if (!scenes[story.start]) problems.push('start scene "' + story.start + '" does not exist');
    if (problems.length) {
      console.warn('[story] ' + problems.length + ' issue(s):\n' +
        problems.map(function (p) { return '  • ' + p; }).join('\n'));
    }
    if (!hasMarkdown) {
      console.warn('[story] marked or DOMPurify failed to load — ' +
        'Markdown will not render. Check the vendor script tags.');
    }
  }

  /* ------------------------------------------------------------- rendering */

  function render(opts) {
    var token = ++revealRun;
    var scene = current();
    if (!scene) { fail('That path is not written yet.'); return; }
    reveal = null;

    renderTrail();

    // restart the entry animation
    var article = document.getElementById('scene');
    article.style.animation = 'none';
    void article.offsetWidth;
    article.style.animation = '';

    el.chapter.textContent = scene.chapter || '';
    el.body.innerHTML = '';
    el.choices.innerHTML = '';
    el.restartWrap.hidden = true;
    el.backWrap.hidden = visited.length < 2;

    var compiled = compile(scene.text);
    reveal = compiled;

    if (!compiled) {
      reveal = null;
      el.body.replaceChildren(plainFallback(scene.text));
    } else if (reduceMotion.matches) {
      settle();
    } else {
      type(compiled, token);
    }

    if (scene.ending) {
      el.restartWrap.hidden = false;
    } else {
      buildChoices(scene);
    }

    history.replaceState(null, '', '#' + encodeURIComponent(visited[visited.length - 1]));
    save();
    if (!opts || !opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function buildChoices(scene) {
    scene.choices.forEach(function (choice, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';

      var mark = document.createElement('span');
      mark.className = 'choice__mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = '→';
      btn.appendChild(mark);

      var label = document.createElement('span');
      var missing = !scenes[choice.to];
      label.textContent = choice.text + (missing ? ' [unwritten scene]' : '');
      btn.appendChild(label);

      if (missing) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', function () { go(choice.to); });
        btn.style.animationDelay = (60 * i) + 'ms';
      }
      el.choices.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------ typewriter */

  /* The typewriter types the reader's character budget, but renders the real
     token tree each time — so <strong> is bold at "st" and not only at the
     end. One repaint per character; marked + DOMPurify are fast enough. */
  function type(compiled, token) {
    var plain = compiled.plain;
    var speed = Math.max(SPEED, Math.min(SPEED_CAP, Math.round(plain.length / 35)));
    var i = 0;

    if (stage) stage.setAttribute('aria-live', 'off');   // don't spam a reader

    var tick = function () {
      if (token !== revealRun) return;
      if (i >= plain.length) { settle(); return; }
      var ch = plain.charAt(i);
      paint(compiled, ++i);
      setTimeout(tick, speed + (/[.,;:—]/.test(ch) ? 90 : ch === '\n' ? 140 : 0));
    };

    tick();
  }

  function paint(compiled, budget) {
    var tokens = truncateTokens(compiled.blocks, budget);
    el.body.replaceChildren(toFragment(window.marked.parser(tokens)));
    appendCaret(el.body);
  }

  /* Puts the caret at the end of the visible text, inside whatever element
     the reader is currently inside, so emphasis carries it correctly.
     marked separates blocks with whitespace-only text nodes; those must not
     win, or the caret lands on the wrapper instead of in the paragraph. */
  function appendCaret(root) {
    var last = null;
    var fallback = null;

    (function scan(node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType === 3) {
          if (!child.nodeValue) continue;
          fallback = child;
          if (child.nodeValue.trim()) last = child;
        } else if (child.nodeType === 1) {
          scan(child);
        }
      }
    })(root);

    var anchor = last || fallback;
    var caret = document.createElement('span');
    caret.className = 'caret';
    if (anchor) anchor.parentNode.insertBefore(caret, anchor.nextSibling);
    else root.appendChild(caret);
  }

  /* Click or Escape: stop the typewriter and show the scene in full. */
  function finishTyping() {
    if (!reveal) return;
    revealRun++;                       // invalidate whatever is mid-flight
    settle();
  }

  /* ------------------------------------------------------------ navigation */

  function go(id) {
    finishTyping();
    visited.push(id);
    render();
  }

  function back() {
    if (visited.length < 2) return;
    finishTyping();
    visited.pop();
    render({ keepScroll: true });
  }

  function restart() {
    finishTyping();
    visited = [story.start];
    render();
  }

  /* From an ending: rewind to the last place with more than one way out. */
  function rewind() {
    finishTyping();
    for (var i = visited.length - 1; i > 0; i--) {
      var scene = scenes[visited[i]];
      if (scene && !scene.ending && scene.choices && scene.choices.length) {
        visited.length = i;
        render();
        return;
      }
    }
    restart();
  }

  function clearAll() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    visited = [story.start];
    render();
  }

  /* ----------------------------------------------------------------- theme */

  function applyTheme(name) {
    el.root.setAttribute('data-theme', name);
    el.root.setAttribute('data-theme-set', name);
    el.themeIcon.textContent = name === 'dark' ? '☾' : '☀';
    el.themeBtn.setAttribute('aria-label',
      'Switch to ' + (name === 'dark' ? 'light' : 'dark') + ' theme');
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    applyTheme(saved);
    el.themeBtn.addEventListener('click', function () {
      var next = el.root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    if (!story || !story.scenes) {
      fail('No story found. Define window.STORY in assets/story.js.');
      return;
    }
    stage = document.getElementById('scene');
    audit();
    el.title.textContent = story.title || 'The Story';
    document.title = story.title || 'The Story';
    initTheme();
    initAmbient();

    el.backBtn.addEventListener('click', back);
    el.restartBtn.addEventListener('click', restart);
    el.alternateBtn.addEventListener('click', rewind);
    el.resetAll.addEventListener('click', clearAll);

    document.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      finishTyping();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') finishTyping();
    });

    var saved = loadSaved();
    var fromHash = decodeURIComponent(location.hash.slice(1));

    if (saved && saved.length > 1 && saved[saved.length - 1] !== story.start) {
      var last = scenes[saved[saved.length - 1]];
      var where = last && last.chapter ? last.chapter : 'where you left off';
      el.resumeTxt.textContent = 'You were partway through — ' + where + '.';
      el.resume.hidden = false;
      el.resumeGo.addEventListener('click', function () {
        el.resume.hidden = true;
        visited = saved;
        render();
      });
      el.resumeDrop.addEventListener('click', function () {
        el.resume.hidden = true;
        restart();
      });
      visited = [story.start];
      render();
    } else if (scenes[fromHash]) {
      visited = [story.start, fromHash];
      render();
    } else {
      restart();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();