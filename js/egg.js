/* =============================================================
   egg.js — Easter-egg reveals (spec: plans/2026-10-28-figures-
   eggs-atlas.md §4.1). A trigger word unfolds an ASCII 3D figure
   in place:

     <span class="egg" data-egg="cochlea" role="button" tabindex="0"
           aria-expanded="false" aria-controls="egg-cochlea">electrode</span>
     <figure class="a3d egg-figure" id="egg-cochlea" data-a3d=cochlea>…</figure>

   - Selecting text that overlaps the trigger opens it (150 ms after
     the selection settles); deselecting never closes it.
   - Click / Enter / Space on the trigger toggles it.
   - Esc closes it while focus is in the trigger or the figure, and
     returns focus to the trigger.
   Every listener is delegated on document, so triggers rendered by
   a script later (Airway) work too. The figure is hidden pre-paint
   only under (scripting: enabled) in css/egg.css: without JS every
   egg is simply visible.
   ============================================================= */
(function () {
    if (typeof document === 'undefined') return;

    var SEL = '.egg[data-egg]';

    function figureFor(trigger) {
        try {
            var id = trigger.getAttribute('aria-controls');
            return id ? document.getElementById(id) : null;
        } catch (e) { return null; }
    }

    function isOpen(trigger) {
        return trigger.getAttribute('aria-expanded') === 'true';
    }

    function open(trigger) {
        var fig = figureFor(trigger);
        if (!fig || isOpen(trigger)) return;
        try {
            trigger.setAttribute('aria-expanded', 'true');
            fig.classList.add('is-open');
            /* the grid was fitted while hidden (zero width): refit now */
            if (window.ASCII3D && typeof window.ASCII3D.refresh === 'function') window.ASCII3D.refresh(fig);
        } catch (e) { /* no-op */ }
    }

    function close(trigger) {
        var fig = figureFor(trigger);
        if (!fig || !isOpen(trigger)) return;
        try {
            trigger.setAttribute('aria-expanded', 'false');
            fig.classList.remove('is-open');
        } catch (e) { /* no-op */ }
    }

    function toggle(trigger) {
        if (isOpen(trigger)) close(trigger); else open(trigger);
    }

    function triggerOf(node) {
        try {
            var el = node && node.nodeType === 1 ? node : node && node.parentElement;
            return el && el.closest ? el.closest(SEL) : null;
        } catch (e) { return null; }
    }

    /* Triggers the current (non-empty) selection overlaps. */
    function selectedTriggers() {
        var out = [];
        try {
            var sel = window.getSelection && window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) return out;
            var list = document.querySelectorAll(SEL);
            for (var r = 0; r < sel.rangeCount; r++) {
                var range = sel.getRangeAt(r);
                for (var i = 0; i < list.length; i++) {
                    if (list[i].getAttribute('data-egg') === 'portrait') continue;
                    if (out.indexOf(list[i]) === -1 && range.intersectsNode(list[i])) out.push(list[i]);
                }
            }
        } catch (e) { /* no-op */ }
        return out;
    }

    var timer = 0;
    document.addEventListener('selectionchange', function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            timer = 0;
            selectedTriggers().forEach(open);
        }, 150);
    });

    document.addEventListener('click', function (e) {
        var t = triggerOf(e.target);
        if (!t) return;
        /* the click that ends a selection gesture (drag or double-click
           over the word) only opens: it must not undo the selection's open */
        if (selectedTriggers().indexOf(t) !== -1) { open(t); return; }
        toggle(t);
    });

    document.addEventListener('keydown', function (e) {
        var k = e.key;
        var t = triggerOf(e.target);
        if (t && (k === 'Enter' || k === ' ' || k === 'Spacebar')) {
            e.preventDefault();             /* Space would scroll the page */
            toggle(t);
            return;
        }
        if (k !== 'Escape' && k !== 'Esc') return;
        if (t) { close(t); return; }
        /* focus inside an open figure: close it and return to its trigger */
        try {
            var fig = e.target && e.target.closest && e.target.closest('.egg-figure.is-open');
            if (!fig || !fig.id) return;
            var list = document.querySelectorAll(SEL);
            for (var i = 0; i < list.length; i++) {
                if (list[i].getAttribute('aria-controls') === fig.id) {
                    close(list[i]);
                    list[i].focus();
                    return;
                }
            }
        } catch (err) { /* no-op */ }
    });

    try { window.Egg = { open: open, close: close, toggle: toggle }; } catch (e) { /* no-op */ }
})();
