/* ---- Slideshow: swipable image carousel with dots and arrows ---- */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".slideshow").forEach(initSlideshow);
});

function initSlideshow(container) {
    const track = container.querySelector(".slideshow-track");
    const slides = Array.from(track.querySelectorAll(".slideshow-slide"));
    if (slides.length === 0) return;

    const dotsContainer = container.querySelector(".slideshow-dots");
    const prevBtn = container.querySelector(".slideshow-prev");
    const nextBtn = container.querySelector(".slideshow-next");

    let current = 0;

    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "slideshow-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsContainer.insertBefore(dot, nextBtn);
    });

    const dots = Array.from(dotsContainer.querySelectorAll(".slideshow-dot"));

    function goTo(index) {
        current = Math.max(0, Math.min(index, slides.length - 1));
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    prevBtn.addEventListener("click", () => goTo(current - 1));
    nextBtn.addEventListener("click", () => goTo(current + 1));

    // Touch/swipe support
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });

    track.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) goTo(current + 1);
            else goTo(current - 1);
        }
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
        }
    });

    // Keyboard support when focused
    container.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") goTo(current - 1);
        if (e.key === "ArrowRight") goTo(current + 1);
    });
}
