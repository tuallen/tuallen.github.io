// Check if device is mobile
const isMobile = window.matchMedia('(max-width: 960px)').matches;

if (isMobile) {
    // On mobile: use Intersection Observer for lazy autoplay
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('.video-thumbnail');
            if (entry.isIntersecting) {
                // Video is visible, play it
                video.play().catch(() => {
                    // Autoplay might be blocked, that's okay
                });
            } else {
                // Video is not visible, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Play when 50% of video is visible
    });

    // Observe all video containers
    document.querySelectorAll('.video-container').forEach(container => {
        videoObserver.observe(container);
    });
} else {
    // On desktop: play on hover
    document.querySelectorAll('.video-container').forEach(container => {
        const video = container.querySelector('.video-thumbnail');
        container.addEventListener('mouseover', () => {
            video.play();
        });
        container.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;  // Reset to the beginning when hover ends
        });
    });
}

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