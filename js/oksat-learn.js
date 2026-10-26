/* =============================================================
   oksat-learn.js — oksat-learn.html: the Interactive learning viewer.

   A guide (js/oksat-manifest.js → OKSAT_GUIDES) is a series of chapters,
   one data file each (js/oksat-guides/<slug>/<chapter>.js, ending
   window.__OKSAT_CHAPTER = {...}). This file renders them: a chapter
   rail, 30-second summaries, sections of blocks, predict-then-reveal
   retrieval prompts, worked checkers, module questions inline (by
   reference), and a drill link into the question modules for every
   section. Schema and authoring: docs/authoring-oksat-guide.md.

   Progress lives only in OKSATStore (oksat:learn:<slug>:<code>). A guide
   is the first pass; the module's own gate, Leitner schedule and
   first-attempt record are never touched from here.

   Everything is built with DOM nodes and textContent. The inline markup
   in guide strings (**bold**, *italic*, [[A|pos|Strong rec]] evidence
   chip, [[src|EPOS 5.2]] source chip) is parsed by inline() into nodes;
   no string from a data file or the URL reaches innerHTML. ?g=, ?c= and
   the hash only ever select among known ids. Every abbreviation in the
   lexicon (js/oksat-terms.js) is marked, and tapping, hovering or
   focusing it shows its full name in one shared popover.
   ============================================================= */
