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