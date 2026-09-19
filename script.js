/* ═══ Air AQ — one script, one pass ═══════════════════════════════════════
   Everything the page needs, sharing cached DOM references and a single
   observer per job. No library, no polling, no work while off-screen.      */
(function () {
    'use strict';

    var win    = window;
    var doc    = document;
    var body   = doc.body;
    var reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO  = 'IntersectionObserver' in win;

    /* ── 0a. preloader ────────────────────────────────────────────────────
       One rAF loop owns the line: it eases toward 90% while the page is
       still loading, and once the page is ready and the floor has passed it
       runs the last stretch out to full. Then the overlay fades and scales
       away, the scroll unlocks, and the hero finishes the small distance it
       was already holding. Around 1.6s in the normal case, capped at 2.6s
       so a slow asset can never hold the door.                             */
    var pre = doc.getElementById('preloader');
    if (pre) {
        var preFill = pre.querySelector('.pre__fill');
        var PRE_MIN = reduce ? 400 : 1500;   /* the floor: the beat it holds */
        var PRE_MAX = reduce ? 900 : 2600;   /* the ceiling: never longer    */
        var PRE_END = 380;                   /* the run out to 100%          */

        var preT0    = performance.now();
        var preReady = doc.readyState === 'complete';
        var preFrom  = -1;                   /* when the final stretch began  */
        var preBase  = 0;                    /* and the width it started from */
        var preAt    = 0;
        var preGone  = false;

        if (!preReady) {
            win.addEventListener('load', function () { preReady = true; }, { once: true });
        }

        var preSet = function (v) {
            preAt = v;
            preFill.style.transform = 'scaleX(' + v.toFixed(4) + ')';
        };

        /* the hero is what the cover comes away from, so the page is put
           back to the top before the lock is released — Lenis included,
           since it carries its own idea of where the scroll is */
        var preTop = function () {
            if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
            win.scrollTo(0, 0);
        };

        var preOut = function () {
            if (preGone) return;
            preGone = true;

            preTop();
            pre.classList.add('is-out');
            body.classList.add('is-loaded');
            /* the scroll stays locked through the fade, so the page cannot
               move under the overlay while it is still on screen */
            setTimeout(function () {
                preTop();
                doc.documentElement.classList.remove('pre-on');
                if (pre.parentNode) pre.parentNode.removeChild(pre);
            }, 740);
        };

        var preTick = function (now) {
            var el = now - preT0;

            if (preFrom < 0) {
                /* the creep — asymptotic, so it never steps or overshoots */
                preSet(Math.min(.9, .9 * (1 - Math.pow(2, -el / 420))));
                if ((preReady && el >= PRE_MIN) || el >= PRE_MAX) {
                    preFrom = now;
                    preBase = preAt;         /* picked up exactly where it is */
                }
            } else {
                /* the last stretch, eased out to a stop at full width */
                var k = Math.min(1, (now - preFrom) / PRE_END);
                var e = 1 - Math.pow(1 - k, 3);
                preSet(preBase + (1 - preBase) * e);
                if (k === 1) { preOut(); return; }
            }
            requestAnimationFrame(preTick);
        };

        requestAnimationFrame(preTick);
    }

    /* ── 0. smooth scroll ─────────────────────────────────────────────────
       Lenis eases the page's own scroll position rather than animating
       anything itself, which is why it needs no wiring: every scrubbed
       effect here — the reveals, the device's settle, the carousel's centre
       card — already reads the real scroll position, so smoothing that one
       number smooths all of them at once.

       Off when motion is turned down, and skipped altogether if the library
       did not load — in which case the page scrolls exactly as it did.     */
    /* work that must run once per frame, after Lenis has moved the page —
       run by Lenis's own loop so nothing competes with it */
    var frameHooks = [];

    if (!reduce && typeof window.Lenis === 'function') {
        var lenis = new window.Lenis({
            /* the weight of the glide. `duration` rather than `lerp` — the two
               are alternatives and lerp wins where both are set, so it is gone:
               a fixed, unhurried settle is what the trust section's scrubbed
               sequence is built on, and it reads as weight rather than lag. */
            duration: 1.4,
            smoothWheel: true,
            /* a notch of wheel travel moves the page less far, which is what
               makes a long scrubbed run feel deliberate instead of flicked */
            wheelMultiplier: 0.75,
            touchMultiplier: 1,
            /* touch stays native: a drag should track the finger exactly,
               and the carousel is dragged inside it */
            syncTouch: false
        });

        var lenisFrame = function (t) {
            lenis.raf(t);
            for (var h = 0; h < frameHooks.length; h++) frameHooks[h](t);
            requestAnimationFrame(lenisFrame);
        };
        requestAnimationFrame(lenisFrame);
    }

    /* ── 0c. the small-screen menu ────────────────────────────────────────
       Below 1200px the four links live in a panel under the bar instead of in
       it. This is the whole of that: a class on .nav, mirrored on the button's
       aria-expanded, and the three ordinary ways out — a link, Escape, or a
       click anywhere else. The panel is a dropdown rather than a full-screen
       overlay, so nothing here touches the scroll and Lenis is untouched.   */
    var navBar    = doc.querySelector('.nav');
    var navToggle = doc.getElementById('nav-toggle');

    if (navBar && navToggle) {
        var navMQ   = win.matchMedia('(max-width: 1200px)');
        var navOpen = false;

        var navSet = function (open) {
            if (open === navOpen) return;
            navOpen = open;
            navBar.classList.toggle('is-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };

        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navSet(!navOpen);
        });

        /* a link is a destination: the panel has done its job */
        var navLinks = navBar.querySelectorAll('.nav__links a, .nav__cta');
        for (var nl = 0; nl < navLinks.length; nl++) {
            navLinks[nl].addEventListener('click', function () { navSet(false); });
        }

        doc.addEventListener('click', function (e) {
            if (navOpen && !navBar.contains(e.target)) navSet(false);
        });

        doc.addEventListener('keydown', function (e) {
            if (navOpen && (e.key === 'Escape' || e.key === 'Esc')) {
                navSet(false);
                navToggle.focus();
            }
        });

        /* the button is not on the page above 1200px, so a panel left open
           through a resize would have nothing to close it */
        var navSync = function () { if (!navMQ.matches) navSet(false); };
        if (navMQ.addEventListener) navMQ.addEventListener('change', navSync);
        else if (navMQ.addListener) navMQ.addListener(navSync);
    }

    /* ── 1. reveal on scroll ──────────────────────────────────────────────
       One observer for every [data-reveal] on the page. Items are visible by
       default; only once this runs does the CSS hide-then-reveal arm, so a
       script failure can never leave the page blank.                       */
    var reveals = doc.querySelectorAll('[data-reveal]');
    if (reveals.length) {
        if (!hasIO || reduce) {
            for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('is-in');
        } else {
            body.classList.add('js-reveal');
            var revealIO = new IntersectionObserver(function (entries) {
                for (var j = 0; j < entries.length; j++) {
                    if (!entries[j].isIntersecting) continue;
                    entries[j].target.classList.add('is-in');
                    revealIO.unobserve(entries[j].target);
                }
            }, { threshold: .15, rootMargin: '0px 0px -10% 0px' });
            for (var k = 0; k < reveals.length; k++) revealIO.observe(reveals[k]);
        }
    }

    /* ── 1b. the live-air band ────────────────────────────────────────────
       One line of airflow crosses the row, and each reading lights as it is
       reached. The whole sequence is a single rAF pass of about three and a
       half seconds that stops the moment it finishes — the beam's length,
       the head's position and the climbing figures all come out of the same
       loop, so there is one style write per reading per frame and nothing
       at all once it has landed.

       Finished figures are already in the markup, so with no script, no
       observer, or motion turned down, the band reads as written.         */
    var airdata = doc.querySelector('.airdata');
    if (airdata) {
        var anodes = airdata.querySelectorAll('.anode');

        if (anodes.length && hasIO && !reduce) {
            var BEAM  = 560,     /* ms for the line to cross one reading  */
                COUNT = 850,     /* ms for a figure to climb              */
                nodes = [];

            for (var a = 0; a < anodes.length; a++) {
                var num = anodes[a].querySelector('.anode__num');
                nodes.push({
                    el:     anodes[a],
                    num:    num,
                    to:     num ? (parseInt(num.getAttribute('data-to'), 10) || 0) : 0,
                    suffix: num ? (num.getAttribute('data-suffix') || '') : '',
                    start:  a * BEAM,          /* the line arrives here     */
                    live:   false,
                    done:   false
                });
                if (num) num.textContent = '0' + nodes[a].suffix;
            }

            /* hide-then-reveal only arms once the script is running */
            airdata.classList.add('is-armed');

            var t0 = 0;

            var airTick = function (now) {
                if (!t0) t0 = now;
                var el   = now - t0,
                    busy = false;

                for (var i = 0; i < nodes.length; i++) {
                    var it = nodes[i];
                    if (it.done) continue;
                    busy = true;

                    /* the line's own progress across this reading */
                    var p = (el - it.start) / BEAM;
                    if (p < 0) p = 0;
                    if (p > 1) p = 1;
                    it.el.style.setProperty('--p', p);
                    /* the head shows only while this length is being drawn */
                    it.el.style.setProperty('--spark', p > 0 && p < 1 ? 1 : 0);

                    /* it passes the sensor at the halfway mark — that is the
                       moment the reading wakes up */
                    if (!it.live && p >= .5) {
                        it.live = true;
                        it.el.classList.add('is-live');
                        it.countFrom = el;
                    }

                    if (!it.live) continue;

                    if (!it.num) {                       /* the word: CSS pulses it */
                        if (p === 1) it.done = true;
                        continue;
                    }

                    var c = (el - it.countFrom) / COUNT;
                    if (c > 1) c = 1;
                    /* easeOutExpo — quick off the mark, a long quiet landing */
                    var e = c === 1 ? 1 : 1 - Math.pow(2, -10 * c);
                    it.num.textContent = Math.round(it.to * e) + it.suffix;

                    if (c === 1 && p === 1) it.done = true;
                }

                if (busy) requestAnimationFrame(airTick);
            };

            /* The readings close the hero now, which means they are on the
               first screen and this observer fires the moment the page
               lays out — while the preloader is still covering it. Three
               and a half seconds of beam and climbing figures would then
               play out behind the cover and be finished before anyone saw
               them. So the sequence waits for the cover to come away: the
               same `is-loaded` the hero's own entrance is gated on, or no
               preloader at all, and it starts immediately. */
            var startAir = function () {
                if (body.classList.contains('is-loaded') || !doc.getElementById('preloader')) {
                    requestAnimationFrame(airTick);
                    return;
                }
                setTimeout(startAir, 100);
            };

            var airIO = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (!entries[i].isIntersecting) continue;
                    airIO.disconnect();
                    startAir();
                }
            }, { threshold: .3, rootMargin: '0px 0px -8% 0px' });

            airIO.observe(airdata);
        } else {
            /* no observer, or motion turned down: everything is simply on */
            for (var b = 0; b < anodes.length; b++) {
                anodes[b].classList.add('is-live');
                anodes[b].style.setProperty('--p', 1);
            }
        }
    }

    /* ── 2. nothing animates off-screen ───────────────────────────────────
       The hero alone runs ~24 looping animations (ribbons, motes, the glass
       cards). Parking them when their section leaves the viewport keeps the
       compositor idle while you read the rest of the page.                 */
    if (hasIO && !reduce) {
        var idleIO = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                entries[i].target.classList.toggle('is-idle', !entries[i].isIntersecting);
            }
        }, { rootMargin: '150px 0px' });

        var sections = doc.querySelectorAll('.hero, .airdata, .product, .assure, .whyaq, .howto, .contact, .foot');
        for (var s = 0; s < sections.length; s++) idleIO.observe(sections[s]);
    }

    /* ── 3. the showcase cards lean toward the cursor ─────────────────── */
    var showcase = doc.querySelector('.showcase');
    if (showcase && !reduce) {
        var box = null;
        showcase.addEventListener('pointerenter', function () {
            box = showcase.getBoundingClientRect();      /* measured once per hover */
        });
        showcase.addEventListener('pointermove', function (ev) {
            if (!box) box = showcase.getBoundingClientRect();
            showcase.style.setProperty('--px', ((ev.clientX - box.left) / box.width  - .5).toFixed(3));
            showcase.style.setProperty('--py', ((ev.clientY - box.top)  / box.height - .5).toFixed(3));
        }, { passive: true });
        showcase.addEventListener('pointerleave', function () {
            box = null;
            showcase.style.setProperty('--px', 0);
            showcase.style.setProperty('--py', 0);
        });
    }

    /* ── 4. the device settles as its section crosses the viewport ────────
       rAF-throttled, passive, and only subscribed while the section is
       actually near the screen — no measuring on every scroll of the page. */
    var device = doc.querySelector('.showcase__device');
    if (device && !reduce) {
        var queued = false, live = !hasIO;

        var settle = function () {
            queued = false;
            var r = device.getBoundingClientRect();
            var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
            device.style.setProperty('--drift', (Math.max(-1, Math.min(1, p)) * -16).toFixed(2) + 'px');
        };
        var onScroll = function () {
            if (live && !queued) { queued = true; requestAnimationFrame(settle); }
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (hasIO) {
            new IntersectionObserver(function (entries) {
                live = entries[0].isIntersecting;
                if (live) settle();
            }, { rootMargin: '200px 0px' }).observe(device);
        }
        settle();
    }

    /* ── 5. the use-case carousel ─────────────────────────────────────────
       Scrolling itself is the browser's: overflow-x plus scroll-snap already
       give trackpad, touch and momentum for free. This only adds the parts
       CSS has no answer for — the arrows, mouse drag, and marking whichever
       card sits nearest the centre so it can lift slightly.                */
    var track = doc.getElementById('usecase-track');
    if (track) {
        var cards = track.querySelectorAll('.usecase');
        var prev  = doc.querySelector('[data-carousel-prev]');
        var next  = doc.querySelector('[data-carousel-next]');
        var pending = false, watching = !hasIO;

        var step = function () {
            /* one card plus one gap, measured live so it survives a resize */
            if (cards.length < 2) return track.clientWidth;
            return Math.round(cards[1].getBoundingClientRect().left -
                              cards[0].getBoundingClientRect().left);
        };

        /* nearest-to-centre card is the active one; every card also gets a
           parallax offset proportional to how far off-centre it sits */
        var paint = function () {
            pending = false;
            var mid  = track.scrollLeft + track.clientWidth / 2;
            var best = 0, bestGap = Infinity;

            for (var i = 0; i < cards.length; i++) {
                var c   = cards[i];
                var gap = (c.offsetLeft + c.offsetWidth / 2) - mid;
                if (Math.abs(gap) < bestGap) { bestGap = Math.abs(gap); best = i; }
                if (!reduce) {
                    var img = c.querySelector('.usecase__img');
                    if (img) {
                        var p = Math.max(-1, Math.min(1, gap / track.clientWidth));
                        img.style.setProperty('--par', (p * -14).toFixed(1) + 'px');
                    }
                }
            }
            for (var j = 0; j < cards.length; j++) cards[j].classList.toggle('is-active', j === best);

            if (prev && next) {
                /* snapping parks the track a few px short of its true end, so
                   the forward arrow retires once the last card is fully in
                   view rather than when scrollLeft maxes out */
                var edge = track.getBoundingClientRect().right;
                prev.disabled = track.scrollLeft <= 2;
                next.disabled = cards[cards.length - 1].getBoundingClientRect().right <= edge + 1;
            }
        };

        var schedule = function () {
            if (watching && !pending) { pending = true; requestAnimationFrame(paint); }
        };

        track.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });

        var nudge = function (dir) {
            track.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
        };
        if (prev) prev.addEventListener('click', function () { nudge(-1); });
        if (next) next.addEventListener('click', function () { nudge(1); });

        /* mouse drag. Touch and trackpad are left entirely to the browser —
           hijacking them is what makes hand-rolled carousels feel wrong. */
        var down = false, startX = 0, startLeft = 0, moved = 0;

        track.addEventListener('pointerdown', function (ev) {
            if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
            down = true; moved = 0;
            startX = ev.clientX;
            startLeft = track.scrollLeft;
            track.classList.add('is-dragging');
        });

        track.addEventListener('pointermove', function (ev) {
            if (!down) return;
            var dx = ev.clientX - startX;
            if (Math.abs(dx) > moved) moved = Math.abs(dx);
            track.scrollLeft = startLeft - dx;
        }, { passive: true });

        var release = function (ev) {
            if (!down) return;
            down = false;
            track.classList.remove('is-dragging');
            /* a drag that travelled shouldn't also open the card underneath */
            if (moved > 6 && ev && ev.target) {
                var link = ev.target.closest ? ev.target.closest('.usecase__link') : null;
                if (link) {
                    var swallow = function (e) { e.preventDefault(); link.removeEventListener('click', swallow, true); };
                    link.addEventListener('click', swallow, true);
                }
            }
        };
        track.addEventListener('pointerup', release);
        track.addEventListener('pointercancel', release);
        track.addEventListener('pointerleave', release);

        /* no measuring while the section is nowhere near the screen */
        if (hasIO) {
            new IntersectionObserver(function (entries) {
                watching = entries[0].isIntersecting;
                if (watching) schedule();
            }, { rootMargin: '200px 0px' }).observe(track);
        }
        paint();
    }


    /* ── 6. the product flies into the trust section, and the act that
       follows it ──────────────────────────────────────────────────────────
       One device, one element, for the whole page — it is never cloned and
       never unmounted, so there is nothing to disappear and reappear.

       Two empty boxes say where it belongs: .showcase__slot, which holds the
       exact geometry it used to occupy on the product stage, and #trust-mark,
       the fixed rect it lands on in the trust section — 14.2%/31.5% of the
       held screen at 24.5% of its width. The device is lifted out of the flow
       (position: fixed, so neither section's clipping can cut it) and
       interpolated between whatever those two boxes measure on the current
       frame — never between remembered numbers. That is what keeps it exact
       through a resize, through the pin engaging, and through the pin letting
       go at the end. It is also why the second act can settle the product by
       doing nothing to the product: it transforms the mark, and the device
       follows because the mark is measured every frame.

       Then the trust section is held on one screen while its own scroll runs
       underneath. That scroll is one number, and everything the section does
       with it is a shaped slice of it: the product settling, the statement
       leaving, and an --in and an --out on each picture and each text.

       Skipped entirely when motion is turned down, and on narrower layouts
       where both sections restack and the two boxes no longer describe the
       same journey.                                                        */
    var flyShots = doc.querySelectorAll('.reel__shot');
    var flyTexts = doc.querySelectorAll('.reel__caption, .reel__note');

    var flyDevice = doc.querySelector('.showcase__device');
    var flySlot   = doc.querySelector('.showcase__slot');
    /* #trust-mark, not #trust-dock: the dock holds the trust section's left
       column open, the mark is the rect the product is actually drawn to —
       one fixed place on the held screen, so the landing is the same on every
       viewport. The dock is the fallback if the mark is ever not there. */
    var flyMark   = doc.getElementById('trust-mark') || doc.getElementById('trust-dock');
    var flyStory  = doc.getElementById('trust-reel');
    var flyStage  = doc.getElementById('product-showcase');
    var flyAir    = doc.querySelector('.assure');
    /* act three's landing: the empty box in the middle of the Why Choose Air AQ
       orbit. Optional — with it absent the journey ends where it always did. */
    var flyWhy    = doc.getElementById('why-mark');
    var flyWhyAir = doc.querySelector('.whyaq');

    if (flyDevice && flySlot && flyMark && flyStory && flyStage && !reduce) {
        var flyMQ = win.matchMedia('(min-width: 1201px)');
        var flyOn = false, flyQueued = false, flyLive = !hasIO, flyW = 0, flyDown = false,
            flySettled = false;

        var flyClamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
        /* smoothstep, so a departure and a landing are both unhurried and the
           middle of a journey carries most of the distance */
        var flyEase  = function (v) { return v * v * (3 - 2 * v); };
        var flySlice = function (p, from, to) {
            return flyEase(flyClamp((p - from) / (to - from)));
        };

        /* smootherstep, for the photographs' own travel. Smoothstep above
           leaves the curve with acceleration still on it at both ends, which
           over a long slide reads as a picture that gets going a little
           suddenly and stops a little short. This one is flat in both the
           first and the second derivative at 0 and at 1: it leans into the
           journey from a standstill, carries the distance through the middle,
           and comes to rest without a last-moment check. Nothing snaps, and
           the frame the travel ends on is the frame it was already on. */
        var flyEaseSoft  = function (v) {
            return v * v * v * (v * (v * 6 - 15) + 10);
        };
        var flySliceSoft = function (p, from, to) {
            return flyEaseSoft(flyClamp((p - from) / (to - from)));
        };

        /* How the track is shared out, in the same svh the CSS lays it out in:
           the first act, and then one stretch for each picture after the first.
           Just under a screen apiece: a picture that crosses in much less
           less reads as a slide changing rather than as something arriving,
           however smooth the scrolling under it is, so each one is given half
           a screen more of scroll than the travel could ever need — the slide
           itself takes about two thirds of the stretch and the rest is the
           picture standing still with its words under it. Change these and
           --act2 changes with them, or the two drift apart. */
        var flyAct1 = 88, flyStep = 66;
        var flyN    = flyShots.length;
        var flyTot  = flyAct1 + (flyN - 1) * flyStep;
        var flyF0   = flyAct1 / flyTot;     /* where the first act ends */
        var flySeg  = flyStep / flyTot;     /* and what each picture gets after */

        /* Picture i's travel across the screen, as a slice of the scrub. The
           first one's is the first act's own — it arrives while the statement
           is still leaving — and every one after it owns its whole stretch. */
        var flyFrom = function (i) { return i ? flyF0 + (i - 1) * flySeg : .24 * flyF0; };
        var flySpan = function (i) { return i ? .68 * flySeg : .55 * flyF0; };

        var flyPaint = function () {
            flyQueued = false;
            if (!flyOn) return;

            var vh    = win.innerHeight;
            var sect  = flyStage.getBoundingClientRect();
            var story = flyStory.getBoundingClientRect();

            /* ---- act one: the flight -------------------------------------
               where the journey ends. The trust section is held on one screen,
               so its top edge never reaches the top of the viewport: ending on
               story.top === 0 would leave the device a few percent short of its
               dock for ever. The reachable end is the story settling into the
               middle of the screen, taken a little low so the landing completes
               with scroll still to spare. The gap between the two sections is
               fixed — they move together — so this is one linear mapping.    */
            var gap  = story.top - sect.bottom;
            var stop = vh * .56 - story.height / 2;
            var span = vh - stop + gap;
            var t = span > 0
                ? flyClamp((vh - sect.bottom) / span)
                : (sect.bottom <= vh ? 1 : 0);
            var e = flyEase(t);

            /* ---- act two: the scroll the held section runs on -------------
               p is how far through it we are: 0 as the stage pins, 1 as it lets
               go. The section's own box carries that length, so it is measured
               rather than assumed. */
            var act = flyAir ? flyAir.getBoundingClientRect() : story;
            var run = act.height - story.height;
            var p   = run > 0 ? flyClamp(-act.top / run) : 0;

            var home = flySlot.getBoundingClientRect();
            var dock = flyMark.getBoundingClientRect();
            if (!home.width || !dock.width) return;

            /* ---- act three: down into Why Choose Air AQ ------------------
               The same device, carried on down. Two things make it one
               continuous move rather than a hand-off:

               First, the dock is held. #trust-mark lives inside the pinned
               stage, so the moment the pin lets go the dock starts scrolling
               up and anything drawn to it would leave with it. Subtracting the
               stage's own travel gives where the dock would be if the pin were
               still holding — a measured value, not a remembered one, and
               identical to dock.top for the whole time the pin is engaged, so
               there is nothing to cross over at the release.

               Second, the journey is a slice of scroll, not a slice of the
               trust scrub: g is how far the landing box still has to come
               before it rests a little above the middle of the screen. It
               opens just after the last photograph settles, carries the device
               across about two screens of scroll, and closes with the device
               on the box exactly — after which it simply stays on it, which is
               the same thing as belonging to the section.                  */
            var hold = dock.top - (story.top < 0 ? story.top : 0);

            var g = 0, why = null;
            if (flyWhy) {
                why = flyWhy.getBoundingClientRect();
                if (why.width) {
                    g = flyEaseSoft(flyClamp(
                        1 - (why.top - (vh * .52 - why.height / 2)) / (vh * 1.85)));
                } else {
                    why = null;
                }
            }

            /* the fixed device needs a real width; it only ever changes on a
               resize, so it is written on change rather than every frame */
            if (home.width !== flyW) {
                flyW = home.width;
                flyDevice.style.width = flyW + 'px';
            }

            /* one rect, built in order: the stage, then the trust dock, then
               the orbit's middle. Each leg is a plain interpolation of numbers
               measured on this frame, so a resize, the pin engaging and the pin
               letting go all land on the right place without being told. */
            var fx = home.left  + (dock.left  - home.left)  * e;
            var fy = home.top   + (hold       - home.top)   * e;
            var fw = home.width + (dock.width - home.width) * e;

            if (why) {
                fx += (why.left  - fx) * g;
                fy += (why.top   - fy) * g;
                fw += (why.width - fw) * g;
            }

            var st = flyDevice.style;
            st.setProperty('--fx', fx.toFixed(2) + 'px');
            st.setProperty('--fy', fy.toFixed(2) + 'px');
            /* scale, never width: the shell and its shadow stay one shape and
               the SVG is never re-laid-out mid-flight. Both docks' transforms
               are already in the rects above, so the settle comes along free. */
            st.setProperty('--fs',   (fw / home.width).toFixed(4));
            /* the hover settle belongs to the stage, so it fades out with it */
            st.setProperty('--rest', (1 - e).toFixed(3));
            /* how far into the light the device is, for the shadows it wears */
            st.setProperty('--lit',  g.toFixed(3));

            /* the benefits wait for the product. Latched: once the device has
               arrived the section stays revealed, so scrolling back up and down
               cannot take the six away again. */
            if (flyWhyAir && g > .82 && !flySettled) {
                flySettled = true;
                flyWhyAir.classList.add('is-settled');
            }

            /* the caption under the device waits for the landing itself: the
               class flips only in the last breath of the journey, so the text
               can never arrive while the product is still moving */
            var down = t > .985;
            if (down !== flyDown) {
                flyDown = down;
                flyStory.classList.toggle('is-landed', down);
            }

            var pd = flySlice(p, 0, .78 * flyF0);   /* the product settles smaller */
            var pc = flySlice(p, 0, .40 * flyF0);   /* and the statement leaves */

            var rs = flyStory.style;
            rs.setProperty('--p2',  pd.toFixed(4));
            rs.setProperty('--p2c', pc.toFixed(4));

            var shift = pc > .5;
            flyStory.classList.toggle('is-shift', shift);

            /* Each picture comes in over its own stretch, and goes out over the
               first half of the one after it — so the two cross, and the place
               they cross in is the one cell they all live in. The last one
               never leaves: it is what the section closes on. */
            var i, ws, wl, ts, te;
            for (i = 0; i < flyN; i++) {
                ws = flyFrom(i);
                wl = flySpan(i);
                flyShots[i].style.setProperty('--in', flySliceSoft(p, ws, ws + wl).toFixed(4));

                /* the words under the picture wait for it: --in is clamped at 1
                   the moment the travel ends, so it cannot say anything about
                   what happens after that. --txt is the slice that starts
                   exactly there and runs partway into the rest the picture then
                   has — the gap between it landing and the next one starting
                   across, which is what `te` is. Every picture gets the same
                   share of its own gap, so the beat between arriving and
                   speaking is the same one every time. */
                ts = ws + wl;
                te = flyFrom(i + 1);
                flyShots[i].style.setProperty('--txt',
                    flySliceSoft(p, ts, ts + .45 * Math.max(te - ts, 1e-4)).toFixed(4));

                ws = flyFrom(i + 1);
                wl = flySpan(i + 1);
                flyShots[i].style.setProperty('--out',
                    (i + 1 < flyN ? flySliceSoft(p, ws, ws + .58 * wl) : 0).toFixed(4));
            }

            /* The texts hand over inside their picture's travel, not on their
               own clock: a text goes once the picture that replaces its own is
               about half way across, and the next arrives as that picture
               lands. Text j belongs to picture j - 1; text 0 is the caption,
               which belongs to the device and is only ever taken over from. */
            var j;
            for (j = 0; j < flyTexts.length; j++) {
                if (j) {
                    ws = flyFrom(j - 1);
                    wl = flySpan(j - 1);
                    flyTexts[j].style.setProperty('--in',
                        flySlice(p, ws + .70 * wl, ws + 1.12 * wl).toFixed(4));
                }
                ws = flyFrom(j);
                wl = flySpan(j);
                flyTexts[j].style.setProperty('--out',
                    (j < flyN ? flySlice(p, ws + .44 * wl, ws + .78 * wl) : 0).toFixed(4));
            }
        };

        var flyEnable = function () {
            if (flyOn) return;
            flyOn = true;
            flyPaint();                 /* place it *before* it goes fixed */
            flyDevice.classList.add('is-flying');
            /* the Why Choose Air AQ section shows the mark instead of its own
               vector only while this is on the page */
            body.classList.add('js-fly');
        };

        var flyDisable = function () {
            if (!flyOn) return;
            flyOn = false;
            flyDevice.classList.remove('is-flying');
            flyStory.classList.remove('is-landed');
            flyStory.classList.remove('is-shift');
            body.classList.remove('js-fly');
            if (flyWhyAir) flyWhyAir.classList.remove('is-settled');
            flyDevice.style.width = '';
            flyW = 0;
            flyDown = false;
            flySettled = false;

            var st = flyDevice.style;
            st.removeProperty('--fx');
            st.removeProperty('--fy');
            st.removeProperty('--fs');
            st.removeProperty('--rest');
            st.removeProperty('--lit');

            var rs = flyStory.style;
            rs.removeProperty('--p2');
            rs.removeProperty('--p2c');

            var n;
            for (n = 0; n < flyShots.length; n++) {
                flyShots[n].style.removeProperty('--in');
                flyShots[n].style.removeProperty('--out');
            }
            for (n = 0; n < flyTexts.length; n++) {
                flyTexts[n].style.removeProperty('--in');
                flyTexts[n].style.removeProperty('--out');
            }
        };

        var onFly = function () {
            if (flyOn && flyLive && !flyQueued) {
                flyQueued = true;
                requestAnimationFrame(flyPaint);
            }
        };

        win.addEventListener('scroll', onFly, { passive: true });
        win.addEventListener('resize', onFly, { passive: true });

        /* nothing is measured while both ends of the journey are off-screen */
        if (hasIO) {
            /* the third end matters: without it the observer would stop the
               paint as the trust section left, in the middle of the travel */
            var flyEnds = [flyStage, flyAir || flyStory, flyWhyAir];
            var flyNear = [false, false, false];
            var flyIO = new IntersectionObserver(function (entries) {
                for (var n = 0; n < entries.length; n++) {
                    var idx = flyEnds.indexOf(entries[n].target);
                    if (idx > -1) flyNear[idx] = entries[n].isIntersecting;
                }
                flyLive = flyNear[0] || flyNear[1] || flyNear[2];
                if (flyLive) flyPaint();
            }, { rootMargin: '300px 0px' });
            flyIO.observe(flyEnds[0]);
            flyIO.observe(flyEnds[1]);
            if (flyEnds[2]) flyIO.observe(flyEnds[2]);
        }

        var flySync = function () {
            if (flyMQ.matches) flyEnable(); else flyDisable();
        };
        if (flyMQ.addEventListener) flyMQ.addEventListener('change', flySync);
        else if (flyMQ.addListener) flyMQ.addListener(flySync);

        flySync();
    }

    /* ── 6. how Air AQ works ──────────────────────────────────────────────
       One line crossing four stages. On the wide layout the section pins and
       the line is scrubbed by the scroll itself: each stage owns a slice of
       the run, and `--sp` — the only value written per frame — is how far
       through its own slice the line has travelled. A stage wakes when the
       line reaches its node, halfway across, and everything inside it from
       that point on is CSS.

       Anywhere the pin is off — tablet, phone, motion turned down — the same
       `--sp` is transitioned instead of scrubbed, off one observer per stage,
       so the stages read the same way straight down the page.

       Nothing here is armed until the script runs, so with no JS the four
       stages simply render finished.                                       */
    var howto = doc.querySelector('.howto');
    var howBox = howto && howto.querySelector('.howto__box');
    var howStory = howto && howto.querySelector('.howto__story');

    if (howto && howBox && howStory) {
        var howSteps = howto.querySelectorAll('.step');
        var howN = howSteps.length;

        if (howN) howto.classList.add('is-armed');

        /* stage i's slice of the run, with a beat at each end so the section
           arrives and leaves with the line at rest */
        var howLead = .05, howSpan = .20;
        var howGap  = howN > 1 ? (1 - howLead * 2 - howSpan) / (howN - 1) : 0;
        var howFrom = function (i) { return howLead + i * howGap; };

        var howClamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

        /* --- wide: the pin ------------------------------------------------ */
        if (howN && !reduce) {
            var howMQ = win.matchMedia('(min-width: 1201px)');
            var howOn = false, howQueued = false, howLive = !hasIO;

            var howPaint = function () {
                howQueued = false;
                if (!howOn) return;

                var box = howBox.getBoundingClientRect();
                var run = box.height - howStory.getBoundingClientRect().height;
                var p   = run > 0 ? howClamp(-box.top / run) : 0;

                for (var i = 0; i < howN; i++) {
                    /* linear across a stage: the line is travelling, and an
                       ease on every slice would read as it checking itself
                       four times on the way over */
                    var sp = howClamp((p - howFrom(i)) / howSpan);
                    var st = howSteps[i].style;
                    st.setProperty('--sp', sp.toFixed(4));
                    st.setProperty('--spark', sp > 0 && sp < 1 ? 1 : 0);
                    /* it passes the node at the halfway mark — that is when
                       the stage wakes */
                    howSteps[i].classList.toggle('is-live', sp >= .5);
                }
            };

            var onHow = function () {
                if (howOn && howLive && !howQueued) {
                    howQueued = true;
                    requestAnimationFrame(howPaint);
                }
            };

            var howEnable = function () {
                if (howOn) return;
                howOn = true;
                howto.classList.add('is-scrub');
                howPaint();
            };

            var howDisable = function () {
                if (!howOn) return;
                howOn = false;
                howto.classList.remove('is-scrub');
                for (var i = 0; i < howN; i++) {
                    howSteps[i].style.removeProperty('--sp');
                    howSteps[i].style.removeProperty('--spark');
                }
                howStack();                       /* hand back to the observer */
            };

            win.addEventListener('scroll', onHow, { passive: true });
            win.addEventListener('resize', onHow, { passive: true });

            if (hasIO) {
                var howIO = new IntersectionObserver(function (entries) {
                    for (var n = 0; n < entries.length; n++) howLive = entries[n].isIntersecting;
                    if (howLive) howPaint();
                }, { rootMargin: '300px 0px' });
                howIO.observe(howBox);
            }
        }

        /* --- everywhere else: one observer per stage ---------------------- */
        var howStacked = false;
        var howStack = function () {
            if (howStacked || !howN) return;
            howStacked = true;

            if (!hasIO || reduce) {
                for (var i = 0; i < howN; i++) howSteps[i].classList.add('is-live');
                return;
            }
            var stackIO = new IntersectionObserver(function (entries) {
                for (var n = 0; n < entries.length; n++) {
                    if (!entries[n].isIntersecting) continue;
                    entries[n].target.classList.add('is-live');
                    stackIO.unobserve(entries[n].target);
                }
            }, { threshold: .3, rootMargin: '0px 0px -12% 0px' });
            for (var k = 0; k < howN; k++) stackIO.observe(howSteps[k]);
        };

        if (howN && !reduce && typeof howMQ !== 'undefined') {
            var howSync = function () {
                if (howMQ.matches) { howEnable(); return; }
                howDisable();          /* no-op unless the pin was running */
                howStack();
            };
            if (howMQ.addEventListener) howMQ.addEventListener('change', howSync);
            else if (howMQ.addListener) howMQ.addListener(howSync);
            howSync();
        } else {
            howStack();
        }
    }

    /* ── 8. the how-it-works film ─────────────────────────────────────────
       The film never plays on its own clock: its position is the scroll.
       Across the pinned run (wide layout) — or, where there is no pin, across
       the section passing the screen — progress 0 → 1 maps to 0 → duration.

       Scroll only sets a target. Once per frame (inside Lenis's loop when it
       is running, otherwise a plain rAF) the shown time eases toward that
       target, and a new seek is only issued once the previous one has
       landed, so the decoder is never queued up and the picture never jumps.
       Stop scrolling and it settles on that exact frame; scroll up and it
       runs backward the same way. Off-screen, the frame work returns early.

       The file is encoded with every frame a keyframe, so any seek — forward
       or back — decodes exactly one frame. With the usual 2-second keyframe
       spacing each seek decoded dozens, which is what made it stutter.  */
    var film = doc.querySelector('.howto__filmEl');
    var filmBox = film && doc.querySelector('.howto__box');
    var filmStory = film && doc.querySelector('.howto__story');
    if (film && filmBox && filmStory && !reduce) {
        var filmNear  = !hasIO;
        var filmTop   = 0, filmRun = 1;   /* measured, not read per frame */
        var smoothTime = 0;               /* the eased time being shown    */
        var filmLast  = 0;
        var filmDur   = 0;                /* cached once metadata is in    */
        var filmHalf  = 1 / 48;           /* half a frame at 24fps         */
        var filmPrimed = false;

        film.loop = false;
        film.muted = true;
        film.pause();

        var filmMeasure = function () {
            var r  = filmBox.getBoundingClientRect();
            var vh = win.innerHeight || doc.documentElement.clientHeight;
            var y  = win.pageYOffset || doc.documentElement.scrollTop;
            var pin = r.height - filmStory.getBoundingClientRect().height;
            if (pin > 1) {
                /* pinned: from the lock to the release */
                filmTop = r.top + y;
                filmRun = pin;
            } else {
                /* stacked: from the section's top reaching the screen's top
                   to its bottom reaching the screen's bottom — or, when it is
                   shorter than the screen, across its whole pass */
                var span = r.height - vh;
                if (span > 1) { filmTop = r.top + y; filmRun = span; }
                else { filmTop = r.top + y - vh; filmRun = vh + r.height; }
            }
        };

        /* iOS will not paint a seeked frame until the element has played
           once — a muted play/pause primes it without anything showing */
        var filmPrime = function () {
            if (filmPrimed) return;
            filmPrimed = true;
            var p = film.play();
            if (p && p.then) p.then(function () { film.pause(); }, function () {});
            else film.pause();
        };

        var filmFrame = function (t) {
            if (!filmNear || !filmDur) { filmLast = t; return; }

            var y = filmLenis ? filmLenis.scroll : (win.pageYOffset || doc.documentElement.scrollTop);
            var p = (y - filmTop) / filmRun;
            p = p < 0 ? 0 : p > 1 ? 1 : p;
            /* stop a hair short of the end so the last frame stays shown */
            var targetTime = p * (filmDur - .04);

            /* smoothTime chases targetTime by a fixed share of the gap each
               frame (0.1 at 60fps, scaled so any refresh rate feels the same):
               it keeps pace while the scroll is moving and, once the scroll
               stops, the shrinking gap makes it decelerate into the exact
               frame instead of halting dead. */
            var dt = filmLast ? Math.min(t - filmLast, 64) : 16.7;
            filmLast = t;
            var diff = targetTime - smoothTime;
            if (diff < .002 && diff > -.002) smoothTime = targetTime;   /* settled */
            else smoothTime += diff * (1 - Math.pow(1 - .1, dt / 16.7));

            /* seek only when it lands on a different frame, and never while
               the previous seek is still decoding */
            var shown = film.currentTime;
            if (!film.seeking && (smoothTime - shown > filmHalf || shown - smoothTime > filmHalf)) {
                film.currentTime = smoothTime;
            }
        };

        var filmLenis = (typeof lenis !== 'undefined' && lenis) ? lenis : null;
        if (filmLenis) {
            frameHooks.push(filmFrame);
        } else {
            /* no Lenis: one rAF of its own, running only while near */
            var filmLooping = false;
            var filmLoop = function (t) {
                filmFrame(t);
                if (filmNear) win.requestAnimationFrame(filmLoop);
                else filmLooping = false;
            };
            var filmStart = function () {
                if (filmLooping) return;
                filmLooping = true;
                win.requestAnimationFrame(filmLoop);
            };
        }

        filmMeasure();
        win.addEventListener('resize', filmMeasure, { passive: true });
        win.addEventListener('load', filmMeasure);
        var filmMeta = function () {
            var d = film.duration;
            filmDur = d && isFinite(d) ? d : 0;
            filmMeasure();
        };
        film.addEventListener('loadedmetadata', filmMeta);
        if (film.readyState >= 1) filmMeta();

        if (hasIO) {
            new IntersectionObserver(function (entries) {
                filmNear = entries[0].isIntersecting;
                if (filmNear) {
                    filmMeasure();
                    filmPrime();
                    if (!filmLenis) filmStart();
                }
            }, { rootMargin: '100% 0px' }).observe(filmBox);
        } else {
            filmPrime();
            if (!filmLenis) filmStart();
        }
    }

    /* ── 9. back to top ───────────────────────────────────────────────────
       One passive scroll listener, gated on a flag so the class is only
       touched when the answer actually changes, and the same rAF discipline
       as everything else here. The scroll itself is handed to Lenis when it
       is running, so the trip up is the page's own easing rather than a
       second, competing animation; without it, native smooth scroll.      */
    var toTop = doc.getElementById('to-top');
    if (toTop) {
        var topUp     = false;
        var topQueued = false;

        var topRead = function () {
            topQueued = false;
            /* a screen and a half: far enough that the corner is not asking
               to undo a scroll the reader has barely started */
            var show = (win.pageYOffset || doc.documentElement.scrollTop) > win.innerHeight * 1.5;
            if (show === topUp) return;
            topUp = show;
            toTop.classList.toggle('is-up', show);
        };

        var onTop = function () {
            if (topQueued) return;
            topQueued = true;
            requestAnimationFrame(topRead);
        };

        toTop.addEventListener('click', function () {
            if (typeof lenis !== 'undefined' && lenis) { lenis.scrollTo(0); return; }
            win.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        });

        win.addEventListener('scroll', onTop, { passive: true });
        win.addEventListener('resize', onTop, { passive: true });

        toTop.hidden = false;              /* the script is here: it can appear */
        topRead();
    }

    /* ── 10. the trust story, sideways on the stacked layout ──────────────
       The wide layout tells this story horizontally already, on the same
       scroll that holds the section — but all of it hangs off the product's
       flight, which needs #showcase__slot and #trust-mark, and both of those
       are display:none below 1201px. So this is the same story driven on its
       own: no flight to measure, one number to write.

       --sp is where the line of slides sits, in screens. Three slides means
       two transitions, and the sum of two eased ramps is a single number that
       walks 0 -> 1 -> 2 and holds still between them: the rests are what is
       left over, so there is nothing to keep in step and no state to get
       wrong. The band for each transition is the middle of its half, which
       leaves a stretch of scroll on img1 before the first move, on img3
       between the two, and on img6 after the last one before the pin lets go.

       Everything is scoped by a matchMedia: crossing 1200px in either
       direction adds or removes the class, the listeners and the custom
       properties, so neither layout is ever left holding the other's state. */
    var hsAir   = doc.querySelector('.assure');
    var hsReel  = doc.getElementById('trust-reel');
    var hsShots = doc.querySelectorAll('.reel__shot');

    if (hsAir && hsReel && hsShots.length > 1 && !reduce) {
        var hsMQ = win.matchMedia('(max-width: 1200px)');
        /* the statement is slide 0 and the three pictures are 1..3, so the line
           carries one more than there are photographs */
        var hsN  = hsShots.length + 1;
        var hsOn = false, hsQueued = false;

        var hsClamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
        /* smootherstep: zero speed *and* zero acceleration at both ends, so a
           slide leaves from a standstill and arrives without a check — the
           same easing the wide layout's pictures travel on */
        var hsEase = function (v) { return v * v * v * (v * (v * 6 - 15) + 10); };
        var hsSlice = function (p, a, b) { return hsEase(hsClamp((p - a) / (b - a))); };

        var hsPaint = function () {
            hsQueued = false;
            if (!hsOn) return;

            var act = hsAir.getBoundingClientRect();
            var run = act.height - hsReel.getBoundingClientRect().height;
            if (run <= 0) return;                     /* nothing pinned yet */

            var p = hsClamp(-act.top / run);

            var sp  = 0;
            var seg = 1 / (hsN - 1);
            for (var i = 0; i < hsN - 1; i++) {
                sp += hsSlice(p, i * seg + seg * .26, i * seg + seg * .74);
            }

            hsReel.style.setProperty('--sp', sp.toFixed(4));
            /* the statement stops being clickable once it is on its way out */
            hsReel.classList.toggle('is-shift', sp > .5);
        };

        var onHs = function () {
            if (hsQueued || !hsOn) return;
            hsQueued = true;
            requestAnimationFrame(hsPaint);
        };

        var hsEnable = function () {
            if (hsOn) return;
            hsOn = true;
            body.classList.add('js-hstory');
            win.addEventListener('scroll', onHs, { passive: true });
            win.addEventListener('resize', onHs, { passive: true });
            /* a frame later: the class above is what gives the section its
               height, and the first paint has to measure the new box */
            requestAnimationFrame(hsPaint);
        };

        var hsDisable = function () {
            if (!hsOn) return;
            hsOn = false;
            win.removeEventListener('scroll', onHs);
            win.removeEventListener('resize', onHs);
            body.classList.remove('js-hstory');
            hsReel.classList.remove('is-shift');
            hsReel.style.removeProperty('--sp');
        };

        var hsSync = function () {
            if (hsMQ.matches) hsEnable(); else hsDisable();
        };

        if (hsMQ.addEventListener) hsMQ.addEventListener('change', hsSync);
        else if (hsMQ.addListener) hsMQ.addListener(hsSync);
        hsSync();
    }


}());