(function () {
    'use strict';

    OKSATPrefs.mountThemeToggle(document.getElementById('theme-toggle'));
    OKSATPrefs.mountFontPicker(document.getElementById('font-picker'));

    const GUIDES = window.OKSAT_GUIDES || [];
    const MODULES = window.OKSAT_MANIFEST || [];
    const SUBS = window.OKSAT_SUBSPECIALTIES || {};
    const reviewer = OKSATStore.reviewer();
    const root = document.getElementById('root');

    /* Same four tiers as the engine's recall self-grade (js/oksat-engine.js). */
    const GRADES = [
        { label: "Didn't know", tone: 'incorrect' },
        { label: 'Guessed', tone: 'ochre' },
        { label: 'Got it partially', tone: 'accent' },
        { label: 'Knew it cold', tone: 'correct' },
    ];
    const LETTERS = 'ABCDEFGH';

    /* ---------- tiny DOM helpers ---------- */
    function h(tag, cls, kids) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        (kids || []).forEach((k) => {
            if (k == null || k === false) return;
            e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
        });
        return e;
    }
    function txt(tag, cls, s) { const e = h(tag, cls); e.textContent = s; return e; }
    /* txt() with the lexicon's terms marked; for guide and module text, never for controls. */
    function tx(tag, cls, s) { const e = h(tag, cls); e.appendChild(terms(s)); return e; }
    function btn(cls, label, onClick) {
        const b = h('button', cls);
        b.type = 'button';
        b.textContent = label;
        if (onClick) b.addEventListener('click', onClick);
        return b;
    }
    function lines(s, tag) {
        return String(s == null ? '' : s).split('\n').filter(Boolean).map((l) => {
            const p = h(tag || 'p');
            p.appendChild(inline(l));
            return p;
        });
    }

    /* ---------- terms: abbreviation → full name ---------- */
    const TERMS = window.OKSATTerms || null;
    function terms(text) {
        const frag = document.createDocumentFragment();
        const s = String(text == null ? '' : text);
        let i = 0;
        (TERMS ? TERMS.scan(s).hits : []).forEach((t) => {
            if (t.i > i) frag.appendChild(document.createTextNode(s.slice(i, t.i)));
            const a = txt('abbr', 'lr-term', s.slice(t.i, t.j));
            a.dataset.term = t.key;
            a.tabIndex = 0;
            frag.appendChild(a);
            i = t.j;
        });
        if (i < s.length) frag.appendChild(document.createTextNode(s.slice(i)));
        return frag;
    }

    /* One popover for every term: hover or focus shows it, a tap or Enter pins it,
       a tap elsewhere or Escape closes it. A tap on a term inside a checker label
       does not tick the box. */
    const tip = h('div', 'lr-tip');
    tip.id = 'lr-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
    let tipFor = null, pinned = false;
    function placeTip() {
        if (!tipFor) return;
        const r = tipFor.getBoundingClientRect();
        const vw = document.documentElement.clientWidth, vh = window.innerHeight;
        const w = tip.offsetWidth, ht = tip.offsetHeight;
        let top = r.bottom + 6;
        if (top + ht > vh - 8 && r.top - 6 - ht > 8) top = r.top - 6 - ht;
        tip.style.left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, vw - 16 - w)) + 'px';
        tip.style.top = top + 'px';
    }
    function showTip(el, pin) {
        const x = TERMS && TERMS.get(el.dataset.term);
        if (!x) return;
        if (tipFor && tipFor !== el) tipFor.removeAttribute('aria-describedby');
        tipFor = el;
        pinned = !!pin;
        tip.replaceChildren(txt('b', '', el.dataset.term), document.createTextNode(' ' + x));
        tip.hidden = false;
        el.setAttribute('aria-describedby', 'lr-tip');
        placeTip();
    }
    function hideTip() {
        if (!tipFor) return;
        tipFor.removeAttribute('aria-describedby');
        tipFor = null;
        pinned = false;
        tip.hidden = true;
    }
    const termAt = (e) => (e.target && e.target.closest ? e.target.closest('.lr-term') : null);
    document.addEventListener('mouseover', (e) => { const t = termAt(e); if (t && !pinned) showTip(t, false); });
    document.addEventListener('mouseout', (e) => { const t = termAt(e); if (t && t === tipFor && !pinned && !t.contains(e.relatedTarget)) hideTip(); });
    document.addEventListener('focusin', (e) => { const t = termAt(e); if (t && t !== tipFor) showTip(t, false); });
    document.addEventListener('focusout', (e) => { if (termAt(e) === tipFor && !pinned) hideTip(); });
    document.addEventListener('click', (e) => {
        const t = termAt(e);
        if (!t) { if (pinned) hideTip(); return; }
        e.preventDefault();
        if (t === tipFor && pinned) hideTip(); else showTip(t, true);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tipFor) { hideTip(); return; }
        const t = termAt(e);
        if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (t === tipFor && pinned) hideTip(); else showTip(t, true); }
    });
    window.addEventListener('scroll', placeTip, { passive: true });
    window.addEventListener('resize', placeTip);

    /* ---------- inline markup → nodes ---------- */
    function chip(body) {
        const parts = body.split('|');
        if (parts[0] === 'src') return txt('span', 'lr-src', parts.slice(1).join('|'));
        const tone = parts[1] === 'pos' || parts[1] === 'neg' ? parts[1] : 'neu';
        return h('span', 'lr-ev', [txt('i', '', parts[0]), txt('s', tone, parts.slice(2).join('|'))]);
    }
    function inline(text) {
        const frag = document.createDocumentFragment();
        const s = String(text == null ? '' : text);
        let bold = false, ital = false, i = 0, m;
        const run = (t) => {
            if (!t) return;
            let n = terms(t);
            if (ital) { const e = document.createElement('em'); e.appendChild(n); n = e; }
            if (bold) { const e = document.createElement('strong'); e.appendChild(n); n = e; }
            frag.appendChild(n);
        };
        const re = /\[\[([^\]]+)\]\]|\\\*|\*\*|\*/g;
        while ((m = re.exec(s))) {
            run(s.slice(i, m.index));
            i = re.lastIndex;
            if (m[1] !== undefined) frag.appendChild(chip(m[1]));
            else if (m[0] === '\\*') run('*');
            else if (m[0] === '**') bold = !bold;
            else ital = !ital;
        }
        run(s.slice(i));
        return frag;
    }

    /* ---------- data loading ----------
       Chapter files only assign window.__OKSAT_CHAPTER, so they load into this page, one at
       a time (they share that global). Module files declare top-level `const meta, DOMAINS…`,
       so two of them cannot share a page: each loads in its own throwaway same-origin frame,
       is copied out as plain data, and the frame is discarded. */
    let chain = Promise.resolve();
    function inFrame(src) {
        return new Promise((resolve, reject) => {
            const f = document.createElement('iframe');
            f.hidden = true;
            f.setAttribute('aria-hidden', 'true');
            f.tabIndex = -1;
            document.body.appendChild(f);
            const done = (fn, v) => { f.remove(); fn(v); };
            const s = f.contentDocument.createElement('script');
            s.src = src;
            s.onload = () => {
                let mod = null;
                try { mod = JSON.parse(JSON.stringify(f.contentWindow.__MCQ_MODULE)); } catch (e) { /* unreadable */ }
                mod ? done(resolve, mod) : done(reject, new Error('no data in ' + src));
            };
            s.onerror = () => done(reject, new Error('could not load ' + src));
            f.contentDocument.body.appendChild(s);
        });
    }
    function inject(src, name) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => {
                const v = window[name];
                try { delete window[name]; } catch (e) { window[name] = undefined; }
                s.remove();
                v ? resolve(v) : reject(new Error('no data in ' + src));
            };
            s.onerror = () => { s.remove(); reject(new Error('could not load ' + src)); };
            document.body.appendChild(s);
        });
    }
    function enqueue(src, name) {
        const p = chain.then(() => inject(src, name));
        chain = p.catch(() => {});
        return p;
    }
    const chapterCache = {}, moduleCache = {};
    function getChapter(entry) {
        if (!chapterCache[entry.id]) {
            chapterCache[entry.id] = enqueue(entry.data, '__OKSAT_CHAPTER').catch((e) => { delete chapterCache[entry.id]; throw e; });
        }
        return chapterCache[entry.id];
    }
    function getModule(slug) {
        const entry = MODULES.filter((m) => m.slug === slug)[0];
        if (!entry) return Promise.resolve(null);
        if (!moduleCache[slug]) {
            moduleCache[slug] = inFrame(entry.data)
                .then((mod) => ({ entry, mod }))
                .catch((e) => { delete moduleCache[slug]; throw e; });
        }
        return moduleCache[slug];
    }

    /* ---------- state ---------- */
    let guide = null, rec = null, view = null, current = null;
    const stepIdx = {};
    function persist() { OKSATStore.saveLearn(guide.slug, reviewer, rec); }
    const secKey = (ch, sec) => ch.id + '/' + sec.id;
    const checkKey = (ch, sec, b) => secKey(ch, sec) + ':' + b.id;
    function doneCount(entry) {
        const pre = entry.id + '/';
        return Object.keys(rec.done).filter((k) => k.indexOf(pre) === 0).length;
    }

    function notice(title, body) {
        const box = h('div', 'ok-notice', [txt('h1', '', title), txt('p', '', body)]);
        const a = txt('a', '', '← Back to the self-assessment hub');
        a.href = 'oksat.html';
        box.appendChild(a);
        root.replaceChildren(box);
    }

    /* ============================================================
       Blocks
       ============================================================ */
    function renderBlocks(blocks, ctx) {
        const frag = document.createDocumentFragment();
        let run = null;
        (blocks || []).forEach((b) => {
            if (b.t === 'check') {
                if (!run) {
                    run = h('div', 'lr-checks', [txt('span', 'lr-label', 'Check yourself')]);
                    frag.appendChild(run);
                }
                run.appendChild(checkBlock(b, ctx));
                return;
            }
            run = null;
            const fn = BLOCKS[b.t];
            if (fn) frag.appendChild(fn(b, ctx));
        });
        return frag;
    }

    const BLOCKS = {
        p: (b) => { const e = h('p', 'lr-p'); e.appendChild(inline(b.x)); return e; },
        why: (b) => { const e = h('p', 'lr-why'); e.appendChild(inline(b.x)); return e; },
        h: (b) => { const e = h('h3', 'lr-h3'); e.appendChild(inline(b.x)); return e; },
        ul: (b) => list('ul', b),
        ol: (b) => list('ol', b),
        table: tableBlock,
        kv: (b) => {
            const dl = h('dl', 'lr-kv');
            b.rows.forEach((r) => {
                const dt = h('dt'); dt.appendChild(inline(r[0]));
                const dd = h('dd'); dd.appendChild(inline(r[1]));
                dl.appendChild(dt); dl.appendChild(dd);
            });
            return dl;
        },
        call: (b, ctx) => h('aside', 'lr-call lr-call--' + (b.k || 'hook'), [tx('span', 'lr-call-label', b.label), renderBlocks(b.blocks, ctx)]),
        deep: (b, ctx) => {
            const d = h('details', 'lr-deep lr-deep--go');
            d.appendChild(txt('summary', '', 'Go deeper: ' + b.title));
            const inner = h('div', 'lr-deep-body');
            inner.appendChild(renderBlocks(b.blocks, ctx));
            d.appendChild(inner);
            return d;
        },
        cards: (b, ctx) => {
            const g = h('div', 'lr-cards lr-cards--' + (b.cols === 2 ? 2 : 1));
            b.items.forEach((it) => {
                const c = h('div', 'lr-card' + (it.tone ? ' lr-card--' + it.tone : ''));
                if (it.h) c.appendChild(tx('span', 'lr-card-h', it.h));
                c.appendChild(renderBlocks(it.blocks, ctx));
                g.appendChild(c);
            });
            return g;
        },
        steps: (b) => {
            const wrap = h('div', 'lr-stepswrap');
            if (b.label) wrap.appendChild(tx('span', 'lr-label', b.label));
            const ol = h('ol', 'lr-steps' + (b.rise ? ' lr-steps--rise' : ''));
            b.items.forEach((it, i) => {
                const li = h('li', 'lr-step' + (it.side ? ' lr-step--side' : ''));
                li.style.setProperty('--i', String(i));
                li.appendChild(tx('span', 'lr-step-n', it.n));
                const body = h('div', 'lr-step-x'); body.appendChild(inline(it.x));
                li.appendChild(body);
                ol.appendChild(li);
            });
            wrap.appendChild(ol);
            if (b.cap) wrap.appendChild(tx('p', 'lr-cap', b.cap));
            return wrap;
        },
        figure: (b) => {
            const f = h('figure', 'lr-figure');
            if (b.label) f.appendChild(tx('span', 'lr-label', b.label));
            const img = h('img');
            img.src = b.src; img.alt = b.alt || ''; img.loading = 'lazy';
            f.appendChild(h('div', 'lr-figure-img', [img]));
            if (b.cap) f.appendChild(tx('figcaption', 'lr-cap', b.cap));
            return f;
        },
        tool: toolBlock,
        practice: practiceBlock,
    };

    function list(tag, b) {
        const e = h(tag, 'lr-list');
        b.items.forEach((t) => { const li = h('li'); li.appendChild(inline(t)); e.appendChild(li); });
        return e;
    }

    function tableBlock(b) {
        const t = h('table', 'lr-table' + (b.wide ? ' lr-table--wide' : ''));
        const head = h('tr');
        b.head.forEach((x) => { const th = h('th'); th.appendChild(inline(x)); head.appendChild(th); });
        t.appendChild(h('thead', '', [head]));
        const body = h('tbody');
        b.rows.forEach((r) => {
            const tr = h('tr');
            r.forEach((c) => {
                const td = h('td');
                const o = typeof c === 'string' ? { x: c } : c;
                if (o.rs) td.rowSpan = o.rs;
                if (o.nw) td.className = 'nw';
                td.appendChild(inline(o.x));
                tr.appendChild(td);
            });
            body.appendChild(tr);
        });
        t.appendChild(body);
        return h('div', 'lr-tablewrap', [t]);
    }

    /* ---------- retrieval prompt: commit, reveal, self-grade ---------- */
    function gradeRow(current, onPick) {
        const row = h('div', 'lr-grades');
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', 'How did you do?');
        GRADES.forEach((g, i) => {
            const b = btn('lr-grade lr-grade--' + g.tone, (i + 1) + ' · ' + g.label, () => {
                row.querySelectorAll('.lr-grade').forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
                onPick(i);
            });
            b.setAttribute('aria-pressed', String(current === i));
            row.appendChild(b);
        });
        return row;
    }
    /* Shared by the guide's own prompts, the flashcards, and module recall items. */
    function promptCard(opts) {
        const card = h('div', 'lr-q');
        const q = h('div', 'lr-q-stem');
        opts.stem.forEach((p) => q.appendChild(p));
        card.appendChild(q);
        const area = h('textarea', 'lr-q-input');
        area.rows = 2;
        area.setAttribute('aria-label', 'Your answer (optional; stays in this tab)');
        area.placeholder = 'Commit to an answer first (optional)…';
        const reveal = btn('ok-btn ok-btn--sm lr-reveal', opts.revealLabel || 'Reveal answer');
        const ans = h('div', 'lr-q-answer');
        ans.hidden = true;
        let grades = null;
        let shown = false;
        function show() {
            if (shown) return;
            shown = true;
            const mine = area.value.trim();
            ans.replaceChildren();
            if (mine) ans.appendChild(h('div', 'lr-q-mine', [txt('span', 'lr-label', 'You wrote'), txt('p', '', mine)]));
            ans.appendChild(txt('span', 'lr-label', 'Model answer'));
            opts.answer.forEach((p) => ans.appendChild(p));
            grades = gradeRow(opts.grade, (g) => { opts.onGrade(g); card.classList.add('is-graded'); });
            ans.appendChild(grades);
            if (opts.after) ans.appendChild(opts.after());
            ans.hidden = false;
            area.hidden = true;
            reveal.hidden = true;
            card.classList.add('is-open');
            grades.querySelector('button').focus({ preventScroll: true });
        }
        reveal.addEventListener('click', show);
        area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); show(); } });
        card.addEventListener('keydown', (e) => {
            if (!shown || e.target === area || e.ctrlKey || e.metaKey || e.altKey) return;
            const n = Number(e.key);
            if (n >= 1 && n <= GRADES.length) { e.preventDefault(); grades.querySelectorAll('.lr-grade')[n - 1].click(); }
        });
        card.appendChild(area);
        card.appendChild(reveal);
        card.appendChild(ans);
        if (opts.grade != null) card.classList.add('is-graded');
        return card;
    }

    function checkBlock(b, ctx) {
        const key = checkKey(ctx.ch, ctx.sec, b);
        const stem = lines(b.q);
        stem[0].classList.add('lr-q-first');
        const card = promptCard({
            stem,
            answer: lines(b.a),
            grade: rec.checks[key],
            onGrade: (g) => { rec.checks[key] = g; persist(); refreshSection(ctx); },
        });
        card.dataset.key = key;
        return card;
    }

    /* ---------- worked checkers (ABRS, ESS, biologic criteria, response) ---------- */
    function toolBlock(b) {
        const box = h('div', 'lr-tool');
        const head = h('div', 'lr-tool-head', [tx('strong', '', b.title), txt('span', 'lr-src', b.src)]);
        box.appendChild(head);
        const opts = h('div', 'lr-tool-opts');
        const out = h('div', 'lr-tool-out');
        out.setAttribute('aria-live', 'polite');
        const boxes = [];
        let pre = null;
        function add(text, isPre) {
            const id = 'tool-' + b.id + '-' + (isPre ? 'pre' : boxes.length);
            const lab = h('label', 'lr-tool-opt');
            const cb = h('input');
            cb.type = 'checkbox'; cb.id = id;
            cb.addEventListener('change', run);
            lab.appendChild(cb);
            const span = h('span'); span.appendChild(inline(text)); lab.appendChild(span);
            if (isPre) pre = cb; else boxes.push(cb);
            return lab;
        }
        if (b.pre) { opts.appendChild(add(b.pre, true)); opts.appendChild(h('hr', 'lr-tool-rule')); }
        b.crit.forEach((c) => opts.appendChild(add(c, false)));
        function run() {
            const k = boxes.filter((x) => x.checked).length, n = boxes.length;
            const vars = { k: k, n: n, miss: n - k };
            const rule = b.rules.filter((r) => {
                if (r.pre !== undefined && pre && pre.checked !== r.pre) return false;
                if (r.eq !== undefined && k !== r.eq) return false;
                if (r.min !== undefined && k < r.min) return false;
                if (r.max !== undefined && k > r.max) return false;
                return true;
            })[0];
            out.className = 'lr-tool-out' + (rule && rule.tone ? ' is-' + rule.tone : '');
            out.replaceChildren(terms(rule ? rule.x.replace(/\{(k|n|miss)\}/g, (m0, v) => String(vars[v])) : ''));
        }
        box.appendChild(opts);
        box.appendChild(out);
        if (b.note) box.appendChild(tx('p', 'lr-why', b.note));
        run();
        return box;
    }

    /* ---------- module questions inline, by reference ---------- */
    function practiceBlock(b, ctx) {
        const box = h('div', 'lr-practice');
        box.appendChild(tx('span', 'lr-label', b.title || 'Apply it'));
        const slots = b.refs.map((ref) => {
            const slot = h('div', 'lr-slot', [txt('p', 'lr-loading', 'Loading question…')]);
            box.appendChild(slot);
            return slot;
        });
        b.refs.forEach((ref, i) => {
            const at = ref.indexOf(':');
            const slug = ref.slice(0, at), id = ref.slice(at + 1);
            getModule(slug).then((m) => {
                const item = m && m.mod.ITEMS.filter((q) => q.id === id)[0];
                if (!item) { slots[i].replaceChildren(txt('p', 'lr-loading', 'Question unavailable: ' + ref)); return; }
                slots[i].replaceChildren(itemCard(m, item, ref, ctx));
            }).catch(() => { slots[i].replaceChildren(txt('p', 'lr-loading', 'Could not load ' + slug + '.')); });
        });
        return box;
    }

    function plain(s) { return String(s == null ? '' : s).split('\n').filter(Boolean).map((l) => tx('p', 'lr-pl', l)); }
    function itemImage(src, alt) {
        if (!src) return null;
        const img = h('img');
        img.src = src; img.alt = alt || ''; img.loading = 'lazy';
        return h('div', 'lr-figure-img', [img]);
    }
    function moduleLink(m, item) {
        const c = (item.concepts || [])[0];
        const a = txt('a', 'lr-modlink', 'Open ' + m.entry.title + ' →');
        a.href = 'oksat-study.html?m=' + encodeURIComponent(m.entry.slug) + (c ? '&c=' + encodeURIComponent(c) : '');
        return a;
    }
    function itemCard(m, item, ref, ctx) {
        const saved = rec.practice[ref];
        const tag = tx('span', 'lr-label', m.entry.title + (item.section ? ' · ' + item.section : ''));
        const wrap = h('div', 'lr-item', [tag]);
        if (item.type === 'recall') {
            const card = promptCard({
                stem: plain(item.stem),
                answer: plain(item.answer).concat(item.brief ? plain(item.brief) : []),
                grade: saved && saved.g,
                onGrade: (g) => { rec.practice[ref] = { g: g, ok: g >= 2 }; persist(); },
                after: () => moduleLink(m, item),
            });
            wrap.appendChild(card);
            return wrap;
        }
        plain(item.stem).forEach((p) => wrap.appendChild(p));
        const im = itemImage(item.image, item.imageAlt);
        if (im) wrap.appendChild(im);
        const area = h('textarea', 'lr-q-input');
        area.rows = 2;
        area.setAttribute('aria-label', 'Your answer (optional; stays in this tab)');
        area.placeholder = 'Commit to an answer first (optional)…';
        const show = btn('ok-btn ok-btn--sm lr-reveal', 'Show the choices');
        const optsBox = h('div', 'lr-options');
        optsBox.setAttribute('role', 'radiogroup');
        optsBox.hidden = true;
        const result = h('div', 'lr-result');
        result.hidden = true;
        function lock(id) {
            const ok = id === item.correct;
            optsBox.querySelectorAll('button').forEach((b2) => {
                b2.disabled = true;
                if (b2.dataset.id === item.correct) b2.classList.add('is-right');
                else if (b2.dataset.id === id) b2.classList.add('is-wrong');
            });
            result.replaceChildren();
            result.appendChild(txt('p', 'lr-verdict ' + (ok ? 'is-ok' : 'is-miss'), ok ? 'Correct.' : 'Not quite. Answer: ' + LETTERS[item.options.findIndex((o) => o.id === item.correct)] + '.'));
            plain(item.brief).forEach((p) => result.appendChild(p));
            if (item.detailed) {
                const d = h('details', 'lr-deep');
                d.appendChild(txt('summary', '', 'Read more'));
                const body = h('div', 'lr-deep-body');
                plain(item.detailed).forEach((p) => body.appendChild(p));
                const ei = itemImage(item.explanationImage, item.explanationImageAlt);
                if (ei) body.appendChild(ei);
                d.appendChild(body);
                result.appendChild(d);
            }
            result.appendChild(moduleLink(m, item));
            result.hidden = false;
        }
        item.options.forEach((o, i) => {
            const b2 = h('button', 'lr-option');
            b2.type = 'button';
            b2.dataset.id = o.id;
            b2.setAttribute('role', 'radio');
            b2.appendChild(txt('span', 'lr-option-l', LETTERS[i]));
            b2.appendChild(txt('span', 'lr-option-t', o.text));
            b2.addEventListener('click', () => {
                if (rec.practice[ref]) return;
                rec.practice[ref] = { a: o.id, ok: o.id === item.correct };
                persist();
                lock(o.id);
            });
            optsBox.appendChild(b2);
        });
        function open() { area.hidden = true; show.hidden = true; optsBox.hidden = false; }
        show.addEventListener('click', () => { open(); const f = optsBox.querySelector('button'); if (f) f.focus({ preventScroll: true }); });
        area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); show.click(); } });
        wrap.appendChild(area);
        wrap.appendChild(show);
        wrap.appendChild(optsBox);
        wrap.appendChild(result);
        if (saved) { open(); lock(saved.a); }
        return wrap;
    }

    /* ============================================================
       Sections and chapters
       ============================================================ */
    function drillRow(sec) {
        if (!sec.drill || !sec.drill.length) return null;
        const row = h('div', 'lr-drill', [txt('span', 'lr-label', 'Drill this in OKSAT')]);
        const links = h('div', 'lr-drill-links');
        sec.drill.forEach((d) => {
            const entry = MODULES.filter((m) => m.slug === d.m)[0];
            if (!entry) return;
            (d.c || [null]).forEach((c) => {
                const a = h('a', 'lr-drill-link');
                a.href = 'oksat-study.html?m=' + encodeURIComponent(d.m) + (c ? '&c=' + encodeURIComponent(c) : '');
                const t = txt('span', '', entry.title + (c ? ' · ' + c : ''));
                a.appendChild(t);
                links.appendChild(a);
                getModule(d.m).then((m) => {
                    if (!m) return;
                    const n = c ? m.mod.ITEMS.filter((q) => (q.concepts || []).indexOf(c) !== -1).length : m.mod.ITEMS.length;
                    const cl = c && m.mod.CONCEPTS && m.mod.CONCEPTS[c] ? m.mod.CONCEPTS[c].label : c;
                    t.textContent = entry.title + (cl ? ' · ' + cl : '') + ' (' + n + ')';
                }).catch(() => {});
            });
        });
        row.appendChild(links);
        return row;
    }

    function sectionEl(ch, entry, sec) {
        const ctx = { ch: entry, sec: sec };
        const el = h('article', 'lr-sec');
        el.id = sec.id;
        el.dataset.sec = sec.id;
        const head = h('header', 'lr-sec-head', [txt('span', 'lr-sn', sec.n), tx('h2', '', sec.title)]);
        el.appendChild(head);
        el.appendChild(renderBlocks(sec.blocks, ctx));
        const foot = h('footer', 'lr-secfoot');
        const drill = drillRow(sec);
        if (drill) foot.appendChild(drill);
        const bar = h('div', 'lr-markbar');
        bar.appendChild(h('span', 'lr-hint'));
        const mark = btn('ok-btn ok-btn--sm lr-mark', 'Mark section done', () => {
            const k = secKey(entry, sec);
            if (rec.done[k]) delete rec.done[k]; else rec.done[k] = 1;
            persist();
            refreshSection(ctx);
            refreshChrome();
            if (rec.done[k] && rec.ui.mode === 'step') stepBy(1);
        });
        bar.appendChild(mark);
        foot.appendChild(bar);
        el.appendChild(foot);
        el._ctx = ctx;
        el._mark = mark;
        refreshSection(ctx, el);
        return el;
    }

    function sectionOf(ctx) { return document.getElementById(ctx.sec.id); }
    /* Done toggle, graded-count hint, and the section's dot. */
    function refreshSection(ctx, el) {
        el = el || sectionOf(ctx);
        if (!el) return;
        const done = !!rec.done[secKey(ctx.ch, ctx.sec)];
        const mark = el._mark;
        mark.textContent = done ? 'Section done' : 'Mark section done';
        mark.setAttribute('aria-pressed', String(done));
        mark.classList.toggle('is-done', done);
        const checks = (ctx.sec.blocks || []).filter((b) => b.t === 'check');
        const graded = checks.filter((b) => rec.checks[checkKey(ctx.ch, ctx.sec, b)] !== undefined).length;
        const hint = el.querySelector('.lr-hint');
        hint.textContent = checks.length ? graded + ' of ' + checks.length + ' prompts graded' + (graded === checks.length && !done ? '. Ready to mark done.' : '') : '';
        const dot = document.querySelector('.lr-dot[data-sec="' + ctx.sec.id + '"]');
        if (dot) dot.classList.toggle('is-done', done);
    }

    function refreshChrome() {
        document.querySelectorAll('.lr-nav').forEach((a) => {
            const e = guide.chapters.filter((c) => c.id === a.dataset.view)[0];
            const pct = a.querySelector('.lr-nav-pct');
            if (!e || !e.sections) return;
            const n = doneCount(e);
            pct.textContent = n === e.sections ? '✓' : Math.round(100 * n / e.sections) + '%';
            a.classList.toggle('is-full', n === e.sections);
        });
        const total = guide.chapters.reduce((s, c) => s + (c.sections || 0), 0);
        const done = guide.chapters.reduce((s, c) => s + doneCount(c), 0);
        const meter = document.querySelector('.lr-rail-meter');
        if (meter) {
            meter.querySelector('.fill').style.width = (total ? Math.round(100 * done / total) : 0) + '%';
            meter.querySelector('.lr-rail-count').textContent = done + ' / ' + total + ' sections';
        }
    }

    function howTo() {
        const items = [
            ['Predict, then reveal', 'Each prompt has a box: commit to an answer before you reveal. Then grade yourself honestly. The grade is a record for you, not a score.'],
            ['Scroll or Step', 'Step shows one section at a time with Previous and Next (also the arrow keys). Use it when attention is thin.'],
            ['Core only', 'Hides every “Go deeper” block. First pass: core. Second pass: open the depth.'],
            ['Apply it, then drill', 'Some sections carry questions from the question modules, answered in place. Each section ends with links into the modules for the full set, on the spaced-repetition schedule.'],
        ];
        return h('div', 'lr-cards lr-cards--2', items.map((it) => h('div', 'lr-card', [txt('span', 'lr-card-h', it[0]), txt('p', 'lr-p', it[1])])));
    }

    function chapterEl(entry, ch) {
        const art = h('div', 'lr-chapter');
        const head = h('header', 'lr-head');
        head.appendChild(txt('span', 'lr-kicker', ch.kicker));
        head.appendChild(tx('h1', 'lr-title', ch.title));
        if (ch.lede) head.appendChild(tx('p', 'lr-lede', ch.lede));
        const meta = [];
        if (entry.min) meta.push('~' + entry.min + ' min');
        if (ch.src) meta.push(ch.src);
        if (meta.length) head.appendChild(txt('p', 'lr-meta', meta.join(' · ')));
        if (ch.sections && ch.sections.length) {
            const dots = h('div', 'lr-dots');
            ch.sections.forEach((s, i) => {
                const d = btn('lr-dot', String(i + 1), () => gotoSection(s.id));
                d.dataset.sec = s.id;
                d.title = s.title;
                dots.appendChild(d);
            });
            head.appendChild(dots);
        }
        art.appendChild(head);
        if (entry.id === 'start') art.appendChild(howTo());
        if (ch.intro) art.appendChild(renderBlocks(ch.intro, { ch: entry, sec: { id: 'intro', blocks: [] } }));
        if (ch.tldr && ch.tldr.length) {
            const t = h('section', 'lr-tldr', [txt('span', 'lr-label', '30-second version')]);
            t.appendChild(list('ul', { items: ch.tldr }));
            art.appendChild(t);
        }
        (ch.sections || []).forEach((s) => art.appendChild(sectionEl(ch, entry, s)));
        art.appendChild(chapterFoot(entry));
        return art;
    }

    function navList() { return guide.chapters.map((c) => c.id).concat(['deck', 'pearls']); }
    function chapterFoot(entry) {
        const ids = navList(), i = ids.indexOf(entry.id);
        const foot = h('div', 'lr-chfoot');
        const nxt = ids[i + 1];
        if (nxt) {
            const label = nxt === 'deck' ? 'Flashcards' : (guide.chapters.filter((c) => c.id === nxt)[0] || {}).short;
            foot.appendChild(btn('ok-btn ok-btn--primary', (entry.id === 'start' ? 'Begin: ' : 'Next: ') + label + ' →', () => navigate(nxt)));
        }
        return foot;
    }

    /* ---------- step / scroll, core-only ---------- */
    function sections() { return Array.prototype.slice.call(document.querySelectorAll('.lr-chapter .lr-sec')); }
    function applyMode() {
        const main = document.querySelector('.lr-main');
        if (!main) return;
        const stepping = rec.ui.mode === 'step' && sections().length > 0;
        main.classList.toggle('is-stepping', stepping);
        document.querySelectorAll('.lr-mode').forEach((b2) => b2.setAttribute('aria-pressed', String(b2.dataset.mode === (rec.ui.mode || 'scroll'))));
        const secs = sections();
        const bar = document.querySelector('.lr-stepbar');
        if (bar) bar.hidden = !stepping;
        if (!stepping) { secs.forEach((s) => s.classList.remove('is-off')); return; }
        let i = stepIdx[view];
        if (i == null) { i = secs.findIndex((s) => !rec.done[secKey(s._ctx.ch, s._ctx.sec)]); if (i < 0) i = 0; }
        i = Math.max(0, Math.min(secs.length - 1, i));
        stepIdx[view] = i;
        secs.forEach((s, j) => s.classList.toggle('is-off', j !== i));
        document.querySelectorAll('.lr-dot').forEach((d, j) => d.classList.toggle('is-cur', j === i));
        if (bar) {
            bar.querySelector('.lr-where').textContent = 'Section ' + (i + 1) + ' of ' + secs.length + ' · ' + secs[i]._ctx.sec.title;
            bar.querySelector('[data-step="-1"]').disabled = i === 0;
            const nx = bar.querySelector('[data-step="1"]');
            nx.textContent = i === secs.length - 1 ? 'Next chapter' : 'Next';
        }
    }
    function stepBy(d) {
        const secs = sections();
        const i = (stepIdx[view] || 0) + d;
        if (i >= secs.length) { const ids = navList(), n = ids[ids.indexOf(view) + 1]; if (n) navigate(n); return; }
        stepIdx[view] = Math.max(0, i);
        applyMode();
        window.scrollTo(0, 0);
    }
    function gotoSection(id, instant) {
        const secs = sections();
        const i = secs.findIndex((s) => s.id === id);
        if (i < 0) return;
        if (rec.ui.mode === 'step') { stepIdx[view] = i; applyMode(); window.scrollTo(0, 0); }
        else secs[i].scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
    }
    function applyCore() {
        const main = document.querySelector('.lr-main');
        if (main) main.classList.toggle('is-core', !!rec.ui.core);
        const b2 = document.querySelector('.lr-core');
        if (b2) b2.setAttribute('aria-pressed', String(!!rec.ui.core));
    }

    /* ============================================================
       Flashcards and pearls (need every chapter)
       ============================================================ */
    function loadAll(onProgress) {
        const real = guide.chapters.filter((c) => c.sections);
        let n = 0;
        return Promise.all(real.map((e) => getChapter(e).then((ch) => { n++; if (onProgress) onProgress(n, real.length); return { entry: e, ch: ch }; })));
    }

    function deckView(main) {
        const wrap = h('div', 'lr-chapter');
        const head = h('header', 'lr-head', [txt('span', 'lr-kicker', 'Flashcards'), txt('h1', 'lr-title', 'Every retrieval prompt, as a deck'), txt('p', 'lr-lede', 'The same prompts as the sections, with the same grades. Weak and ungraded cards come first when you pick that filter.')]);
        wrap.appendChild(head);
        const body = h('div', 'lr-deck', [txt('p', 'lr-loading', 'Loading chapters…')]);
        wrap.appendChild(body);
        main.appendChild(wrap);
        loadAll((n, t) => { body.firstChild.textContent = 'Loading chapters… ' + n + ' / ' + t; }).then((all) => {
            const cards = [];
            all.forEach((a) => (a.ch.sections || []).forEach((s) => (s.blocks || []).forEach((b) => {
                if (b.t === 'check') cards.push({ entry: a.entry, sec: s, b: b, key: checkKey(a.entry, s, b) });
            })));
            const F = { chapters: new Set(), mode: 'all', i: 0, order: [] };
            const filters = h('div', 'lr-filters');
            const modes = h('div', 'lr-seg');
            const stage = h('div', 'lr-stage');
            function pool() {
                let p = cards.filter((c) => !F.chapters.size || F.chapters.has(c.entry.id));
                if (F.mode === 'weak') p = p.filter((c) => rec.checks[c.key] !== undefined && rec.checks[c.key] < 2);
                if (F.mode === 'new') p = p.filter((c) => rec.checks[c.key] === undefined);
                return p;
            }
            function draw() {
                const p = pool();
                stage.replaceChildren();
                if (!p.length) { stage.appendChild(txt('p', 'lr-loading', F.mode === 'weak' ? 'No weak cards. Everything graded is at “partially” or better.' : 'No cards for this filter.')); return; }
                F.i = (F.i + p.length) % p.length;
                const c = p[F.i];
                const stem = lines(c.b.q);
                stage.appendChild(txt('span', 'lr-label', c.entry.short + ' · ' + c.sec.n + ' ' + c.sec.title + ' · ' + (F.i + 1) + ' / ' + p.length));
                stage.appendChild(promptCard({
                    stem: stem, answer: lines(c.b.a), grade: rec.checks[c.key],
                    onGrade: (g) => { rec.checks[c.key] = g; persist(); },
                }));
                const nav = h('div', 'lr-row', [
                    btn('ok-btn ok-btn--sm', '← Previous', () => { F.i--; draw(); }),
                    btn('ok-btn ok-btn--sm', 'Shuffle', () => { F.i = Math.floor(Math.random() * p.length); draw(); }),
                    btn('ok-btn ok-btn--sm', 'Next →', () => { F.i++; draw(); }),
                ]);
                stage.appendChild(nav);
            }
            [['all', 'All'], ['new', 'Ungraded'], ['weak', 'Weak']].forEach((m) => {
                const b2 = btn('lr-chipbtn', m[1], () => { F.mode = m[0]; F.i = 0; modes.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b2))); draw(); });
                b2.setAttribute('aria-pressed', String(m[0] === 'all'));
                modes.appendChild(b2);
            });
            all.forEach((a) => {
                const n = cards.filter((c) => c.entry.id === a.entry.id).length;
                if (!n) return;
                const b2 = btn('lr-chipbtn', a.entry.short + ' · ' + n, () => {
                    if (F.chapters.has(a.entry.id)) F.chapters.delete(a.entry.id); else F.chapters.add(a.entry.id);
                    b2.setAttribute('aria-pressed', String(F.chapters.has(a.entry.id)));
                    F.i = 0; draw();
                });
                b2.setAttribute('aria-pressed', 'false');
                filters.appendChild(b2);
            });
            body.replaceChildren(modes, filters, stage);
            draw();
        }).catch(() => { body.replaceChildren(txt('p', 'lr-loading', 'Could not load every chapter.')); });
    }

    function pearlsView(main) {
        const wrap = h('div', 'lr-chapter');
        wrap.appendChild(h('header', 'lr-head', [txt('span', 'lr-kicker', 'Pearls'), txt('h1', 'lr-title', 'Every board pearl in one scroll'), txt('p', 'lr-lede', 'Read them cold, then open the chapter for the reasoning behind any you cannot explain.')]));
        const body = h('div', 'lr-pearls', [txt('p', 'lr-loading', 'Loading chapters…')]);
        wrap.appendChild(body);
        main.appendChild(wrap);
        loadAll().then((all) => {
            body.replaceChildren();
            all.forEach((a) => (a.ch.sections || []).forEach((s) => (s.blocks || []).forEach((b) => {
                if (b.t !== 'call' || b.k !== 'pearl') return;
                const from = h('a', 'lr-pearl-from');
                from.href = '?g=' + encodeURIComponent(guide.slug) + '&c=' + encodeURIComponent(a.entry.id) + '#' + encodeURIComponent(s.id);
                from.textContent = a.entry.short + ' · ' + s.n + ' ' + s.title;
                from.addEventListener('click', (e) => { e.preventDefault(); navigate(a.entry.id, s.id); });
                body.appendChild(h('div', 'lr-pearl', [from, BLOCKS.call(b, { ch: a.entry, sec: s })]));
            })));
        }).catch(() => { body.replaceChildren(txt('p', 'lr-loading', 'Could not load every chapter.')); });
    }

    /* ============================================================
       Shell, routing
       ============================================================ */
    function rail() {
        const side = h('aside', 'lr-rail');
        side.appendChild(txt('span', 'lr-rail-kicker', guide.kicker));
        side.appendChild(txt('p', 'lr-rail-title', guide.title));
        const meter = h('div', 'lr-rail-meter', [h('span', 'bar', [h('span', 'fill')]), txt('span', 'lr-rail-count', '')]);
        side.appendChild(meter);
        const nav = h('nav', 'lr-navlist');
        nav.setAttribute('aria-label', 'Chapters');
        function item(id, k, label) {
            const a = h('a', 'lr-nav');
            a.href = '?g=' + encodeURIComponent(guide.slug) + '&c=' + encodeURIComponent(id);
            a.dataset.view = id;
            a.appendChild(txt('span', 'lr-nav-k', k));
            a.appendChild(txt('span', 'lr-nav-t', label));
            a.appendChild(txt('span', 'lr-nav-pct', ''));
            a.addEventListener('click', (e) => { e.preventDefault(); navigate(id); });
            nav.appendChild(a);
        }
        guide.chapters.forEach((c) => item(c.id, c.k ? String(c.k) : '·', c.short));
        nav.appendChild(h('hr', 'lr-nav-rule'));
        item('deck', 'F', 'Flashcards');
        item('pearls', 'P', 'Pearls');
        side.appendChild(nav);
        return side;
    }

    function toolbar() {
        const bar = h('div', 'lr-toolbar');
        const seg = h('div', 'lr-seg');
        seg.setAttribute('role', 'group');
        seg.setAttribute('aria-label', 'Reading mode');
        [['scroll', 'Scroll'], ['step', 'Step']].forEach((m) => {
            const b2 = btn('lr-chipbtn lr-mode', m[1], () => { rec.ui.mode = m[0]; persist(); applyMode(); window.scrollTo(0, 0); });
            b2.dataset.mode = m[0];
            seg.appendChild(b2);
        });
        bar.appendChild(seg);
        const core = btn('lr-chipbtn lr-core', 'Core only', () => { rec.ui.core = !rec.ui.core; persist(); applyCore(); });
        core.title = 'Hide the “Go deeper” blocks';
        bar.appendChild(core);
        return bar;
    }

    function stepbar() {
        const bar = h('div', 'lr-stepbar');
        bar.hidden = true;
        const prev = btn('ok-btn ok-btn--sm', 'Previous', () => stepBy(-1));
        prev.dataset.step = '-1';
        const next = btn('ok-btn ok-btn--sm ok-btn--primary', 'Next', () => stepBy(1));
        next.dataset.step = '1';
        bar.appendChild(prev);
        bar.appendChild(txt('span', 'lr-where', ''));
        bar.appendChild(next);
        return bar;
    }

    function mount() {
        const shell = h('div', 'lr-shell');
        shell.appendChild(rail());
        const main = h('main', 'lr-main');
        main.id = 'lr-main';
        shell.appendChild(main);
        root.replaceChildren(shell);
    }

    function entryFor(id) { return guide.chapters.filter((c) => c.id === id)[0] || null; }

    function render(id, secId) {
        view = id;
        rec.ui.last = id;
        persist();
        const main = document.getElementById('lr-main');
        main.replaceChildren();
        document.querySelectorAll('.lr-nav').forEach((a) => {
            if (a.dataset.view === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        const act = document.querySelector('.lr-nav[aria-current]');
        if (act && act.scrollIntoView && window.matchMedia('(max-width: 900px)').matches) act.scrollIntoView({ block: 'nearest', inline: 'center' });
        const col = h('div', 'lr-col');
        main.appendChild(col);
        if (id === 'deck') { deckView(col); main.classList.remove('is-stepping'); refreshChrome(); window.scrollTo(0, 0); return; }
        if (id === 'pearls') { pearlsView(col); main.classList.remove('is-stepping'); refreshChrome(); window.scrollTo(0, 0); return; }
        const entry = entryFor(id);
        col.appendChild(toolbar());
        col.appendChild(txt('p', 'lr-loading', 'Loading chapter…'));
        getChapter(entry).then((ch) => {
            if (view !== id) return;
            col.querySelector('.lr-loading').remove();
            col.appendChild(chapterEl(entry, ch));
            col.appendChild(stepbar());
            sections().forEach((s) => refreshSection(s._ctx, s));
            applyMode();
            applyCore();
            refreshChrome();
            observe();
            if (secId && sections().some((s) => s.id === secId)) gotoSection(secId, true);
            else window.scrollTo(0, 0);
        }).catch(() => {
            if (view !== id) return;
            const l = col.querySelector('.lr-loading');
            if (l) l.textContent = 'Could not load this chapter.';
        });
    }

    function navigate(id, secId) {
        if (id !== 'deck' && id !== 'pearls' && !entryFor(id)) return;
        const url = '?g=' + encodeURIComponent(guide.slug) + '&c=' + encodeURIComponent(id) + (secId ? '#' + encodeURIComponent(secId) : '');
        try { history.pushState(null, '', url); } catch (e) { /* file:// or sandbox */ }
        render(id, secId);
    }

    let io = null;
    function observe() {
        if (io) io.disconnect();
        if (!('IntersectionObserver' in window)) return;
        io = new IntersectionObserver((ents) => {
            if (rec.ui.mode === 'step') return;
            ents.forEach((en) => {
                if (!en.isIntersecting) return;
                document.querySelectorAll('.lr-dot').forEach((d) => d.classList.toggle('is-cur', d.dataset.sec === en.target.id));
            });
        }, { rootMargin: '-30% 0px -60% 0px' });
        sections().forEach((s) => io.observe(s));
    }

    function routeFromLocation() {
        let c = null, hash = '';
        try { c = new URLSearchParams(location.search).get('c'); hash = decodeURIComponent(location.hash.slice(1)); } catch (e) { /* malformed */ }
        const ok = c === 'deck' || c === 'pearls' || !!entryFor(c);
        return { id: ok ? c : (rec.ui.last && (rec.ui.last === 'deck' || rec.ui.last === 'pearls' || entryFor(rec.ui.last)) ? rec.ui.last : 'start'), sec: hash };
    }

    /* ---------- boot ---------- */
    let slug = null;
    try { slug = new URLSearchParams(location.search).get('g'); } catch (e) { /* no-op */ }
    guide = GUIDES.filter((g) => g.slug === slug)[0] || (!slug ? GUIDES[0] : null);
    if (!guide) { notice('Guide not found', 'No interactive guide matches “' + (slug || '') + '”.'); return; }
    document.title = guide.title + ' · Interactive learning · OKSAT | skflx.MD';
    const hue = (SUBS[guide.subspecialty] || {}).hue || guide.accent;
    if (/^#[0-9a-fA-F]{3,8}$/.test(hue || '')) root.style.setProperty('--lr-hue', hue);
    rec = OKSATStore.getLearn(guide.slug, reviewer);
    mount();
    const first = routeFromLocation();
    render(first.id, first.sec);
    window.addEventListener('popstate', () => { const r = routeFromLocation(); render(r.id, r.sec); });
    document.addEventListener('keydown', (e) => {
        if (rec.ui.mode !== 'step' || e.target.closest('textarea, input, select, summary')) return;
        if (e.key === 'ArrowRight') stepBy(1);
        else if (e.key === 'ArrowLeft') stepBy(-1);
    });
})();
