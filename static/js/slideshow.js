/* ---- Slideshow: swipable image carousel with dots and arrows ---- */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".slideshow").forEach(initSlideshow);
});

function initSlideshow(container) {
    const track = container.querySelector(".slideshow-track");
    const slides = Array.from(track.querySelectorAll(".slideshow-slide"));
    if (slides.length === 0) return;

    const controls = container.querySelector(".slideshow-controls");
    const prevBtn = container.querySelector(".slideshow-prev");
    const nextBtn = container.querySelector(".slideshow-next");
    const imgs = Array.from(track.querySelectorAll("img"));

    let current = 0;
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
        dot.addEventListener("click", () => { goTo(i); resetAuto(); });
        controls.insertBefore(dot, nextBtn);
    });

    const dots = Array.from(controls.querySelectorAll(".slideshow-dot"));

    function goTo(index) {
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        current = index;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    // Auto-advance every 3 seconds (only when visible)
    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            if (!paused) goTo(current + 1);
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
    prevBtn.addEventListener("click", () => { goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener("click", () => { goTo(current + 1); resetAuto(); });

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
            if (dx < 0) goTo(current + 1);
            else goTo(current - 1);
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
            if (dx < 0) goTo(current + 1);
            else goTo(current - 1);
        }
        paused = false;
        resetAuto();
    });

    // Keyboard navigation
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { goTo(current - 1); resetAuto(); }
        if (e.key === "ArrowRight") { goTo(current + 1); resetAuto(); }
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
