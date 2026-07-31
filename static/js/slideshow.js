/* ---- Slideshow: swipable image carousel with dots and arrows ---- */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".slideshow:not(.video-slideshow)").forEach(initSlideshow);
    document.querySelectorAll(".video-slideshow").forEach(initVideoSlideshow);
});

/**
 * Drives a `.slideshow-track` as a ring.
 *
 * step() always travels one slide in the direction asked for, so stepping
 * forwards off the last slide moves the images left like every other forward
 * step, rather than rewinding the whole strip; jump() — the dots — takes
 * whichever way round is shorter.
 *
 * Nothing is cloned to manage it. The video carousel's slides own <video> ids
 * that a comparison slider has already bound a canvas to, so a duplicate would
 * collide on id and then sit there undrawn. Instead the slides about to be
 * crossed are lifted a whole strip width to the far end for the length of the
 * animation, which puts them beside the current slide in ring order, and the
 * track animates onto them at an out-of-bounds offset. Lifting is a transform,
 * which doesn't move a flex item's box, so the strip's layout never changes.
 */
function createRingTrack(track, slides, onChange) {
    const count = slides.length;
    let current = 0;
    let wrapping = false;
    let fallbackTimer = null;

    function place(position) {
        track.style.transform = `translateX(${-position * 100}%)`;
    }

    /**
     * Trade the ring positions for the equivalent in-bounds ones once a wrap has
     * arrived. Only the slide at offset 0 is on screen — the wrapper clips the
     * rest — so both sides of the swap paint the same frame and it can't be
     * seen. The forced reflow is what keeps it that way: without it the browser
     * would coalesce the swap with the restored transition and animate the strip
     * all the way back, which is the very thing being avoided here.
     */
    function land() {
        if (!wrapping) return;
        wrapping = false;
        clearTimeout(fallbackTimer);
        track.style.transition = "none";
        slides.forEach(slide => { slide.style.transform = ""; });
        place(current);
        void track.offsetWidth;
        track.style.transition = "";
    }

    // transitionend is the precise signal for a wrap having arrived, but it never
    // comes if the track isn't animating at all — a stylesheet could set
    // `transition: none`, under prefers-reduced-motion say — and the strip would
    // then stay parked out of bounds. The timer below is the backstop; whichever
    // fires first lands it, and land() is a no-op for the other.
    track.addEventListener("transitionend", (e) => {
        if (e.target === track && e.propertyName === "transform") land();
    });

    function travel(target, backward) {
        land();   // a move arriving mid-wrap sets off from the landed state
        const from = current;
        current = target;
        onChange(target);

        // Only a trip that runs off the end of the strip needs the lift.
        if (backward ? target <= from : target >= from) {
            place(target);
            return;
        }

        const lift = backward ? -count : count;
        const first = backward ? target : 0;
        const last = backward ? count - 1 : target;
        for (let i = first; i <= last; i++) {
            slides[i].style.transform = `translateX(${lift * 100}%)`;
        }

        wrapping = true;
        place(target + lift);
        fallbackTimer = setTimeout(land, 600);   // clear of the 0.4s CSS transition
    }

    return {
        get current() { return current; },

        /** One slide over in the direction of `delta`, round the ends. */
        step(delta) {
            travel((current + (delta % count) + count) % count, delta < 0);
        },

        /**
         * Straight to `index` the shorter way round.
         *
         * The track animates over a fixed 0.4s whatever the distance, so travel
         * distance is visual velocity: going the long way round the 9-image
         * gallery would sweep 8 slides in that time. Halving the worst case
         * keeps a dot jump legible.
         */
        jump(index) {
            const forward = (index - current + count) % count;
            const backward = (current - index + count) % count;
            travel(index, backward < forward);
        },
    };
}

/**
 * Slideshow of video comparison sliders.
 *
 * Deliberately not initSlideshow: the sliders inside interpret horizontal
 * pointer movement as scrubbing the split and click as play/pause, so
 * drag-to-swipe would fight them. Auto-advance is also omitted — yanking a
 * comparison away mid-inspection is worse than a second click. Height comes
 * from the videos' own aspect ratio rather than a reference <img>, and only
 * the visible slide plays so an off-screen video isn't decoding for nothing.
 */
