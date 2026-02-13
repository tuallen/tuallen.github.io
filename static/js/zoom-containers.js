// Check if device is mobile
const isMobile = window.matchMedia('(max-width: 960px)').matches;

document.querySelectorAll('.video-container').forEach(container => {
    const video = container.querySelector('.video-thumbnail');

    if (isMobile) {
        // On mobile: autoplay and loop
        video.autoplay = true;
        video.play().catch(() => {
            // Autoplay might be blocked, that's okay
        });
    } else {
        // On desktop: play on hover
        container.addEventListener('mouseover', () => {
            video.play();
        });
        container.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;  // Reset to the beginning when hover ends
        });
    }
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