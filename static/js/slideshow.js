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

    let current = 0;
    let autoTimer = null;

    // Set container height to match the widest (most landscape) image
    const imgs = Array.from(track.querySelectorAll("img"));
    let ready = 0;
    function calcHeight() {
        ready++;
        if (ready < imgs.length) return;
        const containerWidth = container.offsetWidth;
        let minRatio = Infinity;
        imgs.forEach(img => {
            const ratio = img.naturalHeight / img.naturalWidth;
            if (ratio < minRatio) minRatio = ratio;
        });
        const height = Math.round(containerWidth * minRatio);
        container.style.setProperty("--slideshow-height", `${height}px`);
    }
    imgs.forEach(img => {
        if (img.complete) calcHeight();
        else img.addEventListener("load", calcHeight);
    });

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
        // Wrap around
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        current = index;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    prevBtn.addEventListener("click", () => { goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener("click", () => { goTo(current + 1); resetAuto(); });

    // Auto-advance every 5 seconds
    let paused = false;

    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            if (!paused) goTo(current + 1);
        }, 5000);
    }

    function resetAuto() {
        startAuto();
    }

    startAuto();

    // Pause on hover
    container.addEventListener("mouseenter", () => { paused = true; });
    container.addEventListener("mouseleave", () => { paused = false; resetAuto(); });

    // Touch/swipe support
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        clearInterval(autoTimer);
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
        resetAuto();
    }, { passive: true });

    // Mouse drag support for desktop
    let mouseStartX = 0;

    track.addEventListener("mousedown", (e) => {
        mouseStartX = e.clientX;
        isDragging = true;
        e.preventDefault();
    });

    document.addEventListener("mouseup", (e) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = e.clientX - mouseStartX;
        if (Math.abs(dx) > 40) {
            if (dx < 0) goTo(current + 1);
            else goTo(current - 1);
            resetAuto();
        }
    });

    // Keyboard support when focused
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { goTo(current - 1); resetAuto(); }
        if (e.key === "ArrowRight") { goTo(current + 1); resetAuto(); }
    });
}
