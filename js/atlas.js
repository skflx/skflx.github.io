/* =============================================================
   atlas.js — atlas.html. Hover or focus a group and it lights in its
   subspecialty hue (OKSAT_SUBSPECIALTIES) while the rest dim; the
   figure itself is baked by tools/atlas.mjs (docs/atlas.md).

     pointer   hover lights; a click follows a link, or pins an
               unlinked group's highlight
     touch     the first tap lights a group; the second follows its
               link (or releases the pin); a tap elsewhere clears
     keyboard  Tab reaches every interactive group; Enter or Space
               pins an unlinked one; Esc clears

   Nothing here reads the URL. Hues reach the page through
   style.setProperty (CSSOM), so the CSP needs no inline style.
   ============================================================= */
(function () {
    'use strict';
    var svg = null;
    try { svg = document.querySelector('.at-svg'); } catch (e) { /* no-op */ }
    if (!svg) return;

    var groups = Array.prototype.slice.call(svg.querySelectorAll('.at-group'));
    var SUBS = (window.OKSAT_SUBSPECIALTIES) || {};
    var hovered = null, focused = null, pinned = null, lit = null;
    var lastType = 'mouse';

    function interactive(g) { return !!g && g.getAttribute('aria-hidden') !== 'true'; }
    function groupOf(node) {
        try {
            var g = node && node.closest ? node.closest('.at-group') : null;
            return interactive(g) ? g : null;
        } catch (e) { return null; }
    }
    function hueOf(g) {
        var sub = SUBS[g.getAttribute('data-sub')];
        return sub && sub.hue ? sub.hue : null;
    }

    function refresh() {
        var want = hovered || focused || pinned;
        if (want === lit) return;
        lit = want;
        groups.forEach(function (g) {
            var on = !!want && g === want;
            g.classList.toggle('is-lit', on);
            g.classList.toggle('is-dim', !!want && !on && interactive(g));
            if (on) {
                var hue = hueOf(g);
                try { if (hue) g.style.setProperty('--hue', hue); else g.style.removeProperty('--hue'); } catch (e) { /* no-op */ }
            }
        });
    }

    svg.addEventListener('pointerover', function (e) {
        lastType = e.pointerType || 'mouse';
        if (lastType !== 'mouse') return;       /* touch hover is synthetic: taps do the work */
        hovered = groupOf(e.target);
        refresh();
    });
    svg.addEventListener('pointerleave', function (e) {
        if ((e.pointerType || 'mouse') !== 'mouse') return;
        hovered = null; refresh();
    });
    svg.addEventListener('pointerdown', function (e) { lastType = e.pointerType || 'mouse'; });
    svg.addEventListener('focusin', function (e) {
        /* only keyboard focus lights: a click's focus must not outlive the pin */
        var vis = true;
        try { vis = e.target.matches(':focus-visible'); } catch (err) { /* older engines: light on any focus */ }
        focused = vis ? groupOf(e.target) : null;
        refresh();
    });
    svg.addEventListener('focusout', function () { focused = null; refresh(); });

    svg.addEventListener('click', function (e) {
        var g = groupOf(e.target);
        if (!g) { pinned = null; refresh(); return; }
        var linked = g.hasAttribute('href');
        if (lastType === 'touch' || lastType === 'pen') {
            /* first tap lights, the second follows */
            if (pinned !== g) { e.preventDefault(); pinned = g; refresh(); return; }
            if (!linked) { pinned = null; refresh(); }
            return;                              /* a linked group: the default navigation runs */
        }
        if (!linked) { pinned = pinned === g ? null : g; refresh(); }
    });

    svg.addEventListener('keydown', function (e) {
        var g = groupOf(e.target);
        if (!g || g.hasAttribute('href')) return;       /* a link activates itself */
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            pinned = pinned === g ? null : g;
            refresh();
        }
    });

    /* a tap or click outside the figure clears a pin */
    document.addEventListener('pointerdown', function (e) {
        if (!pinned) return;
        try { if (svg.contains(e.target)) return; } catch (err) { return; }
        pinned = null; refresh();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        hovered = pinned = null; refresh();
    });
})();