function initVideoSlideshow(container) {
    const track = container.querySelector(".slideshow-track");
    const slides = Array.from(track.querySelectorAll(".slideshow-slide"));
    if (slides.length === 0) return;

    const controls = container.querySelector(".slideshow-controls");
    const prevBtn = container.querySelector(".slideshow-prev");
    const nextBtn = container.querySelector(".slideshow-next");
    const videos = slides.map(s => s.querySelector("video"));

    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "slideshow-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Go to comparison ${i + 1}`);
        dot.addEventListener("click", () => ring.jump(i));
        controls.insertBefore(dot, nextBtn);
    });

    const dots = Array.from(controls.querySelectorAll(".slideshow-dot"));

    // No height calculation here: each slider's canvas is sized by
    // resizeAndPlay() from its own container width, and the slide takes its
    // height from that canvas. Setting --slideshow-height would do nothing
    // anyway — only img/picture slides consume it.

    const ring = createRingTrack(track, slides, (index) => {
        dots.forEach((d, i) => d.classList.toggle("active", i === index));

        // Play only what's on screen. The canvas keeps its last drawn frame, so
        // a paused slide still looks like a paused video rather than a blank box.
        videos.forEach((v, i) => {
            if (!v) return;
            if (i === index) v.play().catch(() => { });
            else pauseOnceReady(v);
        });
    });

    // A slider sizes its canvas and starts drawing from its own `onplay`
    // handler, so pausing before that runs would leave the canvas blank
    // forever. Wait for it to report ready (and paint one frame), then pause.
    function pauseOnceReady(v) {
        if (v.dataset.comparisonReady) {
            requestAnimationFrame(() => {
                if (videos[ring.current] !== v) v.pause();
            });
            return;
        }
        if (v.dataset.slideshowPausePending) return;
        v.dataset.slideshowPausePending = "true";

        const poll = setInterval(() => {
            if (!v.dataset.comparisonReady) return;
            clearInterval(poll);
            delete v.dataset.slideshowPausePending;
            requestAnimationFrame(() => {
                if (videos[ring.current] !== v) v.pause();
            });
        }, 100);
    }

    prevBtn.addEventListener("click", () => ring.step(-1));
    nextBtn.addEventListener("click", () => ring.step(1));

    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); ring.step(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); ring.step(1); }
    });

    // Pause everything while the whole slideshow is off screen.
    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const vid = videos[ring.current];
                if (vid) vid.play().catch(() => { });
                videos.forEach((v, i) => { if (v && i !== ring.current) pauseOnceReady(v); });
            } else {
                videos.forEach(v => v && v.pause());
            }
        });
    }, { threshold: 0.1 }).observe(container);

    // Every slide autoplays so each slider can size its canvas and paint a first
    // frame; the off-screen ones are paused as soon as they report ready.
    videos.forEach((v, i) => { if (v && i !== 0) pauseOnceReady(v); });
}

function initSlideshow(container) {
    const track = container.querySelector(".slideshow-track");
    const slides = Array.from(track.querySelectorAll(".slideshow-slide"));
    if (slides.length === 0) return;

    const controls = container.querySelector(".slideshow-controls");
    const prevBtn = container.querySelector(".slideshow-prev");
    const nextBtn = container.querySelector(".slideshow-next");
    const imgs = Array.from(track.querySelectorAll("img"));

    let autoTimer = null;
    let paused = false;

    // Set container height based on a reference image (data-aspect-ref, 0-indexed)
    const aspectRef = parseInt(container.dataset.aspectRef || "0", 10);
    const refImg = imgs[aspectRef] || imgs[0];

    function calcHeight() {
        if (!refImg || !refImg.naturalWidth) return;
        const ratio = refImg.naturalHeight / refImg.naturalWidth;
        const height = Math.round(container.offsetWidth * ratio);
        container.style.setProperty("--slideshow-height", `${height}px`);
    }

    if (refImg) {
        if (refImg.complete) calcHeight();
        else refImg.addEventListener("load", calcHeight);
    }

    // Create dots between the arrows
    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "slideshow-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => { ring.jump(i); resetAuto(); });
        controls.insertBefore(dot, nextBtn);
    });

    const dots = Array.from(controls.querySelectorAll(".slideshow-dot"));

    const ring = createRingTrack(track, slides, (index) => {
        dots.forEach((d, i) => d.classList.toggle("active", i === index));
    });

    // Auto-advance every 3 seconds (only when visible)
    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            if (!paused) ring.step(1);
        }, 3000);
    }

    function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
    }

    function resetAuto() { if (!paused) startAuto(); }

    // Only auto-advance when the slideshow is on screen
    const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAuto();
            } else {
                stopAuto();
            }
        });
    }, { threshold: 0.1 });

    visibilityObserver.observe(container);

    // Navigation
    prevBtn.addEventListener("click", () => { ring.step(-1); resetAuto(); });
    nextBtn.addEventListener("click", () => { ring.step(1); resetAuto(); });

    // Pause on hover
    container.addEventListener("mouseenter", () => { paused = true; });
    container.addEventListener("mouseleave", () => { paused = false; resetAuto(); });

    // Touch swipe
    let startX = 0, startY = 0, isDragging = false;

    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        paused = true;
    }, { passive: true });

    track.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            ring.step(dx < 0 ? 1 : -1);
        }
        paused = false;
        resetAuto();
    }, { passive: true });

    // Mouse drag (desktop swipe)
    let mouseStartX = 0, mouseDragging = false;

    track.addEventListener("mousedown", (e) => {
        mouseStartX = e.clientX;
        mouseDragging = true;
        paused = true;
        e.preventDefault();
    });

    document.addEventListener("mouseup", (e) => {
        if (!mouseDragging) return;
        mouseDragging = false;
        const dx = e.clientX - mouseStartX;
        if (Math.abs(dx) > 40) {
            ring.step(dx < 0 ? 1 : -1);
        }
        paused = false;
        resetAuto();
    });

    // Keyboard navigation
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { ring.step(-1); resetAuto(); }
        if (e.key === "ArrowRight") { ring.step(1); resetAuto(); }
    });

    // Click-to-navigate (only if not dragging)
    const link = container.dataset.link;
    const wrapper = container.querySelector(".slideshow-track-wrapper");
    if (link) {
        track.addEventListener("click", (e) => {
            if (!mouseDragging && Math.abs(e.clientX - mouseStartX) < 5) {
                // Force un-zoom immediately so it doesn't appear over modals
                wrapper.style.transform = "scale(1)";
                wrapper.style.pointerEvents = "none";
                setTimeout(() => {
                    wrapper.style.transform = "";
                    wrapper.style.pointerEvents = "";
                }, 500);

                // Create a temporary anchor so event delegation (e.g. PDF modal) can intercept
                const a = document.createElement("a");
                a.href = link;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.style.display = "none";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        });
    }
}
