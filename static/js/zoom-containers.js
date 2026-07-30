// Check if device is mobile
const isMobile = window.matchMedia('(max-width: 960px)').matches;

// Autoplay thumbnail videos when they scroll into view, on every screen size.
//
// This is intentionally decoupled from the hover-to-zoom effect (which is pure
// CSS in zoom_containers.css). Earlier the desktop path played on mouseover and
// paused + reset currentTime on mouseleave, so hovering to zoom in would
// restart the clip every time. Using an IntersectionObserver instead means the
// video just keeps looping while it's on screen — zooming in/out never pauses,
// restarts, or resets it.
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target.querySelector('.video-thumbnail');
        if (!video) return;
        if (entry.isIntersecting) {
            // Autoplay may be blocked before user interaction; that's fine.
            video.play().catch(() => { });
        } else {
            // Pause off-screen videos to save resources; keep currentTime so it
            // resumes where it left off rather than resetting.
            video.pause();
        }
    });
}, {
    threshold: 0.25 // Play once a quarter of the video is visible
});

document.querySelectorAll('.video-container').forEach(container => {
    videoObserver.observe(container);
});

document.querySelectorAll('.image-container').forEach(container => {
    const image = container.querySelector('.image-thumbnail');

    // Only add hover zoom on desktop
    if (!isMobile) {
        container.addEventListener('mouseover', () => {
            image.style.transform = 'scale(3)'; // Zoom the image on hover
        });
        container.addEventListener('mouseleave', () => {
            image.style.transform = 'scale(1)'; // Reset the zoom when hover ends
        });
    }
});
