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

    // Set container height based on a reference image.
    // data-aspect-ref="1" (0-indexed) picks which slide's aspect ratio to use.
    // Defaults to 0 (first image).
    const aspectRef = parseInt(container.dataset.aspectRef || "0", 10);
    const imgs = Array.from(track.querySelectorAll("img"));

    function calcHeight() {
        const refImg = imgs[aspectRef] || imgs[0];
        if (!refImg || !refImg.naturalWidth) return;
        const containerWidth = container.offsetWidth;
        const ratio = refImg.naturalHeight / refImg.naturalWidth;
        const height = Math.round(containerWidth * ratio);
        container.style.setProperty("--slideshow-height", `${height}px`);
    }

    // Wait for the reference image to load
    const refImg = imgs[aspectRef] || imgs[0];
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

    prevBtn.addEventListener("click", () => { goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener("click", () => { goTo(current + 1); resetAuto(); });

    // Auto-advance every 3 seconds
    let paused = false;

    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            if (!paused) goTo(current + 1);
        }, 3000);
    }

    function resetAuto() {
        startAuto();
    }

    startAuto();

    // Pause on hover and resize wrapper to fit current image's aspect ratio
    const wrapper = container.querySelector(".slideshow-track-wrapper");

    container.addEventListener("mouseenter", () => {
        paused = true;
        const currentImg = imgs[current];
        if (currentImg && currentImg.naturalWidth && currentImg.naturalHeight) {
            const imgRatio = currentImg.naturalHeight / currentImg.naturalWidth;
            const containerWidth = container.offsetWidth;
            const containerHeight = parseInt(getComputedStyle(currentImg).height);
            const imgNaturalFitHeight = containerWidth * imgRatio;
            if (imgNaturalFitHeight > containerHeight) {
                // Portrait: shrink width to fit within current height
                const fitWidth = Math.round(containerHeight / imgRatio);
                wrapper.style.width = `${fitWidth}px`;
                wrapper.style.margin = "0 auto";
            }
        }
    });

    container.addEventListener("mouseleave", () => {
        paused = false;
        resetAuto();
        wrapper.style.width = "";
        wrapper.style.margin = "";
    });

    // Touch/swipe support
    let startX = 0;
    let startY = 0;
    let isDragging = false;

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


    // Mouse drag support for desktop swipe
    let mouseStartX = 0;
    let mouseDragging = false;

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

    // Keyboard support when focused
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { goTo(current - 1); resetAuto(); }
        if (e.key === "ArrowRight") { goTo(current + 1); resetAuto(); }
    });
}
