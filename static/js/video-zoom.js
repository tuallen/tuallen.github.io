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

document.querySelectorAll('.image-container').forEach(container => {
    const image = container.querySelector('.image-thumbnail');
    container.addEventListener('mouseover', () => {
        image.style.transform = 'scale(3)'; // Zoom the image on hover
    });
    container.addEventListener('mouseleave', () => {
        image.style.transform = 'scale(1)'; // Reset the zoom when hover ends
    });
});